import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.issue import IssueItem

REPO_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$")


def normalize_repo_name(repo: Optional[str]) -> Optional[str]:
    if not repo:
        return None
    clean = repo.strip().replace("https://github.com/", "").strip("/")
    return clean if clean else None


def is_valid_repo_name(repo: Optional[str]) -> bool:
    clean = normalize_repo_name(repo)
    if not clean or ".." in clean or clean.count("/") != 1:
        return False
    return bool(REPO_PATTERN.match(clean))


# 1. Issue Discovery Agent
class IssueDiscoveryInput(BaseModel):
    query: str = ""
    language: Optional[str] = None
    label: Optional[str] = None
    repo: Optional[str] = None
    page: int = 1
    per_page: int = 15
    sort: str = "updated"

    @field_validator("repo", mode="before")
    @classmethod
    def clean_repo(cls, v: Any) -> Optional[str]:
        if isinstance(v, str):
            clean = normalize_repo_name(v)
            return clean
        return v


class IssueDiscoveryOutput(BaseModel):
    total_count: int
    items: List[IssueItem]
    page: int
    per_page: int
    total_pages: int
    rate_limited: bool = False
    rate_limit_reset: Optional[int] = None
    source: str = "GitHub REST API"
    execution_mode: str = "api_retrieval"


# 2. Issue Understanding Agent
class IssueUnderstandingInput(BaseModel):
    issue_title: str
    issue_body: Optional[str] = ""
    repository_name: str
    issue_url: str = ""
    labels: List[str] = Field(default_factory=list)

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class IssueUnderstandingOutput(BaseModel):
    plain_english_summary: str
    problem_statement: str
    expected_outcome: str
    acceptance_criteria: List[str]
    identified_ambiguities: List[str]
    maintainer_clarifications: List[str]
    confidence_level: str = "High"
    model_used: Optional[str] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False


# 3. Repository Context Agent
class RepositoryContextInput(BaseModel):
    repository_name: str

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class RepositoryContextOutput(BaseModel):
    repository_name: str
    verified_files: List[str]
    contributing_found: bool
    contributing_url: Optional[str] = None
    readme_snippet: Optional[str] = None
    primary_language: Optional[str] = None
    provenance: str = "GitHub Contents API"
    execution_mode: str = "api_retrieval"


# 4. Skill Matching Agent
class SkillMatchingInput(BaseModel):
    issue_title: str
    issue_body: Optional[str] = ""
    repository_name: str
    user_experience: str = "Beginner"  # Beginner, Intermediate, Advanced
    preferred_languages: List[str] = Field(default_factory=lambda: ["Python", "TypeScript"])
    learning_goals: Optional[str] = None
    available_hours_per_week: Optional[int] = 5

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class SkillMatchingOutput(BaseModel):
    contributor_level: str
    suitability_assessment: str  # Excellent, Moderate, Challenging
    suitability_reasons: List[str]
    required_skills: List[str]
    missing_prerequisites: List[str]
    recommended_prep_steps: List[str]
    estimated_difficulty: str
    uncertainty_note: str
    model_used: Optional[str] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False


# 5. Contribution Planning Agent
class ContributionPlanningInput(BaseModel):
    issue_title: str
    repository_name: str
    issue_url: str = ""
    understanding: Optional[Dict[str, Any]] = None
    repo_context: Optional[Dict[str, Any]] = None
    skill_match: Optional[Dict[str, Any]] = None

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class PlanTask(BaseModel):
    id: str
    title: str
    phase: str  # preparation, investigation, implementation, testing, pr
    description: str
    is_hypothesis: bool = False
    dependencies: List[str] = Field(default_factory=list)
    completed: bool = False
    provenance: str = "Inferred by AI"


class ContributionPlanningOutput(BaseModel):
    issue_title: str
    repository_name: str
    roadmap_tasks: List[PlanTask]
    key_risks: List[str]
    verification_criteria: List[str]
    model_used: Optional[str] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False


