'use client';

import React, { useState } from 'react';
import {
  AgentMetadata,
  AgentRunStatus,
  AgentExecutionRecord,
} from '../lib/types';
import {
  Compass,
  FileSearch,
  FolderGit2,
  GraduationCap,
  ListTodo,
  CheckCircle2,
  GitPullRequest,
  Workflow,
  Clock,
  LayoutGrid,
  Orbit,
} from 'lucide-react';

interface AgentConstellationProps {
  agents: AgentMetadata[];
  activeAgentId: string | null;
  onSelectAgent: (agentIdOrName: string) => void;
  executions: AgentExecutionRecord[];
  isWorkflowRunning: boolean;
}

export const AgentConstellation: React.FC<AgentConstellationProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
  executions,
  isWorkflowRunning,
}) => {
  const [viewMode, setViewMode] = useState<'spatial' | 'list'>('spatial');

  // Map execution status by agent id and name
  const statusMap = new Map<
    string,
    { status: AgentRunStatus; duration?: number | null; error?: string | null }
  >();
  (executions || []).forEach((e) => {
    if (e.agent_id) {
      statusMap.set(e.agent_id, { status: e.status, duration: e.duration_ms, error: e.error });
    }
    if (e.agent_name) {
      statusMap.set(e.agent_name, { status: e.status, duration: e.duration_ms, error: e.error });
    }
  });

  const getAgentIcon = (idOrName: string) => {
    const key = (idOrName || '').toLowerCase();
    if (key.includes('orchestrat')) return Workflow;
    if (key.includes('discovery')) return Compass;
    if (key.includes('understanding')) return FileSearch;
    if (key.includes('repo') || key.includes('context')) return FolderGit2;
    if (key.includes('skill')) return GraduationCap;
    if (key.includes('plan')) return ListTodo;
    if (key.includes('test')) return CheckCircle2;
    if (key.includes('pr') || key.includes('readiness')) return GitPullRequest;
    return Compass;
  };

  const orchestrator =
    agents.find((a) => a.id === 'orchestrator' || a.name?.toLowerCase().includes('orchestrat')) ||
    agents[0];
  const specialistAgents = agents.filter((a) => a !== orchestrator);

  // Responsive percentage-based coordinates (50% center, 36% radius)
  const total = Math.max(1, specialistAgents.length);
  const nodes = specialistAgents.map((agent, i) => {
    const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
    const xPct = 50 + 36 * Math.cos(angle);
    const yPct = 50 + 36 * Math.sin(angle);
    return { agent, xPct, yPct };
  });

  const getStatusColor = (status: AgentRunStatus, isSelected: boolean) => {
    switch (status) {
      case 'running':
        return {
          stroke: '#f59e0b',
          strokeWidth: '2.5',
          border: 'border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          lineDash: '4 4',
        };
      case 'completed':
        return {
          stroke: '#10b981',
          strokeWidth: '2',
          border: 'border-emerald-500 bg-slate-900/90 shadow-md shadow-emerald-500/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          lineDash: 'none',
        };
      case 'failed':
        return {
          stroke: '#f43f5e',
          strokeWidth: '2',
          border: 'border-rose-500 bg-slate-900/90 shadow-md shadow-rose-500/20',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          lineDash: 'none',
        };
      case 'cancelled':
        return {
          stroke: '#64748b',
          strokeWidth: '1.5',
          border: 'border-slate-700 bg-slate-950/90 opacity-75',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          lineDash: '2 2',
        };
      case 'queued':
        return {
          stroke: '#38bdf8',
          strokeWidth: '2',
          border: 'border-sky-400 bg-slate-900/90 shadow-sm shadow-sky-500/10',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          lineDash: '3 3',
        };
      default:
        return {
          stroke: isSelected ? '#38bdf8' : '#334155',
          strokeWidth: isSelected ? '2' : '1.2',
          border: isSelected
            ? 'border-sky-400 bg-slate-900 ring-2 ring-sky-400/40'
            : 'border-slate-800 bg-slate-950/80 hover:border-slate-700',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          lineDash: 'none',
        };
    }
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 overflow-hidden select-none shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[540px]">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 spatial-grid-pattern pointer-events-none" />

      {/* Ambient Lighting Depth */}
      <div
        className={`absolute inset-0 m-auto w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isWorkflowRunning ? 'bg-emerald-500/10' : 'bg-cyan-500/5'
        }`}
      />

      {/* Top Controls Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Orbit className="h-4 w-4 text-emerald-400" />
            <span>Multi-Agent Constellation</span>
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
            8 Specialists
          </span>
        </div>

        {/* View Switcher: Spatial vs List for mobile & accessibility */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('spatial')}
            aria-label="Switch to Spatial Orbit View"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'spatial'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Orbit</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="Switch to Compact List View"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: SPATIAL ORBIT VIEW */}
      {viewMode === 'spatial' ? (
        <div className="relative flex-1 w-full min-h-[440px] my-2 flex items-center justify-center">
          {/* Responsive SVG connection lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Outer Orbit Track */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.3"
              strokeDasharray="1 1.5"
              className="opacity-60"
            />

            {/* Connecting lines from center orchestrator to specialist agents */}
            {nodes.map(({ agent, xPct, yPct }) => {
              const agentKey = agent.id || agent.name;
              const info = statusMap.get(agentKey) || (agent.id ? statusMap.get(agent.id) : undefined);
              const isSelected = activeAgentId === agentKey || (agent.id && activeAgentId === agent.id);
              const status = info?.status || 'idle';
              const styles = getStatusColor(status, Boolean(isSelected));

              return (
                <line
                  key={agentKey}
                  x1="50%"
                  y1="50%"
                  x2={`${xPct}%`}
                  y2={`${yPct}%`}
                  stroke={styles.stroke}
                  strokeWidth={styles.strokeWidth}
                  strokeDasharray={styles.lineDash}
                  className="transition-colors duration-300"
                />
              );
            })}
          </svg>

          {/* Center Orchestrator Node */}
          {orchestrator && (
            <button
              type="button"
              role="button"
              tabIndex={0}
              aria-label={`Select Orchestrator Agent. Status: ${isWorkflowRunning ? 'Running' : 'Ready'}`}
              aria-pressed={
                activeAgentId === (orchestrator.id || orchestrator.name) ||
                activeAgentId === 'orchestrator'
              }
              onClick={() => onSelectAgent(orchestrator.id || orchestrator.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectAgent(orchestrator.id || orchestrator.name);
                }
              }}
              style={{ left: '50%', top: '50%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all duration-300 z-20 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeAgentId === (orchestrator.id || orchestrator.name) ||
                activeAgentId === 'orchestrator'
                  ? 'ring-2 ring-emerald-400 bg-slate-900 shadow-xl shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900/90 border border-slate-700 hover:border-emerald-500/60 shadow-lg'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md ${
                    isWorkflowRunning ? 'animate-pulse' : ''
                  }`}
                >
                  <Workflow className="h-5 w-5" />
                </div>
                {isWorkflowRunning && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-xs font-bold text-white tracking-wide">
                {orchestrator.display_name || orchestrator.name || 'Orchestrator'}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-wider">
                {isWorkflowRunning ? 'COORDINATING' : 'READY'}
              </span>
            </button>
          )}

          {/* Specialist Satellite Nodes */}
          {nodes.map(({ agent, xPct, yPct }) => {
            const agentKey = agent.id || agent.name;
            const Icon = getAgentIcon(agentKey);
            const info = statusMap.get(agentKey) || (agent.id ? statusMap.get(agent.id) : undefined);
            const isSelected = activeAgentId === agentKey || (agent.id && activeAgentId === agent.id);
            const status = info?.status || 'idle';
            const styles = getStatusColor(status, Boolean(isSelected));

            return (
              <button
                type="button"
                role="button"
                tabIndex={0}
                key={agentKey}
                aria-label={`Select agent ${agent.display_name || agent.name}, status ${status}`}
                aria-pressed={Boolean(isSelected)}
                onClick={() => onSelectAgent(agentKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectAgent(agentKey);
                  }
                }}
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-2 rounded-2xl cursor-pointer transition-all duration-200 z-10 w-28 sm:w-32 text-center border focus-visible:ring-2 focus-visible:ring-emerald-400 ${styles.border} hover:scale-105`}
              >
                <div className="relative mb-1">
                  <div
                    className={`p-1.5 rounded-xl ${
                      status === 'running'
                        ? 'bg-amber-500/20 text-amber-300'
                        : status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : status === 'failed'
                        ? 'bg-rose-500/20 text-rose-400'
                        : status === 'cancelled'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-100 truncate w-full px-1">
                  {agent.display_name || agent.name}
                </span>

                <div className="mt-1 flex items-center justify-center gap-1 w-full">
                  <span
                    className={`text-[8px] sm:text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-md border ${styles.badge}`}
                  >
                    {status}
                  </span>
                  {info?.duration != null && (
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Clock className="h-2 w-2" />
                      {(info.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* View Mode 2: ACCESSIBLE COMPACT LIST VIEW */
        <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
          {agents.map((agent) => {
            const agentKey = agent.id || agent.name;
            const Icon = getAgentIcon(agentKey);
            const info = statusMap.get(agentKey) || (agent.id ? statusMap.get(agent.id) : undefined);
            const isSelected = activeAgentId === agentKey || (agent.id && activeAgentId === agent.id);
            const status = info?.status || 'idle';
            const styles = getStatusColor(status, Boolean(isSelected));

            return (
              <button
                type="button"
                key={agentKey}
                role="button"
                tabIndex={0}
                aria-label={`Select agent ${agent.name}, status ${status}`}
                aria-pressed={Boolean(isSelected)}
                onClick={() => onSelectAgent(agentKey)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${styles.border}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {agent.display_name || agent.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{agent.role}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${styles.badge}`}
                  >
                    {status}
                  </span>
                  {info?.duration != null && (
                    <span className="text-[9px] font-mono text-slate-400">
                      {(info.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Accessible Interactive Legend */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/70 text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-600" /> Idle
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> Queued
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Running
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Failed
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-500" /> Cancelled
          </span>
        </div>

        <span className="hidden lg:inline text-slate-500 text-[10px]">
          Click or press Enter on any node to inspect typed I/O
        </span>
      </div>
    </div>
  );
};
