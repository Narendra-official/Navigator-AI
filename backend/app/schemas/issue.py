from typing import List, Optional
from pydantic import BaseModel, Field


class IssueLabel(BaseModel):
    name: str
    color: Optional[str] = "6b7280"
    description: Optional[str] = None


class IssueItem(BaseModel):
    id: int
    number: int
    title: str
    body: Optional[str] = ""
    html_url: str
    state: str = "open"
    created_at: str
    updated_at: str
    comments_count: int = 0
    repository_name: str  # e.g., "fastapi/fastapi"
    repository_url: str   # e.g., "https://github.com/fastapi/fastapi"
    labels: List[IssueLabel] = Field(default_factory=list)


class IssueSearchResponse(BaseModel):
    total_count: int
    items: List[IssueItem]
    page: int = 1
    per_page: int = 15
    total_pages: int = 1
    rate_limited: bool = False
    rate_limit_reset: Optional[int] = None
    message: Optional[str] = None
