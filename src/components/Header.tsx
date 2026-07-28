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
  ShoppingBag,
  Lock,
  LogOut,
  ChevronDown,
  Users,
  Sun,
  Moon,
  Home,
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
  onApproveDeleteAudit?: (auditId: string, notifId: string) => void;
  onRejectDeleteAudit?: (notifId: string, auditId: string) => void;
  onGoHome?: () => void;
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
  onApproveDeleteAudit,
  onRejectDeleteAudit,
  onGoHome,
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

    if (userRole === "shopper" && view === "dashboard") {
      setAccessDeniedMsg("Раздел «Дашборд ОКК» недоступен для роли «Шоппер»");
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
        <div
          onClick={onGoHome || (() => handleNavClick(userRole === "manager" || userRole === "admin" ? "dashboard" : "form"))}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Вернуться на главную страницу"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
                AI Mystery Auditor
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
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Переключить тему"
          >
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Notification Center */}
          {userRole !== "shopper" && (
            <NotificationCenter
              notifications={notifications}
              currentUser={currentUser || undefined}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onSelectAuditFromNotif={onSelectAuditFromNotif}
              onApproveDeleteAudit={onApproveDeleteAudit}
              onRejectDeleteAudit={onRejectDeleteAudit}
            />
          )}

          {/* User Profile Badge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                userRole === "admin"
                  ? "bg-amber-500/10 bg-amber-950/80 border-amber-500/60 text-amber-200 hover:bg-amber-500/20"
                  : userRole === "manager"
                  ? "bg-indigo-500/10 bg-indigo-950/80 border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/20"
                  : userRole === "shopper"
                  ? "bg-emerald-500/10 bg-emerald-950/80 border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/20"
                  : "bg-blue-500/10 bg-blue-950/80 border-blue-500/60 text-blue-200 hover:bg-blue-500/20"
              }`}
            >
              {userRole === "admin" ? (
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              ) : userRole === "manager" ? (
                <Crown className="w-3.5 h-3.5 text-indigo-400" />
              ) : userRole === "shopper" ? (
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>
                {currentUser?.name || "Пользователь"} (
                {userRole === "admin"
                  ? "Админ"
                  : userRole === "manager"
                  ? "Руководитель"
                  : userRole === "shopper"
                  ? "Шоппер"
                  : "Проверяющий"}
                )
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Профиль пользователя
                </div>

                <div className="px-3 py-2 text-xs bg-slate-950 rounded-lg space-y-1 my-1 border border-slate-800">
                  <div className="font-bold text-white">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-400">Логин: <span className="font-mono text-slate-200">@{currentUser?.login}</span></div>
                  <div className="text-[11px] text-slate-400">Роль: <span className="text-blue-400 font-semibold">{userRole === "admin" ? "Администратор" : userRole === "manager" ? "Руководитель" : userRole === "shopper" ? "Шоппер" : "Проверяющий"}</span></div>
                </div>

                {/* Role Switcher ONLY for Authorized Administrator */}
                {userRole === "admin" && (
                  <div className="space-y-1 border-t border-slate-800/80 pt-1.5 mt-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Быстрая смена роли (Админ-доступ)
                    </div>

                    <button
                      onClick={() => {
                        onSwitchRoleQuick("admin");
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors bg-amber-600/30 text-amber-300"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Администратор</span>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      onClick={() => {
                        onSwitchRoleQuick("manager");
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors text-slate-300 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-indigo-400" />
                        <span>Руководитель</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSwitchRoleQuick("inspector");
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors text-slate-300 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        <span>Проверяющий</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSwitchRoleQuick("shopper");
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors text-slate-300 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span>Шоппер</span>
                      </div>
                    </button>
                  </div>
                )}

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
            {/* Home / Главная Button */}
            <button
              id="audit-subview-home-btn"
              onClick={onGoHome || (() => handleNavClick(userRole === "manager" || userRole === "admin" ? "dashboard" : "form"))}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer border border-transparent hover:border-slate-700"
              title="Вернуться на главную страницу"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Главная</span>
            </button>

            {/* Form tab (For Inspectors, Admins & Shoppers) */}
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
              title={
                userRole === "manager"
                  ? "Только для роли Проверяющего / Админа"
                  : userRole === "shopper"
                  ? "Анкета Mystery shopper"
                  : "Новая проверка (4 шага)"
              }
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>{userRole === "shopper" ? "Анкета Mystery shopper" : "Новая проверка"}</span>
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

            {/* Dashboard tab (For Managers, Inspectors & Admins - NOT for Shoppers) */}
            {userRole !== "shopper" && (
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
            )}

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
        </div>
      </div>
    </header>
  );
};
