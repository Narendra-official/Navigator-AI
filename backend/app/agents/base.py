from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import time


class AgentRunStatus(str, Enum):
    IDLE = "idle"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    WAITING = "waiting"


class AgentMetadata(BaseModel):
    id: str
    name: str
    role: str
    description: str
    inputs_required: List[str] = Field(default_factory=list)
    produces: List[str] = Field(default_factory=list)
    phase: int = 1
    is_autonomous: bool = True
    display_name: Optional[str] = None
    capabilities: List[str] = Field(default_factory=list)
    system_prompt_snippet: Optional[str] = None
    model: str = ""

    def model_post_init(self, __context: Any) -> None:
        if not self.model:
            try:
                from app.core.config import settings
                self.model = settings.OLLAMA_MODEL
            except Exception:
                self.model = "deepseek-r1:8b"
        if not self.display_name:
            self.display_name = self.name
        if not self.capabilities:
            self.capabilities = [f"Analyzes {p.replace('_', ' ')}" for p in self.produces]
        if not self.system_prompt_snippet:
            self.system_prompt_snippet = f"Specialist agent focused on {self.role.lower()} for open-source contributors."


class AgentExecutionRecord(BaseModel):
    agent_id: str
    agent_name: str
    status: AgentRunStatus = AgentRunStatus.IDLE
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    duration_ms: Optional[float] = None
    input_summary: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    model_used: Optional[str] = None
    execution_mode: Optional[str] = None


class WorkflowRunRecord(BaseModel):
    run_id: str
    target_agent: str = "orchestrator"  # specific agent id or "orchestrator"
    status: AgentRunStatus = AgentRunStatus.QUEUED
    created_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None
    duration_ms: Optional[float] = None
    total_duration_ms: Optional[float] = None
    issue_context: Optional[Dict[str, Any]] = None
    issue_title: Optional[str] = None
    repository_name: Optional[str] = None
    user_skill_level: str = "Beginner"
    agents_state: Dict[str, AgentExecutionRecord] = Field(default_factory=dict)
    agent_executions: List[AgentExecutionRecord] = Field(default_factory=list)
    combined_result: Optional[Dict[str, Any]] = None
    final_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    failing_stage: Optional[str] = None
    model_used: Optional[str] = None
    original_request: Optional[Dict[str, Any]] = None

    def sync_aliases(self) -> None:
        """Keep both dictionary and list forms in sync for frontend compatibility."""
        if self.duration_ms and not self.total_duration_ms:
            self.total_duration_ms = self.duration_ms
        if self.total_duration_ms and not self.duration_ms:
            self.duration_ms = self.total_duration_ms
        if self.issue_context:
            if not self.issue_title:
                self.issue_title = self.issue_context.get("title")
            if not self.repository_name:
                self.repository_name = self.issue_context.get("repo")
        if self.agents_state:
            self.agent_executions = list(self.agents_state.values())
        if self.combined_result and not self.final_result:
            self.final_result = self.combined_result
        if self.final_result and not self.combined_result:
            self.combined_result = self.final_result


class BaseAgent(ABC):
    """Abstract base class for all specialist agents."""

    def __init__(self, metadata: AgentMetadata):
        self.metadata = metadata

    @abstractmethod
    async def execute(self, payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent task and return a validated dictionary."""
        pass
