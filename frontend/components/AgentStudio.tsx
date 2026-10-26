'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AgentMetadata,
  WorkflowRunRecord,
  WorkflowRunRequest,
  IssueItem,
  getAgentExecutionsList,
} from '../lib/types';
import {
  listAgents,
  startWorkflowRun,
  getRunStatus,
  cancelRun,
  retryRun,
} from '../lib/api';
import { AgentConstellation } from './AgentConstellation';
import { createPlanFromWorkflowResult, savePlan } from '../lib/storage';
import {
  Play,
  RotateCw,
  Square,
  Sparkles,
  Copy,
  Check,
  Code2,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
  FolderGit2,
  AlertCircle,
  FileCheck2,
  BookmarkCheck,
} from 'lucide-react';

interface AgentStudioProps {
  prefilledIssue?: IssueItem | null;
  userSkill: string;
  onJumpToRepoExplorer?: (repo: string) => void;
  onPlanCreated?: () => void;
}

export const AgentStudio: React.FC<AgentStudioProps> = ({
  prefilledIssue,
  userSkill,
  onJumpToRepoExplorer,
  onPlanCreated,
}) => {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgentName, setSelectedAgentName] = useState<string>('orchestrator');
  const [loadingAgents, setLoadingAgents] = useState<boolean>(true);

  // Workflow run state
  const [currentRun, setCurrentRun] = useState<WorkflowRunRecord | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [planCreatedNotice, setPlanCreatedNotice] = useState<boolean>(false);

  // Input fields for workflow execution
  const [repoName, setRepoName] = useState<string>(prefilledIssue?.repository_name || '');
  const [issueTitle, setIssueTitle] = useState<string>(prefilledIssue?.title || '');
  const [issueBody, setIssueBody] = useState<string>(prefilledIssue?.body || '');
  const [issueUrl, setIssueUrl] = useState<string>(prefilledIssue?.html_url || '');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load registered agents on mount
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await listAgents();
        if (active && Array.isArray(data)) {
          setAgents(data);
          if (data.length > 0 && !selectedAgentName) {
            setSelectedAgentName(data[0].id || data[0].name);
          }
        }
      } catch (err: unknown) {
        if (active) {
          setRunError(err instanceof Error ? err.message : 'Failed to load agent metadata.');
        }
      } finally {
        if (active) setLoadingAgents(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [selectedAgentName]);

  // Sync when prefilledIssue changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active && prefilledIssue) {
        setRepoName(prefilledIssue.repository_name || '');
        setIssueTitle(prefilledIssue.title || '');
        setIssueBody(prefilledIssue.body || '');
        setIssueUrl(prefilledIssue.html_url || '');
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [prefilledIssue]);

  // Clean up polling timer
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll status while workflow is running
  const startPollingRun = useCallback((runId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const record = await getRunStatus(runId);
        setCurrentRun(record);

        if (
          record.status === 'completed' ||
          record.status === 'failed' ||
          record.status === 'cancelled'
        ) {
          setIsRunning(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Continue polling until terminal state or cancelled
      }
    }, 1500);
  }, []);

  // Execute full workflow pipeline
  const handleRunFullWorkflow = async () => {
    if (!repoName.trim()) {
      setRunError('Please enter a target repository in owner/repo format (e.g. pallets/flask).');
      return;
    }
    setIsRunning(true);
    setRunError(null);
    setPlanCreatedNotice(false);

    try {
      const payload: WorkflowRunRequest = {
        target_agent: 'orchestrator',
        agent_name: 'orchestrator',
        issue_title: issueTitle || 'Contribute to ' + repoName,
        issue_body: issueBody,
        repository_name: repoName.trim(),
        issue_url: issueUrl || `https://github.com/${repoName.trim()}`,
        user_experience: userSkill,
        user_skill_level: userSkill,
      };

      const res = await startWorkflowRun(payload);
      if (res.record) {
        setCurrentRun(res.record);
      }
      startPollingRun(res.run_id);
    } catch (e: unknown) {
      setIsRunning(false);
      setRunError(e instanceof Error ? e.message : 'Failed to launch workflow run.');
    }
  };

  // Execute only the currently selected specialist agent
  const handleRunSingleAgent = async (agentIdOrName: string) => {
    if (!repoName.trim() && agentIdOrName !== 'issue_discovery') {
      setRunError('Please enter a repository in owner/repo format (e.g. pallets/flask).');
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setPlanCreatedNotice(false);

    try {
      const payload: WorkflowRunRequest = {
        target_agent: agentIdOrName,
        agent_name: agentIdOrName,
        issue_title: issueTitle || 'Contribute to ' + repoName,
        issue_body: issueBody,
        repository_name: repoName.trim(),
        issue_url: issueUrl || `https://github.com/${repoName.trim()}`,
        user_experience: userSkill,
        user_skill_level: userSkill,
        search_query: issueTitle || repoName,
        search_language: 'all',
      };

      const res = await startWorkflowRun(payload);
      if (res.record) {
        setCurrentRun(res.record);
      }
      startPollingRun(res.run_id);
    } catch (e: unknown) {
      setIsRunning(false);
      setRunError(e instanceof Error ? e.message : `Failed to launch agent ${agentIdOrName}.`);
    }
  };

  // Cancel currently running workflow
  const handleCancelRun = async () => {
    if (!currentRun) return;
    try {
      await cancelRun(currentRun.run_id);
      setIsRunning(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      const updated = await getRunStatus(currentRun.run_id);
      setCurrentRun(updated);
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : 'Failed to cancel workflow run.');
    }
  };

  // Retry failed or cancelled workflow
  const handleRetryWorkflow = async () => {
    if (!currentRun) return;
    setIsRunning(true);
    setRunError(null);
    setPlanCreatedNotice(false);
    try {
      const res = await retryRun(currentRun.run_id);
      if (res.record) {
        setCurrentRun(res.record);
      }
      startPollingRun(res.run_id);
    } catch (e: unknown) {
      setIsRunning(false);
      setRunError(e instanceof Error ? e.message : 'Failed to retry workflow run.');
    }
  };

  // Convert workflow output to saved Contribution Plan
  const handleExportToPlan = () => {
    if (!currentRun) return;
    try {
      const plan = createPlanFromWorkflowResult(currentRun);
      savePlan(plan);
      setPlanCreatedNotice(true);
      if (onPlanCreated) {
        onPlanCreated();
      }
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : 'Failed to export contribution plan.');
    }
  };

  // Fill sample demo issue
  const handleLoadDemoIssue = () => {
    setRepoName('pallets/flask');
    setIssueTitle('Improve error messaging when blueprint registration encounters duplicate names');
    setIssueBody(
      'When registering multiple blueprints with conflicting names, the raised exception lacks the name of the conflicting endpoint, making debugging tedious in large applications.'
    );
    setIssueUrl('https://github.com/pallets/flask/issues/4000');
    setRunError(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentName || a.name === selectedAgentName) ||
    agents[0];

  const executions = getAgentExecutionsList(currentRun);
  const selectedExecution = executions.find(
    (e) =>
      (selectedAgent?.id && e.agent_id === selectedAgent.id) ||
      (selectedAgent?.name && e.agent_name === selectedAgent.name) ||
      e.agent_id === selectedAgentName ||
      e.agent_name === selectedAgentName
  );

  const capabilities =
    selectedAgent?.capabilities && selectedAgent.capabilities.length > 0
      ? selectedAgent.capabilities
      : (selectedAgent?.produces || []).map((p) => `Produces ${p.replace('_', ' ')}`);

  const promptSnippet =
    selectedAgent?.system_prompt_snippet ||
    selectedAgent?.description ||
    'Specialist open-weight AI agent.';

  const hasCombinedResult = Boolean(currentRun?.combined_result || currentRun?.final_result);

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-400" />
            <span>Multi-Agent AI Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            8 autonomous, typed open-weight specialist agents collaboratively analyzing issues and planning contributions.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isRunning ? (
            <button
              onClick={handleCancelRun}
              className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Cancel Run</span>
            </button>
          ) : currentRun?.status === 'failed' || currentRun?.status === 'cancelled' ? (
            <button
              onClick={handleRetryWorkflow}
              className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Retry Workflow</span>
            </button>
          ) : (
            <button
              onClick={handleRunFullWorkflow}
              disabled={loadingAgents || isRunning}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Multi-Agent Pipeline</span>
            </button>
          )}

          {hasCombinedResult && (
            <button
              onClick={handleExportToPlan}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-sm transition-all cursor-pointer"
              title="Save multi-agent results as an interactive Contribution Map"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>Export to Contribution Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Issue & Repo Context Inputs */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" /> Target Work Context for Agents
          </span>

          <div className="flex items-center gap-3">
            {!repoName && (
              <button
                onClick={handleLoadDemoIssue}
                className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Load Sample Flask Demo</span>
              </button>
            )}

            {onJumpToRepoExplorer && repoName && (
              <button
                onClick={() => onJumpToRepoExplorer(repoName)}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                Explore {repoName} in Explorer →
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Target Repository (owner/repo)
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. pallets/flask"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Issue Title
            </label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="Issue title or description of contribution task"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Plan Created Success Notice */}
      {planCreatedNotice && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 text-emerald-400" />
            <span>
              Contribution Plan successfully created from multi-agent workflow! Available in the Plans tab.
            </span>
          </div>
          {onPlanCreated && (
            <button
              onClick={onPlanCreated}
              className="text-xs font-bold text-white underline cursor-pointer"
            >
              View Plan →
            </button>
          )}
        </div>
      )}

      {/* Error alert if any */}
      {runError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-bold">Workflow Run Error</div>
            <div className="mt-1 text-slate-300">{runError}</div>
          </div>
        </div>
      )}

      {/* Spatial Constellation and Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Constellation Map (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <AgentConstellation
            agents={agents}
            activeAgentId={selectedAgent?.id || selectedAgent?.name || selectedAgentName}
            onSelectAgent={setSelectedAgentName}
            executions={executions}
            isWorkflowRunning={isRunning}
          />

          {/* Workflow Status Bar */}
          {currentRun && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">Run ID:</span>
                <span className="font-mono text-emerald-400 font-semibold">{currentRun.run_id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] uppercase border ${
                    currentRun.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentRun.status === 'running'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                      : currentRun.status === 'cancelled'
                      ? 'bg-slate-700/30 text-slate-400 border-slate-700'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {currentRun.status}
                </span>
                {currentRun.failing_stage && (
                  <span className="text-[10px] font-mono text-rose-400">
                    Failed at: {currentRun.failing_stage}
                  </span>
                )}
              </div>

              {(currentRun.total_duration_ms || currentRun.duration_ms) && (
                <div className="text-slate-400 font-mono text-[11px]">
                  Duration: {(((currentRun.total_duration_ms || currentRun.duration_ms) ?? 0) / 1000).toFixed(2)}s
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Agent Inspector Drawer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          {selectedAgent ? (
            <div className="h-full rounded-3xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-4 overflow-y-auto pr-1 max-h-[520px]">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        {selectedAgent.role || 'Specialist'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
                        Phase {selectedAgent.phase ?? 1}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      {selectedAgent.display_name || selectedAgent.name}
                    </h2>
                  </div>

                  {selectedExecution && (
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        selectedExecution.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : selectedExecution.status === 'running'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                          : selectedExecution.status === 'cancelled'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {selectedExecution.status}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-1">
                    Mission & Scope
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedAgent.description}
                  </p>
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">
                    Verified Capabilities
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {capabilities.map((cap, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Prompt Snippet */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-slate-400" />
                    <span>System Prompt Snippet</span>
                  </h4>
                  <pre className="rounded-xl bg-slate-900 p-2.5 text-[11px] font-mono text-slate-400 border border-slate-800 whitespace-pre-wrap">
                    {promptSnippet}
                  </pre>
                </div>

                {/* Execution Output Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Agent Output Payload</span>
                    </h4>
                    {selectedExecution?.output_data && (
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(selectedExecution.output_data, null, 2),
                            'output'
                          )
                        }
                        className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                      >
                        {copiedKey === 'output' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy JSON
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedExecution?.output_data ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        {selectedExecution.model_used && (
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Model: {selectedExecution.model_used}
                          </span>
                        )}
                        {selectedExecution.execution_mode && (
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Mode: {selectedExecution.execution_mode}
                          </span>
                        )}
                      </div>
                      <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-300/90 border border-slate-800 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedExecution.output_data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                      No execution output recorded yet. Run the workflow or trigger this agent directly below.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger Button */}
              {selectedAgent.id !== 'orchestrator' &&
                !selectedAgent.name?.toLowerCase().includes('orchestrat') && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleRunSingleAgent(selectedAgent.id || selectedAgent.name)}
                      disabled={isRunning}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:text-emerald-400 hover:bg-slate-800/80 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Run Only {selectedAgent.display_name || selectedAgent.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
            </div>
          ) : (
            <div className="h-full rounded-3xl border border-slate-800 bg-slate-950 p-6 flex items-center justify-center text-xs text-slate-500">
              Select an agent from the constellation to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
