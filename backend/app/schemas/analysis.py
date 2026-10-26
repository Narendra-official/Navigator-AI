from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class SuggestedAreaHypothesis(BaseModel):
    area_or_path: str = Field(description="File, module, or directory path to inspect")
    rationale: str = Field(description="Why this area relates to the issue")
    is_hypothesis: bool = Field(default=True, description="True if based on AI hypothesis, false if verified in repo")
    is_verified_in_repo: bool = Field(default=False, description="True if path confirmed present in repository")
    provenance: str = Field(default="Inferred by AI", description="Provenance indicator: Verified from GitHub | Inferred by AI")


class AnalyzeRequest(BaseModel):
    issue_title: str = Field(..., min_length=2, max_length=500)
    issue_body: Optional[str] = Field(default="", max_length=15000)
    repository_name: str = Field(..., min_length=3, max_length=200)
    issue_url: str = Field(...)
    labels: List[str] = Field(default_factory=list)
    user_skill_level: Optional[str] = Field(
        default="Beginner",
        description="Contributor self-assessed level (Beginner, Intermediate, Advanced)",
    )


class AnalysisResult(BaseModel):
    issue_title: str
    repository_name: str
    issue_url: str
    plain_english_summary: str
    problem_description: str
    expected_outcome: str
    possible_skills: List[str]
    estimated_difficulty: DifficultyLevel
    difficulty_rationale: str
    investigation_plan: List[str]
    suggested_inspection_areas: List[SuggestedAreaHypothesis]
    testing_strategy: List[str]
    common_pitfalls: List[str]
    maintainer_questions: List[str]
    verification_checklist: List[str]
    model_used: str
    user_skill_level: str = "Beginner"
    retrieved_repo_context: Optional[Dict[str, Any]] = None
    execution_mode: str = "ai_model"
    is_rule_based_fallback: bool = False
    provenance: str = "AI reasoning synthesized from verified repository metadata"
    disclaimer: str = (
        "AI-generated guidance may be incorrect and is advisory. Verify recommendations against the "
        "repository code and maintainer instructions before submitting a PR."
    )
