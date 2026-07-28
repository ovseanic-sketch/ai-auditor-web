import React, { useState, useEffect } from "react";
import { UserAccount } from "../types";
import {
  MessageSquare,
  Send,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface FeedbackNote {
  id: string;
  createdAt: string;
  userRole: string;
  userName: string;
  text: string;
}

interface FeedbackNotepadProps {
  currentUser?: UserAccount;
}

export const FeedbackNotepad: React.FC<FeedbackNotepadProps> = ({ currentUser }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Notes history persisted in localStorage
  const [notes, setNotes] = useState<FeedbackNote[]>(() => {
    try {
      const saved = localStorage.getItem("okk_testing_feedback_notes_v1");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load feedback notes", e);
    }
    return [
      {
        id: "note-1",
        createdAt: new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        userName: currentUser?.name || "Тестировщик",
        userRole: currentUser?.role === "admin" ? "Администратор" : currentUser?.role === "manager" ? "Руководитель" : "Проверяющий",
        text: "Демо-заметка: Все комментарии на Шаге 3 подсвечиваются красным в итоговом акте. Тестирование Реестра и согласования проходит штатно.",
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("okk_testing_feedback_notes_v1", JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save feedback notes", e);
    }
  }, [notes]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: FeedbackNote = {
      id: `note-${Date.now()}`,
      createdAt: new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      userName: currentUser?.name || "Пользователь",
      userRole:
        currentUser?.role === "admin"
          ? "Администратор"
          : currentUser?.role === "manager"
          ? "Руководитель"
          : currentUser?.role === "shopper"
          ? "Шоппер"
          : "Проверяющий",
      text: noteText.trim(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteText("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCopyAllNotes = () => {
    if (notes.length === 0) return;
    const formatted = notes
      .map((n) => `[${n.createdAt}] ${n.userName} (${n.userRole}):\n${n.text}`)
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isExpanded) {
    return (
      <div className="mb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/60 hover:border-amber-400 text-amber-200 hover:text-white font-bold text-xs shadow-xl shadow-amber-500/10 flex items-center justify-between sm:justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold tracking-wide">
              📝 Блокнот (Обратная связь)
            </span>
            {notes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono border border-amber-400/40">
                {notes.length} {notes.length === 1 ? "запись" : notes.length < 5 ? "записи" : "записей"}
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-400 font-semibold underline underline-offset-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Открыть поле для записей</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 transition-all mb-6">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(false)}
        className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 flex items-center justify-between cursor-pointer border-b border-amber-500/30 select-none hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-amber-200">
                📝 Блокнот обратной связи и замечаний
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40">
                Временная опция
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Предназначен для сбора предложений, идей и сообщений об ошибках в процессе тестирования
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
          className="text-xs text-amber-400 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Свернуть в ярлык</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Content Body */}
      <div className="p-4 sm:p-5 space-y-4 bg-slate-950/60">
          {/* Note Input Form */}
          <form onSubmit={handleSaveNote} className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Введите предложение, ошибку или замечание по работе системы..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Заметка подпишется как <strong className="text-amber-300">{currentUser?.name || "Пользователь"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fadeIn">
                    <Check className="w-4 h-4" />
                    <span>Заметка сохранена!</span>
                  </span>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Сохранить в блокнот</span>
                </button>
              </div>
            </div>
          </form>

          {/* Saved Notes Feed */}
          {notes.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Сохраненные записи тестирования ({notes.length})</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopyAllNotes}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Скопировано!" : "Скопировать все записи"}</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-amber-300">{note.userName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-[10px]">{note.userRole}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500 text-[10px] font-mono">{note.createdAt}</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {note.text}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 opacity-80 group-hover:opacity-100"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};
