import asyncio
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status

from app.agents.base import AgentMetadata, AgentRunStatus, WorkflowRunRecord
from app.agents.registry import registry
from app.agents.task_store import task_store
from app.clients.github_client import GitHubClient
from app.schemas.agent_schemas import (
    WorkflowRunRequest,
    WorkflowRunResponse,
    adapt_input_for_agent,
    is_valid_repo_name,
    normalize_repo_name,
)

router = APIRouter()
github_client = GitHubClient()


@router.get("/agents", response_model=List[AgentMetadata], summary="List registered specialist agents")
async def list_agents() -> List[AgentMetadata]:
    """Retrieve metadata, descriptions, and phases for all registered specialist agents."""
    return registry.list_metadata()


@router.get("/agents/runs", response_model=List[WorkflowRunRecord], summary="List recent agent workflow runs")
async def list_runs(limit: int = Query(20, ge=1, le=50)) -> List[WorkflowRunRecord]:
    """Retrieve recent task execution history with status, timings, and durations."""
    return task_store.list_runs(limit=limit)


async def _execute_workflow_task(run_id: str, payload: Dict[str, Any]):
    orchestrator = registry.get_orchestrator()
    try:
        await orchestrator.execute(payload, {"run_id": run_id})
    except Exception as e:
        task_store.finish_run(run_id=run_id, status=AgentRunStatus.FAILED, error=str(e))


@router.post(
    "/agents/runs",
    response_model=WorkflowRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger agent or full workflow run",
)
async def start_run(req: WorkflowRunRequest, background_tasks: BackgroundTasks) -> WorkflowRunResponse:
    """Trigger an individual specialist agent or coordinate the full multi-agent pipeline."""
    target = req.target_agent
    if target != "orchestrator" and not registry.get_agent(target):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{target}' is not registered.",
        )

    payload = req.model_dump()

    # Pre-validate inputs specifically for single specialist agents to catch invalid inputs immediately
    if target != "orchestrator":
        try:
            adapt_input_for_agent(target, payload)
        except (ValueError, TypeError) as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Validation failed for agent '{target}': {str(e)}",
            )
    else:
        # Validate repository format if provided for orchestrator
        if req.repository_name:
            clean_repo = normalize_repo_name(req.repository_name)
            if clean_repo and not is_valid_repo_name(clean_repo):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid repository format '{req.repository_name}'. Expected 'owner/repo'.",
                )

    run_id = f"run-{uuid.uuid4().hex[:8]}"
    issue_context = {
        "title": req.issue_title,
        "repo": req.repository_name,
        "url": req.issue_url,
    }

    run_record = task_store.create_run(
        run_id=run_id,
        target_agent=target,
        issue_context=issue_context,
        user_skill_level=req.user_experience,
        original_request=payload,
    )

    background_tasks.add_task(_execute_workflow_task, run_id, payload)

    return WorkflowRunResponse(
        run_id=run_id,
        status="queued",
        target_agent=target,
        created_at=run_record.created_at,
        message=f"Agent run '{run_id}' initiated for target '{target}'.",
        record=run_record.model_dump(),
    )


@router.get("/agents/runs/{run_id}", response_model=WorkflowRunRecord, summary="Get run status and output")
async def get_run_status(run_id: str) -> WorkflowRunRecord:
    """Poll execution state, per-agent node status, and accumulated outputs for a run."""
    record = task_store.get_run(run_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run '{run_id}' not found.",
        )
    return record


@router.post("/agents/runs/{run_id}/retry", response_model=WorkflowRunResponse, summary="Retry a failed or cancelled run")
async def retry_run(run_id: str, background_tasks: BackgroundTasks) -> WorkflowRunResponse:
    """Retry an existing run if failed or cancelled, preserving full original request payload."""
    try:
        record = task_store.prepare_retry(run_id)
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Re-use preserved full original payload
    payload = record.original_request or {
        "target_agent": record.target_agent,
        "issue_title": (record.issue_context or {}).get("title"),
        "repository_name": (record.issue_context or {}).get("repo"),
        "issue_url": (record.issue_context or {}).get("url"),
        "user_experience": record.user_skill_level,
    }

    background_tasks.add_task(_execute_workflow_task, run_id, payload)

    return WorkflowRunResponse(
        run_id=run_id,
        status="queued",
        target_agent=record.target_agent,
        created_at=record.created_at,
        message=f"Run '{run_id}' re-queued for execution with full preserved context.",
        record=record.model_dump(),
    )


@router.post("/agents/runs/{run_id}/cancel", summary="Cancel a running task")
async def cancel_run(run_id: str) -> Dict[str, Any]:
    """Request cooperative cancellation of a running agent workflow."""
    record = task_store.get_run(run_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run '{run_id}' not found.")

    success = task_store.cancel_run(run_id)
    return {
        "run_id": run_id,
        "status": "cancelled",
        "message": "Cancellation flag set. Workflow will stop cooperatively at the earliest safe boundary.",
    }


# Repository Explorer API
@router.get("/repository/explore", summary="Explore repository structure")
async def explore_repository(
    repo: str = Query(..., description="Repository in owner/name format"),
    max_files: int = Query(60, ge=5, le=200),
) -> Dict[str, Any]:
    """Retrieve verified file hierarchy and contributing guidelines for the repository."""
    clean_repo = normalize_repo_name(repo)
    if not clean_repo or not is_valid_repo_name(clean_repo):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid repository format '{repo}'. Expected 'owner/repo'.",
        )

    context = await github_client.get_repo_context(clean_repo)
    file_names = context.get("verified_files", [])
    contributing_found = context.get("contributing_found", False)
    contributing_url = context.get("contributing_url")

    readme_file = context.get("readme_file") or next((f for f in file_names if f.lower().startswith("readme")), None)
    contributing_file = context.get("contributing_file") or next((f for f in file_names if "contribut" in f.lower()), None)
    test_dirs = [f for f in file_names if "test" in f.lower()]

    return {
        "repository_name": clean_repo,
        "files_count": len(file_names),
        "files": file_names,
        "verified_files": file_names,
        "items": context.get("items", []),
        "first_file": context.get("first_file") or readme_file,
        "contributing_found": contributing_found,
        "contributing_file": contributing_file,
        "contributing_url": contributing_url,
        "readme_file": readme_file,
        "test_directories": test_dirs,
    }


@router.get("/repository/file", summary="Inspect safe repository file content")
async def inspect_repository_file(
    repo: str = Query(..., description="Repository in owner/name format"),
    path: str = Query(..., description="File path within the repository"),
) -> Dict[str, Any]:
    """Safely fetch and inspect text file contents from GitHub within strict size bounds."""
    clean_repo = normalize_repo_name(repo)
    if not clean_repo or not is_valid_repo_name(clean_repo):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid repository format '{repo}'. Expected 'owner/repo'.",
        )
    return await github_client.get_file_content(clean_repo, path)
