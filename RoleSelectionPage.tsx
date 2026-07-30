import React from "react";
import { UserRole, UserProfile } from "../types";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  BarChart3,
  Layers,
  FileSearch,
  Sparkles,
  ArrowRight,
  Lock,
  Headphones,
  CheckCircle2,
  Award,
} from "lucide-react";

interface RoleSelectionPageProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Система автоматизации ОКК & Mystery Shopper AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Вход в систему контроля качества
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Выберите вашу роль для входа в рабочий кабинет и доступа к соответствующему функционалу
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Руководитель */}
          <div
            onClick={() => onSelectRole("manager")}
            className="group relative bg-slate-900/90 border-2 border-slate-800 hover:border-indigo-500/80 rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Менеджмент
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  <span>Руководитель</span>
                  <span className="text-xs text-slate-400 font-normal">(ОКК / Дирекция)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Аналитический доступ к показателям качества, сводному дашборду и полной базе проверок
                </p>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2.5 pt-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Доступный функционал:
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Сводный Дашборд ОКК:</strong> Анализ BPV Index и филиалов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Реестр проверок:</strong> Вся история актов и аудиозаписи</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Экспорт отчетов:</strong> Скачивание PDF и фильтрация</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                    <span className="line-through">Загрузка новых аудитов (для Инспекторов)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 group-hover:underline">
                Войти как Руководитель
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Проверяющий */}
          <div
            onClick={() => onSelectRole("inspector")}
            className="group relative bg-slate-900/90 border-2 border-slate-800 hover:border-blue-500/80 rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Полевой аудитор
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                  <span>Проверяющий</span>
                  <span className="text-xs text-slate-400 font-normal">(Аудитор / Mystery Shopper)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Рабочее место для загрузки аудио, проведения 4-шагового ИИ-анализа и подготовки Актов
                </p>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2.5 pt-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Доступный функционал:
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>4-шаговый Мастер проверок:</strong> Загрузка аудио & ИИ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Автозаполнение полей:</strong> Корректировка оператором</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Подгрузка в Реестр:</strong> Сохранение финального отчета</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Реестр проверок:</strong> Просмотр созданных проверок</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 group-hover:underline">
                Войти как Проверяющий
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 pt-4">
          Вы сможете сменить роль в любой момент, нажав на переключатель профиля в шапке приложения.
        </div>
      </div>
    </div>
  );
};
