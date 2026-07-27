import React, { useState } from "react";
import { UserRole, UserAccount, AppNotification } from "../types";
import { NotificationCenter } from "./NotificationCenter";
import {
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  BarChart3,
  Layers,
  Key,
  UserCheck,
  Crown,
  Shield,
  Lock,
  LogOut,
  ChevronDown,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import { getStoredApiKey, setStoredApiKey } from "../services/geminiService";

interface HeaderProps {
  hasApiKey: boolean;
  currentUser: UserAccount | null;
  auditSubView: "form" | "registry" | "dashboard" | "users";
  setAuditSubView: (view: "form" | "registry" | "dashboard" | "users") => void;
  onLogout: () => void;
  onSwitchRoleQuick: (role: UserRole) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onSelectAuditFromNotif?: (auditId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  currentUser,
  auditSubView,
  setAuditSubView,
  onLogout,
  onSwitchRoleQuick,
  theme,
  onToggleTheme,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onSelectAuditFromNotif = () => {},
}) => {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [apiKeyVal, setApiKeyVal] = useState(getStoredApiKey());
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  const userRole = currentUser?.role || null;

  const handleSaveKey = () => {
    setStoredApiKey(apiKeyVal);
    setShowKeyInput(false);
  };

  const handleNavClick = (view: "form" | "registry" | "dashboard" | "users") => {
    setAccessDeniedMsg(null);

    // Permission checks
    if (userRole === "manager" && view === "form") {
      setAccessDeniedMsg("Раздел «Новая проверка» доступен только роли «Проверяющий» или «Администратор»");
      setTimeout(() => setAccessDeniedMsg(null), 4000);
      return;
    }

    if (view === "users" && userRole !== "admin") {
      setAccessDeniedMsg("Раздел «Управление пользователями» доступен только «Администратору»");
      setTimeout(() => setAccessDeniedMsg(null), 4000);
      return;
    }

    setAuditSubView(view);
  };

  return (
    <header id="studio-header" className="sticky top-0 z-40 bg-[#0b1329]/95 backdrop-blur-md border-b border-slate-800/80 text-white px-4 lg:px-8 py-3 transition-all shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">
                ИИ-Агент Аудитор Контрольных Закупок
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Mystery Shopper AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Мониторинг BPV Index, речевых стандартов и мастер управления аудитами
            </p>
          </div>
        </div>

        {/* Navigation & Role Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Access Denied Warning Popup */}
          {accessDeniedMsg && (
            <div className="absolute top-16 right-4 z-50 bg-amber-950/90 border border-amber-500 text-amber-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{accessDeniedMsg}</span>
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 transition-all flex items-center gap-1.5"
            title="Переключить оттенок темно-синей темы"
          >
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Notification Center */}
          <NotificationCenter
            notifications={notifications}
            currentUser={currentUser || undefined}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onSelectAuditFromNotif={onSelectAuditFromNotif}
          />

          {/* User Profile Badge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                userRole === "admin"
                  ? "bg-amber-500/10 bg-amber-950/80 border-amber-500/60 text-amber-200 hover:bg-amber-500/20"
                  : userRole === "manager"
                  ? "bg-indigo-500/10 bg-indigo-950/80 border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/20"
                  : "bg-blue-500/10 bg-blue-950/80 border-blue-500/60 text-blue-200 hover:bg-blue-500/20"
              }`}
            >
              {userRole === "admin" ? (
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              ) : userRole === "manager" ? (
                <Crown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>
                {currentUser?.name || "Пользователь"} (
                {userRole === "admin"
                  ? "Админ"
                  : userRole === "manager"
                  ? "Руководитель"
                  : "Проверяющий"}
                )
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Быстрое переключение роли
                </div>

                <button
                  onClick={() => {
                    onSwitchRoleQuick("admin");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                    userRole === "admin" ? "bg-amber-600/30 text-amber-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Администратор</span>
                  </div>
                  {userRole === "admin" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  onClick={() => {
                    onSwitchRoleQuick("manager");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                    userRole === "manager" ? "bg-indigo-600/30 text-indigo-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-indigo-400" />
                    <span>Руководитель</span>
                  </div>
                  {userRole === "manager" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </button>

                <button
                  onClick={() => {
                    onSwitchRoleQuick("inspector");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                    userRole === "inspector" ? "bg-blue-600/30 text-blue-300" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Проверяющий</span>
                  </div>
                  {userRole === "inspector" && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowRoleMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти из аккаунта</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SubView Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {/* Form tab (For Inspectors & Admins) */}
            <button
              id="audit-subview-form-btn"
              onClick={() => handleNavClick("form")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                auditSubView === "form"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : userRole === "manager"
                  ? "text-slate-600 opacity-60 cursor-not-allowed"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={userRole === "manager" ? "Только для роли Проверяющего / Админа" : "Новая проверка (4 шага)"}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Новая проверка</span>
              {userRole === "manager" && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            {/* Registry tab (Available for all) */}
            <button
              id="audit-subview-registry-btn"
              onClick={() => handleNavClick("registry")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                auditSubView === "registry"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Реестр проверок</span>
            </button>

            {/* Dashboard tab (For Managers, Inspectors & Admins) */}
            <button
              id="audit-subview-dashboard-btn"
              onClick={() => handleNavClick("dashboard")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                auditSubView === "dashboard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Дашборд ОКК"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Дашборд ОКК</span>
            </button>

            {/* User Management tab (ADMIN ONLY) */}
            {userRole === "admin" && (
              <button
                id="audit-subview-users-btn"
                onClick={() => handleNavClick("users")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  auditSubView === "users"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Пользователи</span>
              </button>
            )}
          </div>

          {/* API Key Setting Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition-all"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKeyVal ? "Ключ Gemini" : "Ввести Ключ"}</span>
            </button>

            {showKeyInput && (
              <div className="absolute right-0 mt-2 w-80 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs">
                <label className="block text-slate-300 font-semibold mb-1">
                  API Ключ Gemini (для работы в браузере):
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyVal}
                  onChange={(e) => setApiKeyVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono mb-2 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Сохраняется в браузере</span>
                  <button
                    onClick={handleSaveKey}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