# 6. Test Strategy Agent
class TestStrategyInput(BaseModel):
    __test__ = False
    issue_title: str
    issue_body: Optional[str] = ""
    repository_name: str
    verified_files: List[str] = Field(default_factory=list)

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class TestCaseSuggestion(BaseModel):
    __test__ = False
    name: str
    purpose: str
    expected_result: str
    test_type: str = "Unit"  # Unit, Integration, Manual Reproduction
    execution_status: str = "Proposed (Not Executed)"


class TestStrategyOutput(BaseModel):
    __test__ = False
    suggested_test_framework: str
    reproduction_steps: List[str]
    test_cases: List[TestCaseSuggestion]
    edge_cases_to_consider: List[str]
    success_indicators: List[str]
    failure_indicators: List[str]
    model_used: Optional[str] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False


# 7. PR Readiness Agent
class PRReadinessInput(BaseModel):
    issue_title: str
    repository_name: str
    issue_url: str = ""
    completed_task_ids: List[str] = Field(default_factory=list)
    total_task_count: int = 0
    understanding: Optional[Dict[str, Any]] = None
    test_strategy: Optional[Dict[str, Any]] = None

    @field_validator("repository_name")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        clean = normalize_repo_name(v)
        if not clean or not is_valid_repo_name(clean):
            raise ValueError(f"Invalid repository name '{v}'. Expected format 'owner/repo'.")
        return clean


class PRReadinessOutput(BaseModel):
    readiness_score_pct: int
    readiness_level: str  # "Ready for Review", "Needs Testing", "In Progress", "Needs Setup"
    proposed_pr_title: str
    proposed_pr_body: str
    pr_checklist: List[str]
    known_limitations: List[str]
    unresolved_questions: List[str]
    disclaimer: str = "Readiness assessment only. Does not guarantee maintainer approval."
    model_used: Optional[str] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False


# Workflow Run Request & Response
class WorkflowRunRequest(BaseModel):
    target_agent: str = "orchestrator"  # "orchestrator" or agent ID
    agent_name: Optional[str] = None  # alias for target_agent
    issue_title: Optional[str] = None
    issue_body: Optional[str] = ""
    repository_name: Optional[str] = None
    issue_url: Optional[str] = None
    labels: List[str] = Field(default_factory=list)
    user_experience: str = "Beginner"
    user_skill_level: Optional[str] = None
    preferred_languages: List[str] = Field(default_factory=list)
    learning_goals: Optional[str] = None
    search_params: Optional[Dict[str, Any]] = None
    search_query: Optional[str] = None
    search_language: Optional[str] = None
    search_label: Optional[str] = None
    search_page: Optional[int] = None
    search_per_page: Optional[int] = None
    search_sort: Optional[str] = None
    upstream_outputs: Optional[Dict[str, Any]] = None

    def model_post_init(self, __context: Any) -> None:
        if self.agent_name and self.target_agent == "orchestrator":
            self.target_agent = self.agent_name
        if self.user_skill_level and self.user_experience == "Beginner":
            self.user_experience = self.user_skill_level


class WorkflowRunResponse(BaseModel):
    run_id: str
    status: str
    target_agent: str
    created_at: float
    message: str
    record: Optional[Dict[str, Any]] = None


