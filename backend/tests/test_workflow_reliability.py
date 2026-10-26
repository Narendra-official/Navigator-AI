import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.agents.base import AgentRunStatus
from app.agents.task_store import TaskStore, task_store
from app.agents.orchestrator import OrchestratorAgent
from app.agents.registry import registry
from app.main import app
from app.schemas.agent_schemas import adapt_input_for_agent, is_valid_repo_name


@pytest.fixture
def clean_task_store():
    task_store.clear()
    yield task_store
    task_store.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_repo_validation_helper():
    assert is_valid_repo_name("pallets/flask") is True
    assert is_valid_repo_name("fastapi/fastapi") is True
    assert is_valid_repo_name("https://github.com/facebook/react") is True
    assert is_valid_repo_name("invalid-repo-without-slash") is False
    assert is_valid_repo_name("../../etc/passwd") is False
    assert is_valid_repo_name("owner/repo/extra") is False
    assert is_valid_repo_name("") is False
    assert is_valid_repo_name(None) is False


def test_agent_input_adapters():
    # Issue discovery adapter
    res = adapt_input_for_agent(
        "issue_discovery",
        {
            "search_query": "docs bug",
            "search_language": "python",
            "repository_name": "pallets/flask",
            "search_page": 2,
        },
    )
    assert res["query"] == "docs bug"
    assert res["language"] == "python"
    assert res["repo"] == "pallets/flask"
    assert res["page"] == 2

    # Repository context adapter requires valid owner/repo
    with pytest.raises(ValueError) as exc:
        adapt_input_for_agent("repository_context", {"repository_name": "invalid"})
    assert "owner/name" in str(exc.value)

    # Issue understanding adapter requires title and repo
    with pytest.raises(ValueError):
        adapt_input_for_agent("issue_understanding", {"issue_title": ""})

    # Valid issue understanding adapter
    adapted_und = adapt_input_for_agent(
        "issue_understanding",
        {
            "issue_title": "Fix typo",
            "repository_name": "pallets/flask",
            "issue_body": "Typo in route",
        },
    )
    assert adapted_und["issue_title"] == "Fix typo"
    assert adapted_und["repository_name"] == "pallets/flask"


def test_task_store_retry_clears_cancellation(clean_task_store):
    run_id = "test-run-retry-cancel"
    original_payload = {
        "target_agent": "orchestrator",
        "issue_title": "Fix memory leak",
        "issue_body": "Detailed leak description",
        "repository_name": "pallets/flask",
        "issue_url": "https://github.com/pallets/flask/issues/100",
        "labels": ["bug", "core"],
        "user_experience": "Intermediate",
        "preferred_languages": ["Python", "C"],
        "learning_goals": "Master memory profiling",
    }

    # 1. Create run
    run = clean_task_store.create_run(
        run_id=run_id,
        target_agent="orchestrator",
        issue_context={"title": "Fix memory leak", "repo": "pallets/flask"},
        user_skill_level="Intermediate",
        original_request=original_payload,
    )
    assert run.status == AgentRunStatus.QUEUED

    # 2. Cancel run
    assert clean_task_store.cancel_run(run_id) is True
    assert clean_task_store.is_cancelled(run_id) is True
    assert clean_task_store.get_run(run_id).status == AgentRunStatus.CANCELLED

    # 3. Retry run: must clear cancellation flag and reset execution state
    retried_run = clean_task_store.prepare_retry(run_id)
    assert clean_task_store.is_cancelled(run_id) is False
    assert retried_run.status == AgentRunStatus.QUEUED
    assert retried_run.error is None
    assert retried_run.completed_at is None
    assert retried_run.duration_ms is None
    assert retried_run.combined_result is None
    assert len(retried_run.agents_state) == 0

    # 4. Verify original request was preserved in full
    assert retried_run.original_request["issue_body"] == "Detailed leak description"
    assert retried_run.original_request["preferred_languages"] == ["Python", "C"]
    assert retried_run.original_request["learning_goals"] == "Master memory profiling"


def test_task_store_retry_rejection_when_running(clean_task_store):
    run_id = "test-run-running"
    clean_task_store.create_run(
        run_id=run_id,
        target_agent="orchestrator",
    )
    clean_task_store.update_agent_state(
        run_id=run_id,
        agent_id="test_agent",
        agent_name="Test Agent",
        status=AgentRunStatus.RUNNING,
    )

    run = clean_task_store.get_run(run_id)
    assert run.status == AgentRunStatus.RUNNING

    with pytest.raises(ValueError) as exc:
        clean_task_store.prepare_retry(run_id)
    assert "already in progress" in str(exc.value)


