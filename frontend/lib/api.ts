import {
  AgentMetadata,
  AnalysisResult,
  HealthStatus,
  IssueSearchResponse,
  RepoFileContentResponse,
  RepoFileExploreResponse,
  WorkflowRunRecord,
  WorkflowRunRequest,
  WorkflowRunResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // Fallback to status text
        if (res.statusText) errorMsg = `${res.status} ${res.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Please check backend connection.`);
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to OpenSource Navigator AI backend at ${API_BASE}. Ensure the FastAPI server is running.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getHealth(): Promise<HealthStatus> {
  return fetchJson<HealthStatus>(`${API_BASE}/api/v1/health`, { cache: 'no-store' }, 8000);
}

export async function fetchIssues(params: {
  q?: string;
  language?: string;
  label?: string;
  repo?: string;
  page?: number;
  per_page?: number;
  sort?: string;
}): Promise<IssueSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.language && params.language !== 'all') query.set('language', params.language);
  if (params.label && params.label !== 'all') query.set('label', params.label);
  if (params.repo) query.set('repo', params.repo);
  if (params.page) query.set('page', params.page.toString());
  if (params.per_page) query.set('per_page', params.per_page.toString());
  if (params.sort) query.set('sort', params.sort);

  try {
    return await fetchJson<IssueSearchResponse>(
      `${API_BASE}/api/v1/issues?${query.toString()}`,
      { cache: 'no-store' },
      20000
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.toLowerCase().includes('rate limit')) {
      let reset: number | null = null;
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.rate_limit_reset) reset = parsed.rate_limit_reset;
      } catch {
        // Not JSON
      }
      return {
        total_count: 0,
        items: [],
        page: params.page || 1,
        per_page: params.per_page || 10,
        total_pages: 1,
        rate_limited: true,
        rate_limit_reset: reset,
        message: err.message,
      };
    }
    throw err;
  }
}

export async function analyzeIssue(payload: {
  issue_title: string;
  issue_body?: string;
  repository_name: string;
  issue_url: string;
  labels?: string[];
  user_skill_level?: string;
}): Promise<AnalysisResult> {
  return fetchJson<AnalysisResult>(
    `${API_BASE}/api/v1/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    90000
  );
}

// ==========================================
// Multi-Agent API Endpoints
// ==========================================

export async function listAgents(): Promise<AgentMetadata[]> {
  return fetchJson<AgentMetadata[]>(`${API_BASE}/api/v1/agents`, { cache: 'no-store' }, 10000);
}

export async function listRuns(limit = 20): Promise<WorkflowRunRecord[]> {
  return fetchJson<WorkflowRunRecord[]>(
    `${API_BASE}/api/v1/agents/runs?limit=${limit}`,
    { cache: 'no-store' },
    10000
  );
}

export async function startWorkflowRun(payload: WorkflowRunRequest): Promise<WorkflowRunResponse> {
  return fetchJson<WorkflowRunResponse>(
    `${API_BASE}/api/v1/agents/runs`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    20000
  );
}

export async function getRunStatus(runId: string): Promise<WorkflowRunRecord> {
  return fetchJson<WorkflowRunRecord>(
    `${API_BASE}/api/v1/agents/runs/${encodeURIComponent(runId)}`,
    { cache: 'no-store' },
    10000
  );
}

export async function retryRun(runId: string): Promise<WorkflowRunResponse> {
  return fetchJson<WorkflowRunResponse>(
    `${API_BASE}/api/v1/agents/runs/${encodeURIComponent(runId)}/retry`,
    { method: 'POST' },
    15000
  );
}

export async function cancelRun(
  runId: string
): Promise<{ run_id: string; status: string; message: string }> {
  return fetchJson<{ run_id: string; status: string; message: string }>(
    `${API_BASE}/api/v1/agents/runs/${encodeURIComponent(runId)}/cancel`,
    { method: 'POST' },
    10000
  );
}

// ==========================================
// Repository Exploration Endpoints
// ==========================================

export async function exploreRepository(
  repo: string,
  maxFiles = 60
): Promise<RepoFileExploreResponse> {
  const query = new URLSearchParams({
    repo,
    max_files: maxFiles.toString(),
  });
  return fetchJson<RepoFileExploreResponse>(
    `${API_BASE}/api/v1/repository/explore?${query.toString()}`,
    { cache: 'no-store' },
    15000
  );
}

export async function fetchRepositoryFile(
  repo: string,
  filePath: string
): Promise<RepoFileContentResponse> {
  const query = new URLSearchParams({
    repo,
    path: filePath,
  });
  return fetchJson<RepoFileContentResponse>(
    `${API_BASE}/api/v1/repository/file?${query.toString()}`,
    { cache: 'no-store' },
    15000
  );
}
