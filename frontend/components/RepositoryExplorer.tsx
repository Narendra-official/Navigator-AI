'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  FileCode,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  Folder,
} from 'lucide-react';
import { exploreRepository, fetchRepositoryFile } from '../lib/api';
import { RepoFileContentResponse, RepoFileExploreResponse, RepoTreeItem } from '../lib/types';

interface RepositoryExplorerProps {
  initialRepo?: string;
  onSelectIssueDiscover?: (repo: string) => void;
}

export const RepositoryExplorer: React.FC<RepositoryExplorerProps> = ({
  initialRepo = 'pallets/flask',
  onSelectIssueDiscover,
}) => {
  const [repoInput, setRepoInput] = useState<string>(initialRepo || 'pallets/flask');
  const [activeRepo, setActiveRepo] = useState<string>(initialRepo || 'pallets/flask');

  const [exploreData, setExploreData] = useState<RepoFileExploreResponse | null>(null);
  const [loadingExplore, setLoadingExplore] = useState<boolean>(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  // File viewer state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<RepoFileContentResponse | null>(null);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [fileFilter, setFileFilter] = useState<string>('');

  // Open file content
  const handleOpenFile = useCallback(async (repo: string, filePath: string) => {
    if (!repo || !filePath) return;
    setSelectedFile(filePath);
    setLoadingFile(true);
    setFileError(null);
    try {
      const content = await fetchRepositoryFile(repo, filePath);
      if (content.found === false) {
        setFileError(content.error || `Could not load ${filePath}`);
        setFileContent(null);
      } else {
        setFileContent(content);
      }
    } catch (e: unknown) {
      setFileError(e instanceof Error ? e.message : 'Failed to fetch file content.');
      setFileContent(null);
    } finally {
      setLoadingFile(false);
    }
  }, []);

  // Explore repository
  const handleExplore = useCallback(
    async (targetRepo: string) => {
      if (!targetRepo || !targetRepo.includes('/')) {
        setExploreError('Please provide a valid repository in the format "owner/repo"');
        return;
      }

      setLoadingExplore(true);
      setExploreError(null);
      setSelectedFile(null);
      setFileContent(null);
      try {
        const data = await exploreRepository(targetRepo.trim(), 80);
        setExploreData(data);
        setActiveRepo(targetRepo.trim());

        // Target file to display first (prioritizes README or first file)
        const targetInitial =
          data.first_file ||
          data.readme_file ||
          data.contributing_file ||
          (data.items && data.items.find((i) => i.type === 'file')?.path) ||
          (data.files && data.files.length > 0 ? data.files[0] : null);

        if (targetInitial) {
          handleOpenFile(targetRepo.trim(), targetInitial);
        }
      } catch (e: unknown) {
        setExploreError(e instanceof Error ? e.message : 'Failed to explore repository.');
      } finally {
        setLoadingExplore(false);
      }
    },
    [handleOpenFile]
  );

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active && initialRepo) {
        setRepoInput(initialRepo);
        handleExplore(initialRepo);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [initialRepo, handleExplore]);

  const handleCopyContent = () => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rawList = exploreData?.items || [];
  const stringList: RepoTreeItem[] =
    rawList.length > 0
      ? rawList
      : (exploreData?.files || exploreData?.verified_files || []).map((name) => ({
          name,
          type: name.includes('.') ? 'file' : 'dir',
          path: name,
        }));

  const testDirs = exploreData?.test_directories || [];
  const filesCount = exploreData?.files_count ?? stringList.length;

  const filteredTree = stringList.filter((item) =>
    (item.name || item.path || '').toLowerCase().includes(fileFilter.toLowerCase())
  );

  const fileSize = fileContent?.size_bytes ?? fileContent?.size ?? 0;
  const isTruncated = fileContent?.is_truncated ?? fileContent?.truncated ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-emerald-400" />
            <span>Repository Context Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live inspection of real GitHub source code, verified file trees, and maintainer guidelines.
          </p>
        </div>

        {/* GitHub link */}
        {activeRepo && (
          <div className="flex items-center gap-2">
            {onSelectIssueDiscover && (
              <button
                onClick={() => onSelectIssueDiscover(activeRepo)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition-all cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-emerald-400" />
                <span>Find Issues in {activeRepo}</span>
              </button>
            )}

            <a
              href={`https://github.com/${activeRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        )}
      </div>

      {/* Target Repo Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5">
        <div className="relative flex-1">
          <FolderGit2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExplore(repoInput);
            }}
            placeholder="Enter repository (e.g. pallets/flask, fastapi/fastapi, psf/requests)"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => handleExplore(repoInput)}
          disabled={loadingExplore}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loadingExplore ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>Explore Repo</span>
        </button>
      </div>

      {/* Error Banner */}
      {exploreError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-bold">Exploration Error</div>
            <div className="mt-1 text-slate-300">{exploreError}</div>
          </div>
        </div>
      )}

      {/* Quick context pills */}
      {exploreData && (
        <div className="flex flex-wrap items-center gap-2">
          {exploreData.readme_file && (
            <button
              onClick={() => handleOpenFile(activeRepo, exploreData.readme_file!)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Readme: {exploreData.readme_file}</span>
            </button>
          )}

          {exploreData.contributing_file ? (
            <button
              onClick={() => handleOpenFile(activeRepo, exploreData.contributing_file!)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Contributing Guide</span>
            </button>
          ) : exploreData.contributing_found ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Contributing Guide Verified</span>
            </span>
          ) : null}

          {testDirs.map((dir, i) => (
            <span
              key={i}
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300 font-mono"
            >
              Test Suite: {dir}/
            </span>
          ))}

          <span className="text-xs text-slate-400 font-mono ml-auto">
            {filesCount} items verified
          </span>
        </div>
      )}

      {/* Split File Explorer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Tree Pane (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-950 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-emerald-400" />
              <span>Repository Tree</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Live Verified
            </span>
          </div>

          {/* Quick file search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="Filter repository files..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* File list */}
          <div className="overflow-y-auto max-h-[480px] space-y-1 pr-1">
            {filteredTree.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {exploreData ? 'No matching files.' : 'No repository explored yet.'}
              </div>
            ) : (
              filteredTree.map((item) => {
                const isSelected = selectedFile === item.path || selectedFile === item.name;
                const isDir = item.type === 'dir';
                const isDoc = (item.name || '').toLowerCase().includes('.md') || (item.name || '').toLowerCase().includes('.rst');
                const isTest = (item.name || '').toLowerCase().includes('test');

                const Icon = isDir ? Folder : isDoc ? FileText : FileCode;

                return (
                  <button
                    key={item.path || item.name}
                    onClick={() => handleOpenFile(activeRepo, item.path || item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isDir
                            ? 'text-amber-400'
                            : isTest
                            ? 'text-purple-400'
                            : isDoc
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate font-mono text-[11px]">{item.name}</span>
                    </div>

                    {isDir && (
                      <span className="text-[9px] uppercase font-mono text-slate-500 border border-slate-800 px-1.5 py-0.2 rounded">
                        dir
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content Pane (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-950 p-5 flex flex-col space-y-4">
          {/* Header of Content Pane */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-xs text-slate-200 font-semibold truncate max-w-md">
                {selectedFile || 'Select a file to inspect'}
              </span>
              {fileSize > 0 && (
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  ({(fileSize / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {fileContent && (
              <div className="flex items-center gap-2 shrink-0">
                {isTruncated && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Truncated (safety limit)
                  </span>
                )}
                {fileContent.html_url && (
                  <a
                    href={fileContent.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* File Body or Loading */}
          {loadingFile ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500 space-y-2">
              <RotateCw className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-xs">Fetching code from repository...</span>
            </div>
          ) : fileError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-rose-400 text-xs text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <div className="font-semibold">{fileError}</div>
              <p className="text-slate-500 text-[11px] max-w-sm">
                Select another verified file from the repository tree on the left.
              </p>
            </div>
          ) : fileContent?.content ? (
            <div className="flex-1 overflow-x-auto rounded-2xl bg-slate-900/90 border border-slate-800/80 p-4 font-mono text-xs text-slate-200 leading-relaxed max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap">{fileContent.content}</pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-600 space-y-3">
              <FolderGit2 className="h-8 w-8 text-slate-600" />
              <span className="text-xs">
                Select any verified file from the repository tree on the left to inspect its code.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
