from typing import Dict, List, Optional
from app.agents.base import AgentMetadata, BaseAgent
from app.agents.contribution_planning_agent import ContributionPlanningAgent
from app.agents.issue_discovery_agent import IssueDiscoveryAgent
from app.agents.issue_understanding_agent import IssueUnderstandingAgent
from app.agents.orchestrator import OrchestratorAgent
from app.agents.pr_readiness_agent import PRReadinessAgent
from app.agents.repository_context_agent import RepositoryContextAgent
from app.agents.skill_matching_agent import SkillMatchingAgent
from app.agents.test_strategy_agent import TestStrategyAgent
from app.clients.github_client import GitHubClient
from app.clients.ollama_client import OllamaClient


class AgentRegistry:
    """Central registry for all specialist agents."""

    def __init__(self, github_client: GitHubClient, ollama_client: OllamaClient):
        self.github_client = github_client
        self.ollama_client = ollama_client

        # Initialize specialist agents
        self._agents: Dict[str, BaseAgent] = {}
        self._register_all()

    def _register_all(self):
        a1 = IssueDiscoveryAgent(self.github_client)
        a2 = IssueUnderstandingAgent(self.ollama_client)
        a3 = RepositoryContextAgent(self.github_client)
        a4 = SkillMatchingAgent(self.ollama_client)
        a5 = ContributionPlanningAgent(self.ollama_client)
        a6 = TestStrategyAgent(self.ollama_client)
        a7 = PRReadinessAgent(self.ollama_client)

        specialists = {
            a1.metadata.id: a1,
            a2.metadata.id: a2,
            a3.metadata.id: a3,
            a4.metadata.id: a4,
            a5.metadata.id: a5,
            a6.metadata.id: a6,
            a7.metadata.id: a7,
        }

        orchestrator = OrchestratorAgent(specialists)

        self._agents = {
            **specialists,
            orchestrator.metadata.id: orchestrator,
        }

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        return self._agents.get(agent_id)

    def list_metadata(self) -> List[AgentMetadata]:
        return [agent.metadata for agent in self._agents.values()]

    def get_orchestrator(self) -> OrchestratorAgent:
        return self._agents["orchestrator"]  # type: ignore


# Singleton registry instance
_default_gh = GitHubClient()
_default_ollama = OllamaClient()
registry = AgentRegistry(_default_gh, _default_ollama)
