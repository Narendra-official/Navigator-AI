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
    <div className="group rounded-2xl border border-white/[0.08] bg-[#12141a]/70 hover:bg-[#181a24]/90 backdrop-blur-xl p-5 hover:border-emerald-500/35 transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden">
      {/* Top ambient highlight line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/0 group-hover:via-emerald-400/50 to-transparent transition-all duration-300" />

      <div>
        {/* Repo & Date Header */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-3">
          <a
            href={issue.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span className="font-semibold truncate max-w-[200px]">{issue.repository_name}</span>
          </a>

          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 font-headline tracking-tight leading-snug">
          {issue.title}
        </h3>

        {/* Body snippet or expanded view */}
        {issue.body && (
          <div className="mt-2.5 text-xs text-slate-400 leading-relaxed font-body">
            <p className={expanded ? 'whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/40 p-3 rounded-xl border border-white/[0.08] text-slate-300' : 'line-clamp-2'}>
              {issue.body.replace(/[#*`_]/g, '')}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer transition-colors"
            >
              <span>{expanded ? 'Show Less' : 'Read Full Description'}</span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}

        {/* Labels */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 5).map((lbl, idx) => (
            <span
              key={`${lbl.name}-${idx}`}
              className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] shadow-sm tracking-tight"
            >
              {lbl.name}
            </span>
          ))}
          {issue.labels.length > 5 && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] text-slate-400 bg-white/[0.02] border border-white/[0.05] font-mono">
              +{issue.labels.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-slate-400 font-medium">#{issue.number}</span>
          <div className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-mono">{issue.comments_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] p-2 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer shadow-sm"
            title="Open original issue on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {onSendToStudio && (
            <button
              onClick={() => onSendToStudio(issue)}
              title="Inspect in 8-Agent Constellation"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-all cursor-pointer shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span>Studio</span>
            </button>
          )}

          <button
            onClick={() => onAnalyze(issue)}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white px-3.5 py-1.5 text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
};
