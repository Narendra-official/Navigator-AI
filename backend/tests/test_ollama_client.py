import pytest
from unittest.mock import AsyncMock, patch
import httpx

from app.clients.ollama_client import OllamaClient
from app.schemas.analysis import AnalyzeRequest, DifficultyLevel


@pytest.fixture
def sample_request():
    return AnalyzeRequest(
        issue_title="Typo in documentation for auth endpoint",
        issue_body="The /auth/login docs show username instead of email parameter.",
        repository_name="acme/api",
        issue_url="https://github.com/acme/api/issues/42",
        labels=["good first issue", "docs"],
    )


def test_extract_json_plain():
    client = OllamaClient()
    raw = '{"plain_english_summary": "Test summary", "estimated_difficulty": "Beginner"}'
    parsed = client._extract_json(raw)
    assert parsed["plain_english_summary"] == "Test summary"
    assert parsed["estimated_difficulty"] == "Beginner"


def test_extract_json_with_think_tags_and_fences():
    client = OllamaClient()
    raw = (
        "<think>Let me reason about this issue carefully...</think>\n"
        "```json\n"
        "{\n"
        '  "plain_english_summary": "Fix auth docs typo.",\n'
        '  "estimated_difficulty": "Beginner",\n'
        '  "investigation_plan": ["Check docs/auth.md"]\n'
        "}\n"
        "```"
    )
    parsed = client._extract_json(raw)
    assert parsed["plain_english_summary"] == "Fix auth docs typo."
    assert parsed["estimated_difficulty"] == "Beginner"
    assert parsed["investigation_plan"] == ["Check docs/auth.md"]


def test_extract_json_invalid_raises_value_error():
    client = OllamaClient()
    with pytest.raises(ValueError):
        client._extract_json("This is purely plain text without any JSON.")


@pytest.mark.asyncio
async def test_analyze_issue_success(sample_request):
    client = OllamaClient()

    fake_tags_resp = httpx.Response(
        status_code=200,
        json={"models": [{"name": client.model}]},
        request=httpx.Request("GET", "http://localhost:11434/api/tags"),
    )

    fake_ai_content = """{
      "plain_english_summary": "Fix docs typo in login route.",
      "problem_description": "Documentation mentions username instead of email.",
      "expected_outcome": "Documentation accurately lists email as expected payload key.",
      "possible_skills": ["Markdown", "Git"],
      "estimated_difficulty": "Beginner",
      "difficulty_rationale": "Only documentation text needs updating.",
      "investigation_plan": ["Locate docs file", "Verify schema"],
      "suggested_inspection_areas": [
        {"area_or_path": "docs/endpoints/auth.md", "rationale": "Likely documentation file"}
      ],
      "testing_strategy": ["Build docs locally or preview markdown"],
      "common_pitfalls": ["Overwriting other endpoint documentation"],
      "maintainer_questions": ["Is email mandatory or optional?"],
      "verification_checklist": ["Preview Markdown changes in editor"]
    }"""

    fake_chat_resp = httpx.Response(
        status_code=200,
        json={"message": {"content": fake_ai_content}},
        request=httpx.Request("POST", "http://localhost:11434/api/chat"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_get.return_value = fake_tags_resp
        mock_post.return_value = fake_chat_resp

        result = await client.analyze_issue(sample_request)

        assert result.estimated_difficulty == DifficultyLevel.BEGINNER
        assert result.plain_english_summary == "Fix docs typo in login route."
        assert len(result.suggested_inspection_areas) == 1
        assert result.suggested_inspection_areas[0].is_hypothesis is True
        assert "AI-generated guidance may be incorrect" in result.disclaimer


@pytest.mark.asyncio
async def test_analyze_issue_ollama_offline(sample_request):
    client = OllamaClient()

    with patch("httpx.AsyncClient.get", side_effect=httpx.ConnectError("Connection refused")):
        with pytest.raises(ConnectionError) as exc_info:
            await client.analyze_issue(sample_request)
        assert "Cannot connect to Ollama" in str(exc_info.value)


@pytest.mark.asyncio
async def test_analyze_issue_timeout(sample_request):
    client = OllamaClient()

    fake_tags_resp = httpx.Response(
        status_code=200,
        json={"models": [{"name": client.model}]},
        request=httpx.Request("GET", "http://localhost:11434/api/tags"),
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        mock_get.return_value = fake_tags_resp
        with pytest.raises(TimeoutError) as exc_info:
            await client.analyze_issue(sample_request)
        assert "timed out" in str(exc_info.value)
