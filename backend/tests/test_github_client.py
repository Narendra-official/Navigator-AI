import pytest
from unittest.mock import AsyncMock, patch
import httpx

from app.clients.github_client import GitHubClient


def test_build_query_basic():
    client = GitHubClient()
    q = client.build_query(query="fastapi bug")
    assert "is:issue" in q
    assert "state:open" in q
    assert "fastapi bug" in q


def test_build_query_with_language_label_and_repo():
    client = GitHubClient()
    q = client.build_query(
        query="memory leak",
        language="python",
        label="good first issue",
        repo="fastapi/fastapi",
    )
    assert "is:issue" in q
    assert "state:open" in q
    assert "memory leak" in q
    assert "language:python" in q
    assert 'label:"good first issue"' in q
    assert "repo:fastapi/fastapi" in q


def test_build_query_excludes_prs_by_default():
    client = GitHubClient()
    q = client.build_query()
    assert "is:issue" in q
    assert "state:open" in q


@pytest.mark.asyncio
async def test_search_issues_filters_out_pull_requests():
    client = GitHubClient()
    mock_payload = {
        "total_count": 2,
        "items": [
            {
                "id": 101,
                "number": 1,
                "title": "Real Issue",
                "body": "Issue details",
                "html_url": "https://github.com/org/repo/issues/1",
                "repository_url": "https://api.github.com/repos/org/repo",
                "labels": [{"name": "bug", "color": "d73a4a"}],
            },
            {
                "id": 102,
                "number": 2,
                "title": "Pull Request pretending to be issue",
                "body": "PR description",
                "html_url": "https://github.com/org/repo/pull/2",
                "repository_url": "https://api.github.com/repos/org/repo",
                "pull_request": {"url": "https://api.github.com/repos/org/repo/pulls/2"},
                "labels": [],
            },
        ],
    }

    mock_resp = httpx.Response(
        status_code=200,
        json=mock_payload,
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await client.search_issues(query="test", page=2, per_page=10)

        assert len(res.items) == 1
        assert res.items[0].number == 1
        assert res.items[0].title == "Real Issue"
        assert res.items[0].repository_name == "org/repo"
        assert res.page == 2
        assert res.rate_limited is False


@pytest.mark.asyncio
async def test_search_issues_rate_limited():
    client = GitHubClient()
    headers = {
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": "1730000000",
    }
    mock_resp = httpx.Response(
        status_code=403,
        text="Rate limit exceeded",
        headers=headers,
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await client.search_issues(query="test")

        assert res.rate_limited is True
        assert "rate limit exceeded" in res.message.lower()
        assert res.rate_limit_reset == 1730000000
        assert len(res.items) == 0


@pytest.mark.asyncio
async def test_search_issues_timeout_handling():
    client = GitHubClient()

    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Timed out")):
        res = await client.search_issues(query="timeout_test")
        assert res.rate_limited is False
        assert "timed out" in res.message.lower()
        assert len(res.items) == 0


@pytest.mark.asyncio
async def test_get_repo_context_success():
    client = GitHubClient()
    mock_contents = [
        {"name": "src", "type": "dir", "html_url": "https://github.com/org/repo/tree/main/src"},
        {"name": "tests", "type": "dir", "html_url": "https://github.com/org/repo/tree/main/tests"},
        {"name": "CONTRIBUTING.md", "type": "file", "html_url": "https://github.com/org/repo/blob/main/CONTRIBUTING.md"},
        {"name": "README.md", "type": "file", "html_url": "https://github.com/org/repo/blob/main/README.md"},
    ]

    mock_resp = httpx.Response(
        status_code=200,
        json=mock_contents,
        request=httpx.Request("GET", "https://api.github.com/repos/org/repo/contents"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        context = await client.get_repo_context("org/repo")

        assert "src" in context["verified_files"]
        assert "tests" in context["verified_files"]
        assert context["contributing_found"] is True
        assert "CONTRIBUTING.md" in context["contributing_url"]
