'use client';

import React from 'react';
import {
  Search,
  BrainCircuit,
  Bot,
  FolderGit2,
  ListTodo,
  Activity,
  Info,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'discover'
  | 'agents'
  | 'repo'
  | 'analyzer'
  | 'plans'
  | 'activity'
  | 'about';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  plansCount: number;
  hasActiveAnalysis: boolean;
  activeAgentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  plansCount,
  hasActiveAnalysis,
}) => {
  const items = [
    {
      id: 'discover' as NavTab,
      label: 'Discover Issues',
      icon: Search,
      description: 'Search curated open-source tasks',
    },
    {
      id: 'agents' as NavTab,
      label: 'Agent Studio',
      icon: Bot,
      description: '8 autonomous AI specialists constellation',
      badge: '8 Agents',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'repo' as NavTab,
      label: 'Repo Explorer',
      icon: FolderGit2,
      description: 'Inspect verified code & guidelines',
    },
    {
      id: 'analyzer' as NavTab,
      label: 'AI Issue Analyzer',
      icon: BrainCircuit,
      description: 'Deep breakdown & contribution strategy',
      badge: hasActiveAnalysis ? 'Active' : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'plans' as NavTab,
      label: 'Contribution Plans',
      icon: ListTodo,
      description: 'Personalized checklists & PR roadmap',
      badge: plansCount > 0 ? plansCount.toString() : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'activity' as NavTab,
      label: 'Agent Activity',
      icon: Activity,
      description: 'Live task telemetry & status logs',
    },
    {
      id: 'about' as NavTab,
      label: 'About the Project',
      icon: Info,
      description: 'Architecture & Hackathon details',
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-white/[0.07] bg-[#0e0e11]/80 backdrop-blur-2xl p-4 shrink-0 flex flex-col justify-between">
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex items-center justify-between rounded-xl p-3 text-left transition-all cursor-pointer whitespace-nowrap md:whitespace-normal group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/8 to-transparent border border-emerald-500/30 shadow-lg shadow-emerald-500/5 text-white'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent'
              }`}
            >
              {/* Active left indicator glow bar */}
              {isActive && (
                <span className="hidden md:block absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 group-hover:bg-white/[0.08] group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight tracking-tight font-headline">{item.label}</div>
                  <div className="hidden lg:block text-[11px] text-slate-500 mt-0.5 tracking-tight font-body">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border font-mono tracking-tight ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="hidden md:block h-4 w-4 text-emerald-400 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Spatial HUD Info Card */}
      <div className="hidden md:block mt-8 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#14161f]/90 via-[#0f1118]/90 to-[#0e0e11] p-4 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Spatial AI Workspace</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-body">
          Powered by local open-weight <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px] font-mono">deepseek-r1:8b</code> with zero cloud lock-in.
        </p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-white/[0.06] pt-2.5">
          <span>Ollama Engine</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            v0.1.x / REST
          </span>
        </div>
      </div>
    </aside>
  );
};
