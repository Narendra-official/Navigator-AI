import {
  AnalysisResult,
  ChecklistItem,
  ContributionPlan,
  PlanStatus,
  TaskProvenance,
  WorkflowRunRecord,
} from './types';

const STORAGE_KEY = 'os_navigator_contribution_plans_v1';

export type PlanSectionKey =
  | 'preparation_tasks'
  | 'investigation_tasks'
  | 'implementation_tasks'
  | 'testing_tasks'
  | 'pr_checklist';

export function getStoredPlans(): ContributionPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load contribution plans from localStorage:', e);
    return [];
  }
}

export function savePlans(plans: ContributionPlan[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (e) {
    console.error('Failed to save contribution plans to localStorage (quota or permission):', e);
    return false;
  }
}

export function createPlanFromAnalysis(analysis: AnalysisResult): ContributionPlan {
  const toItems = (
    arr: string[],
    prefix: string,
    provenance: TaskProvenance = 'Inferred by AI'
  ): ChecklistItem[] =>
    arr.map((text, i) => ({
      id: `${prefix}-${i}-${Date.now()}`,
      text,
      completed: false,
      provenance,
    }));

  const prepDefaults = [
    'Fork repository to your GitHub account and clone locally',
    analysis.retrieved_repo_context?.contributing_found
      ? 'Read the verified CONTRIBUTING.md guidelines in the repository'
      : 'Verify CONTRIBUTING.md, Code of Conduct, and development guidelines',
    'Set up local development environment and ensure base test suite passes',
    'Create an isolated feature branch (e.g. git checkout -b fix/issue-name)',
  ];

  const prDefaults = [
    'Run full test suite locally and ensure 100% clean pass',
    'Follow repository code formatting, linting, and typing checks',
    'Write or update unit tests covering your changes',
    'Craft clear commit messages referencing the issue number (e.g. Closes #...)',
    'Open Pull Request with a descriptive summary and screenshots/logs if applicable',
  ];

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    issue_title: analysis.issue_title,
    repository_name: analysis.repository_name,
    issue_url: analysis.issue_url,
    skill_level_reason: `${analysis.estimated_difficulty} - ${analysis.difficulty_rationale}`,
    status: 'Not Started',
    created_at: new Date().toISOString(),
    preparation_tasks: toItems(
      prepDefaults,
      'prep',
      analysis.retrieved_repo_context?.contributing_found
        ? 'Verified from GitHub'
        : 'Needs manual verification'
    ),
    investigation_tasks: toItems(analysis.investigation_plan, 'inv', 'Inferred by AI'),
    implementation_tasks: toItems(
      analysis.suggested_inspection_areas.map((a) => {
        const tag = a.is_verified_in_repo ? '[Verified from GitHub]' : '[Inferred by AI]';
        return `${tag} ${a.area_or_path}: ${a.rationale}`;
      }),
      'impl',
      'Inferred by AI'
    ),
    testing_tasks: toItems(
      analysis.testing_strategy.map((s) => `[Proposed] ${s}`),
      'test',
      'Inferred by AI'
    ),
    pr_checklist: toItems(prDefaults, 'pr', 'Inferred by AI'),
    model_used: analysis.model_used,
  };
}

interface AgentResultData {
  issue_understanding?: {
    plain_english_summary?: string;
    acceptance_criteria?: string[];
  };
  repository_context?: {
    contributing_found?: boolean;
    verified_files?: string[];
  };
  skill_matching?: {
    suitability_assessment?: string;
    suitability_reasons?: string[];
    recommended_prep_steps?: string[];
  };
  contribution_planning?: {
    roadmap_tasks?: Array<{
      title?: string;
      description?: string;
      files?: string[];
      is_hypothesis?: boolean;
    }>;
  };
  test_strategy?: {
    test_framework?: string;
    suggested_test_framework?: string;
    test_commands?: string[];
    reproduction_steps?: string[];
    test_cases?: Array<{
      name?: string;
      purpose?: string;
      expected_result?: string;
    }>;
    proposed_tests?: Array<{
      description?: string;
      target_file?: string;
      is_hypothesis?: boolean;
    }>;
  };
  pr_readiness?: {
    suggested_pr_title?: string;
    draft_pr_description?: string;
    checklist?: string[];
    pr_checklist?: string[];
  };
  [key: string]: unknown;
}

/**
 * Synthesizes multi-agent workflow results into a rich, structured ContributionPlan.
 */
