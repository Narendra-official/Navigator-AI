'use client';

import React from 'react';
import {
  Compass,
  Cpu,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Command,
  Bot,
} from 'lucide-react';
import { HealthStatus } from '../lib/types';

interface NavbarProps {
  health: HealthStatus | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  userSkill: string;
  onSkillChange: (skill: string) => void;
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  healthLoading,
  onRefreshHealth,
  userSkill,
  onSkillChange,
  onOpenCommandPalette,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0e0e11]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1700px] mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-lg shadow-emerald-500/25 border border-white/20">
            <Compass className="h-5 w-5 text-white animate-spin-slow" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-headline">
                OpenSource Navigator <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25 shadow-sm font-mono tracking-tight">
                Spatial HUD
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block tracking-tight font-body">
              Autonomous multi-agent constellation for beginner open-source contributors
            </p>
          </div>
        </div>

        {/* Center: Command Palette Trigger Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#161820]/70 hover:bg-[#1f222e] px-4 py-2 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/10 group backdrop-blur-md"
        >
          <Command className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-400 group-hover:text-slate-200">Quick actions &amp; search...</span>
          <kbd className="rounded-md bg-white/[0.06] border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono text-slate-300 shadow-inner">
            ⌘K / Ctrl+K
          </kbd>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Skill Profile Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161820]/80 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-sm">
            <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-slate-400">Skill:</span>
            <select
              value={userSkill}
              onChange={(e) => onSkillChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
              title="Tailor AI explanations, test strategies, and PR readiness to your skill level"
            >
              <option value="Beginner" className="bg-[#161820] text-slate-200">Beginner</option>
              <option value="Intermediate" className="bg-[#161820] text-slate-200">Intermediate</option>
              <option value="Advanced" className="bg-[#161820] text-slate-200">Advanced</option>
            </select>
          </div>

          {/* Ollama Status Pill */}
          <button
            onClick={onRefreshHealth}
            title="Click to refresh system health status"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#161820]/80 px-3 py-1.5 text-xs text-slate-300 hover:border-white/20 hover:bg-[#1f222e] transition-all cursor-pointer backdrop-blur-md shadow-sm"
          >
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden md:inline font-mono text-slate-400">Ollama:</span>
            {healthLoading ? (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            ) : health?.ollama.connected ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-emerald-400 truncate max-w-[130px] font-mono">
                  {health.ollama.configured_model}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-medium text-rose-400">Offline</span>
              </div>
            )}
          </button>

          {/* Multi-Agent Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300 font-mono backdrop-blur-md shadow-sm">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold">8 Specialists Ready</span>
          </div>

          {/* GitHub API Status Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#161820]/80 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-sm">
            <GitBranch className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">GitHub:</span>
            {health?.github.token_configured ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Auth (5k/h)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400" title="Unauthenticated limit: 60 req/h">
                <AlertCircle className="h-3 w-3" /> Public (60/h)
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
