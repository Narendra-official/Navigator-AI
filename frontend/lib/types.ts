export interface IssueLabel {
  name: string;
  color: string;
  description?: string | null;
}

export interface IssueItem {
  id: number;
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
  repository_name: string;
  repository_url: string;
  labels: IssueLabel[];
}

export interface IssueSearchResponse {
  total_count: number;
  items: IssueItem[];
  page: number;
  per_page: number;
  total_pages: number;
  rate_limited: boolean;
  rate_limit_reset?: number | null;
  message?: string | null;
}

export type TaskProvenance =
  | 'Verified from GitHub'
  | 'Inferred by AI'
  | 'Needs manual verification'
  | 'Not available';

export interface SuggestedAreaHypothesis {
  area_or_path: string;
  rationale: string;
  is_hypothesis: boolean;
  is_verified_in_repo?: boolean;
  provenance?: TaskProvenance;
}

export interface AnalysisResult {
  issue_title: string;
  repository_name: string;
  issue_url: string;
  plain_english_summary: string;
  problem_description: string;
  expected_outcome: string;
  possible_skills: string[];
  estimated_difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty_rationale: string;
  investigation_plan: string[];
  suggested_inspection_areas: SuggestedAreaHypothesis[];
  testing_strategy: string[];
  common_pitfalls: string[];
  maintainer_questions: string[];
  verification_checklist: string[];
  model_used: string;
  user_skill_level?: string;
  retrieved_repo_context?: {
    verified_files?: string[];
    contributing_found?: boolean;
    contributing_url?: string | null;
  } | null;
  execution_mode?: string;
  is_rule_based_fallback?: boolean;
  provenance?: string;
  disclaimer: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  custom?: boolean;
  provenance?: TaskProvenance;
  phase?: string;
  is_hypothesis?: boolean;
}

export type PlanStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface ContributionPlan {
  id: string;
  issue_title: string;
  repository_name: string;
  issue_url: string;
  skill_level_reason: string;
  status: PlanStatus;
  created_at: string;
  preparation_tasks: ChecklistItem[];
  investigation_tasks: ChecklistItem[];
  implementation_tasks: ChecklistItem[];
  testing_tasks: ChecklistItem[];
  pr_checklist: ChecklistItem[];
  source_workflow_run_id?: string;
  model_used?: string;
}

export interface HealthStatus {
  status: string;
  system_health?: string;
  app_name: string;
  version: string;
  ollama: {
    connected: boolean;
    configured_model: string;
    model_available?: boolean;
    available_models: string[];
    active_model?: string | null;
    degraded_mode?: boolean;
    degraded_reason?: string | null;
  };
  github: {
    token_configured: boolean;
    rate_limit_authenticated?: boolean;
  };
}

// ==========================================
// Multi-Agent System Types
// ==========================================

export type AgentRole =
  | 'discovery'
  | 'understanding'
  | 'repo_context'
  | 'skill_matching'
  | 'planning'
  | 'test_strategy'
  | 'pr_readiness'
  | 'orchestrator'
  | string;

export type AgentRunStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'waiting'
  | string;

export interface AgentMetadata {
  id?: string;
  name: string;
  role: string;
  display_name?: string;
  description: string;
  inputs_required?: string[];
  produces?: string[];
  phase?: number;
  is_autonomous?: boolean;
  capabilities?: string[];
  system_prompt_snippet?: string;
  input_schema_name?: string;
  output_schema_name?: string;
  model?: string;
}

export interface AgentExecutionRecord {
  agent_id?: string;
  agent_name: string;
  role?: string;
  status: AgentRunStatus;
  started_at?: number | string | null;
  completed_at?: number | string | null;
  duration_ms?: number | null;
  error?: string | null;
  input_summary?: string | Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  model_used?: string | null;
  execution_mode?: string | null;
}

export interface WorkflowRunRecord {
  run_id: string;
  target_agent?: string;
  created_at: number | string;
  status: AgentRunStatus;
  agent_filter?: string | null;
  issue_title?: string | null;
  repository_name?: string | null;
  issue_context?: {
    title?: string;
    repo?: string;
    url?: string;
    body?: string;
  } | null;
  model_used?: string;
  started_at?: number | string | null;
  completed_at?: number | string | null;
  duration_ms?: number | null;
  total_duration_ms?: number | null;
  error?: string | null;
  failing_stage?: string | null;
  user_skill_level?: string;
  agents_state?: Record<string, AgentExecutionRecord>;
  agent_executions?: AgentExecutionRecord[];
  combined_result?: Record<string, unknown> | null;
  final_result?: Record<string, unknown> | null;
  original_request?: WorkflowRunRequest | Record<string, unknown> | null;
}

export interface WorkflowRunRequest {
  target_agent?: string;
  agent_name?: string | null;
  issue_title?: string | null;
  issue_body?: string | null;
  repository_name?: string | null;
  issue_url?: string | null;
  labels?: string[];
  user_experience?: string;
  user_skill_level?: string;
  user_skills_list?: string[];
  search_query?: string;
  search_language?: string;
  search_label?: string;
  search_page?: number;
  search_per_page?: number;
  search_sort?: string;
  search_params?: Record<string, unknown>;
  upstream_outputs?: Record<string, unknown>;
}

export interface WorkflowRunResponse {
  run_id: string;
  status: AgentRunStatus;
  target_agent?: string;
  created_at?: number;
  message: string;
  record?: WorkflowRunRecord;
}

export interface RepoTreeItem {
  name: string;
  type: 'file' | 'dir' | string;
  path: string;
  size?: number;
}

export interface RepoFileExploreResponse {
  repository_name?: string;
  files_count?: number;
  files?: string[];
  verified_files?: string[];
  items?: RepoTreeItem[];
  first_file?: string | null;
  contributing_found?: boolean;
  contributing_file?: string | null;
  contributing_url?: string | null;
  readme_file?: string | null;
  test_directories?: string[];
}

export interface RepoFileContentResponse {
  found?: boolean;
  path?: string;
  file_path?: string;
  size?: number;
  size_bytes?: number;
  is_directory?: boolean;
  is_truncated?: boolean;
  truncated?: boolean;
  content?: string;
  error?: string | null;
  html_url?: string | null;
}

/**
 * Utility helper to extract executions safely from any format of WorkflowRunRecord
 */
export function getAgentExecutionsList(record: WorkflowRunRecord | null | undefined): AgentExecutionRecord[] {
  if (!record) return [];
  if (record.agent_executions && Array.isArray(record.agent_executions) && record.agent_executions.length > 0) {
    return record.agent_executions;
  }
  if (record.agents_state && typeof record.agents_state === 'object') {
    return Object.values(record.agents_state);
  }
  return [];
}
