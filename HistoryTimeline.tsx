import React from "react";
import { History, ArrowLeftRight, Download, Sparkles, Clock, Trash2 } from "lucide-react";

export interface HistoryItem {
  id: string;
  timestamp: string;
  prompt: string;
  imageUrl: string;
  originalUrl: string;
  modelUsed: string;
}

interface HistoryTimelineProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  currentImage?: string;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
  currentImage,
}) => {
  if (history.length === 0) {
    return (
      <div id="history-empty-state" className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-8 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          No Studio Edit History Yet
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Type an instruction prompt or pick a preset template to transform your product photo. Your iteration history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div id="history-timeline-panel" className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Studio Iteration History ({history.length})
          </h3>
        </div>
        <button
          id="clear-history-btn"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((item, idx) => {
          const isActive = currentImage === item.imageUrl;
          return (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => onSelectHistoryItem(item)}
              className={`group relative cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                  : "border-slate-700/60 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              <div className="space-y-2">
                {/* Thumbnail Preview */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-checkerboard flex items-center justify-center border border-slate-700/50">
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-blue-400 border border-blue-500/30">
                    #{history.length - idx}
                  </span>
                </div>

                {/* Prompt Details */}
                <p className="text-xs font-medium text-slate-200 line-clamp-2">
                  "{item.prompt}"
                </p>
              </div>

              {/* Footer info */}
              <div className="pt-2 mt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{item.timestamp}</span>
                </span>
                <span className="text-blue-400 font-mono">
                  {item.modelUsed.includes("lite") ? "Lite" : "Studio 1K"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
