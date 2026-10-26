import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoredPlans,
  savePlan,
  deletePlan,
  toggleTaskCompletion,
  addTaskToSection,
  deleteTaskFromSection,
  updatePlanStatus,
} from '../lib/storage';
import { ContributionPlan } from '../lib/types';

// Mock localStorage in global scope for Node environment
const mockStorage: Record<string, string> = {};
global.window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k in mockStorage) delete mockStorage[k];
    },
  },
} as unknown as Window & typeof globalThis;
global.localStorage = global.window.localStorage;

describe('Contribution Plan Lifecycle & Tracking', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  const samplePlan: ContributionPlan = {
    id: 'plan-1',
    issue_title: 'Support asynchronous handlers in WSGI dispatcher',
    repository_name: 'pallets/werkzeug',
    issue_url: 'https://github.com/pallets/werkzeug/issues/500',
    skill_level_reason: 'Requires familiarity with async/await and WSGI',
    status: 'Not Started',
    created_at: new Date().toISOString(),
    preparation_tasks: [
      { id: 'prep-1', text: 'Fork and clone repo', completed: false, provenance: 'Verified from GitHub' },
    ],
    investigation_tasks: [
      { id: 'inv-1', text: 'Read dispatcher.py', completed: false, provenance: 'Inferred by AI' },
    ],
    implementation_tasks: [
      { id: 'impl-1', text: 'Wrap WSGI callable with async adapter', completed: false, provenance: 'Inferred by AI', is_hypothesis: true },
    ],
    testing_tasks: [
      { id: 'test-1', text: 'Run pytest tests/test_dispatcher.py', completed: false, provenance: 'Needs manual verification' },
    ],
    pr_checklist: [
      { id: 'pr-1', text: 'Run pre-commit hooks', completed: false, provenance: 'Inferred by AI' },
    ],
    model_used: 'llama3:8b',
  };

  it('saves and retrieves contribution plans with bounded persistence', () => {
    savePlan(samplePlan);
    const plans = getStoredPlans();
    assert.equal(plans.length, 1);
    assert.equal(plans[0].id, 'plan-1');
    assert.equal(plans[0].issue_title, 'Support asynchronous handlers in WSGI dispatcher');
  });

  it('toggles task completion status', () => {
    savePlan(samplePlan);
    const updated = toggleTaskCompletion('plan-1', 'preparation_tasks', 'prep-1');
    assert.equal(updated[0].preparation_tasks[0].completed, true);

    const toggledBack = toggleTaskCompletion('plan-1', 'preparation_tasks', 'prep-1');
    assert.equal(toggledBack[0].preparation_tasks[0].completed, false);
  });

  it('adds custom tasks and deletes tasks accurately', () => {
    savePlan(samplePlan);
    const withCustom = addTaskToSection('plan-1', 'implementation_tasks', 'Write custom docstrings');
    const implTasks = withCustom[0].implementation_tasks;
    assert.equal(implTasks.length, 2);
    const customTask = implTasks.find((t) => t.text === 'Write custom docstrings');
    assert.ok(customTask);
    assert.equal(customTask?.custom, true);

    // Delete custom task
    const afterDelete = deleteTaskFromSection('plan-1', 'implementation_tasks', customTask!.id);
    assert.equal(afterDelete[0].implementation_tasks.length, 1);
  });

  it('updates plan status between Not Started, In Progress, and Completed', () => {
    savePlan(samplePlan);
    const inProgress = updatePlanStatus('plan-1', 'In Progress');
    assert.equal(inProgress[0].status, 'In Progress');

    const completed = updatePlanStatus('plan-1', 'Completed');
    assert.equal(completed[0].status, 'Completed');
  });

  it('deletes plan completely', () => {
    savePlan(samplePlan);
    const afterDelete = deletePlan('plan-1');
    assert.equal(afterDelete.length, 0);
    assert.equal(getStoredPlans().length, 0);
  });
});
