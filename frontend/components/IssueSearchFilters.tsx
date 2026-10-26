'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCw, Tag, Code2, ArrowUpDown, FolderGit2 } from 'lucide-react';

interface FilterProps {
  query: string;
  language: string;
  label: string;
  repo: string;
  perPage: number;
  sort: string;
  onFilterChange: (filters: {
    query?: string;
    language?: string;
    label?: string;
    repo?: string;
    perPage?: number;
    sort?: string;
  }) => void;
  onRefresh: () => void;
  loading: boolean;
}

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
];

const LABELS = [
  { value: 'good first issue', label: 'good first issue' },
  { value: 'help wanted', label: 'help wanted' },
  { value: 'documentation', label: 'documentation' },
  { value: 'bug', label: 'bug' },
  { value: 'enhancement', label: 'enhancement' },
  { value: 'all', label: 'Any Label' },
];

export const IssueSearchFilters: React.FC<FilterProps> = ({
  query,
  language,
  label,
  repo,
  perPage,
  sort,
  onFilterChange,
  onRefresh,
  loading,
}) => {
  const [searchInput, setSearchInput] = useState(query);
  const [repoInput, setRepoInput] = useState(repo);

  // Debounce search query input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== query) {
        onFilterChange({ query: searchInput });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput, query, onFilterChange]);

  // Debounce repo input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (repoInput !== repo) {
        onFilterChange({ repo: repoInput });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [repoInput, repo, onFilterChange]);

  const quickFilter = (newLang?: string, newLabel?: string) => {
    onFilterChange({
      language: newLang !== undefined ? newLang : language,
      label: newLabel !== undefined ? newLabel : label,
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12141a]/80 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Subtle top edge ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="flex flex-col gap-4">
        {/* Main Search Bar & Target Repo Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keywords Search */}
          <div className="relative md:col-span-7">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keywords, bug summary, or topic..."
              className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-body"
            />
          </div>

          {/* Specific Repository Filter */}
          <div className="relative md:col-span-3">
            <FolderGit2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="Repo: owner/repo"
              className="w-full rounded-xl border border-white/[0.08] bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-xs sm:text-sm"
              title="Filter by specific repository (e.g. fastapi/fastapi)"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="md:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-emerald-500/30 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-sm"
            title="Refresh issues"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2">
            <Code2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onFilterChange({ language: e.target.value })}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value} className="bg-[#12141a] text-slate-200">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2">
            <Tag className="h-4 w-4 text-purple-400 shrink-0" />
            <select
              value={label}
              onChange={(e) => onFilterChange({ label: e.target.value })}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              {LABELS.map((lb) => (
                <option key={lb.value} value={lb.value} className="bg-[#12141a] text-slate-200">
                  {lb.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2">
            <ArrowUpDown className="h-4 w-4 text-sky-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => onFilterChange({ sort: e.target.value })}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="updated" className="bg-[#12141a] text-slate-200">Sort: Recently Updated</option>
              <option value="created" className="bg-[#12141a] text-slate-200">Sort: Newest Issues</option>
              <option value="comments" className="bg-[#12141a] text-slate-200">Sort: Most Discussed</option>
            </select>
          </div>

          {/* Limit Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2">
            <Filter className="h-4 w-4 text-amber-400 shrink-0" />
            <select
              value={perPage}
              onChange={(e) => onFilterChange({ perPage: Number(e.target.value) })}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-[#12141a] text-slate-200">Show 10 Issues</option>
              <option value={15} className="bg-[#12141a] text-slate-200">Show 15 Issues</option>
              <option value={25} className="bg-[#12141a] text-slate-200">Show 25 Issues</option>
              <option value={50} className="bg-[#12141a] text-slate-200">Show 50 Issues</option>
            </select>
          </div>
        </div>

        {/* Quick shortcut tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
          <span className="font-medium text-slate-500 font-label">Quick filters:</span>
          <button
            onClick={() => quickFilter(undefined, 'good first issue')}
            className={`rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-medium tracking-tight ${
              label === 'good first issue'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            #good first issue
          </button>
          <button
            onClick={() => quickFilter('python', undefined)}
            className={`rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-medium tracking-tight ${
              language === 'python'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.25)]'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            Python
          </button>
          <button
            onClick={() => quickFilter('typescript', undefined)}
            className={`rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-medium tracking-tight ${
              language === 'typescript'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => quickFilter(undefined, 'documentation')}
            className={`rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-medium tracking-tight ${
              label === 'documentation'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            #documentation
          </button>
          <button
            onClick={() => quickFilter('rust', undefined)}
            className={`rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-medium tracking-tight ${
              language === 'rust'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            Rust
          </button>
        </div>
      </div>
    </div>
  );
};
