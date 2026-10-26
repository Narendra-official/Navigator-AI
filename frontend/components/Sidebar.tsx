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
    <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-4 shrink-0">
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between rounded-xl p-3 text-left transition-all cursor-pointer whitespace-nowrap md:whitespace-normal ${
                isActive
                  ? 'bg-slate-900 border border-slate-700 shadow-md text-white'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">{item.label}</div>
                  <div className="hidden lg:block text-[11px] text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="hidden md:block h-4 w-4 text-emerald-400" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Spatial HUD Info Card */}
      <div className="hidden md:block mt-8 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950 p-4">
        <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Spatial AI Workspace</span>
        </div>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Powered by local open-weight <code className="text-emerald-300">deepseek-r1:8b</code> with zero cloud API keys required.
        </p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-2.5">
          <span>Ollama Engine</span>
          <span className="text-slate-300">v0.1.x / REST</span>
        </div>
      </div>
    </aside>
  );
};
