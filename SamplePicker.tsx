import React from "react";
import { SAMPLE_PRODUCTS, SampleProduct } from "../data/sampleProducts";
import { Upload, Sparkles, Image as ImageIcon } from "lucide-react";

interface SamplePickerProps {
  onSelectSample: (sample: SampleProduct) => void;
  onFileUpload: (file: File) => void;
  selectedSampleId?: string;
}

export const SamplePicker: React.FC<SamplePickerProps> = ({
  onSelectSample,
  onFileUpload,
  selectedSampleId,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="sample-picker-container" className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Select or Upload Product Photo
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Try a sample or upload your own product photo
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Upload Box */}
        <div
          id="upload-dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative cursor-pointer border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-800/80 hover:bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[110px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors">
            <Upload className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-200 group-hover:text-blue-400">
            Upload Photo
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            JPG, PNG, WEBP
          </span>
        </div>

        {/* Sample Product Items */}
        {SAMPLE_PRODUCTS.map((sample) => {
          const isSelected = selectedSampleId === sample.id;
          return (
            <button
              key={sample.id}
              id={`sample-item-${sample.id}`}
              onClick={() => onSelectSample(sample)}
              className={`group relative text-left rounded-xl overflow-hidden border transition-all flex flex-col ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50"
                  : "border-slate-700/60 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              <div className="relative aspect-square w-full bg-slate-900/50 overflow-hidden flex items-center justify-center">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white p-1 rounded-full shadow-md">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-blue-300">
                  {sample.name}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {sample.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
