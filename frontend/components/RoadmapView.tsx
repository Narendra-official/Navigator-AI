'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  FolderGit2,
  Sparkles,
  Info,
  Plus,
  Copy,
  Download,
  Check,
  X,
} from 'lucide-react';
import { ChecklistItem, ContributionPlan, PlanStatus } from '../lib/types';
import { PlanSectionKey, exportPlanToMarkdown } from '../lib/storage';

interface RoadmapViewProps {
  plans: ContributionPlan[];
  onToggleTask: (
    planId: string,
    section: PlanSectionKey,
    taskId: string
  ) => void;
  onAddTask: (
    planId: string,
    section: PlanSectionKey,
    text: string
  ) => void;
  onDeleteTask: (
    planId: string,
    section: PlanSectionKey,
    taskId: string
  ) => void;
  onUpdateStatus: (planId: string, status: PlanStatus) => void;
  onDeletePlan: (planId: string) => void;
  onGoToDiscover: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  plans,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateStatus,
  onDeletePlan,
  onGoToDiscover,
}) => {
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);
  const [newTasks, setNewTasks] = useState<Record<string, string>>({});

  const handleCopyMarkdown = (plan: ContributionPlan) => {
    const md = exportPlanToMarkdown(plan);
    navigator.clipboard.writeText(md);
    setCopiedPlanId(plan.id);
    setTimeout(() => setCopiedPlanId(null), 2500);
  };

  const handleDownloadMarkdown = (plan: ContributionPlan) => {
    const md = exportPlanToMarkdown(plan);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeRepo = plan.repository_name.replace('/', '-');
    link.setAttribute('download', `roadmap-${safeRepo}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewTask = (planId: string, sectionKey: PlanSectionKey) => {
    const key = `${planId}-${sectionKey}`;
    const text = newTasks[key];
    if (text && text.trim()) {
      onAddTask(planId, sectionKey, text.trim());
      setNewTasks((prev) => ({ ...prev, [key]: '' }));
    }
  };

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center my-8">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Sparkles className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-white">No Contribution Plans Yet</h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Explore open-source issues, run AI analysis, and click &quot;Create Contribution Plan&quot; to build your step-by-step contribution checklist!
        </p>
        <button
          onClick={onGoToDiscover}
          className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-lg shadow-emerald-950 cursor-pointer"
        >
          Discover Real Issues
        </button>
      </div>
    );
  }

  const renderSection = (
    planId: string,
    title: string,
    tasks: ChecklistItem[],
    sectionKey: PlanSectionKey
  ) => {
    const completedCount = tasks.filter((t) => t.completed).length;
    const inputKey = `${planId}-${sectionKey}`;
    const currentInput = newTasks[inputKey] || '';

    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
              {title}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {completedCount}/{tasks.length} done
            </span>
          </div>

          <ul className="space-y-1.5 mb-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-start justify-between gap-2 text-xs text-slate-300 p-2 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <div
                  onClick={() => onToggleTask(planId, sectionKey, task.id)}
                  className="flex items-start gap-2.5 flex-1 cursor-pointer"
                >
                  <div className="mt-0.5 text-emerald-400 shrink-0">
                    {task.completed ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-500 group-hover:text-slate-400" />
                    )}
                  </div>
                  <span
                    className={`leading-relaxed transition-all ${
                      task.completed
                        ? 'line-through text-slate-500'
                        : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {task.text}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteTask(planId, sectionKey, task.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                  title="Delete task"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add Custom Task Input */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5">
          <input
            type="text"
            value={currentInput}
            onChange={(e) =>
              setNewTasks((prev) => ({ ...prev, [inputKey]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewTask(planId, sectionKey);
              }
            }}
            placeholder="+ Add custom task..."
            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleAddNewTask(planId, sectionKey)}
            disabled={!currentInput.trim()}
            className="rounded-lg bg-slate-800 hover:bg-emerald-600 disabled:opacity-30 text-white p-1.5 text-xs transition-colors cursor-pointer"
            title="Add task"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Notice about local browser storage */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400">
        <Info className="h-4 w-4 text-sky-400 shrink-0" />
        <span>
          Contribution plans and checklist states are stored locally in your browser storage and are not synced to external servers.
        </span>
      </div>

      {plans.map((plan) => {
        const allTasks = [
          ...plan.preparation_tasks,
          ...plan.investigation_tasks,
          ...plan.implementation_tasks,
          ...plan.testing_tasks,
          ...plan.pr_checklist,
        ];
        const completedTotal = allTasks.filter((t) => t.completed).length;
        const progressPercent =
          allTasks.length > 0 ? Math.round((completedTotal / allTasks.length) * 100) : 0;

        return (
          <div
            key={plan.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>{plan.repository_name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-sans">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{plan.issue_title}</h3>
                <p className="mt-1 text-xs text-slate-400">{plan.skill_level_reason}</p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Selector */}
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <select
                    value={plan.status}
                    onChange={(e) => onUpdateStatus(plan.id, e.target.value as PlanStatus)}
                    className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Not Started" className="bg-slate-900 text-slate-200">
                      Not Started
                    </option>
                    <option value="In Progress" className="bg-slate-900 text-slate-200">
                      In Progress
                    </option>
                    <option value="Completed" className="bg-slate-900 text-slate-200">
                      Completed
                    </option>
                  </select>
                </div>

                {/* Copy Markdown */}
                <button
                  onClick={() => handleCopyMarkdown(plan)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all cursor-pointer"
                  title="Copy roadmap as markdown checklist"
                >
                  {copiedPlanId === plan.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>

                {/* Download Markdown */}
                <button
                  onClick={() => handleDownloadMarkdown(plan)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all cursor-pointer"
                  title="Download roadmap as markdown file"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>Download</span>
                </button>

                <a
                  href={plan.issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all"
                >
                  <span>Issue</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => onDeletePlan(plan.id)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 text-xs transition-all cursor-pointer"
                  title="Delete contribution plan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="my-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-300">Contribution Progress</span>
                <span className="font-mono font-bold text-emerald-400">
                  {completedTotal}/{allTasks.length} tasks ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Task Checklist Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSection(
                plan.id,
                '1. Preparation & Setup',
                plan.preparation_tasks,
                'preparation_tasks'
              )}
              {renderSection(
                plan.id,
                '2. Repository Investigation',
                plan.investigation_tasks,
                'investigation_tasks'
              )}
              {renderSection(
                plan.id,
                '3. Implementation Tasks',
                plan.implementation_tasks,
                'implementation_tasks'
              )}
              {renderSection(
                plan.id,
                '4. Testing & Verification',
                plan.testing_tasks,
                'testing_tasks'
              )}
            </div>

            <div className="mt-4">
              {renderSection(
                plan.id,
                '5. Pull Request Preparation Checklist',
                plan.pr_checklist,
                'pr_checklist'
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
