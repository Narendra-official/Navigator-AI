'use client';

import React from 'react';
import {
  Compass,
  Cpu,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Bot,
  Workflow,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-4">
            <Award className="h-3.5 w-3.5" />
            <span>Hacktoberfest Hack Day Pune × NIAT–ADYPU</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            OpenSource Navigator <span className="text-emerald-400">AI</span>
          </h2>
          <p className="mt-2 text-base text-slate-300 font-medium">
            Explore open source. Understand the code. Make your first contribution.
          </p>
          <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
            Designed for students and early-career developers venturing into open source.
            Rather than feeling overwhelmed by unfamiliar enterprise codebases and cryptic issue trackers,
            OpenSource Navigator AI provides a Spatial Developer Workspace with 8 autonomous, typed AI specialist agents
            orchestrated over local open-weight models.
          </p>
        </div>
      </div>

      {/* Prize Category & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3 mb-3 text-emerald-400">
            <Award className="h-5 w-5" />
            <h3 className="font-bold text-white text-base">Prize Category</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Targeting the <strong className="text-emerald-400">Best Open-Source AI Project</strong> prize category. Built strictly with open standards, zero commercial vendor lock-in, and full local execution on consumer hardware.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3 mb-3 text-purple-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold text-white text-base">Open-Weight AI</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Uses locally running open-weight language models via <strong className="text-purple-400">Ollama</strong> (e.g. <code className="text-emerald-300">deepseek-r1:8b</code> / <code className="text-emerald-300">qwen3:4b</code>). No paid proprietary API keys or external data exfiltration.
          </p>
        </div>
      </div>

      {/* 8 Autonomous Specialist Agents */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3 mb-4 text-emerald-400">
          <Bot className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">8 Autonomous AI Specialist Agents</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">1. Discovery Agent</div>
            <p className="text-slate-400 text-[11px]">Curates good-first-issues and student tasks from GitHub REST API.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">2. Understanding Agent</div>
            <p className="text-slate-400 text-[11px]">Translates cryptic maintainer jargon into plain-English explanations.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">3. Repo Context Agent</div>
            <p className="text-slate-400 text-[11px]">Retrieves verified trees, test suites, and contributor documentation.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">4. Skill Matching Agent</div>
            <p className="text-slate-400 text-[11px]">Maps required languages, frameworks, and prerequisite knowledge.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">5. Planning Agent</div>
            <p className="text-slate-400 text-[11px]">Builds step-by-step investigation, code, and debugging milestones.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">6. Test Strategy Agent</div>
            <p className="text-slate-400 text-[11px]">Formulates reproduction steps, regression cases, and test assertions.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">7. PR Readiness Agent</div>
            <p className="text-slate-400 text-[11px]">Constructs commit guidelines, PR descriptions, and sanity checklists.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="font-bold text-emerald-300 mb-1">8. Orchestrator Nucleus</div>
            <p className="text-slate-400 text-[11px]">Manages pipeline state, cancellation, and task store persistence.</p>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3 mb-4 text-sky-400">
          <Layers className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Full-Stack Technology Stack</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Compass className="h-4 w-4" />
              <span>Spatial UI (Next.js)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Next.js App Router, TypeScript, Tailwind CSS, Lucide icons. Command palette (Ctrl+K), interactive 2D agent constellation, and live telemetry feeds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
              <Workflow className="h-4 w-4" />
              <span>Multi-Agent Engine (FastAPI)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Python 3, FastAPI, Pydantic schemas, HTTPX async clients. Bounded in-memory TaskStore, cancellation token support, and typed specialist agents.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <Cpu className="h-4 w-4" />
              <span>Inference Engine (Ollama)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Ollama local HTTP API running open-weight models. Generates deterministic JSON responses with strict validation and safe hypothesis framing.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Safety Posture */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3 mb-4 text-rose-400">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Security & Guardrails</h3>
        </div>

        <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
            <span>
              <strong>Untrusted Input Sanitization:</strong> Public GitHub issue text is treated strictly as untrusted external data and never concatenated as raw system instructions.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
            <span>
              <strong>Zero Token Leakage:</strong> Optional GitHub API tokens are kept strictly inside the server environment and are never returned to the browser or committed to version control.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
            <span>
              <strong>Grounding & Verification:</strong> Distinguishes verified repository files from unverified AI hypotheses. Cites file paths and lines only when actually retrieved.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
            <span>
              <strong>Zero Unattended Actions:</strong> The application does not automatically clone untrusted repos, execute code, or submit unauthorized pull requests.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
