import React, { useState } from "react";
import { PROMPT_PRESETS, PromptPreset } from "../data/promptPresets";
import {
  Wand2,
  Sparkles,
  ShoppingBag,
  Layers,
  Box,
  Trees,
  Sun,
  Sparkle,
  Scissors,
  Zap,
  Loader2,
  Settings2,
  HelpCircle,
  X,
} from "lucide-react";

interface PromptSectionProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  modelQuality: "high" | "lite";
  setModelQuality: (quality: "high" | "lite") => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  modelQuality,
  setModelQuality,
  aspectRatio,
  setAspectRatio,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "E-Commerce", "Studio & Scenes", "Photo Cleanup", "Creative Lighting"];

  const filteredPresets =
    selectedCategory === "All"
      ? PROMPT_PRESETS
      : PROMPT_PRESETS.filter((p) => p.category === selectedCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ShoppingBag":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "Layers":
        return <Layers className="w-3.5 h-3.5" />;
      case "Box":
        return <Box className="w-3.5 h-3.5" />;
      case "Trees":
        return <Trees className="w-3.5 h-3.5" />;
      case "Sun":
        return <Sun className="w-3.5 h-3.5" />;
      case "Sparkle":
        return <Sparkle className="w-3.5 h-3.5" />;
      case "Wand2":
        return <Wand2 className="w-3.5 h-3.5" />;
      case "Scissors":
        return <Scissors className="w-3.5 h-3.5" />;
      case "Zap":
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const handleApplyPreset = (preset: PromptPreset) => {
    setPrompt(preset.prompt);
  };

  return (
    <div id="prompt-section-card" className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-5 shadow-xl space-y-4">
      {/* Text Area Header */}
      <div className="flex items-center justify-between">
        <label htmlFor="custom-prompt-input" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Wand2 className="w-4 h-4 text-blue-400" />
          <span>Edit & Cleanup Instructions</span>
        </label>
        {prompt && (
          <button
            id="clear-prompt-btn"
            onClick={() => setPrompt("")}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Main Prompt Input Box */}
      <div className="relative">
        <textarea
          id="custom-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Remove background and place product on a white marble pedestal with soft morning sunlight, or clean up dust and boost product sharpness..."
          rows={3}
          disabled={isGenerating}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
        />
      </div>

      {/* Quick Presets Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Studio Presets
          </span>
          <span className="text-xs text-slate-500">Click to apply template</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`category-filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-medium px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-700 text-blue-400 border border-slate-600"
                  : "bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Preset Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              id={`preset-pill-${preset.id}`}
              onClick={() => handleApplyPreset(preset)}
              disabled={isGenerating}
              className="group text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/80 border border-slate-700/60 hover:border-blue-500/50 transition-all flex items-start gap-2.5"
            >
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0 mt-0.5">
                {getIcon(preset.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate">
                    {preset.title}
                  </span>
                  {preset.badge && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Model Options */}
      <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Quality Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" />
              <span>Quality:</span>
            </span>
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-700 flex text-xs">
              <button
                id="quality-high-btn"
                onClick={() => setModelQuality("high")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  modelQuality === "high"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                High Studio (1K)
              </button>
              <button
                id="quality-lite-btn"
                onClick={() => setModelQuality("lite")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  modelQuality === "lite"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Fast Speed
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ratio:</span>
            <select
              id="aspect-ratio-select"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Product</option>
              <option value="16:9">16:9 Banner</option>
              <option value="9:16">9:16 Story</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          id="generate-photo-btn"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isGenerating || !prompt.trim()
              ? "bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Processing Studio Edit...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Clean & Transform Photo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
