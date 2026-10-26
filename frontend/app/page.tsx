'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar, NavTab } from '../components/Sidebar';
import { IssueSearchFilters } from '../components/IssueSearchFilters';
import { IssueCard } from '../components/IssueCard';
import { AnalyzerView } from '../components/AnalyzerView';
import { RoadmapView } from '../components/RoadmapView';
import { AboutView } from '../components/AboutView';
import { AgentStudio } from '../components/AgentStudio';
import { RepositoryExplorer } from '../components/RepositoryExplorer';
import { ActivityView } from '../components/ActivityView';
import { SpatialCommandPalette } from '../components/SpatialCommandPalette';
import { IssueCardSkeleton } from '../components/LoadingSkeleton';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  AnalysisResult,
  ContributionPlan,
  HealthStatus,
  IssueItem,
  PlanStatus,
} from '../lib/types';
import { analyzeIssue, fetchIssues, getHealth } from '../lib/api';
import {
  addTaskToSection,
  createPlanFromAnalysis,
  deletePlan,
  deleteTaskFromSection,
  getStoredPlans,
  PlanSectionKey,
  savePlan,
  toggleTaskCompletion,
  updatePlanStatus,
} from '../lib/storage';
import { ChevronLeft, ChevronRight, Sparkles, Terminal } from 'lucide-react';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>('discover');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Contributor Skill Level Profile
  const [userSkill, setUserSkill] = useState<string>('Beginner');

  // Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Issues
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<boolean>(false);
  const [rateLimitReset, setRateLimitReset] = useState<number | null>(null);

  // Search Filters
  const [query, setQuery] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [label, setLabel] = useState<string>('good first issue');
  const [repo, setRepo] = useState<string>('');
  const [perPage, setPerPage] = useState<number>(15);
  const [sort, setSort] = useState<string>('updated');

  // Analyzer
  const [activeIssue, setActiveIssue] = useState<IssueItem | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Agent Studio cross-tab context
  const [studioPrefilledIssue, setStudioPrefilledIssue] = useState<IssueItem | null>(null);

  // Repository Explorer target
  const [repoExplorerTarget, setRepoExplorerTarget] = useState<string>('pallets/flask');

  // Contribution Plans
  const [plans, setPlans] = useState<ContributionPlan[]>([]);

  // Load plans from local storage
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        setPlans(getStoredPlans());
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Fetch Health
  const checkSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        checkSystemHealth();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkSystemHealth]);

  // Fetch Issues
  const loadIssues = useCallback(async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const res = await fetchIssues({
        q: query,
        language: language === 'all' ? undefined : language,
        label: label === 'all' ? undefined : label,
        repo: repo ? repo : undefined,
        page: page,
        per_page: perPage,
        sort: sort,
      });

      if (res.rate_limited) {
        setRateLimited(true);
        setRateLimitReset(res.rate_limit_reset || null);
        setIssuesError(res.message || 'GitHub rate limit exceeded.');
        setIssues([]);
        setTotalCount(0);
        setTotalPages(1);
      } else if (res.message) {
        setIssuesError(res.message);
        setIssues([]);
        setTotalCount(0);
        setTotalPages(1);
      } else {
        setRateLimited(false);
        setRateLimitReset(null);
        setIssues(res.items);
        setTotalCount(res.total_count);
        setTotalPages(res.total_pages || 1);
      }
    } catch (e: unknown) {
      setIssuesError(e instanceof Error ? e.message : 'Failed to connect to backend.');
      setIssues([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIssuesLoading(false);
    }
  }, [query, language, label, repo, page, perPage, sort]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        loadIssues();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadIssues]);

  // Handle Filter Change
  const handleFilterChange = (filters: {
    query?: string;
    language?: string;
    label?: string;
    repo?: string;
    perPage?: number;
    sort?: string;
  }) => {
    setPage(1);
    if (filters.query !== undefined) setQuery(filters.query);
    if (filters.language !== undefined) setLanguage(filters.language);
    if (filters.label !== undefined) setLabel(filters.label);
    if (filters.repo !== undefined) setRepo(filters.repo);
    if (filters.perPage !== undefined) setPerPage(filters.perPage);
    if (filters.sort !== undefined) setSort(filters.sort);
  };

  // Trigger AI analysis on an issue
  const handleAnalyze = async (issue: IssueItem) => {
    setActiveIssue(issue);
    setCurrentTab('analyzer');
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeIssue({
        issue_title: issue.title,
        issue_body: issue.body,
        repository_name: issue.repository_name,
        issue_url: issue.html_url,
        labels: issue.labels.map((l) => l.name),
        user_skill_level: userSkill,
      });
      setAnalysis(result);
    } catch (e: unknown) {
      setAnalysisError(
        e instanceof Error
          ? e.message
          : 'Failed to analyze issue with Ollama. Verify that Ollama is running and the model is downloaded.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send issue to Agent Studio constellation
  const handleSendToStudio = (issue: IssueItem) => {
    setStudioPrefilledIssue(issue);
    setCurrentTab('agents');
  };

  // Jump to repo explorer
  const handleJumpToRepoExplorer = (targetRepo: string) => {
    setRepoExplorerTarget(targetRepo);
    setCurrentTab('repo');
  };

  // Retry active analysis
  const handleRetryAnalysis = () => {
    if (activeIssue) {
      handleAnalyze(activeIssue);
    }
  };

  // Create Plan from analysis
  const handleCreatePlan = (res: AnalysisResult) => {
    const newPlan = createPlanFromAnalysis(res);
    const updated = savePlan(newPlan);
    setPlans(updated);
    setCurrentTab('plans');
  };

  // Toggle plan task checklist item
  const handleToggleTask = (
    planId: string,
    section: PlanSectionKey,
    taskId: string
  ) => {
    const updated = toggleTaskCompletion(planId, section, taskId);
    setPlans(updated);
  };

  // Add custom task to plan
  const handleAddTask = (
    planId: string,
    section: PlanSectionKey,
    text: string
  ) => {
    const updated = addTaskToSection(planId, section, text);
    setPlans(updated);
  };

  // Delete task from plan
  const handleDeleteTask = (
    planId: string,
    section: PlanSectionKey,
    taskId: string
  ) => {
    const updated = deleteTaskFromSection(planId, section, taskId);
    setPlans(updated);
  };

  // Update plan status
  const handleUpdateStatus = (planId: string, status: PlanStatus) => {
    const updated = updatePlanStatus(planId, status);
    setPlans(updated);
  };

  // Delete plan
  const handleDeletePlan = (planId: string) => {
    const updated = deletePlan(planId);
    setPlans(updated);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navigation */}
      <Navbar
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={checkSystemHealth}
        userSkill={userSkill}
        onSkillChange={setUserSkill}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          plansCount={plans.length}
          hasActiveAnalysis={Boolean(analysis)}
        />

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: DISCOVER ISSUES */}
          {currentTab === 'discover' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Discover Open-Source Issues
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Real, live GitHub issues filtered for beginner contributors and students.
                  </p>
                </div>

                {!issuesLoading && totalCount > 0 && (
                  <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                    {totalCount.toLocaleString()} issues matched
                  </div>
                )}
              </div>

              {/* Search & Filter Bar */}
              <IssueSearchFilters
                query={query}
                language={language}
                label={label}
                repo={repo}
                perPage={perPage}
                sort={sort}
                onFilterChange={handleFilterChange}
                onRefresh={loadIssues}
                loading={issuesLoading}
              />

              {/* Error Banner */}
              {issuesError && (
                <ErrorBanner
                  message={issuesError}
                  isRateLimited={rateLimited}
                  rateLimitReset={rateLimitReset}
                  onRetry={loadIssues}
                />
              )}

              {/* Issues Grid / Skeletons */}
              {issuesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <IssueCardSkeleton key={i} />
                  ))}
                </div>
              ) : issues.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {issues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onAnalyze={handleAnalyze}
                        onSendToStudio={handleSendToStudio}
                        isAnalyzing={isAnalyzing && activeIssue?.id === issue.id}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 px-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || issuesLoading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <div className="text-xs text-slate-400">
                      Page <span className="font-bold text-white">{page}</span> of{' '}
                      <span className="font-bold text-white">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || issuesLoading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                !issuesError && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">
                    <Terminal className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-200">
                      No issues found
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                      Try broadening your search query or clearing the repository filter.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 2: AGENT STUDIO (NEW) */}
          {currentTab === 'agents' && (
            <div className="max-w-7xl mx-auto">
              <AgentStudio
                prefilledIssue={studioPrefilledIssue}
                userSkill={userSkill}
                onJumpToRepoExplorer={handleJumpToRepoExplorer}
                onPlanCreated={() => setCurrentTab('plans')}
              />
            </div>
          )}

          {/* TAB 3: REPO EXPLORER (NEW) */}
          {currentTab === 'repo' && (
            <div className="max-w-7xl mx-auto">
              <RepositoryExplorer
                initialRepo={repoExplorerTarget}
                onSelectIssueDiscover={(r) => {
                  setRepo(r);
                  setCurrentTab('discover');
                }}
              />
            </div>
          )}

          {/* TAB 4: AI ISSUE ANALYZER */}
          {currentTab === 'analyzer' && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                    <span>AI Issue Analyzer</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Grounded breakdown, verified repository targets, and contribution strategy tailored for your skill level.
                  </p>
                </div>
              </div>

              <AnalyzerView
                analysis={analysis}
                loading={isAnalyzing}
                error={analysisError}
                onRetry={handleRetryAnalysis}
                onCreatePlan={handleCreatePlan}
                onBackToDiscover={() => setCurrentTab('discover')}
              />
            </div>
          )}

          {/* TAB 5: CONTRIBUTION PLANS */}
          {currentTab === 'plans' && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  My Contribution Plans
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customizable checklists, task additions, and 1-click Markdown export for your Pull Requests.
                </p>
              </div>

              <RoadmapView
                plans={plans}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onUpdateStatus={handleUpdateStatus}
                onDeletePlan={handleDeletePlan}
                onGoToDiscover={() => setCurrentTab('discover')}
              />
            </div>
          )}

          {/* TAB 6: AGENT ACTIVITY (NEW) */}
          {currentTab === 'activity' && (
            <div className="max-w-6xl mx-auto">
              <ActivityView onGoToStudio={() => setCurrentTab('agents')} />
            </div>
          )}

          {/* TAB 7: ABOUT THE PROJECT */}
          {currentTab === 'about' && <AboutView />}
        </main>
      </div>

      {/* Spatial Command Palette Modal */}
      <SpatialCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onSelectSkill={(skill) => setUserSkill(skill)}
        onTriggerQuickAgentRun={() => setCurrentTab('agents')}
      />
    </div>
  );
}
