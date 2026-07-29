import React, { useState } from "react";
import { UserAccount, UserRole } from "../types";
import { FeedbackNotepad } from "./FeedbackNotepad";
import { createNotification } from "../utils/notificationStore";
import { checkSupabaseConnection, signInWithSupabase } from "../services/supabaseClient";
import {
  ShieldCheck,
  Key,
  User,
  Shield,
  Crown,
  UserCheck,
  ShoppingBag,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  HelpCircle,
  X,
  Send,
  CheckCircle2,
  Mail,
  Bell,
} from "lucide-react";

interface LoginPageProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

interface RoleCardConfig {
  role: UserRole;
  badge: string;
  title: string;
  desc: string;
  defaultLogin: string;
  defaultPass: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: "blue" | "indigo" | "cyan" | "emerald";
}

const ROLE_CONFIGS: RoleCardConfig[] = [
  {
    role: "admin",
    badge: "Админ",
    title: "Администратор",
    desc: "Управление пользователями, ролями и настройками доступов",
    defaultLogin: "admin",
    defaultPass: "admin123",
    icon: Shield,
    accentColor: "blue",
  },
  {
    role: "manager",
    badge: "Менеджмент",
    title: "Руководитель",
    desc: "Сводная аналитика BPV, реестр аудитов и утверждение отчетов",
    defaultLogin: "manager",
    defaultPass: "manager123",
    icon: Crown,
    accentColor: "indigo",
  },
  {
    role: "inspector",
    badge: "Аудитор",
    title: "Проверяющий",
    desc: "Загрузка диалогов, проведение ИИ-аудитов и создание отчетов",
    defaultLogin: "auditor",
    defaultPass: "auditor123",
    icon: UserCheck,
    accentColor: "cyan",
  },
  {
    role: "shopper",
    badge: "Шоппер",
    title: "Шоппер",
    desc: "Заполнение анкет контрольных закупок и отправка материалов",
    defaultLogin: "shopper",
    defaultPass: "shopper123",
    icon: ShoppingBag,
    accentColor: "emerald",
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  // Load saved credentials from localStorage if present
  const [credentials, setCredentials] = useState<Record<string, { login: string; pass: string }>>(() => {
    try {
      const saved = localStorage.getItem("okk_remembered_creds_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          admin: parsed.admin || { login: "", pass: "" },
          manager: parsed.manager || { login: "", pass: "" },
          inspector: parsed.inspector || { login: "", pass: "" },
          shopper: parsed.shopper || { login: "", pass: "" },
        };
      }
    } catch (e) {
      console.error("Failed to load saved credentials", e);
    }
    return {
      admin: { login: "", pass: "" },
      manager: { login: "", pass: "" },
      inspector: { login: "", pass: "" },
      shopper: { login: "", pass: "" },
    };
  });

  const [rememberMe, setRememberMe] = useState<Record<string, boolean>>({
    admin: false,
    manager: false,
    inspector: false,
    shopper: false,
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({
    admin: false,
    manager: false,
    inspector: false,
    shopper: false,
  });

  const [activeError, setActiveError] = useState<{ role: string; message: string } | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotLoginOrEmail, setForgotLoginOrEmail] = useState("");
  const [forgotUserRole, setForgotUserRole] = useState<string>("inspector");
  const [forgotComment, setForgotComment] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const openForgotPasswordModal = (defaultRole?: string, defaultLogin?: string) => {
    setForgotLoginOrEmail(defaultLogin || "");
    setForgotUserRole(defaultRole || "inspector");
    setForgotComment("");
    setForgotStatus(null);
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotLoginOrEmail.trim()) {
      setForgotStatus({ type: "error", message: "Укажите логин или e-mail для сброса пароля" });
      return;
    }

    setIsSubmittingReset(true);
    setForgotStatus(null);

    const inputClean = forgotLoginOrEmail.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.login.toLowerCase() === inputClean || (u.email && u.email.toLowerCase() === inputClean)
    );

    const roleName =
      forgotUserRole === "admin"
        ? "Администратор"
        : forgotUserRole === "manager"
        ? "Руководитель"
        : forgotUserRole === "shopper"
        ? "Шоппер"
        : "Проверяющий";

    const userName = matchedUser ? matchedUser.name : forgotLoginOrEmail;
    const userLogin = matchedUser ? matchedUser.login : forgotLoginOrEmail;
    const userEmail = matchedUser ? matchedUser.email || `${userLogin}@company.com` : forgotLoginOrEmail;

    // Create system notification for Administrator in active notifications (Bell icon)
    createNotification({
      recipientName: "Екатерина Администратор",
      recipientRole: "admin",
      recipientEmail: "admin@company.com",
      title: "Запрос на сброс пароля",
      message: `Пользователь ${userName} (логин: @${userLogin}, роль: ${roleName}, e-mail: ${userEmail}) затребовал сброс пароля. ${
        forgotComment ? `Причина: "${forgotComment}"` : ""
      }`,
      type: "PASSWORD_RESET_REQUEST",
    });

    setIsSubmittingReset(false);
    setForgotStatus({
      type: "success",
      message: `Уведомление успешно отправлено в активные оповещения администратора (значок колокольчика 🔔). Администратор увидит ваш запрос при входе в систему и сбросит пароль.`,
    });
  };

  const handleInputChange = (role: string, field: "login" | "pass", value: string) => {
    setActiveError(null);
    setCredentials((prev) => ({
      ...prev,
      [role]: {
        login: prev[role]?.login || "",
        pass: prev[role]?.pass || "",
        [field]: value,
      },
    }));
  };

  const toggleRememberMe = (role: string, checked: boolean) => {
    setRememberMe((prev) => ({ ...prev, [role]: checked }));
  };

  const autofillDemo = (role: string, defaultLogin: string, defaultPass: string) => {
    setActiveError(null);
    setCredentials((prev) => ({
      ...prev,
      [role]: { login: defaultLogin, pass: defaultPass },
    }));
  };

  const toggleShowPassword = (role: string) => {
    setShowPasswords((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleCardSubmit = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setActiveError(null);

    const creds = credentials[role] || { login: "", pass: "" };
    const cleanLogin = creds.login.trim().toLowerCase();
    const cleanPass = creds.pass.trim();

    if (!cleanLogin || !cleanPass) {
      setActiveError({ role, message: "Введите логин и пароль" });
      return;
    }

    const matchedUser = users.find((u) => u.login.toLowerCase() === cleanLogin || u.email?.toLowerCase() === cleanLogin);

    if (checkSupabaseConnection()) {
      try {
        const authenticated = await signInWithSupabase(
          cleanLogin.includes("@") ? cleanLogin : matchedUser?.email || cleanLogin,
          cleanPass
        );
        if (authenticated.status === "blocked") {
          setActiveError({ role, message: "Учетная запись заблокирована" });
          return;
        }
        if (authenticated.role !== role && !(role === "inspector" && authenticated.role === "auditor")) {
          setActiveError({ role, message: "Выбрана карточка другой роли" });
          return;
        }
        onLoginSuccess({
          id: authenticated.id,
          login: authenticated.email,
          email: authenticated.email,
          name: authenticated.name,
          position: authenticated.position,
          role: authenticated.role as UserRole,
          status: authenticated.status,
          createdAt: new Date().toISOString(),
        });
        return;
      } catch (error) {
        setActiveError({ role, message: error instanceof Error ? error.message : "Ошибка входа" });
        return;
      }
    }

    if (!matchedUser) {
      setActiveError({ role, message: "Пользователь не найден" });
      return;
    }

    if (matchedUser.status === "blocked") {
      setActiveError({ role, message: "Учетная запись заблокирована" });
      return;
    }

    const validPassword = matchedUser.password || "admin123";
    if (cleanPass !== validPassword) {
      setActiveError({ role, message: "Неверный пароль" });
      return;
    }

    // Save login & password if "rememberMe" is checked
    try {
      const savedRaw = localStorage.getItem("okk_remembered_creds_v1");
      const currentSaved = savedRaw ? JSON.parse(savedRaw) : {};

      if (rememberMe[role]) {
        currentSaved[role] = { login: creds.login, pass: creds.pass };
      } else {
        delete currentSaved[role];
      }

      localStorage.setItem("okk_remembered_creds_v1", JSON.stringify(currentSaved));
    } catch (err) {
      console.error("Failed to save credentials to localStorage", err);
    }

    onLoginSuccess(matchedUser);
  };

  return (
    <div className="min-h-screen bg-[#0b1329] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full space-y-8 relative z-10 py-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Система контроля качества и авто-аудита Mystery Shopper AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Авторизация в рабочей системе
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Введите логин и пароль непосредственно в карточке вашей роли для входа в систему
          </p>
        </div>

        {/* Integrated Role Cards Grid with direct Login & Password forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLE_CONFIGS.map((config) => {
            const IconComp = config.icon;
            const cardCreds = credentials[config.role] || { login: config.defaultLogin, pass: config.defaultPass };
            const isPasswordVisible = !!showPasswords[config.role];
            const cardError = activeError?.role === config.role ? activeError.message : null;

            // Color themes per role
            const colorStyles = {
              blue: {
                border: "border-blue-500/40 hover:border-blue-500",
                badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                btnBg: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25",
                focusBorder: "focus:border-blue-500",
              },
              indigo: {
                border: "border-indigo-500/40 hover:border-indigo-500",
                badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
                btnBg: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25",
                focusBorder: "focus:border-indigo-500",
              },
              cyan: {
                border: "border-cyan-500/40 hover:border-cyan-500",
                badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
                btnBg: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25",
                focusBorder: "focus:border-cyan-500",
              },
              emerald: {
                border: "border-emerald-500/40 hover:border-emerald-500",
                badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                btnBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25",
                focusBorder: "focus:border-emerald-500",
              },
            }[config.accentColor];

            return (
              <div
                key={config.role}
                className={`bg-slate-900/90 border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xl ${colorStyles.border}`}
              >
                {/* Header of Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorStyles.iconBg}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorStyles.badgeBg}`}>
                      {config.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {config.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {config.desc}
                    </p>
                  </div>
                </div>

                {/* Card Error Alert */}
                {cardError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    <span>{cardError}</span>
                  </div>
                )}

                {/* Form Embedded Directly in Card */}
                <form onSubmit={(e) => handleCardSubmit(e, config.role)} className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Логин</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Введите логин..."
                      value={cardCreds.login}
                      onChange={(e) => handleInputChange(config.role, "login", e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 ${colorStyles.focusBorder} rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none transition-all`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>Пароль</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        required
                        placeholder="Введите пароль..."
                        value={cardCreds.pass}
                        onChange={(e) => handleInputChange(config.role, "pass", e.target.value)}
                        className={`w-full bg-slate-950 border border-slate-800 ${colorStyles.focusBorder} rounded-xl pl-3 pr-9 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowPassword(config.role)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5"
                        title={isPasswordVisible ? "Скрыть" : "Показать"}
                      >
                        {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox & Forgot Password Link */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={rememberMe[config.role] ?? false}
                        onChange={(e) => toggleRememberMe(config.role, e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Запомнить</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => openForgotPasswordModal(config.role, cardCreds.login)}
                      className="text-amber-400 hover:text-amber-300 font-medium hover:underline transition-colors cursor-pointer"
                    >
                      Забыл пароль?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={`w-full ${colorStyles.btnBg} font-bold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Войти как {config.title}</span>
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        {/* Global Forgot Password helper bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Не удается войти в систему или забыли пароль?</span>
          </div>
          <button
            type="button"
            onClick={() => openForgotPasswordModal()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Запросить сброс пароля у админа</span>
          </button>
        </div>

        {/* Feedback Notepad for testing - startup page */}
        <div className="pt-4">
          <FeedbackNotepad />
        </div>

        {/* Global Footer info */}
        <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Формы авторизации интегрированы непосредственно в карточки ролей.</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  Восстановление доступа / Забыли пароль
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotStatus ? (
              <div className={`p-4 rounded-xl text-xs space-y-3 ${
                forgotStatus.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/30 text-red-300"
              }`}>
                <div className="flex items-start gap-2.5">
                  {forgotStatus.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <p className="leading-relaxed font-medium">{forgotStatus.message}</p>
                </div>
                {forgotStatus.type === "success" && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer mt-2"
                  >
                    Понятно, закрыть
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Укажите ваш логин или адрес электронной почты. Мы сформируем официальный запрос администратору системы для сброса вашего пароля.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Роль учетной записи
                  </label>
                  <select
                    value={forgotUserRole}
                    onChange={(e) => setForgotUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="admin">Администратор</option>
                    <option value="manager">Руководитель</option>
                    <option value="inspector">Проверяющий (Аудитор)</option>
                    <option value="shopper">Шоппер (Тайный покупатель)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Логин или E-mail <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: inspector1 или user@company.com"
                    value={forgotLoginOrEmail}
                    onChange={(e) => setForgotLoginOrEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Комментарий или причина (необязательно)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Укажите подробности, например: 'Забыл пароль после отпуска'..."
                    value={forgotComment}
                    onChange={(e) => setForgotComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Уведомление поступит прямо в <strong>Центр активных оповещений (колокольчик 🔔)</strong> администратора.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReset ? "Отправка..." : "Уведомить администратора"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