def adapt_input_for_agent(agent_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Explicitly adapt generic workflow payload to the specific inputs required by each specialist agent."""
    repo = normalize_repo_name(payload.get("repository_name") or payload.get("repo"))
    title = (payload.get("issue_title") or "").strip()
    body = payload.get("issue_body") or ""
    url = (payload.get("issue_url") or "").strip() or (f"https://github.com/{repo}" if repo else "")
    labels = payload.get("labels") or []

    if agent_id == "issue_discovery":
        # Extract search parameters
        search_params = payload.get("search_params") or {}
        q = (
            payload.get("query")
            or payload.get("search_query")
            or payload.get("q")
            or search_params.get("q")
            or title
            or ""
        )
        lang = payload.get("language") or payload.get("search_language") or search_params.get("language")
        lbl = payload.get("label") or payload.get("search_label") or search_params.get("label")
        r = repo or search_params.get("repo")
        page = payload.get("page") or payload.get("search_page") or search_params.get("page") or 1
        per_page = payload.get("per_page") or payload.get("search_per_page") or search_params.get("per_page") or 15
        sort = payload.get("sort") or payload.get("search_sort") or search_params.get("sort") or "updated"
        return {
            "query": q,
            "language": lang,
            "label": lbl,
            "repo": r,
            "page": int(page),
            "per_page": int(per_page),
            "sort": sort,
        }

    elif agent_id == "repository_context":
        if not repo or not is_valid_repo_name(repo):
            raise ValueError(
                f"Repository Context Agent requires a valid repository in 'owner/name' format. Received: '{payload.get('repository_name')}'"
            )
        return {"repository_name": repo}

    elif agent_id == "issue_understanding":
        if not title:
            raise ValueError("Issue Understanding Agent requires 'issue_title'.")
        if not repo or not is_valid_repo_name(repo):
            raise ValueError("Issue Understanding Agent requires a valid 'repository_name'.")
        return {
            "issue_title": title,
            "issue_body": body,
            "repository_name": repo,
            "issue_url": url,
            "labels": labels,
        }

    elif agent_id == "skill_matching":
        if not title:
            raise ValueError("Skill Matching Agent requires 'issue_title'.")
        if not repo or not is_valid_repo_name(repo):
            raise ValueError("Skill Matching Agent requires a valid 'repository_name'.")
        exp = payload.get("user_experience") or payload.get("user_skill_level") or "Beginner"
        langs = payload.get("preferred_languages") or ["Python", "TypeScript"]
        goals = payload.get("learning_goals")
        return {
            "issue_title": title,
            "issue_body": body,
            "repository_name": repo,
            "user_experience": exp,
            "preferred_languages": langs,
            "learning_goals": goals,
            "available_hours_per_week": payload.get("available_hours_per_week", 5),
        }

    elif agent_id == "contribution_planning":
        if not title:
            raise ValueError("Contribution Planning Agent requires 'issue_title'.")
        if not repo or not is_valid_repo_name(repo):
            raise ValueError("Contribution Planning Agent requires a valid 'repository_name'.")
        upstream = payload.get("upstream_outputs") or {}
        return {
            "issue_title": title,
            "repository_name": repo,
            "issue_url": url,
            "understanding": payload.get("understanding") or upstream.get("issue_understanding"),
            "repo_context": payload.get("repo_context") or upstream.get("repository_context"),
            "skill_match": payload.get("skill_match") or upstream.get("skill_matching"),
        }

    elif agent_id == "test_strategy":
        if not title:
            raise ValueError("Test Strategy Agent requires 'issue_title'.")
        if not repo or not is_valid_repo_name(repo):
            raise ValueError("Test Strategy Agent requires a valid 'repository_name'.")
        upstream = payload.get("upstream_outputs") or {}
        repo_ctx = payload.get("repo_context") or upstream.get("repository_context") or {}
        v_files = payload.get("verified_files") or repo_ctx.get("verified_files") or []
        return {
            "issue_title": title,
            "issue_body": body,
            "repository_name": repo,
            "verified_files": v_files,
        }

    elif agent_id == "pr_readiness":
        if not title:
            raise ValueError("PR Readiness Agent requires 'issue_title'.")
        if not repo or not is_valid_repo_name(repo):
            raise ValueError("PR Readiness Agent requires a valid 'repository_name'.")
        upstream = payload.get("upstream_outputs") or {}
        plan = payload.get("contribution_planning") or upstream.get("contribution_planning") or {}
        tasks = plan.get("roadmap_tasks") or []
        return {
            "issue_title": title,
            "repository_name": repo,
            "issue_url": url,
            "completed_task_ids": payload.get("completed_task_ids") or [],
            "total_task_count": payload.get("total_task_count") or len(tasks),
            "understanding": payload.get("understanding") or upstream.get("issue_understanding"),
            "test_strategy": payload.get("test_strategy") or upstream.get("test_strategy"),
        }

    return payload