export function createPlanFromWorkflowResult(record: WorkflowRunRecord): ContributionPlan {
  const combined = ((record.combined_result || record.final_result || {}) as unknown) as AgentResultData;
  const rawReq = record.original_request as Record<string, unknown> | null;

  const issueTitle: string =
    typeof record.issue_title === 'string' && record.issue_title
      ? record.issue_title
      : typeof record.issue_context?.title === 'string' && record.issue_context.title
      ? record.issue_context.title
      : typeof rawReq?.issue_title === 'string' && (rawReq.issue_title as string)
      ? (rawReq.issue_title as string)
      : 'Open Source Contribution Plan';

  const repoName: string =
    typeof record.repository_name === 'string' && record.repository_name
      ? record.repository_name
      : typeof record.issue_context?.repo === 'string' && record.issue_context.repo
      ? record.issue_context.repo
      : typeof rawReq?.repository_name === 'string' && (rawReq.repository_name as string)
      ? (rawReq.repository_name as string)
      : 'repository';

  const issueUrl: string =
    typeof record.issue_context?.url === 'string' && record.issue_context.url
      ? record.issue_context.url
      : typeof rawReq?.issue_url === 'string' && (rawReq.issue_url as string)
      ? (rawReq.issue_url as string)
      : `https://github.com/${repoName}`;

  const understanding = combined.issue_understanding || {};
  const repoContext = combined.repository_context || {};
  const skillMatch = combined.skill_matching || {};
  const planning = combined.contribution_planning || {};
  const testStrategy = combined.test_strategy || {};
  const prReadiness = combined.pr_readiness || {};

  const skillReason = skillMatch.suitability_assessment
    ? `${skillMatch.suitability_assessment} match for ${record.user_skill_level || 'Beginner'} contributor (${(skillMatch.suitability_reasons || []).join(' ')})`
    : `Tailored for ${record.user_skill_level || 'Beginner'} contributor`;

  const toItems = (
    items: Array<{ text: string; provenance?: TaskProvenance; is_hypothesis?: boolean }>,
    prefix: string
  ): ChecklistItem[] =>
    items.map((it, idx) => ({
      id: `${prefix}-${idx}-${Date.now()}`,
      text: it.text,
      completed: false,
      provenance: it.provenance || 'Inferred by AI',
      is_hypothesis: it.is_hypothesis,
    }));

  // 1. Preparation tasks
  const prepList: Array<{ text: string; provenance?: TaskProvenance }> = [
    { text: `Fork ${repoName} to your GitHub profile and clone locally`, provenance: 'Verified from GitHub' },
  ];
  if (repoContext.contributing_found) {
    prepList.push({
      text: 'Read repository CONTRIBUTING.md guidelines and setup environment',
      provenance: 'Verified from GitHub',
    });
  } else {
    prepList.push({
      text: 'Review repository README and locate contributing instructions',
      provenance: 'Needs manual verification',
    });
  }
  if (skillMatch.recommended_prep_steps && skillMatch.recommended_prep_steps.length > 0) {
    for (const step of skillMatch.recommended_prep_steps) {
      prepList.push({ text: `Prep: ${step}`, provenance: 'Inferred by AI' });
    }
  }

  // 2. Investigation tasks
  const invList: Array<{ text: string; provenance?: TaskProvenance; is_hypothesis?: boolean }> = [];
  if (understanding.plain_english_summary) {
    invList.push({
      text: `Context: ${understanding.plain_english_summary}`,
      provenance: 'Inferred by AI',
    });
  }
  if (understanding.acceptance_criteria && understanding.acceptance_criteria.length > 0) {
    for (const ac of understanding.acceptance_criteria) {
      invList.push({ text: `Acceptance Goal: ${ac}`, provenance: 'Inferred by AI' });
    }
  }

  // 3. Implementation tasks from roadmap tasks
  const implList: Array<{ text: string; provenance?: TaskProvenance; is_hypothesis?: boolean }> = [];
  const roadmapTasks = planning.roadmap_tasks || [];
  if (roadmapTasks.length > 0) {
    for (const t of roadmapTasks) {
      const isHyp = Boolean(t.is_hypothesis);
      const tag = isHyp ? '[Inferred by AI]' : '[Verified from GitHub]';
      implList.push({
        text: `${tag} ${t.title}: ${t.description || ''}`,
        provenance: isHyp ? 'Inferred by AI' : 'Verified from GitHub',
        is_hypothesis: isHyp,
      });
    }
  } else {
    implList.push({
      text: `Implement minimal code changes addressing '${issueTitle}'`,
      provenance: 'Inferred by AI',
    });
  }

  // 4. Testing & Verification tasks
  const testList: Array<{ text: string; provenance?: TaskProvenance }> = [];
  const framework = testStrategy.suggested_test_framework || 'pytest';
  testList.push({
    text: `Run base repository test suite locally using ${framework}`,
    provenance: 'Needs manual verification',
  });
  if (testStrategy.reproduction_steps && testStrategy.reproduction_steps.length > 0) {
    for (const rep of testStrategy.reproduction_steps) {
      testList.push({ text: `Reproduction: ${rep}`, provenance: 'Inferred by AI' });
    }
  }
  if (testStrategy.test_cases && testStrategy.test_cases.length > 0) {
    for (const tc of testStrategy.test_cases) {
      testList.push({
        text: `[Proposed Test Case] ${tc.name}: ${tc.purpose} -> Expected: ${tc.expected_result}`,
        provenance: 'Inferred by AI',
      });
    }
  }

  // 5. PR Readiness Checklist
  const prList: Array<{ text: string; provenance?: TaskProvenance }> = [];
  const checklists = prReadiness.pr_checklist || [
    'Confirm all automated test suites pass locally with 0 regressions',
    'Follow repository code formatting, typing, and linting rules',
    `Reference issue URL in Pull Request body (${issueUrl})`,
    'Include clear before/after verification logs or screenshots',
  ];
  for (const c of checklists) {
    prList.push({ text: c, provenance: 'Inferred by AI' });
  }

  return {
    id: `plan-agent-${record.run_id}-${Date.now().toString(36)}`,
    issue_title: issueTitle,
    repository_name: repoName,
    issue_url: issueUrl,
    skill_level_reason: skillReason,
    status: 'Not Started',
    created_at: new Date().toISOString(),
    preparation_tasks: toItems(prepList, 'prep'),
    investigation_tasks: toItems(invList, 'inv'),
    implementation_tasks: toItems(implList, 'impl'),
    testing_tasks: toItems(testList, 'test'),
    pr_checklist: toItems(prList, 'pr'),
    source_workflow_run_id: record.run_id,
    model_used: record.model_used || 'Open-Weight Multi-Agent System',
  };
}

