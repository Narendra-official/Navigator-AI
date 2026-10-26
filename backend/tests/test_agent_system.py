import pytest
from unittest.mock import AsyncMock, patch

from app.agents.base import AgentRunStatus
from app.agents.registry import registry
from app.agents.task_store import TaskStore


def test_agent_registry():
    metadata_list = registry.list_metadata()
    assert len(metadata_list) == 8
    agent_ids = [m.id for m in metadata_list]
    expected_ids = [
        "issue_discovery",
        "issue_understanding",
        "repository_context",
        "skill_matching",
        "contribution_planning",
        "test_strategy",
        "pr_readiness",
        "orchestrator",
    ]
    for eid in expected_ids:
        assert eid in agent_ids
        assert registry.get_agent(eid) is not None


def test_task_store_lifecycle():
    store = TaskStore(max_runs=5)
    run = store.create_run(run_id="run-1", target_agent="orchestrator", issue_context={"title": "Test Issue"})
    assert run.run_id == "run-1"
    assert run.status == AgentRunStatus.QUEUED

    # Update agent state
    store.update_agent_state(
        run_id="run-1",
        agent_id="issue_understanding",
        agent_name="Issue Understanding Agent",
        status=AgentRunStatus.RUNNING,
        started_at=100.0,
    )
    r = store.get_run("run-1")
    assert r.status == AgentRunStatus.RUNNING
    assert "issue_understanding" in r.agents_state
    assert r.agents_state["issue_understanding"].status == AgentRunStatus.RUNNING

    # Finish run
    store.finish_run(run_id="run-1", status=AgentRunStatus.COMPLETED, combined_result={"ok": True})
    r = store.get_run("run-1")
    assert r.status == AgentRunStatus.COMPLETED
    assert r.combined_result == {"ok": True}

    # Cancel
    store.cancel_run("run-1")
    assert store.is_cancelled("run-1") is True


def test_agents_api_endpoints(client):
    with patch("app.api.agent_routes._execute_workflow_task", new_callable=AsyncMock):
        # 1. List agents
        resp = client.get("/api/v1/agents")
        assert resp.status_code == 200
        agents = resp.json()
        assert len(agents) == 8

        # 2. Start a run (queued in background)
        payload = {
            "target_agent": "orchestrator",
            "issue_title": "Fix doc typo in auth module",
            "repository_name": "sample/repo",
            "issue_url": "https://github.com/sample/repo/issues/1",
            "user_experience": "Beginner",
        }
        post_resp = client.post("/api/v1/agents/runs", json=payload)
        assert post_resp.status_code == 202
        run_id = post_resp.json()["run_id"]
        assert run_id.startswith("run-")

        # 3. Get run status
        get_resp = client.get(f"/api/v1/agents/runs/{run_id}")
        assert get_resp.status_code == 200
        record = get_resp.json()
        assert record["run_id"] == run_id

        # 4. Cancel run
        cancel_resp = client.post(f"/api/v1/agents/runs/{run_id}/cancel")
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "cancelled"

        # 5. List runs
        list_resp = client.get("/api/v1/agents/runs")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 1


def test_repository_explorer_endpoints(client):
    with patch("app.clients.github_client.GitHubClient.get_repo_context", new_callable=AsyncMock) as mock_ctx, \
         patch("app.clients.github_client.GitHubClient.get_file_content", new_callable=AsyncMock) as mock_file:

        mock_ctx.return_value = {
            "verified_files": ["src", "tests", "README.md"],
            "contributing_found": True,
            "contributing_url": "https://github.com/sample/repo/blob/main/CONTRIBUTING.md",
        }
        mock_file.return_value = {
            "found": True,
            "path": "README.md",
            "size": 120,
            "html_url": "https://github.com/sample/repo/blob/main/README.md",
            "content": "# Sample Project",
        }

        # Explore repo
        res1 = client.get("/api/v1/repository/explore?repo=sample/repo")
        assert res1.status_code == 200
        assert "src" in res1.json()["verified_files"]

        # Inspect file
        res2 = client.get("/api/v1/repository/file?repo=sample/repo&path=README.md")
        assert res2.status_code == 200
        assert res2.json()["content"] == "# Sample Project"
