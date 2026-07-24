import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuditForm } from "./components/AuditForm";
import { AuditReportView } from "./components/AuditReportView";
import { Dashboard } from "./components/Dashboard";
import { AuditRegistry, AuditRecord, INITIAL_AUDIT_RECORDS } from "./components/AuditRegistry";
import { SamplePicker } from "./components/SamplePicker";
import { PromptSection } from "./components/PromptSection";
import { BeforeAfterViewer } from "./components/BeforeAfterViewer";
import { AdjustmentStudio } from "./components/AdjustmentStudio";
import { HistoryTimeline, HistoryItem } from "./components/HistoryTimeline";
import { SAMPLE_PRODUCTS, SampleProduct } from "./data/sampleProducts";
import { AUDIT_PRESETS } from "./data/auditPresets";
import { AuditFormData } from "./types";
import { analyzeMysteryShopperClient, editProductPhotoClient } from "./services/geminiService";
import {
  DEFAULT_ADJUSTMENTS,
  Adjustments,
  processCanvasAdjustments,
  downloadImage,
  copyImageToClipboard,
} from "./utils/imageProcess";
import {
  Sparkles,
  AlertCircle,
  FileSearch,
  CheckCircle2,
  Sliders,
  Wand2,
  Image as ImageIcon,
  ArrowRight,
  Info,
  X,
} from "lucide-react";

