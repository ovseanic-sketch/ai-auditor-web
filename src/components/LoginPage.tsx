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

  return (
    <div className="min-h-screen bg-[#0b1329] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

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
            Выберите необходимую роль для входа в панель управления
          </p>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Admin Role */}
          <div
            onClick={() => handleQuickLogin("admin")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-blue-500/80 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Полный доступ
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  Администратор
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Регистрация пользователей с отправкой доступов на почту, управление ролями, просмотр всех паролей и настроек
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:underline pt-3 border-t border-slate-800/80">
              <span>Войти как Администратор</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Manager Role */}
          <div
            onClick={() => handleQuickLogin("manager")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-indigo-500/80 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Менеджмент
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Руководитель
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Сводный дашборд показателей BPV, аналитический реестр проверок, оценки стандартов и отчеты
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:underline pt-3 border-t border-slate-800/80">
              <span>Войти как Руководитель</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Inspector Role */}
          <div
            onClick={() => handleQuickLogin("inspector")}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-cyan-500/80 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Полевой аудитор
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Проверяющий
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Загрузка диалогов и аудиозаписей визитов, 4-шаговый мастер ИИ-анализа и утверждение актов
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:underline pt-3 border-t border-slate-800/80">
              <span>Войти как Проверяющий</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
