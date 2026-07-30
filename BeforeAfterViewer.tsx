import React, { useState, useRef, useEffect } from "react";
import {
  SplitSquareVertical,
  Columns,
  Eye,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

interface BeforeAfterViewerProps {
  originalImage: string;
  editedImage: string | null;
  isProcessing: boolean;
  onDownload: () => void;
  onCopy: () => void;
  isCopied: boolean;
  promptUsed?: string;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  originalImage,
  editedImage,
  isProcessing,
  onDownload,
  onCopy,
  isCopied,
  promptUsed,
}) => {
  const [viewMode, setViewMode] = useState<"slider" | "split" | "single">("slider");
  const [singleTab, setSingleTab] = useState<"after" | "before">("after");
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1, 1.5, 2

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Handle slider mouse / touch drag
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const effectiveEditedImage = editedImage || originalImage;

  return (
    <div id="viewer-container" className="bg-slate-800/80 rounded-2xl border border-slate-700/60 p-4 shadow-xl space-y-3">
      {/* Viewer Mode Controls & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-700/60">
        {/* Left: View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
          <button
            id="view-mode-slider-btn"
            onClick={() => setViewMode("slider")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "slider"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            id="view-mode-split-btn"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "split"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            id="view-mode-single-btn"
            onClick={() => setViewMode("single")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "single"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Single View</span>
          </button>
        </div>

        {/* Right: Tools & Actions */}
        <div className="flex items-center gap-2">
          {/* Transparency Grid Toggle */}
          <button
            id="toggle-checkerboard-btn"
            onClick={() => setShowCheckerboard(!showCheckerboard)}
            title="Toggle background transparency grid"
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              showCheckerboard
                ? "bg-slate-700 text-blue-400 border-slate-600"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grid</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              id="zoom-out-btn"
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="zoom-in-btn"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.5))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                id="zoom-reset-btn"
                onClick={() => setZoomLevel(1)}
                className="p-1 text-blue-400 hover:text-blue-300 ml-1 border-l border-slate-700"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action Download & Copy buttons */}
          {editedImage && (
            <div className="flex items-center gap-1.5">
              <button
                id="copy-photo-btn"
                onClick={onCopy}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-all"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                id="download-photo-btn"
                onClick={onDownload}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stage Display Area */}
      <div
        className={`relative w-full rounded-xl overflow-hidden min-h-[380px] max-h-[580px] aspect-square sm:aspect-auto sm:h-[480px] flex items-center justify-center select-none transition-colors ${
          showCheckerboard ? "bg-checkerboard" : "bg-slate-950"
        }`}
      >
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h4 className="text-base font-semibold text-white">
              Studio AI Processing Photo
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {promptUsed ? `"${promptUsed}"` : "Removing background and enhancing product lighting..."}
            </p>
          </div>
        )}

        {/* MODE 1: SLIDER VIEW */}
        {viewMode === "slider" && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            className="relative w-full h-full overflow-hidden cursor-col-resize group"
          >
            {/* Base Image (Edited / Result) */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={effectiveEditedImage}
                alt="AI Edited Product Photo"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain"
              />
              <span className="absolute bottom-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur">
                {editedImage ? "AI Cleaned Studio" : "Original"}
              </span>
            </div>

            {/* Overlay Image (Original, clipped by sliderPosition) */}
            {editedImage && (
              <div
                className="absolute top-0 left-0 bottom-0 overflow-hidden transition-transform duration-200"
                style={{ width: `${sliderPosition}%`, transform: `scale(${zoomLevel})`, transformOrigin: "left center" }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ width: containerRef.current?.offsetWidth || "100%" }}
                >
                  <img
                    src={originalImage}
                    alt="Original Product Photo"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                  <span className="absolute bottom-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur">
                    Original Before
                  </span>
                </div>
              </div>
            )}

            {/* Slider Divider Line & Handle */}
            {editedImage && (
              <div
                className="absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] cursor-col-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border-2 border-blue-500 flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110">
                  ↔
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: SIDE BY SIDE VIEW */}
        {viewMode === "split" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full h-full p-2">
            <div className="relative w-full h-full bg-slate-900/40 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={originalImage}
                alt="Original Product"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              <span className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700">
                Original
              </span>
            </div>

            <div className="relative w-full h-full bg-slate-900/40 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={effectiveEditedImage}
                alt="Edited Studio Product"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              <span className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900/80 text-emerald-400 border border-emerald-500/30">
                {editedImage ? "AI Cleaned Studio" : "Original"}
              </span>
            </div>
          </div>
        )}

        {/* MODE 3: SINGLE TOGGLE VIEW */}
        {viewMode === "single" && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute top-3 left-3 z-10 flex bg-slate-900/80 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                id="toggle-single-after"
                onClick={() => setSingleTab("after")}
                className={`px-3 py-1 rounded font-medium ${
                  singleTab === "after" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                Edited Result
              </button>
              <button
                id="toggle-single-before"
                onClick={() => setSingleTab("before")}
                className={`px-3 py-1 rounded font-medium ${
                  singleTab === "before" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                Original Photo
              </button>
            </div>

            <img
              src={singleTab === "after" ? effectiveEditedImage : originalImage}
              alt="Product Photo View"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
