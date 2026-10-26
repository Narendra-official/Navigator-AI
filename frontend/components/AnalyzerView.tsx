'use client';

import React from 'react';
import {
  Sparkles,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  FileCode2,
  FolderGit2,
  ListOrdered,
  PlusCircle,
  RotateCcw,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisResult } from '../lib/types';

interface AnalyzerViewProps {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreatePlan: (analysis: AnalysisResult) => void;
  onBackToDiscover: () => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  analysis,
  loading,
  error,
  onRetry,
  onCreatePlan,
  onBackToDiscover,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-emerald-500 p-0.5 animate-spin">
            <div className="h-full w-full rounded-2xl bg-slate-950" />
          </div>
          <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-emerald-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Analyzing GitHub Issue with Open-Weight AI</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md">
          Retrieving verified repository structure, dissecting the problem statement, and formulating a customized contribution roadmap...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center max-w-2xl mx-auto my-8">
        <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-rose-200">AI Analysis Error</h3>
        <p className="mt-2 text-sm text-rose-300 leading-relaxed">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Analysis</span>
          </button>
          <button
            onClick={onBackToDiscover}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
          >
            Back to Issues
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center my-6">
        <div className="h-12 w-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Issue Currently Selected</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Navigate to the &quot;Discover Issues&quot; tab and click &quot;Analyze with AI&quot; on any GitHub issue to generate an interactive contribution guide.
        </p>
        <button
          onClick={onBackToDiscover}
          className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
        >
          Discover Real Issues
        </button>
      </div>
    );
  }

  const getDifficultyBadge = (level?: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Advanced':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const repoContext = analysis.retrieved_repo_context;
  const possibleSkills = analysis.possible_skills || [];
  const inspectionAreas = analysis.suggested_inspection_areas || [];
  const investigationPlan = analysis.investigation_plan || [];
  const testingStrategy = analysis.testing_strategy || [];
  const commonPitfalls = analysis.common_pitfalls || [];
  const maintainerQuestions = analysis.maintainer_questions || [];

  return (
    <div className="space-y-6">
      {/* Disclaimer Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-200">Important Notice: </span>
          {analysis.disclaimer || 'AI-generated guidance is advisory. Always consult repository guidelines.'}
        </div>
      </div>

      {/* Main Issue Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>{analysis.repository_name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-sans font-medium">Model: {analysis.model_used || 'deepseek-r1:8b'}</span>
              {analysis.user_skill_level && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-sky-400 font-sans font-medium">Profile: {analysis.user_skill_level}</span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {analysis.issue_title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {repoContext?.contributing_url && (
              <a
                href={repoContext.contributing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all"
                title="View CONTRIBUTING.md"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Contributing Guide</span>
              </a>
            )}

            {analysis.issue_url && (
              <a
                href={analysis.issue_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all"
              >
                <span>GitHub Issue</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <button
              onClick={() => onCreatePlan(analysis)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Contribution Plan</span>
            </button>
          </div>
        </div>

        {/* Difficulty & Skills Banner */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Estimated Contributor Difficulty</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getDifficultyBadge(
                  analysis.estimated_difficulty
                )}`}
              >
                {analysis.estimated_difficulty || 'Beginner'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.difficulty_rationale || 'Straightforward beginner task.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              Skills & Concepts To Understand
            </span>
            <div className="flex flex-wrap gap-1.5">
              {possibleSkills.length > 0 ? (
                possibleSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">General coding and Git proficiency</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid for Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plain English Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3>Plain-English Explanation (For Beginners)</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {analysis.plain_english_summary}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Problem Description
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {analysis.problem_description}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Expected Outcome
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {analysis.expected_outcome}
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Inspection Areas (Grounded with Verified Files) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-emerald-400" />
              <h3>Suggested Repository Inspection Targets</h3>
            </div>
            {repoContext?.verified_files && repoContext.verified_files.length > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Repo-Aware
              </span>
            ) : (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                Hypotheses Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Files verified against repository contents are marked in green; uninspected paths are flagged as hypotheses.
          </p>

          <div className="space-y-2.5">
            {inspectionAreas.length > 0 ? (
              inspectionAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span className="text-slate-100 font-medium">{area.area_or_path}</span>
                    {area.is_verified_in_repo ? (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30 font-sans font-medium shrink-0">
                        ✓ Verified in Repo
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 border border-amber-500/30 font-sans font-medium shrink-0">
                        Hypothesis
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-slate-300 leading-relaxed">{area.rationale}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic">No specific files identified yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Investigation Plan & Testing Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step-by-step Investigation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <ListOrdered className="h-4 w-4 text-sky-400" />
            <h3>Step-by-Step Investigation Plan</h3>
          </div>
          <ol className="space-y-2.5 text-xs">
            {investigationPlan.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[11px] font-bold text-sky-400">
                  {idx + 1}
                </span>
                <span className="text-slate-300 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Testing Strategy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <h3>Testing & Verification Strategy</h3>
          </div>
          <ul className="space-y-2 text-xs">
            {testingStrategy.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Common Pitfalls & Maintainer Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Pitfalls */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h3>Common Pitfalls & Risks</h3>
          </div>
          <ul className="space-y-2 text-xs">
            {commonPitfalls.map((pitfall, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-xl border border-rose-500/10 bg-rose-950/10 p-3 text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Maintainer Questions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
            <HelpCircle className="h-4 w-4 text-purple-400" />
            <h3>Questions to Clarify with Maintainers</h3>
          </div>
          <ul className="space-y-2 text-xs">
            {maintainerQuestions.map((q, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-xl border border-purple-500/10 bg-purple-950/10 p-3 text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
