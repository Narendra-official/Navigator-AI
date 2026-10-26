import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlanFromWorkflowResult,
  createPlanFromAnalysis,
  exportPlanToMarkdown,
} from '../lib/storage';

describe('Frontend Storage & Plan Generation', () => {
  it('converts analysis result to a structured contribution plan', () => {
    const mockAnalysis = {
      issue_title: 'Fix typo in documentation',
      repository_name: 'pallets/flask',
      issue_url: 'https://github.com/pallets/flask/issues/100',
      plain_english_summary: 'Simple typo in docs',
      problem_description: 'Misspelled keyword in quickstart guide',
      expected_outcome: 'Documentation is fixed',
      possible_skills: ['Markdown', 'Python'],
      estimated_difficulty: 'Beginner' as const,
      difficulty_rationale: 'Documentation-only fix with no code impact',
      investigation_plan: ['Locate typo in docs/quickstart.rst'],
      suggested_inspection_areas: [
        {
          area_or_path: 'docs/quickstart.rst',
          rationale: 'Contains the typo',
          is_hypothesis: false,
          is_verified_in_repo: true,
          provenance: 'Verified from GitHub' as const,
        },
      ],
      testing_strategy: ['Build docs with sphinx'],
      common_pitfalls: ['Breaking sphinx cross-references'],
      maintainer_questions: ['Should we also update tutorial.rst?'],
      verification_checklist: ['Doc builds without warnings'],
      model_used: 'llama3:8b',
      disclaimer: 'AI-generated guidance may be incorrect',
    };

    const plan = createPlanFromAnalysis(mockAnalysis);
    assert.equal(plan.issue_title, 'Fix typo in documentation');
    assert.equal(plan.repository_name, 'pallets/flask');
    assert.equal(plan.status, 'Not Started');
    assert.ok(plan.preparation_tasks.length > 0);
    assert.ok(plan.investigation_tasks.length > 0);
    assert.ok(plan.implementation_tasks.length > 0);
    assert.ok(plan.testing_tasks.length > 0);
    assert.ok(plan.pr_checklist.length > 0);

    // Markdown export check
    const md = exportPlanToMarkdown(plan);
    assert.ok(md.includes('# Contribution Roadmap: Fix typo in documentation'));
    assert.ok(md.includes('pallets/flask'));
    assert.ok(md.includes('### 1. Preparation & Setup'));
  });

  it('synthesizes multi-agent workflow results into a typed plan with provenance', () => {
    const mockRecord = {
      run_id: 'run-test-123',
      created_at: Date.now(),
      status: 'completed' as const,
      issue_title: 'Add support for JSON logging',
      repository_name: 'pallets/flask',
      user_skill_level: 'Intermediate',
      issue_context: {
        title: 'Add support for JSON logging',
        repo: 'pallets/flask',
        url: 'https://github.com/pallets/flask/issues/200',
      },
      combined_result: {
        issue_understanding: {
          plain_english_summary: 'Allow users to configure JSON structured logs',
          acceptance_criteria: ['Logs format in JSON when configured'],
        },
        repository_context: {
          contributing_found: true,
          verified_files: ['src/flask/logging.py', 'tests/test_logging.py'],
        },
        skill_matching: {
          suitability_assessment: 'Good',
          suitability_reasons: ['Requires basic knowledge of Python logging'],
          recommended_prep_steps: ['Review Python standard logging module'],
        },
        contribution_planning: {
          roadmap_tasks: [
            {
              title: 'Inspect logging handler',
              description: 'Check src/flask/logging.py',
              is_hypothesis: false,
            },
            {
              title: 'Add JSON formatter',
              description: 'Implement custom Formatter subclass',
              is_hypothesis: true,
            },
          ],
        },
        test_strategy: {
          test_framework: 'pytest',
          reproduction_steps: ['Run pytest tests/test_logging.py'],
          test_cases: [
            {
              name: 'test_json_formatter',
              purpose: 'Verify valid JSON is output',
              expected_result: 'Valid JSON string',
            },
          ],
        },
        pr_readiness: {
          suggested_pr_title: 'feat: Add configurable JSON log formatter',
          checklist: ['Include unit tests', 'Update docs'],
        },
      },
      model_used: 'llama3:8b',
    };

    const plan = createPlanFromWorkflowResult(mockRecord);
    assert.equal(plan.issue_title, 'Add support for JSON logging');
    assert.equal(plan.repository_name, 'pallets/flask');
    assert.equal(plan.source_workflow_run_id, 'run-test-123');

    // Check verified task vs hypothesis
    const verifiedTask = plan.implementation_tasks.find((t) => t.is_hypothesis === false);
    const hypothesisTask = plan.implementation_tasks.find((t) => t.is_hypothesis === true);

    assert.ok(verifiedTask, 'Should contain verified implementation task');
    assert.ok(hypothesisTask, 'Should contain AI hypothesis implementation task');
    assert.equal(verifiedTask?.provenance, 'Verified from GitHub');
    assert.equal(hypothesisTask?.provenance, 'Inferred by AI');

    const md = exportPlanToMarkdown(plan);
    assert.ok(md.includes('[Verified from GitHub]'));
    assert.ok(md.includes('[Inferred by AI]'));
  });
});
