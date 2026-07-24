import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-800 rounded-md" />
            <div className="h-3 w-32 bg-slate-800/60 rounded-md" />
          </div>
        </div>
        <div className="h-6 w-20 bg-slate-800 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 space-y-2">
          <div className="h-3 w-24 bg-slate-800/80 rounded" />
          <div className="h-6 w-16 bg-slate-800 rounded-md" />
          <div className="h-2 w-full bg-slate-800/40 rounded-full" />
        </div>
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 space-y-2">
          <div className="h-3 w-24 bg-slate-800/80 rounded" />
          <div className="h-6 w-16 bg-slate-800 rounded-md" />
          <div className="h-2 w-full bg-slate-800/40 rounded-full" />
        </div>
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 space-y-2">
          <div className="h-3 w-24 bg-slate-800/80 rounded" />
          <div className="h-6 w-16 bg-slate-800 rounded-md" />
          <div className="h-2 w-full bg-slate-800/40 rounded-full" />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-slate-800/60 rounded" />
        <div className="h-3 w-5/6 bg-slate-800/40 rounded" />
        <div className="h-3 w-4/6 bg-slate-800/40 rounded" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="h-4 w-40 bg-slate-800 rounded" />
        <div className="h-4 w-24 bg-slate-800 rounded" />
      </div>

      <div className="divide-y divide-slate-800/60">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-1/4">
              <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-3/4 bg-slate-800 rounded" />
                <div className="h-2.5 w-1/2 bg-slate-800/60 rounded" />
              </div>
            </div>

            <div className="h-3.5 w-1/6 bg-slate-800/70 rounded hidden md:block" />
            <div className="h-3.5 w-1/6 bg-slate-800/70 rounded hidden sm:block" />
            <div className="h-6 w-16 bg-slate-800 rounded-full shrink-0" />
            <div className="h-8 w-20 bg-slate-800 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScoreBadge: React.FC<{ score: number; label?: string }> = ({ score, label }) => {
  let badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  if (score < 70) {
    badgeStyle = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
  } else if (score < 85) {
    badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
      <span>{score}%</span>
      {label && <span className="opacity-75 font-normal text-[10px]">({label})</span>}
    </span>
  );
};
