'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WorkflowRunRecord,
  getAgentExecutionsList,
} from '../lib/types';
import { listRuns, retryRun, cancelRun } from '../lib/api';
import {
  Activity,
  RotateCw,
  Clock,
  Play,
  Square,
  AlertCircle,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ActivityViewProps {
  onGoToStudio: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ onGoToStudio }) => {
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const data = await listRuns(30);
      if (Array.isArray(data)) {
        setRuns(data);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch agent activity log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchRuns();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchRuns]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRuns();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRuns]);

  const handleRetry = async (runId: string) => {
    try {
      await retryRun(runId);
      fetchRuns();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to retry run.');
    }
  };

  const handleCancel = async (runId: string) => {
    try {
      await cancelRun(runId);
      fetchRuns();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel run.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span>Agent Activity & Task History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-agent execution telemetry, durations, error traces, and status observables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>Live Sync (3s)</span>
          </label>

          <button
            onClick={fetchRuns}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-bold">Activity Feed Error</div>
            <div className="mt-1 text-slate-300">{error}</div>
          </div>
        </div>
      )}

      {/* Runs Table / Cards */}
      {runs.length === 0 && !loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-12 text-center space-y-4">
          <Bot className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">
            No agent executions logged yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Launch a multi-agent workflow in the Agent Studio to inspect live execution telemetry and status records.
          </p>
          <button
            onClick={onGoToStudio}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Open Agent Studio</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const isExpanded = expandedRunId === run.run_id;
            const execs = getAgentExecutionsList(run);
            const duration = run.total_duration_ms || run.duration_ms;

            return (
              <div
                key={run.run_id}
                className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden transition-all"
              >
                {/* Summary Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start md:items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] uppercase border shrink-0 ${
                        run.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : run.status === 'running'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                          : run.status === 'cancelled'
                          ? 'bg-slate-700/30 text-slate-400 border-slate-700'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {run.status}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 font-semibold">
                          Run: {run.run_id}
                        </span>
                        {run.target_agent && run.target_agent !== 'orchestrator' ? (
                          <span className="text-[10px] bg-slate-800 text-purple-300 font-mono px-2 py-0.5 rounded">
                            single:{run.target_agent}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                            pipeline:all-8
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-200 font-medium mt-0.5 truncate max-w-xl">
                        {run.issue_title || run.issue_context?.title || run.repository_name || 'Orchestration Run'}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    {duration != null && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="h-3 w-3" />
                        {(duration / 1000).toFixed(1)}s
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {run.status === 'running' && (
                        <button
                          onClick={() => handleCancel(run.run_id)}
                          className="flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                        >
                          <Square className="h-3 w-3" /> Cancel
                        </button>
                      )}

                      {(run.status === 'failed' || run.status === 'cancelled') && (
                        <button
                          onClick={() => handleRetry(run.run_id)}
                          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <RotateCw className="h-3 w-3" /> Retry
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedRunId(isExpanded ? null : run.run_id)
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Execution Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-900/40 p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">
                      Specialist Agent Executions ({execs.length})
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {execs.map((exec) => (
                        <div
                          key={exec.agent_id || exec.agent_name}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200 text-[11px]">
                              {exec.agent_name || exec.agent_id}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {exec.duration_ms
                                ? `${(exec.duration_ms / 1000).toFixed(2)}s`
                                : exec.status}
                            </div>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              exec.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : exec.status === 'running'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {exec.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {run.error && (
                      <div className="text-xs text-rose-300 font-mono bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl">
                        Error trace: {run.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
