import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuditForm } from "./components/AuditForm";
import { AuditReportView } from "./components/AuditReportView";
import { Dashboard } from "./components/Dashboard";
import { AuditRegistry, INITIAL_AUDIT_RECORDS } from "./components/AuditRegistry";
import { UserManagement } from "./components/UserManagement";
import { LoginPage } from "./components/LoginPage";
import { DEFAULT_USERS } from "./data/defaultUsers";
import { AUDIT_PRESETS } from "./data/auditPresets";
import { AuditFormData, UserAccount, UserRole, AuditRecord, AppNotification } from "./types";
import { analyzeMysteryShopperClient } from "./services/geminiService";
import { updateReportMetadata } from "./utils/cleanMarkdown";
import { loadNotifications, saveNotifications, createNotification } from "./utils/notificationStore";
import { AlertCircle, X } from "lucide-react";

export default function App() {
  // Theme State (Persisted in localStorage, default "dark")
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const savedTheme = localStorage.getItem("okk_theme_v1");
      if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    } catch (e) {
      console.error("Failed to read theme", e);
    }
    return "dark";
  });

  useEffect(() => {
    try {
      localStorage.setItem("okk_theme_v1", theme);
      document.documentElement.classList.add("dark");
    } catch (e) {
      console.error("Failed to set theme", e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Users List State (Persisted in localStorage)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem("okk_users_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load users list from storage", e);
    }
    return DEFAULT_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("okk_users_v1", JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save users list", e);
    }
  }, [users]);

  // Current Logged In User State (Persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUserStr = localStorage.getItem("okk_current_user_v1");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error("Failed to load current user", e);
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("okk_current_user_v1", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("okk_current_user_v1");
      }
    } catch (e) {
      console.error("Failed to persist current user", e);
    }
  }, [currentUser]);

  // Current SubView State
  const [auditSubView, setAuditSubView] = useState<"form" | "registry" | "dashboard" | "users">(() => {
    if (currentUser?.role === "manager") return "dashboard";
    if (currentUser?.role === "admin") return "users";
    return "form";
  });

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === "manager") setAuditSubView("dashboard");
    else if (user.role === "admin") setAuditSubView("users");
    else setAuditSubView("form");
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSwitchRoleQuick = (role: UserRole) => {
    const matchedUser = users.find((u) => u.role === role && u.status === "active");
    if (matchedUser) {
      setCurrentUser(matchedUser);
      if (role === "manager") setAuditSubView("dashboard");
      else if (role === "admin") setAuditSubView("users");
      else setAuditSubView("form");
    }
  };

  // User Management Actions (for Admin)
  const handleAddUser = (user: Omit<UserAccount, "id" | "createdAt">) => {
    const newUser: UserAccount = {
      ...user,
      id: `usr-${String(users.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUpdateUserStatus = (id: string, status: "active" | "blocked") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u))
    );
  };

  const handleUpdateUserRole = (id: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
    }
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleResetPassword = (id: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPass } : u))
    );
  };

  const handleUpdateUserInfo = (
    id: string,
    updatedData: { name?: string; login?: string; password?: string; role?: UserRole }
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updatedData };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

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

  // Notifications State & Handlers
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [selectedAuditIdForModal, setSelectedAuditIdForModal] = useState<string | null>(null);

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const handleSelectAuditFromNotif = (auditId: string) => {
    setAuditSubView("registry");
    setSelectedAuditIdForModal(auditId);
  };

  const handleRefreshNotifications = () => {
    setNotifications(loadNotifications());
  };

  // App State & API Health
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- MYSTERY SHOPPER WORKFLOW STATE ---
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [auditData, setAuditData] = useState<AuditFormData>(() => ({
    date: new Date().toISOString().split("T")[0],
    brand: "",
    branch: "",
    city: "",
    employeeCode: "",
    inspector: currentUser?.name || "",
    category: "",
    target: "",
    result: "",
    comment: "",
    standards: AUDIT_PRESETS[0].auditData.standards,
  }));
  const [transcript, setTranscript] = useState<string>(AUDIT_PRESETS[0].transcript);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  // STEP 1 -> STEP 2: Operator starts AI Analysis
  const handleStartStep1To2 = async () => {
    if (!transcript.trim() && !audioBase64) {
      setErrorMessage("Предоставьте текст диалога или аудиозапись визита.");
      return;
    }

    setCurrentStep(2);
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

      // Step 2 AI auto-fills metadata fields for Step 3 operator review
      if (data.extractedMeta) {
        setAuditData((prev) => ({
          ...prev,
          brand: data.extractedMeta?.brand || prev.brand || "Orange",
          branch: data.extractedMeta?.branch || prev.branch || "Филиал №1",
          city: data.extractedMeta?.city || prev.city || "Кишинев",
          employeeCode: data.extractedMeta?.employeeCode || prev.employeeCode || "Консультант Ион М.",
          inspector: data.extractedMeta?.inspector || prev.inspector || currentUser?.name || "Инспектор ОКК",
          category: data.extractedMeta?.category || prev.category || "Смартфоны",
          target: data.extractedMeta?.target || prev.target || "Консультация BPV",
          result: data.extractedMeta?.result || prev.result || "Завершено",
          comment: data.extractedMeta?.comment || prev.comment || "",
        }));
      }

      // Transition to Step 3 for operator inspection and editing
      setCurrentStep(3);
    } catch (err: any) {
      console.error("Audit Step 1->2 error:", err);
      setErrorMessage(err.message || "Произошла ошибка при анализе визита.");
      setCurrentStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STEP 3 -> STEP 4: Operator confirms edited fields & generates Final Report loaded into Registry
  const handleGenerateStep3To4 = () => {
    setCurrentStep(4);

    const updatedReport = auditReport ? updateReportMetadata(auditReport, auditData) : null;
    if (updatedReport) {
      setAuditReport(updatedReport);
    }

    const timestamp = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const reportStr = updatedReport || auditReport || "";
    const bpvMatch = reportStr.match(/BPV INDEX.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) || reportStr.match(/(?:BPV|Service Index).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);
    const speechMatch = reportStr.match(/РЕЧЕВОЙ ИНДЕКС.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) || reportStr.match(/(?:Речевой|Speech|Диалог).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);
    const salesMatch = reportStr.match(/SALES DRIVE.*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i) || reportStr.match(/(?:Sales Drive|коммерческой).*?:?\s*\*?\*?\s*(\d+(?:\.\d+)?)\s*%/i);

    const extractedBpv = bpvMatch ? parseFloat(bpvMatch[1]) : 92;
    const extractedSpeech = speechMatch ? parseFloat(speechMatch[1]) : 92;
    const extractedSales = salesMatch ? parseFloat(salesMatch[1]) : 85;

    // Save final record to Persistent Audit Registry with all Step 3 corrected metadata
    const newRecord: AuditRecord = {
      id: `AUD-2026-${String(auditRecords.length + 1).padStart(3, "0")}`,
      date: auditData.date || new Date().toLocaleDateString("ru-RU"),
      startTime: auditData.startTime || "10:00",
      endTime: auditData.endTime || "10:45",
      brand: auditData.brand || "Orange",
      branch: auditData.branch || "Филиал №1",
      city: auditData.city || "Кишинев",
      group: auditData.region || "Центральный регион",
      manager: auditData.manager || "Петров В.В.",
      checkType: auditData.checkType || "1. Контрольная закупка",
      employeeCode: auditData.employeeCode || "Консультант",
      inspector: auditData.inspector || currentUser?.name || "Инспектор ОКК",
      bpvScore: extractedBpv,
      speechScore: extractedSpeech,
      salesDriveScore: extractedSales,
      stopFactors: 0,
      reportSummary: "Автоматически сгенерированный и направленный на согласование Акт оценки ОКК.",
      fullReportText: updatedReport || auditReport || "",
      approvalStatus: "PENDING_APPROVAL",
      approvalHistory: [
        {
          timestamp,
          user: currentUser?.name || "Аудитор ОКК",
          role: "Проверяющий",
          action: "Сформировал Акт оценки ОКК и направил на согласование руководителю",
        },
      ],
    };

    setAuditRecords((prev) => [newRecord, ...prev]);

    // Send System & E-mail Notification to Manager
    createNotification({
      recipientName: auditData.manager || "Петров В.В.",
      recipientRole: "manager",
      recipientEmail: "manager@company.com",
      title: `Новый Акт оценки ОКК (${newRecord.id}) на согласовании`,
      message: `Аудитор ${newRecord.inspector} сформировал Акт ${newRecord.id} (${newRecord.brand}, ${newRecord.city}). Ознакомьтесь с результатами и утвердите их или отправьте на пересмотр.`,
      auditId: newRecord.id,
      type: "NEW_AUDIT_FOR_APPROVAL",
      emailSubject: `[ОКК] Поступил новый Акт оценки ${newRecord.id} на согласование`,
      emailBody: `Уважаемый(ая) ${newRecord.manager || "Руководитель"}!\n\nАудитор ${newRecord.inspector} сформировал новый Акт оценки ОКК ${newRecord.id}.\nФилиал: ${newRecord.branch} (${newRecord.city})\nБренд: ${newRecord.brand}\nОценка BPV: ${newRecord.bpvScore}%\n\nПожалуйста, войдите в систему ОКК, ознакомьтесь с подробным отчетом и утвердите результаты или отправьте на пересмотр с комментарием.`,
    });

    setNotifications(loadNotifications());
  };

  // Reset entire workflow back to Step 1
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setAuditReport(null);
    setErrorMessage(null);
  };

  // Render Login Page if user is not authenticated
  if (!currentUser) {
    return <LoginPage users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="product-photo-studio-root" className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-blue-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        hasApiKey={hasApiKey}
        currentUser={currentUser}
        auditSubView={auditSubView}
        setAuditSubView={setAuditSubView}
        onLogout={handleLogout}
        onSwitchRoleQuick={handleSwitchRoleQuick}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onSelectAuditFromNotif={handleSelectAuditFromNotif}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div id="error-notification-banner" className="bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 rounded-2xl p-4 flex items-start justify-between gap-3 text-red-300 text-xs sm:text-sm animate-fadeIn backdrop-blur-md shadow-xl">
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

        {/* WORKSPACE VIEWS ACCORDING TO ROLE & TAB */}
        <div className="space-y-6">
          {auditSubView === "users" && currentUser.role === "admin" ? (
            <UserManagement
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUserStatus={handleUpdateUserStatus}
              onUpdateUserRole={handleUpdateUserRole}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
              onUpdateUserInfo={handleUpdateUserInfo}
            />
          ) : auditSubView === "dashboard" ? (
            <Dashboard recentAudits={auditRecords} />
          ) : auditSubView === "registry" ? (
            <AuditRegistry
              records={auditRecords}
              onUpdateRecords={setAuditRecords}
              currentUser={currentUser}
              onNotificationCreated={handleRefreshNotifications}
              selectedRecordIdForModal={selectedAuditIdForModal}
              onClearSelectedModalId={() => setSelectedAuditIdForModal(null)}
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
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                onStartStep1To2={handleStartStep1To2}
                onGenerateStep3To4={handleGenerateStep3To4}
                onResetWorkflow={handleResetWorkflow}
                isAnalyzing={isAnalyzing}
                currentUser={currentUser}
                users={users}
              />

              {currentStep === 4 && (
                <AuditReportView
                  report={auditReport}
                  isAnalyzing={isAnalyzing}
                  auditData={auditData}
                  onReset={handleResetWorkflow}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ИИ-Агент ОКК • Вы вошли как{" "}
            <strong className="text-slate-200">{currentUser.name}</strong> (
            {currentUser.role === "admin"
              ? "Администратор"
              : currentUser.role === "manager"
              ? "Руководитель"
              : "Проверяющий"}
            )
          </span>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:underline text-[11px]"
          >
            Выйти из учетной записи
          </button>
        </div>
      </footer>
    </div>
  );
}