@pytest.mark.asyncio
async def test_cooperative_cancellation_during_pipeline(clean_task_store):
    run_id = "test-cancel-pipeline"
    payload = {
        "target_agent": "orchestrator",
        "issue_title": "Improve documentation",
        "repository_name": "pallets/flask",
        "issue_url": "https://github.com/pallets/flask/issues/500",
    }

    clean_task_store.create_run(
        run_id=run_id,
        target_agent="orchestrator",
        original_request=payload,
    )

    orchestrator = registry.get_orchestrator()

    # Pre-cancel the run
    clean_task_store.cancel_run(run_id)

    # Executing the pipeline should stop immediately and set terminal status CANCELLED
    result = await orchestrator.execute(payload, {"run_id": run_id})

    run = clean_task_store.get_run(run_id)
    assert run.status == AgentRunStatus.CANCELLED
    # Does not falsely claim COMPLETED
    assert run.status != AgentRunStatus.COMPLETED


@pytest.mark.asyncio
async def test_pipeline_preserves_partial_results_on_failure(clean_task_store):
    run_id = "test-partial-failure"
    payload = {
        "target_agent": "orchestrator",
        "issue_title": "Test Partial Failure",
        "repository_name": "pallets/flask",
        "issue_url": "https://github.com/pallets/flask/issues/101",
    }

    clean_task_store.create_run(
        run_id=run_id,
        target_agent="orchestrator",
        original_request=payload,
    )

    orchestrator = registry.get_orchestrator()

    # Mock stage 1 (issue_understanding) to succeed, but stage 2 (repository_context) to raise
    with patch.object(
        orchestrator.agents_map["issue_understanding"],
        "execute",
        new_callable=AsyncMock,
        return_value={"plain_english_summary": "Understood issue"},
    ), patch.object(
        orchestrator.agents_map["repository_context"],
        "execute",
        new_callable=AsyncMock,
        side_effect=RuntimeError("GitHub API 500 error"),
    ):
        result = await orchestrator.execute(payload, {"run_id": run_id})

        run = clean_task_store.get_run(run_id)
        assert run.status == AgentRunStatus.FAILED
        assert run.failing_stage == "repository_context"
        assert "GitHub API 500 error" in run.error
        # Stage 1 partial results must be preserved!
        assert "issue_understanding" in run.combined_result
        assert run.combined_result["issue_understanding"]["plain_english_summary"] == "Understood issue"


def test_api_validation_on_direct_agent_run(client, clean_task_store):
    # Missing required repo for repository_context agent must yield 422
    resp = client.post(
        "/api/v1/agents/runs",
        json={"target_agent": "repository_context", "repository_name": "invalid-no-slash"},
    )
    assert resp.status_code == 422
    assert "Invalid repository format" in resp.json()["detail"] or "Validation failed" in resp.json()["detail"]


def test_api_retry_endpoint_preserves_payload(client, clean_task_store):
    with patch("app.api.agent_routes._execute_workflow_task", new_callable=AsyncMock) as mock_exec:
        # 1. Create a run with full payload
        full_payload = {
            "target_agent": "orchestrator",
            "issue_title": "Fix logging crash",
            "issue_body": "Full body with trace",
            "repository_name": "pallets/flask",
            "issue_url": "https://github.com/pallets/flask/issues/999",
            "labels": ["bug"],
            "user_experience": "Advanced",
            "preferred_languages": ["Python", "Rust"],
            "learning_goals": "Concurrency mastery",
        }
        create_resp = client.post("/api/v1/agents/runs", json=full_payload)
        assert create_resp.status_code == 202
        run_id = create_resp.json()["run_id"]

        # 2. Cancel run
        cancel_resp = client.post(f"/api/v1/agents/runs/{run_id}/cancel")
        assert cancel_resp.status_code == 200

        # 3. Retry run
        retry_resp = client.post(f"/api/v1/agents/runs/{run_id}/retry")
        assert retry_resp.status_code == 200

        # 4. Check status: status is queued, full request preserved
        status_resp = client.get(f"/api/v1/agents/runs/{run_id}")
        assert status_resp.status_code == 200
        record = status_resp.json()
        assert record["status"] in ("queued", "running")
        assert record["original_request"]["learning_goals"] == "Concurrency mastery"
        assert record["original_request"]["preferred_languages"] == ["Python", "Rust"]
