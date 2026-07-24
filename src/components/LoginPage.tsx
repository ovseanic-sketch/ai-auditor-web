import React, { useState } from "react";
import { UserAccount, UserRole } from "../types";
import {
  ShieldCheck,
  Key,
  User,
  Lock,
  ArrowRight,
  Shield,
  Crown,
  UserCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface LoginPageProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  const [loginVal, setLoginVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Preset Login Handler
  const handleQuickLogin = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role && u.status === "active");
    if (targetUser) {
      onLoginSuccess(targetUser);
    } else {
      setErrorMessage(`Пользователь с ролью ${role} не найден или заблокирован`);
    }
  };

  // Standard Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = users.find(
      (u) =>
        u.login.toLowerCase() === loginVal.trim().toLowerCase() &&
        u.password === passwordVal.trim()
    );

    if (!user) {
      setErrorMessage("Неверный логин или пароль");
      return;
    }

    if (user.status === "blocked") {
      setErrorMessage("Ваша учетная запись заблокирована администратором системы.");
      return;
    }

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Система контроля качества и авто-аудита Mystery Shopper AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Авторизация в рабочей системе
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Войдите под своей учетной записью или воспользуйтесь быстрыми демо-ролями для тестирования
          </p>
        </div>

        {/* Quick Demo Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admin Role */}
          <div
            onClick={() => handleQuickLogin("admin")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-amber-500/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Полный доступ
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                  Администратор
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Управление пользователями, редактирование имени админа, дашборды и создание проверок
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                Логин: <strong>admin</strong> | Пароль: <strong>admin123</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:underline pt-2 border-t border-slate-800/80">
              <span>Войти как Админ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Manager Role */}
          <div
            onClick={() => handleQuickLogin("manager")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-indigo-500/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Менеджмент
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Руководитель ОКК
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Сводный дашборд показателей BPV, реестр проверок и готовые отчеты
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                Логин: <strong>manager</strong> | Пароль: <strong>manager123</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:underline pt-2 border-t border-slate-800/80">
              <span>Войти как Руководитель</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Inspector Role */}
          <div
            onClick={() => handleQuickLogin("inspector")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-blue-500/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Полевой аудитор
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors">
                  Проверяющий
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Загрузка диалогов, 4-шаговый мастер ИИ-анализа и редактирование
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                Логин: <strong>auditor</strong> | Пароль: <strong>auditor123</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:underline pt-2 border-t border-slate-800/80">
              <span>Войти как Проверяющий</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Standard Authorization Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Форма входа в систему</span>
            </h3>
            <p className="text-xs text-slate-400">Введите Имя / Логин и Пароль пользователя или администратора</p>
          </div>

          {/* Quick autofill buttons for convenience */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setLoginVal("admin");
                setPasswordVal("admin123");
                setErrorMessage(null);
              }}
              className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
              title="Заполнить логин и пароль Администратора"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Администратор</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginVal("manager");
                setPasswordVal("manager123");
                setErrorMessage(null);
              }}
              className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <Crown className="w-3 h-3 text-indigo-400" />
              <span>Руководитель</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginVal("auditor");
                setPasswordVal("auditor123");
                setErrorMessage(null);
              }}
              className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-cyan-400" />
              <span>Проверяющий</span>
            </button>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Имя / Логин администратора или сотрудника:</span>
                <span className="text-[10px] text-amber-400/80 font-mono">admin</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Например: admin или auditor"
                  value={loginVal}
                  onChange={(e) => setLoginVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Пароль администратора или пользователя:</span>
                <span className="text-[10px] text-amber-400/80 font-mono">admin123</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Войти под указанными данными</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
