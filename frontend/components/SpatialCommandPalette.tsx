'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  BrainCircuit,
  Bot,
  FolderGit2,
  ListTodo,
  Activity,
  Info,
  GraduationCap,
  Sparkles,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectSkill: (skill: string) => void;
  onTriggerQuickAgentRun: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Profile';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  perform: () => void;
}

export const SpatialCommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectSkill,
  onTriggerQuickAgentRun,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'nav-discover',
      title: 'Discover Issues (Search curated tasks)',
      category: 'Navigation',
      icon: Search,
      perform: () => {
        onNavigate('discover');
        onClose();
      },
    },
    {
      id: 'nav-agents',
      title: 'Agent Studio (Multi-Agent Constellation & Inspector)',
      category: 'Navigation',
      icon: Bot,
      perform: () => {
        onNavigate('agents');
        onClose();
      },
    },
    {
      id: 'nav-repo',
      title: 'Repository Explorer (Inspect code & verified context)',
      category: 'Navigation',
      icon: FolderGit2,
      perform: () => {
        onNavigate('repo');
        onClose();
      },
    },
    {
      id: 'nav-analyzer',
      title: 'AI Issue Analyzer (Single-issue deep breakdown)',
      category: 'Navigation',
      icon: BrainCircuit,
      perform: () => {
        onNavigate('analyzer');
        onClose();
      },
    },
    {
      id: 'nav-plans',
      title: 'My Contribution Plans (Checklists & Roadmaps)',
      category: 'Navigation',
      icon: ListTodo,
      perform: () => {
        onNavigate('plans');
        onClose();
      },
    },
    {
      id: 'nav-activity',
      title: 'Agent Activity & Tasks (Live execution history)',
      category: 'Navigation',
      icon: Activity,
      perform: () => {
        onNavigate('activity');
        onClose();
      },
    },
    {
      id: 'nav-about',
      title: 'About OpenSource Navigator AI (Architecture & Hackathon)',
      category: 'Navigation',
      icon: Info,
      perform: () => {
        onNavigate('about');
        onClose();
      },
    },
    {
      id: 'act-run-pipeline',
      title: 'Run Full Multi-Agent Workflow Pipeline',
      category: 'Actions',
      icon: Sparkles,
      shortcut: '↵',
      perform: () => {
        onNavigate('agents');
        onTriggerQuickAgentRun();
        onClose();
      },
    },
    {
      id: 'act-skill-beginner',
      title: 'Set Skill Level: Beginner (Student / First-time contributor)',
      category: 'Profile',
      icon: GraduationCap,
      perform: () => {
        onSelectSkill('Beginner');
        onClose();
      },
    },
    {
      id: 'act-skill-intermediate',
      title: 'Set Skill Level: Intermediate (Familiar with git & framework)',
      category: 'Profile',
      icon: GraduationCap,
      perform: () => {
        onSelectSkill('Intermediate');
        onClose();
      },
    },
    {
      id: 'act-skill-advanced',
      title: 'Set Skill Level: Advanced (Production-grade / Senior reviewer)',
      category: 'Profile',
      icon: GraduationCap,
      perform: () => {
        onSelectSkill('Advanced');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled outside or via prop
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev + 1 < filteredCommands.length ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-xl">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12141a]/95 backdrop-blur-2xl shadow-2xl shadow-black/90 text-slate-100 flex flex-col max-h-[75vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top edge glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5 bg-black/40">
          <Search className="h-5 w-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to workspace view..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-body"
            autoFocus
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 font-body">
              No matching workspace actions found for &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredCommands.map((command, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => command.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/35 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{command.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {command.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {command.shortcut && (
                      <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                        {command.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2 bg-slate-950/80 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-400">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-400">
                ↵
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-400">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="text-emerald-400 font-mono text-[10px]">
            Spatial Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};
