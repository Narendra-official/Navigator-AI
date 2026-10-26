from typing import Any, Dict
from app.agents.base import AgentMetadata, BaseAgent
from app.clients.github_client import GitHubClient
from app.schemas.agent_schemas import (
    RepositoryContextInput,
    RepositoryContextOutput,
    adapt_input_for_agent,
)


class RepositoryContextAgent(BaseAgent):
    """Agent 3: Gathers verified repository structure, guidelines, and context."""

    def __init__(self, github_client: GitHubClient):
        super().__init__(
            AgentMetadata(
                id="repository_context",
                name="Repository Context Agent",
                role="Codebase Inspector & Layout Grounder",
                description="Queries GitHub Contents API to discover verified repository files, directories, and CONTRIBUTING.md guidelines.",
                inputs_required=["repository_name"],
                produces=["verified_files", "contributing_found", "contributing_url", "primary_language", "provenance"],
                phase=3,
            )
        )
        self.github_client = github_client

    async def execute(self, payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        adapted = adapt_input_for_agent("repository_context", payload)
        inp = RepositoryContextInput(**adapted)
        repo_data = await self.github_client.get_repo_context(inp.repository_name)

        verified = repo_data.get("verified_files", [])
        contributing_found = repo_data.get("contributing_found", False)
        contributing_url = repo_data.get("contributing_url")

        # Determine probable primary language based on verified file indicators
        primary_lang = "General"
        lower_names = [f.lower() for f in verified]
        if any(f.endswith(".py") or f in ("pyproject.toml", "setup.py", "requirements.txt") for f in lower_names):
            primary_lang = "Python"
        elif any(f.endswith((".ts", ".tsx")) or f in ("package.json", "tsconfig.json") for f in lower_names):
            primary_lang = "TypeScript"
        elif any(f.endswith((".js", ".jsx")) for f in lower_names):
            primary_lang = "JavaScript"
        elif any(f.endswith(".rs") or f == "cargo.toml" for f in lower_names):
            primary_lang = "Rust"
        elif any(f.endswith(".go") or f == "go.mod" for f in lower_names):
            primary_lang = "Go"
        elif any(f.endswith(".java") or f in ("pom.xml", "build.gradle") for f in lower_names):
            primary_lang = "Java"

        output = RepositoryContextOutput(
            repository_name=inp.repository_name,
            verified_files=verified,
            contributing_found=contributing_found,
            contributing_url=contributing_url,
            primary_language=primary_lang,
            provenance="GitHub Contents API (/repos/{owner}/{repo}/contents)",
            execution_mode="api_retrieval",
        )
        return output.model_dump()
