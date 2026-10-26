'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  MessageSquare,
  Calendar,
  Sparkles,
  FolderGit2,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import { IssueItem } from '../lib/types';

interface IssueCardProps {
  issue: IssueItem;
  onAnalyze: (issue: IssueItem) => void;
  onSendToStudio?: (issue: IssueItem) => void;
  isAnalyzing: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onAnalyze,
  onSendToStudio,
  isAnalyzing,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(issue.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 hover:bg-slate-900/80 transition-all shadow-md flex flex-col justify-between">
      <div>
        {/* Repo & Date Header */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2.5">
          <a
            href={issue.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span className="font-semibold">{issue.repository_name}</span>
          </a>

          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2">
          {issue.title}
        </h3>

        {/* Body snippet or expanded view */}
        {issue.body && (
          <div className="mt-2 text-xs text-slate-400 leading-relaxed">
            <p className={expanded ? 'whitespace-pre-wrap max-h-60 overflow-y-auto bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-slate-300' : 'line-clamp-2'}>
              {issue.body.replace(/[#*`_]/g, '')}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{expanded ? 'Show Less' : 'Read Full Description'}</span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}

        {/* Labels */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 5).map((lbl, idx) => (
            <span
              key={`${lbl.name}-${idx}`}
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {lbl.name}
            </span>
          ))}
          {issue.labels.length > 5 && (
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-950">
              +{issue.labels.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-slate-400">#{issue.number}</span>
          <div className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="h-3 w-3" />
            <span>{issue.comments_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            title="Open original issue on GitHub"
          >
            <ExternalLink className="h-3 w-3" />
          </a>

          {onSendToStudio && (
            <button
              onClick={() => onSendToStudio(issue)}
              title="Inspect in 8-Agent Constellation"
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition-all cursor-pointer"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span>Studio</span>
            </button>
          )}

          <button
            onClick={() => onAnalyze(issue)}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
