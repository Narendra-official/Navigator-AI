'use client';

import React from 'react';
import { AlertCircle, RotateCw, Key } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  isRateLimited?: boolean;
  rateLimitReset?: number | null;
  onRetry: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  isRateLimited,
  rateLimitReset,
  onRetry,
}) => {
  const resetTimeStr = rateLimitReset
    ? new Date(rateLimitReset * 1000).toLocaleTimeString()
    : null;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isRateLimited
          ? 'border-amber-500/30 bg-amber-950/20 text-amber-200'
          : 'border-rose-500/30 bg-rose-950/20 text-rose-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            className={`h-5 w-5 shrink-0 mt-0.5 ${
              isRateLimited ? 'text-amber-400' : 'text-rose-400'
            }`}
          />
          <div>
            <h4 className="text-sm font-bold">
              {isRateLimited ? 'GitHub API Rate Limit Encountered' : 'Error Communicating with Service'}
            </h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">{message}</p>
            {resetTimeStr && (
              <p className="mt-1 text-xs text-amber-300 font-medium">
                Rate limit resets at: {resetTimeStr}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-all shrink-0 cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      </div>

      {isRateLimited && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-start gap-2 text-xs text-slate-300">
          <Key className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Tip: You can add an optional personal access token to{' '}
            <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">backend/.env</code> (as{' '}
            <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">GITHUB_TOKEN=ghp_...</code>) to
            unlock 5,000 requests per hour.
          </span>
        </div>
      )}
    </div>
  );
};