export function savePlan(plan: ContributionPlan): ContributionPlan[] {
  const existing = getStoredPlans();
  const index = existing.findIndex((p) => p.id === plan.id);
  let updated: ContributionPlan[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = plan;
  } else {
    updated = [plan, ...existing];
  }
  savePlans(updated);
  return updated;
}

export function deletePlan(id: string): ContributionPlan[] {
  const existing = getStoredPlans();
  const updated = existing.filter((p) => p.id !== id);
  savePlans(updated);
  return updated;
}

export function toggleTaskCompletion(
  planId: string,
  sectionKey: PlanSectionKey,
  taskId: string
): ContributionPlan[] {
  const existing = getStoredPlans();
  const updated = existing.map((p) => {
    if (p.id !== planId) return p;
    const tasks = p[sectionKey].map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    return { ...p, [sectionKey]: tasks };
  });
  savePlans(updated);
  return updated;
}

export function addTaskToSection(
  planId: string,
  sectionKey: PlanSectionKey,
  taskText: string
): ContributionPlan[] {
  const clean = taskText ? taskText.trim() : '';
  if (!clean) return getStoredPlans();

  const existing = getStoredPlans();
  const updated = existing.map((p) => {
    if (p.id !== planId) return p;
    const newTask: ChecklistItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: clean,
      completed: false,
      custom: true,
      provenance: 'Verified from GitHub',
    };
    return { ...p, [sectionKey]: [...p[sectionKey], newTask] };
  });
  savePlans(updated);
  return updated;
}

export function deleteTaskFromSection(
  planId: string,
  sectionKey: PlanSectionKey,
  taskId: string
): ContributionPlan[] {
  const existing = getStoredPlans();
  const updated = existing.map((p) => {
    if (p.id !== planId) return p;
    const filtered = p[sectionKey].filter((t) => t.id !== taskId);
    return { ...p, [sectionKey]: filtered };
  });
  savePlans(updated);
  return updated;
}

export function updatePlanStatus(planId: string, status: PlanStatus): ContributionPlan[] {
  const existing = getStoredPlans();
  const updated = existing.map((p) => (p.id === planId ? { ...p, status } : p));
  savePlans(updated);
  return updated;
}

export function exportPlanToMarkdown(plan: ContributionPlan): string {
  const renderTasks = (tasks: ChecklistItem[]) =>
    tasks
      .map((t) => {
        const provTag = t.provenance ? ` [${t.provenance}]` : '';
        return `- [${t.completed ? 'x' : ' '}] ${t.text}${provTag}`;
      })
      .join('\n');

  return `# Contribution Roadmap: ${plan.issue_title}

**Repository:** [${plan.repository_name}](${plan.issue_url})  
**Status:** ${plan.status}  
**Skill Assessment:** ${plan.skill_level_reason}  
${plan.model_used ? `**Model/Pipeline:** ${plan.model_used}  \n` : ''}

> [!NOTE]  
> Tasks marked with **[Verified from GitHub]** are confirmed against active repository contents.  
> Tasks marked with **[Inferred by AI]** represent synthesized hypotheses and recommended practices.  
> Unexecuted tests are designated as **[Proposed]** strategies.

---

### 1. Preparation & Setup
${renderTasks(plan.preparation_tasks)}

### 2. Repository Investigation
${renderTasks(plan.investigation_tasks)}

### 3. Implementation Tasks
${renderTasks(plan.implementation_tasks)}

### 4. Testing & Verification
${renderTasks(plan.testing_tasks)}

### 5. Pull Request Preparation Checklist
${renderTasks(plan.pr_checklist)}

---
*Generated by OpenSource Navigator AI — Spatial Developer Workspace*
`;
}