export default function App() {
  // Mode selection: Mystery Shopper Agent (Default) vs Product Photo Studio
  const [appMode, setAppMode] = useState<"mystery-shopper" | "photo-studio">("mystery-shopper");
  const [auditSubView, setAuditSubView] = useState<"form" | "registry" | "dashboard">("form");

  // Persistent Audit Registry Records
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem("okk_audit_records_v2");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (parseErr) {
          console.warn("Invalid JSON in localStorage okk_audit_records_v2, resetting to default:", parseErr);
        }
      }
    } catch (e) {
      console.error("Failed to load audit records from storage", e);
    }
    return INITIAL_AUDIT_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("okk_audit_records_v2", JSON.stringify(auditRecords));
    } catch (e) {
      console.error("Failed to save audit records", e);
    }
  }, [auditRecords]);

  // Navigation tabs for photo studio
  const [activeTab, setActiveTab] = useState<"edit" | "presets" | "history">("edit");

  // App State & API Health
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- MYSTERY SHOPPER STATE ---
  const [auditData, setAuditData] = useState<AuditFormData>(AUDIT_PRESETS[0].auditData);
  const [transcript, setTranscript] = useState<string>(AUDIT_PRESETS[0].transcript);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  // --- PHOTO STUDIO STATE ---
  const [selectedSample, setSelectedSample] = useState<SampleProduct>(SAMPLE_PRODUCTS[0]);
  const [originalImage, setOriginalImage] = useState<string>(SAMPLE_PRODUCTS[0].dataUrl);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(
    "Remove background and place product on a seamless pure white studio background with a realistic contact shadow."
  );
  const [modelQuality, setModelQuality] = useState<"high" | "lite">("high");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Health check
  useEffect(() => {
    fetch("/api/health")
      .then(async (res) => {
        if (!res.ok) return null;
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.warn("Non-JSON response from /api/health:", text);
          return null;
        }
      })
      .then((data) => {
        if (data && typeof data.hasApiKey === "boolean") {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => console.log("Health check fetch error:", err));
  }, []);

  // Run Mystery Shopper AI Audit
  const handleRunAudit = async () => {
    if (!transcript.trim() && !audioBase64) {
      setErrorMessage("Предоставьте текст диалога или аудиозапись визита.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const data = await analyzeMysteryShopperClient({
        auditData,
        transcript,
        audioBase64: audioBase64 || undefined,
        audioMimeType: "audio/mp3",
      });

      setAuditReport(data.report);

      // Add new record to Registry
      const newRecord: AuditRecord = {
        id: `AUD-2026-${String(auditRecords.length + 1).padStart(3, "0")}`,
        date: auditData.date || new Date().toLocaleDateString("ru-RU"),
        brand: auditData.brand || "Orange",
        branch: auditData.branch || "Филиал",
        city: "Кишинев",
        group: "Центральный регион",
        checkType: auditData.checkType as "Полная проверка с контрольной закупкой" | "Mystery shopper / Оценка BPV (Без покупки)",
        employeeCode: auditData.employeeCode || "Консультант",
        inspector: "ИИ-Агент Аудитор",
        bpvScore: 92,
        speechScore: 92,
        salesDriveScore: 85,
        stopFactors: 0,
        reportSummary: "Автоматически сгенерированный акт оценки ОКК.",
      };
      setAuditRecords((prev) => [newRecord, ...prev]);
    } catch (err: any) {
      console.error("Audit error:", err);
      setErrorMessage(err.message || "Произошла ошибка при анализе визита.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Photo studio handlers
  const handleSelectSample = (sample: SampleProduct) => {
    setSelectedSample(sample);
    setOriginalImage(sample.dataUrl);
    setEditedImage(null);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setErrorMessage(null);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setOriginalImage(dataUrl);
        setEditedImage(null);
        setSelectedSample({
          id: `custom-${Date.now()}`,
          name: file.name,
          category: "Загруженное фото",
          description: "Пользовательское фото",
          dataUrl,
        });
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const data = await editProductPhotoClient({
        image: originalImage,
        prompt: prompt.trim(),
        modelQuality,
        aspectRatio,
      });

      setEditedImage(data.imageUrl);

      const newHistoryItem: HistoryItem = {
        id: `edit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        prompt: prompt.trim(),
        imageUrl: data.imageUrl,
        originalUrl: originalImage,
        modelUsed: data.modelUsed || modelQuality,
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    } catch (err: any) {
      console.error("Image generation error:", err);
      setErrorMessage(err.message || "Ошибка при обработке фото.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCanvasAdjustments = async () => {
    const baseImg = editedImage || originalImage;
    try {
      const result = await processCanvasAdjustments(baseImg, adjustments);
      setEditedImage(result);
    } catch (err) {
      console.error("Error applying canvas adjustments:", err);
    }
  };

  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  const handleDownload = () => {
    const imgToDownload = editedImage || originalImage;
    const filename = `studio-product-${Date.now()}.png`;
    downloadImage(imgToDownload, filename);
  };

  const handleCopy = async () => {
    const imgToCopy = editedImage || originalImage;
    const success = await copyImageToClipboard(imgToCopy);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setOriginalImage(item.originalUrl);
    setEditedImage(item.imageUrl);
    setPrompt(item.prompt);
    setActiveTab("edit");
  };

  return (
    <div id="product-photo-studio-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        hasApiKey={hasApiKey}
        appMode={appMode}
        setAppMode={setAppMode}
        auditSubView={auditSubView}
        setAuditSubView={setAuditSubView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div id="error-notification-banner" className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start justify-between gap-3 text-red-300 text-xs sm:text-sm animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-200">
                  Сообщение системы
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              id="close-error-banner"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODE 1: MYSTERY SHOPPER AI INSPECTOR */}
        {appMode === "mystery-shopper" && (
          <div className="space-y-6">
            {auditSubView === "dashboard" ? (
              <Dashboard recentAudits={auditRecords} />
            ) : auditSubView === "registry" ? (
              <AuditRegistry
                records={auditRecords}
                onUpdateRecords={setAuditRecords}
              />
            ) : (
              <>
                <AuditForm
                  auditData={auditData}
                  setAuditData={setAuditData}
                  transcript={transcript}
                  setTranscript={setTranscript}
                  audioBase64={audioBase64}
                  setAudioBase64={setAudioBase64}
                  audioFileName={audioFileName}
                  setAudioFileName={setAudioFileName}
                  onAnalyze={handleRunAudit}
                  isAnalyzing={isAnalyzing}
                />

                <AuditReportView
                  report={auditReport}
                  isAnalyzing={isAnalyzing}
                  auditData={auditData}
                  onReset={() => setAuditReport(null)}
                />
              </>
            )}
          </div>
        )}

        {/* MODE 2: PRODUCT PHOTO STUDIO */}
        {appMode === "photo-studio" && (
          <div className="space-y-6">
            {/* Sample Photo & Upload Bar */}
            <SamplePicker
              onSelectSample={handleSelectSample}
              onFileUpload={handleFileUpload}
              selectedSampleId={selectedSample?.id}
            />

            {/* Studio Grid: Left Controls, Right Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Instruction & Adjustments */}
              <div className="lg:col-span-5 space-y-5">
                <PromptSection
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onGenerate={handleGenerate}
                  isGenerating={isProcessing}
                  modelQuality={modelQuality}
                  setModelQuality={setModelQuality}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                />

                <AdjustmentStudio
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  onApplyCanvasAdjustments={handleApplyCanvasAdjustments}
                  onReset={handleResetAdjustments}
                />
              </div>

              {/* Right Column: Interactive Before & After Viewer */}
              <div className="lg:col-span-7">
                <BeforeAfterViewer
                  originalImage={originalImage}
                  editedImage={editedImage}
                  isProcessing={isProcessing}
                  onDownload={handleDownload}
                  onCopy={handleCopy}
                  isCopied={isCopied}
                  promptUsed={prompt}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ИИ-Агент Анализа Контрольных Закупок (Mystery Shopper) • Gemini AI</span>
          <span className="text-[11px] text-slate-600">
            Разделение реплик, оценка голоса, цитирование с таймкодами и экспорт в Excel/CSV
          </span>
        </div>
      </footer>
    </div>
  );
}
