'use client';

import React from 'react';

export const IssueCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-3 w-16 bg-slate-800 rounded" />
        </div>
        <div className="h-5 w-4/5 bg-slate-800 rounded mb-2" />
        <div className="h-4 w-3/5 bg-slate-800/60 rounded mb-3" />
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="mt-6 pt-3 border-t border-slate-800 flex justify-between items-center">
        <div className="h-3 w-12 bg-slate-800 rounded" />
        <div className="h-7 w-28 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};
