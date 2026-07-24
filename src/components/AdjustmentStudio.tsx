import React from "react";
import { Adjustments } from "../utils/imageProcess";
import { Sliders, Sun, Contrast, Palette, Shield, RotateCcw, Sparkles } from "lucide-react";

interface AdjustmentStudioProps {
  adjustments: Adjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustments>>;
  onApplyCanvasAdjustments: () => void;
  onReset: () => void;
}

export const AdjustmentStudio: React.FC<AdjustmentStudioProps> = ({
  adjustments,
  setAdjustments,
  onApplyCanvasAdjustments,
  onReset,
}) => {
  const bgOptions = [
    { label: "Transparent", value: "transparent", colorClass: "bg-checkerboard border-slate-600" },
    { label: "Pure White", value: "#ffffff", colorClass: "bg-white border-slate-300" },
    { label: "Studio Gray", value: "#f1f5f9", colorClass: "bg-slate-100 border-slate-300" },
    { label: "Soft Cream", value: "#fef3c7", colorClass: "bg-amber-100 border-amber-300" },
    { label: "Pastel Pink", value: "#fce7f3", colorClass: "bg-pink-100 border-pink-300" },
    { label: "Dark Obsidian", value: "#090d16", colorClass: "bg-slate-950 border-slate-700" },
  ];

  return (
    <div id="adjustment-studio-panel" className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Studio Lighting & Canvas Fine-Tuning
          </h3>
        </div>
        <button
          id="reset-adjustments-btn"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Solid Background Replacer */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Background Color Replacement</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {bgOptions.map((opt) => (
            <button
              key={opt.value}
              id={`bg-color-${opt.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                setAdjustments((prev) => ({ ...prev, bgColor: opt.value }));
              }}
              className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                adjustments.bgColor === opt.value
                  ? "border-blue-500 bg-blue-500/10 text-white shadow-md shadow-blue-500/20"
                  : "border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border shadow-inner ${opt.colorClass}`} />
              <span className="text-[10px] text-slate-300 truncate w-full text-center">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Brightness */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Brightness</span>
            </span>
            <span className="font-mono text-slate-400">{adjustments.brightness}</span>
          </div>
          <input
            id="slider-brightness"
            type="range"
            min="-50"
            max="50"
            value={adjustments.brightness}
            onChange={(e) =>
              setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) }))
            }
            className="w-full accent-blue-500 cursor-pointer bg-slate-900 rounded-lg h-2"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Contrast className="w-3.5 h-3.5 text-blue-400" />
              <span>Contrast</span>
            </span>
            <span className="font-mono text-slate-400">{adjustments.contrast}</span>
          </div>
          <input
            id="slider-contrast"
            type="range"
            min="-50"
            max="50"
            value={adjustments.contrast}
            onChange={(e) =>
              setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) }))
            }
            className="w-full accent-blue-500 cursor-pointer bg-slate-900 rounded-lg h-2"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Color Vibrancy</span>
            </span>
            <span className="font-mono text-slate-400">{adjustments.saturation}</span>
          </div>
          <input
            id="slider-vibrancy"
            type="range"
            min="-50"
            max="50"
            value={adjustments.saturation}
            onChange={(e) =>
              setAdjustments((prev) => ({ ...prev, saturation: Number(e.target.value) }))
            }
            className="w-full accent-blue-500 cursor-pointer bg-slate-900 rounded-lg h-2"
          />
        </div>

        {/* Studio Contact Shadow */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Ground Shadow</span>
            </span>
            <span className="font-mono text-slate-400">{adjustments.shadowIntensity}%</span>
          </div>
          <input
            id="slider-shadow"
            type="range"
            min="0"
            max="100"
            value={adjustments.shadowIntensity}
            onChange={(e) =>
              setAdjustments((prev) => ({ ...prev, shadowIntensity: Number(e.target.value) }))
            }
            className="w-full accent-blue-500 cursor-pointer bg-slate-900 rounded-lg h-2"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          id="apply-adjustments-btn"
          onClick={onApplyCanvasAdjustments}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Apply Lighting Adjustments</span>
        </button>
      </div>
    </div>
  );
};
