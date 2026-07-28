import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { AuditForm } from "./components/AuditForm";
import { AuditReportView } from "./components/AuditReportView";
import { Dashboard } from "./components/Dashboard";
import { AuditRegistry, INITIAL_AUDIT_RECORDS } from "./components/AuditRegistry";
import { UserManagement } from "./components/UserManagement";
import { LoginPage } from "./components/LoginPage";
import { FeedbackNotepad } from "./components/FeedbackNotepad";
import { ShopperVisitForm } from "./components/ShopperVisitForm";
import { DEFAULT_USERS } from "./data/defaultUsers";
import { AUDIT_PRESETS } from "./data/auditPresets";
import { AuditFormData, UserAccount, UserRole, AuditRecord, AppNotification } from "./types";
import { analyzeMysteryShopperClient } from "./services/geminiService";
import { cleanMarkdownReport, updateReportMetadata, highlightManualEdits, ReportMetadataInput, generateFallbackReportWithShopperData } from "./utils/cleanMarkdown";
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const unique: UserAccount[] = [];
          for (const u of parsed) {
            const key = u.login ? u.login.trim().toLowerCase() : u.id;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(u);
            }
          }
          return unique;
        }
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

  // Current Logged In User State (Requires explicit login every session)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("okk_current_user_v1", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("okk_current_user_v1");
      }
    } catch (e) {
      console.error("Failed to sync current user state", e);
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
    // Only administrator is allowed to switch roles
    if (currentUser?.role !== "admin") return;

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
    setUsers((prev) => {
      const cleanLogin = user.login.trim().toLowerCase();
      const cleanEmail = user.email ? user.email.trim().toLowerCase() : "";
      const exists = prev.some(
        (u) =>
          u.login.trim().toLowerCase() === cleanLogin ||
          (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail)
      );
      if (exists) {
        console.warn("User already exists, preventing duplicate creation:", cleanLogin);
        return prev;
      }
      const newUser: UserAccount = {
        ...user,
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return [...prev, newUser];
    });
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

  // Admin approves auditor's request to delete an approved audit record
  const handleApproveDeleteAudit = (auditId: string, notifId: string) => {
    setAuditRecords((prev) => prev.filter((r) => r.id !== auditId));
    handleMarkNotificationAsRead(notifId);

    createNotification({
      recipientName: "Аудиторы",
      recipientRole: "auditor",
      title: `Удаление проверки ${auditId} утверждено`,
      message: `Администратор ${currentUser?.name || "Администратор"} утвердил удаление утвержденной проверки № ${auditId}. Проверка окончательно удалена из реестра.`,
      auditId: auditId,
      type: "AUDIT_APPROVED",
    });

    handleRefreshNotifications();
  };

  // Admin rejects auditor's request to delete an approved audit record
  const handleRejectDeleteAudit = (notifId: string, auditId: string) => {
    handleMarkNotificationAsRead(notifId);

    createNotification({
      recipientName: "Аудиторы",
      recipientRole: "auditor",
      title: `Удаление проверки ${auditId} отклонено`,
      message: `Администратор ${currentUser?.name || "Администратор"} отклонил запрос на удаление проверки № ${auditId}. Запись сохранена в реестре.`,
      auditId: auditId,
      type: "REVISION_REQUESTED",
    });

    handleRefreshNotifications();
  };

  // Return to main page (reset active modals and select default home view for role)
  const handleGoHome = () => {
    setSelectedAuditIdForModal(null);
    setErrorMessage(null);
    if (currentUser?.role === "manager") setAuditSubView("dashboard");
    else if (currentUser?.role === "admin") setAuditSubView("dashboard");
    else setAuditSubView("form");
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
  const [originalReport, setOriginalReport] = useState<string | null>(null);
  const [originalMeta, setOriginalMeta] = useState<ReportMetadataInput | undefined>(undefined);

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

      // Preserve any shopper/user pre-filled fields in auditData!
      const mergedAuditData: AuditFormData = {
        ...auditData,
        brand: auditData.brand && auditData.brand.trim() ? auditData.brand : (data.extractedMeta?.brand || "Orange"),
        branch: auditData.branch && auditData.branch.trim() ? auditData.branch : (data.extractedMeta?.branch || "Филиал №1"),
        city: auditData.city && auditData.city.trim() ? auditData.city : (data.extractedMeta?.city || "Кишинев"),
        employeeCode: auditData.employeeCode && auditData.employeeCode.trim() ? auditData.employeeCode : (data.extractedMeta?.employeeCode || "Консультант Ион М."),
        inspector: auditData.inspector && auditData.inspector.trim() ? auditData.inspector : (data.extractedMeta?.inspector || currentUser?.name || "Инспектор ОКК"),
        category: auditData.category && auditData.category.trim() ? auditData.category : (data.extractedMeta?.category || "Смартфоны"),
        target: auditData.target && auditData.target.trim() ? auditData.target : (data.extractedMeta?.target || "Консультация BPV"),
        result: auditData.result && auditData.result.trim() ? auditData.result : (data.extractedMeta?.result || "Завершено"),
        comment: auditData.comment && auditData.comment.trim() ? auditData.comment : (data.extractedMeta?.comment || ""),
        manager: auditData.manager && auditData.manager.trim() ? auditData.manager : (data.extractedMeta?.manager || ""),
        region: auditData.region && auditData.region.trim() ? auditData.region : (data.extractedMeta?.region || "Регион Центр"),
        group: auditData.group && auditData.group.trim() ? auditData.group : (data.extractedMeta?.group || "Регион Центр"),
      };

      setAuditData(mergedAuditData);

      // Immediately format the report with passport metadata from mergedAuditData
      const formattedReport = updateReportMetadata(
        data.report,
        mergedAuditData,
        originalMeta || mergedAuditData
      );

      setAuditReport(formattedReport);
      setOriginalReport(formattedReport);

      // Transition to Step 3 for operator inspection and editing
      setCurrentStep(3);
    } catch (err: any) {
      console.warn("Audit Step 1->2 AI analysis fallback triggered:", err);
      const fallbackReport = generateFallbackReportWithShopperData(auditData, transcript);
      setAuditReport(fallbackReport);
      setOriginalReport(fallbackReport);
      setCurrentStep(3);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STEP 3 -> STEP 4: Operator confirms edited fields & generates Final Report loaded for preview
  const handleGenerateStep3To4 = () => {
    setCurrentStep(4);

    let updatedReport = auditReport ? updateReportMetadata(auditReport, auditData, originalMeta) : null;
    if (updatedReport) {
      updatedReport = highlightManualEdits(updatedReport, originalReport);
      setAuditReport(updatedReport);
    }
  };

  // STEP 4: Submit Final Report to Manager, Add to Registry, and Clear Form for New Audit
  const handleSubmitAndClose = () => {
    let updatedReport = auditReport ? updateReportMetadata(auditReport, auditData, originalMeta) : null;
    if (updatedReport) {
      updatedReport = highlightManualEdits(updatedReport, originalReport);
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

    const auditId = `AUD-2026-${String(auditRecords.length + 1).padStart(3, "0")}`;

    // Create record in Persistent Audit Registry
    const newRecord: AuditRecord = {
      id: auditId,
      date: auditData.date || new Date().toLocaleDateString("ru-RU"),
      startTime: auditData.startTime || "10:00",
      endTime: auditData.endTime || "10:45",
      brand: auditData.brand || "Orange",
      branch: auditData.branch || "Филиал №1",
      city: auditData.city || "Кишинев",
      group: auditData.region || auditData.group || "Центральный регион",
      region: auditData.region || auditData.group || "Центральный регион",
      manager: auditData.manager || "Петров В.В.",
      category: auditData.category || "Смартфоны",
      target: auditData.target || "Консультация BPV",
      result: auditData.result || `Оценка визита: ${extractedBpv}%`,
      comment: auditData.comment || "",
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
          action: "Завершил проверку, сформировал Акт оценки ОКК и направил на согласование руководителю",
        },
      ],
    };

    setAuditRecords((prev) => [newRecord, ...prev]);

    // Send Notification to Manager
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

    // Reset workflow to clean fields for brand new audit
    setCurrentStep(1);
    setAuditReport(null);
    setOriginalReport(null);
    setOriginalMeta(undefined);
    setTranscript("");
    setAudioBase64(null);
    setAudioFileName(null);
    setAuditData({
      date: new Date().toISOString().split("T")[0],
      brand: "",
      branch: "",
      city: "",
      employeeCode: "",
      inspector: currentUser?.name || "Инспектор ОКК",
      category: "",
      target: "",
      result: "",
      comment: "",
      standards: AUDIT_PRESETS[0].auditData.standards,
    });

    alert(`Акт №${auditId} успешно отправлен руководителю (${auditData.manager || "Петров В.В."}) и внесен в Реестр проверок!\n\nФорма очищена для проведения новой проверки.`);
  };

  // Reset entire workflow back to Step 1
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setAuditReport(null);
    setOriginalReport(null);
    setOriginalMeta(undefined);
    setErrorMessage(null);
  };

  // Handle Loading a Shopper Visit Record into the Audit Form (Autofill)
  const handleLoadShopperVisitToForm = (record: AuditRecord) => {
    const shopperMeta: AuditFormData = {
      date: record.date || new Date().toISOString().split("T")[0],
      startTime: record.startTime || "14:00",
      endTime: record.endTime || "14:30",
      brand: record.brand || "",
      branch: record.branch || "",
      city: record.city || "",
      employeeCode: record.employeeCode || "",
      inspector: record.inspector || currentUser?.name || "",
      checkType: record.checkType || "2. Mystery shopper (без покупки)",
      category: record.category || "Смартфоны и портативная техника",
      target: record.target || "Оценка сервисных стандартов и консультанта по визиту тайного покупателя",
      result: record.result || `Оценка визита шоппера: ${record.bpvScore}%`,
      comment: record.comment || record.reportSummary || "",
      manager: record.manager || "",
      region: record.region || record.group || "Регион Центр",
      group: record.group || record.region || "Регион Центр",
      month: record.month || "",
      standards: AUDIT_PRESETS[0].auditData.standards,
    };

    setAuditData(shopperMeta);
    setOriginalMeta(shopperMeta);

    setTranscript(record.fullReportText || record.reportSummary || "");
    if (record.audioFileName) {
      setAudioFileName(record.audioFileName);
    } else {
      setAudioFileName(null);
    }
    if (record.audioUrl) {
      setAudioBase64(record.audioUrl);
    }

    setCurrentStep(1);
    setAuditSubView("form");
  };

  // Handle Shopper Visit Form Submission
  const handleShopperSubmitVisit = (recordData: Omit<AuditRecord, "id">) => {
    const newId = `AUD-${Date.now().toString().slice(-4)}`;
    const newRecord: AuditRecord = {
      ...recordData,
      id: newId,
    };

    setAuditRecords((prev) => [newRecord, ...prev]);

    // Send Notification to Inspectors / Auditors
    createNotification({
      recipientName: "Иванова А.С. (Проверяющий)",
      recipientRole: "inspector",
      recipientEmail: "inspector@company.com",
      title: `Новый визит Тайного Покупателя (${newId})`,
      message: `Шоппер ${newRecord.inspector} передал отчет и аудиозапись по филиалу ${newRecord.branch} (${newRecord.city}). Данные готовы к автозаполнению в Конструкторе.`,
      auditId: newId,
      type: "NEW_AUDIT_FOR_APPROVAL",
      emailSubject: `[ОКК] Поступил новый отчет тайного покупателя: ${newId}`,
      emailBody: `Уважаемый(ая) Проверяющий/Аудитор!\n\nТайный покупатель ${newRecord.inspector} передал отчет о визите в филиал ${newRecord.branch} (${newRecord.city}).\nКонсультант: ${newRecord.employeeCode}\nПрикрепленное аудио: ${newRecord.audioFileName || "Запись визита прикреплена"}\n\nВы можете запустить автозаполнение в Конструкторе Акта, прослушать запись и внести ручные корректировки.`,
    });

    // Send Notification to Managers
    createNotification({
      recipientName: "Петров В.В. (Руководитель)",
      recipientRole: "manager",
      recipientEmail: "manager@company.com",
      title: `Новый визит Тайного Покупателя (${newId})`,
      message: `Шоппер ${newRecord.inspector} зафиксировал визит в филиал ${newRecord.branch} (${newRecord.city}, ${newRecord.brand}). Оценка: ${newRecord.bpvScore}%.`,
      auditId: newId,
      type: "NEW_AUDIT_FOR_APPROVAL",
      emailSubject: `[ОКК] Новый отчет тайного покупателя: ${newId}`,
      emailBody: `Уважаемый(ая) Руководитель!\n\nТайный покупатель ${newRecord.inspector} загрузил отчет о визите в филиал ${newRecord.branch} (${newRecord.city}).\nОценка визита: ${newRecord.bpvScore}%\nКонсультант: ${newRecord.employeeCode}\n\nОзнакомьтесь с отчетом в Реестре проверок.`,
    });

    setNotifications(loadNotifications());
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
        onApproveDeleteAudit={handleApproveDeleteAudit}
        onRejectDeleteAudit={handleRejectDeleteAudit}
        onGoHome={handleGoHome}
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
          ) : auditSubView === "dashboard" && currentUser.role !== "shopper" ? (
            <Dashboard recentAudits={auditRecords} currentUser={currentUser} />
          ) : auditSubView === "registry" ? (
            <AuditRegistry
              records={auditRecords}
              onUpdateRecords={setAuditRecords}
              currentUser={currentUser}
              onNotificationCreated={handleRefreshNotifications}
              selectedRecordIdForModal={selectedAuditIdForModal}
              onClearSelectedModalId={() => setSelectedAuditIdForModal(null)}
              onLoadVisitToForm={handleLoadShopperVisitToForm}
            />
          ) : (
            <>
              {currentUser.role !== "shopper" && <FeedbackNotepad currentUser={currentUser} />}
              {currentUser.role === "shopper" ? (
                <ShopperVisitForm
                  currentUser={currentUser}
                  onSubmitVisit={handleShopperSubmitVisit}
                  onGoToRegistry={() => setAuditSubView("registry")}
                  users={users}
                />
              ) : (
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
                  onSubmitAndClose={handleSubmitAndClose}
                  onResetWorkflow={handleResetWorkflow}
                  isAnalyzing={isAnalyzing}
                  currentUser={currentUser}
                  users={users}
                  auditReport={auditReport}
                  setAuditReport={setAuditReport}
                  originalReport={originalReport}
                  auditRecords={auditRecords}
                  onLoadVisitRecord={handleLoadShopperVisitToForm}
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
              : currentUser.role === "shopper"
              ? "Шоппер"
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
