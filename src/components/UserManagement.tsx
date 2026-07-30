import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { UserAccount, UserRole } from "../types";
import { requestPasswordRecovery } from "../services/supabaseClient";
import {
  Dictionaries,
  loadDictionaries,
  saveDictionaries,
} from "../utils/dictionaryStore";

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, "id" | "createdAt">) => void;
  onUpdateUserStatus: (id: string, status: "active" | "blocked") => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUserInfo?: (
    id: string,
    updatedData: {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      network?: string;
      position?: string;
      login?: string;
      role?: UserRole;
    }
  ) => void;
}

type Notice = { type: "success" | "error"; text: string } | null;

const roleLabel: Record<UserRole, string> = {
  admin: "Администратор",
  auditor: "Аудитор",
  manager: "Руководитель",
  supervisor: "Руководитель",
  operator: "Оператор",
  inspector: "Проверяющий",
  shopper: "Шоппер",
};

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
}) => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [notice, setNotice] = useState<Notice>(null);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [dictionaries, setDictionaries] = useState<Dictionaries>(() => loadDictionaries());
  const [newBrand, setNewBrand] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newCity, setNewCity] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const haystack = [
        user.name,
        user.login,
        user.email,
        user.network,
        user.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!needle || haystack.includes(needle));
    });
  }, [query, roleFilter, users]);

  const sendRecovery = async (user: UserAccount) => {
    const email = (user.email || user.login || "").trim().toLowerCase();
    if (!email.includes("@")) {
      setNotice({
        type: "error",
        text: `Для ${user.name} не указан корректный e-mail.`,
      });
      return;
    }

    setSendingFor(user.id);
    setNotice(null);
    try {
      await requestPasswordRecovery(email);
      setNotice({
        type: "success",
        text: `Ссылка для самостоятельной установки нового пароля отправлена на ${email}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отправить письмо.";
      setNotice({
        type: "error",
        text: message.toLowerCase().includes("rate limit")
          ? "Превышен лимит писем Supabase. Повторите попытку позже."
          : message,
      });
    } finally {
      setSendingFor(null);
    }
  };

  const updateDictionaries = (next: Dictionaries) => {
    setDictionaries(next);
    saveDictionaries(next);
  };

  const addDictionaryValue = (
    key: keyof Dictionaries,
    value: string,
    clear: () => void
  ) => {
    const clean = value.trim();
    if (!clean) return;
    const existing = dictionaries[key] as string[];
    if (existing.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      setNotice({ type: "error", text: `Значение «${clean}» уже есть в справочнике.` });
      return;
    }
    updateDictionaries({ ...dictionaries, [key]: [...existing, clean] });
    clear();
  };

  const removeDictionaryValue = (key: keyof Dictionaries, value: string) => {
    const existing = dictionaries[key] as string[];
    updateDictionaries({
      ...dictionaries,
      [key]: existing.filter((item) => item !== value),
    });
  };

  const dictionaryColumn = (
    title: string,
    key: keyof Dictionaries,
    value: string,
    setValue: (value: string) => void
  ) => (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold text-slate-200">
        {title} ({(dictionaries[key] as string[]).length})
      </h4>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
          placeholder={`Добавить: ${title.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={() => addDictionaryValue(key, value, () => setValue(""))}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          aria-label={`Добавить ${title.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {(dictionaries[key] as string[]).map((item) => (
          <div
            key={item}
            className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeDictionaryValue(key, item)}
              className="text-slate-500 hover:text-red-400"
              aria-label={`Удалить ${item}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Пользователи и доступы</h2>
              <p className="text-xs text-slate-400 mt-1">
                Учетные записи Supabase Auth. Пароли недоступны администраторам и не хранятся в интерфейсе.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDictionaryModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-white flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            Справочники
          </button>
        </div>
      </section>

      <section className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-100 leading-relaxed">
          <strong>Безопасная модель доступа:</strong> пользователь устанавливает пароль сам по защищённой
          ссылке Supabase. Администратор может отправить ссылку восстановления, но не может увидеть,
          скопировать или назначить пароль вручную.
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-xl border p-3 flex items-center gap-2 text-xs ${
            notice.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              : "bg-red-950/40 border-red-500/30 text-red-200"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени, e-mail, сети или должности"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="manager">Руководители</option>
            <option value="inspector">Проверяющие</option>
            <option value="shopper">Шопперы</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Сотрудник</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Сеть / должность</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Доступ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-slate-200">
                  <td className="px-4 py-4">
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-slate-400 mt-1">{user.email || user.login}</div>
                  </td>
                  <td className="px-4 py-4">{roleLabel[user.role]}</td>
                  <td className="px-4 py-4">
                    <div>{user.network || "—"}</div>
                    <div className="text-slate-500 mt-1">{user.position || "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {user.status === "active" ? "Активен" : "Заблокирован"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => sendRecovery(user)}
                      disabled={sendingFor === user.id || user.id === currentUser.id}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2"
                    >
                      {sendingFor === user.id ? (
                        <Mail className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      Отправить сброс
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
          Создание новых учетных записей будет включено после подключения защищённого серверного
          приглашения Supabase. Это исключает передачу временных паролей открытым текстом.
        </div>
      </section>

      {showDictionaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-white">Справочники системы</h3>
                  <p className="text-xs text-slate-400">Бренды, регионы и города Республики Молдова</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dictionaryColumn("Бренды", "brands", newBrand, setNewBrand)}
              {dictionaryColumn("Регионы", "regions", newRegion, setNewRegion)}
              {dictionaryColumn("Города", "cities", newCity, setNewCity)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
