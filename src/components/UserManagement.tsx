import React, { useState } from "react";
import { UserAccount, UserRole } from "../types";
import { loadDictionaries, saveDictionaries, Dictionaries } from "../utils/dictionaryStore";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  UserCheck,
  ShoppingBag,
  Search,
  Lock,
  Unlock,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  AlertCircle,
  UserX,
  Mail,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sparkles,
  BookOpen,
  Plus,
  MapPin,
  Globe,
} from "lucide-react";

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: Omit<UserAccount, "id" | "createdAt">) => void;
  onUpdateUserStatus: (id: string, status: "active" | "blocked") => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
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
      password?: string;
      role?: UserRole;
    }
  ) => void;
}

// Transliteration helper for login generation
function cyrillicToTranslit(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

// Auto Generator functions
function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 9; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function generateSmartLogin(email: string, firstName: string, lastName: string): string {
  if (email && email.includes("@")) {
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (emailPrefix.length >= 3) return emailPrefix;
  }
  const cleanFirst = cyrillicToTranslit(firstName);
  const cleanLast = cyrillicToTranslit(lastName);

  if (cleanFirst && cleanLast) {
    return `${cleanFirst.charAt(0)}.${cleanLast}`;
  } else if (cleanLast) {
    return cleanLast;
  } else if (cleanFirst) {
    return cleanFirst;
  }
  return `user_${Math.floor(100 + Math.random() * 900)}`;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUserStatus,
  onUpdateUserRole,
  onDeleteUser,
  onResetPassword,
  onUpdateUserInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Passwords visibility toggle per user ID (map of string -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Email Notification Modal State (After Registration or Manual Resend)
  const [emailNotification, setEmailNotification] = useState<{
    recipientEmail: string;
    userName: string;
    login: string;
    password: string;
    roleName: string;
    network: string;
    position: string;
  } | null>(null);

  // Email sending states & toasts
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState<string | null>(null);

  // SMTP Settings Modal State
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("Mystery Shopper AI");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpStatusMsg, setSmtpStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);

  // Sent Emails History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch("/api/smtp-config");
      const data = await res.json();
      if (data.success && data.config) {
        setSmtpHost(data.config.host || "");
        setSmtpPort(String(data.config.port || "465"));
        setSmtpSecure(data.config.secure ?? true);
        setSmtpUser(data.config.user || "");
        setSmtpPass(data.config.pass || "");
        setSmtpFromName(data.config.fromName || "Mystery Shopper AI");
        setSmtpFromEmail(data.config.fromEmail || "");
        setIsSmtpConfigured(!!data.config.isConfigured);
      }
    } catch (e) {
      console.error("Failed to load SMTP config:", e);
    }
  };

  const handleApplyPreset = (preset: "yandex" | "gmail" | "mailru") => {
    if (preset === "yandex") {
      setSmtpHost("smtp.yandex.ru");
      setSmtpPort("465");
      setSmtpSecure(true);
      setSmtpStatusMsg({ type: "info", text: "Применен пресет Яндекс Почты. Используйте Пароль Приложения в настройках Yandex ID." });
    } else if (preset === "gmail") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort("465");
      setSmtpSecure(true);
      setSmtpStatusMsg({ type: "info", text: "Применен пресет Gmail. Требуется 2FA и Пароль Приложения (App Password)." });
    } else if (preset === "mailru") {
      setSmtpHost("smtp.mail.ru");
      setSmtpPort("465");
      setSmtpSecure(true);
      setSmtpStatusMsg({ type: "info", text: "Применен пресет Mail.ru. Используйте пароль для внешних приложений Mail.ru." });
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpStatusMsg(null);
    try {
      const res = await fetch("/api/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: Number(smtpPort),
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          fromEmail: smtpFromEmail || smtpUser,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSmtpConfigured(true);
        setSmtpStatusMsg({ type: "success", text: "Настройки SMTP успешно сохранены на сервере!" });
      } else {
        setSmtpStatusMsg({ type: "error", text: data.error || "Не удалось сохранить настройки SMTP" });
      }
    } catch (err: any) {
      setSmtpStatusMsg({ type: "error", text: "Ошибка соединения с сервером" });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setSmtpStatusMsg({ type: "info", text: "Проверка подключения к почтовому серверу..." });
    try {
      const res = await fetch("/api/test-smtp", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSmtpStatusMsg({ type: "success", text: data.message });
      } else {
        setSmtpStatusMsg({ type: "error", text: data.error });
      }
    } catch (e: any) {
      setSmtpStatusMsg({ type: "error", text: "Ошибка при проверке подключения к почтовому серверу" });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const fetchSentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/sent-emails");
      const data = await res.json();
      if (data.success) {
        setSentHistory(data.emails || []);
      }
    } catch (e) {
      console.error("Failed to fetch sent history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const triggerSendEmail = async (emailData: {
    recipientEmail: string;
    userName: string;
    login: string;
    password: string;
    roleName: string;
    network: string;
    position: string;
  }) => {
    setIsSendingEmail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      if (result.success) {
        if (result.method === "smtp_direct") {
          setEmailToast(`Письмо с доступами отправлено напрямую через ваш SMTP-сервер на e-mail ${emailData.recipientEmail}`);
        } else {
          setEmailToast(`Уведомление с доступами зафиксировано для ${emailData.recipientEmail}`);
        }
      } else {
        setEmailToast(`Предупреждение: ${result.error || "Не удалось отправить письмо"}`);
      }
    } catch (err: any) {
      console.error("Failed to connect to email API:", err);
      setEmailToast(`Уведомление сформировано и сохранено в лог доступа`);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailToast(null), 6000);
    }
  };

  // Reset Password Modal State
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  // Delete User Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);

  // Edit User State
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNetwork, setEditNetwork] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editLogin, setEditLogin] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("admin");
  const [editError, setEditError] = useState<string | null>(null);

  // Registration Form State (New User by Email, First Name, Last Name, Network, Position)
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regNetwork, setRegNetwork] = useState("Orange");
  const [regPosition, setRegPosition] = useState("Инспектор ОКК");
  const [regRole, setRegRole] = useState<UserRole>("inspector");

  // Auto-generated values
  const [autoLogin, setAutoLogin] = useState("");
  const [autoPassword, setAutoPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Dictionaries Admin Management State
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [dictionaries, setDictionaries] = useState<Dictionaries>(loadDictionaries);
  const [newBrandInput, setNewBrandInput] = useState("");
  const [newRegionInput, setNewRegionInput] = useState("");
  const [newCityInput, setNewCityInput] = useState("");

  const handleAddBrandDict = () => {
    if (!newBrandInput.trim()) return;
    const clean = newBrandInput.trim();
    if (!dictionaries.brands.includes(clean)) {
      const updated = { ...dictionaries, brands: [...dictionaries.brands, clean] };
      saveDictionaries(updated);
      setDictionaries(updated);
    }
    setNewBrandInput("");
  };

  const handleRemoveBrandDict = (brandName: string) => {
    const updated = { ...dictionaries, brands: dictionaries.brands.filter((b) => b !== brandName) };
    saveDictionaries(updated);
    setDictionaries(updated);
  };

  const handleAddRegionDict = () => {
    if (!newRegionInput.trim()) return;
    const clean = newRegionInput.trim();
    if (!dictionaries.regions.includes(clean)) {
      const updated = { ...dictionaries, regions: [...dictionaries.regions, clean] };
      saveDictionaries(updated);
      setDictionaries(updated);
    }
    setNewRegionInput("");
  };

  const handleRemoveRegionDict = (regionName: string) => {
    const updated = { ...dictionaries, regions: dictionaries.regions.filter((r) => r !== regionName) };
    saveDictionaries(updated);
    setDictionaries(updated);
  };

  const handleAddCityDict = () => {
    if (!newCityInput.trim()) return;
    const clean = newCityInput.trim();
    if (!dictionaries.cities.includes(clean)) {
      const updated = { ...dictionaries, cities: [...dictionaries.cities, clean] };
      saveDictionaries(updated);
      setDictionaries(updated);
    }
    setNewCityInput("");
  };

  const handleRemoveCityDict = (cityName: string) => {
    const updated = { ...dictionaries, cities: dictionaries.cities.filter((c) => c !== cityName) };
    saveDictionaries(updated);
    setDictionaries(updated);
  };

  // Toggle Password Visibility
  const toggleShowPassword = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Auto-generate Login & Password when inputs change in registration
  const handleAutoFillCredentials = (emailVal: string, fnVal: string, lnVal: string) => {
    const login = generateSmartLogin(emailVal, fnVal, lnVal);
    setAutoLogin(login);
    if (!autoPassword) {
      setAutoPassword(generateRandomPassword());
    }
  };

  const openAddModal = () => {
    setRegFirstName("");
    setRegLastName("");
    setRegEmail("");
    setRegNetwork("");
    setRegPosition("Инспектор ОКК");
    setRegRole("inspector");
    setAutoLogin("");
    setAutoPassword(generateRandomPassword());
    setFormError(null);
    setShowAddModal(true);
  };

  const handleRegeneratePassword = () => {
    setAutoPassword(generateRandomPassword());
  };

  const handleRegenerateLogin = () => {
    const login = generateSmartLogin(regEmail, regFirstName, regLastName);
    setAutoLogin(`${login}_${Math.floor(10 + Math.random() * 89)}`);
  };

  const openEditModal = (user: UserAccount) => {
    setEditUser(user);
    setEditFirstName(user.firstName || user.name.split(" ")[0] || "");
    setEditLastName(user.lastName || user.name.split(" ")[1] || "");
    setEditEmail(user.email || `${user.login}@company.com`);
    setEditNetwork(user.network || "Офис");
    setEditPosition(user.position || "Сотрудник");
    setEditLogin(user.login);
    setEditPassword(user.password || "admin123");
    setEditRole(user.role);
    setEditError(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);

    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();

    if (!fullName || !editLogin.trim() || !editPassword.trim()) {
      setEditError("Заполните имя, фамилию, логин и пароль");
      return;
    }

    // Check duplicate logins
    const isDuplicate = users.some(
      (u) => u.id !== editUser.id && u.login.toLowerCase() === editLogin.trim().toLowerCase()
    );
    if (isDuplicate) {
      setEditError("Пользователь с таким логином уже существует");
      return;
    }

    if (onUpdateUserInfo) {
      onUpdateUserInfo(editUser.id, {
        name: fullName,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        network: editNetwork.trim(),
        position: editPosition.trim(),
        login: editLogin.trim(),
        password: editPassword.trim(),
        role: editRole,
      });
    }

    setEditUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(searchLower) ||
      u.login.toLowerCase().includes(searchLower) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.network && u.network.toLowerCase().includes(searchLower)) ||
      (u.position && u.position.toLowerCase().includes(searchLower));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Submit User Registration Form
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    setFormError(null);

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) {
      setFormError("Заполните обязательные поля: Почта, Имя и Фамилия");
      return;
    }

    const finalLogin = autoLogin.trim() || generateSmartLogin(regEmail, regFirstName, regLastName);
    const finalPassword = autoPassword.trim() || generateRandomPassword();
    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`;

    // Check duplicate logins
    if (users.some((u) => u.login.toLowerCase() === finalLogin.toLowerCase())) {
      setFormError(`Логин "${finalLogin}" уже занят. Попробуйте нажать кнопку обновить логин.`);
      return;
    }

    setIsRegistering(true);

    onAddUser({
      login: finalLogin,
      password: finalPassword,
      name: fullName,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      email: regEmail.trim(),
      network: regNetwork.trim(),
      position: regPosition.trim(),
      role: regRole,
      status: "active",
    });

    // Close registration modal
    setShowAddModal(false);
    setIsRegistering(false);

    // Show email dispatch confirmation modal
    const roleName =
      regRole === "admin"
        ? "Администратор"
        : regRole === "manager"
        ? "Руководитель"
        : regRole === "shopper"
        ? "Шоппер"
        : "Проверяющий";

    const emailPayload = {
      recipientEmail: regEmail.trim(),
      userName: fullName,
      login: finalLogin,
      password: finalPassword,
      roleName,
      network: regNetwork.trim(),
      position: regPosition.trim(),
    };

    setEmailNotification(emailPayload);
    // Send email via backend server endpoint
    triggerSendEmail(emailPayload);
  };

  const handleSendEmailToUser = (user: UserAccount) => {
    const roleName =
      user.role === "admin"
        ? "Администратор"
        : user.role === "manager"
        ? "Руководитель"
        : user.role === "shopper"
        ? "Шоппер"
        : "Проверяющий";

    const emailPayload = {
      recipientEmail: user.email || `${user.login}@company.com`,
      userName: user.name,
      login: user.login,
      password: user.password || "••••••••",
      roleName,
      network: user.network || "Сеть компании",
      position: user.position || "Сотрудник",
    };

    setEmailNotification(emailPayload);
    // Trigger real backend email send
    triggerSendEmail(emailPayload);
  };

  const handleConfirmResetPassword = (userId: string) => {
    if (!newPasswordVal.trim()) return;
    onResetPassword(userId, newPasswordVal.trim());

    const user = users.find((u) => u.id === userId);
    if (user) {
      handleSendEmailToUser({ ...user, password: newPasswordVal.trim() });
    }

    setResetModalUserId(null);
    setNewPasswordVal("");
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Администратор</span>
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Crown className="w-3 h-3 text-indigo-400" />
            <span>Руководитель</span>
          </span>
        );
      case "inspector":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <UserCheck className="w-3 h-3 text-cyan-400" />
            <span>Проверяющий</span>
          </span>
        );
      case "shopper":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <ShoppingBag className="w-3 h-3 text-emerald-400" />
            <span>Шоппер</span>
          </span>
        );
    }
  };

  return (
    <div id="user-management-container" className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Панель администрирования пользователей</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Admin Zone
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Регистрация пользователей по почте, имени, сети и должности с автоматической генерацией и отправкой логинов и паролей
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser.role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setDictionaries(loadDictionaries());
                  setShowDictionaryModal(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                title="Управление справочниками Брендов, Регионов и Городов"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Справочники</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchSmtpConfig();
                  setShowSmtpModal(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                title="Настроить свой SMTP почтовый сервер (Яндекс, Gmail, Mail.ru)"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Настройки SMTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchSentHistory();
                  setShowHistoryModal(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                title="Просмотреть журнал выданных логинов и отправленных писем"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Журнал писем</span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal(currentUser)}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>Мой аккаунт</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Зарегистрировать пользователя</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Info Bar */}
      {currentUser.role === "admin" && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Администратор в системе: <strong className="text-blue-400">{currentUser.name}</strong></span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full font-mono border border-blue-500/20">@{currentUser.login}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Пароль администратора: <strong className="font-mono text-slate-200">{currentUser.password || "admin123"}</strong></span>
                <button
                  onClick={() => handleCopyText(currentUser.password || "admin123", "myPass")}
                  className="text-blue-400 hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "myPass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "myPass" ? "Скопировано!" : "Скопировать"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Вы можете просматривать и копировать открытые пароли всех пользователей ниже</span>
          </div>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Поиск по ФИО, логину, почте, сети или должности..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-all placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0">Фильтр по роли:</span>
          {["all", "admin", "manager", "inspector", "shopper"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === role
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {role === "all"
                ? "Все роли"
                : role === "admin"
                ? "Администраторы"
                : role === "manager"
                ? "Руководители"
                : role === "shopper"
                ? "Шопперы"
                : "Проверяющие"}
            </button>
          ))}
        </div>
      </div>

      {/* Data Integrity Notice Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-slate-300 shadow-xl">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="leading-relaxed">
          <span className="font-bold text-white">Сохранность исторических данных:</span>{" "}
          При удалении или корректировке учетных записей сотрудников вся созданная ими информация (реестр проверок, акты, PDF-отчеты и статистика на дэшбордах) <strong className="text-emerald-400 font-semibold">сохраняется в полном объеме</strong>.
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-4 px-4">Сотрудник / Почта</th>
                <th className="py-4 px-4">Сеть и Должность</th>
                <th className="py-4 px-4">Роль</th>
                <th className="py-4 px-4">Логин в системе</th>
                <th className="py-4 px-4">Пароль (Админ-доступ)</th>
                <th className="py-4 px-4">Статус</th>
                <th className="py-4 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Пользователи по вашему запросу не найдены.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPassVisible = !!visiblePasswords[user.id];
                  const userPass = user.password || "admin123";

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        user.status === "blocked" ? "opacity-60 bg-red-950/10" : ""
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-slate-200 shadow-sm shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                                  Вы (Админ)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email || `${user.login}@company.com`}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Network & Position */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-200 font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-400" />
                            <span>{user.network || "Сеть Orange"}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-500" />
                            <span>{user.position || "Сотрудник"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                        </div>
                      </td>

                      {/* Login */}
                      <td className="py-4 px-4 font-mono text-slate-200 font-bold">
                        <div className="inline-flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span>@{user.login}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(user.login, `login-${user.id}`)}
                            className="text-slate-500 hover:text-blue-400 p-0.5 cursor-pointer transition-colors"
                            title="Скопировать логин"
                          >
                            {copiedKey === `login-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Password (Admin Viewable & Copyable) */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span className="font-mono font-bold text-amber-300 min-w-[70px]">
                            {isPassVisible ? userPass : "••••••••"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleShowPassword(user.id)}
                            className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                            title={isPassVisible ? "Скрыть пароль" : "Показать пароль"}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(userPass, `pass-${user.id}`)}
                            className="text-slate-500 hover:text-amber-300 p-0.5 cursor-pointer transition-colors"
                            title="Скопировать пароль"
                          >
                            {copiedKey === `pass-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {user.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Активен</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            <UserX className="w-3 h-3" />
                            <span>Заблокирован</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Email Info Button */}
                          <button
                            type="button"
                            onClick={() => handleSendEmailToUser(user)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Отправить письмо с доступами повторно"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Редактировать данные пользователя"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => setResetModalUserId(user.id)}
                            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Сбросить пароль"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Block / Unblock Toggle */}
                          {user.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateUserStatus(
                                  user.id,
                                  user.status === "active" ? "blocked" : "active"
                                )
                              }
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                user.status === "active"
                                  ? "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                  : "text-emerald-400 hover:bg-emerald-950/40"
                              }`}
                              title={
                                user.status === "active"
                                  ? "Заблокировать пользователя"
                                  : "Разблокировать пользователя"
                              }
                            >
                              {user.status === "active" ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete User Button */}
                          {user.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmUser(user)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                              title="Удалить аккаунт (с сохранением отчетов)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL (Register by Email, First Name, Last Name, Network, Position) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span>Регистрация нового пользователя</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Электронная почта (Email) *</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. employee@company.com"
                  value={regEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegEmail(val);
                    handleAutoFillCredentials(val, regFirstName, regLastName);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Name and Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Имя *
                  </label>
                  <input
                    type="text"
                    placeholder="Алексей"
                    value={regFirstName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegFirstName(val);
                      handleAutoFillCredentials(regEmail, val, regLastName);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    placeholder="Смирнов"
                    value={regLastName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegLastName(val);
                      handleAutoFillCredentials(regEmail, regFirstName, val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Network and Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Бренд / Сеть</span>
                  </label>
                  <select
                    value={regNetwork}
                    onChange={(e) => setRegNetwork(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">— Не указан (Офис / Без бренда) —</option>
                    {dictionaries.brands
                      .filter((b) => !["maximum", "bomba"].includes(b.trim().toLowerCase()))
                      .map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Должность *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Инспектор ОКК / Аудитор"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Назначить роль в системе:
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-semibold"
                >
                  <option value="inspector">Проверяющий (Полевой аудитор / Инспектор ОКК)</option>
                  <option value="shopper">Шоппер (Тайный покупатель / Контрольные визиты)</option>
                  <option value="manager">Руководитель (Аналитик / Руководитель ОКК)</option>
                  <option value="admin">Администратор (Полный доступ к системе)</option>
                </select>
              </div>

              {/* Auto-generated Credentials Preview Box */}
              <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Автоматически сгенерированные данные входа:</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Сгенерированный Логин:</div>
                      <div className="text-white font-bold">{autoLogin || "a.smirnov"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegenerateLogin}
                      className="text-slate-400 hover:text-blue-400 p-1"
                      title="Обновить логин"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Сгенерированный Пароль:</div>
                      <div className="text-amber-300 font-bold">{autoPassword || "Pass123!"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="text-slate-400 hover:text-amber-300 p-1"
                      title="Сгенерировать новый пароль"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  При сохранении логин и пароль будут автоматически занесены в базу и отправлены пользователю на почту{" "}
                  <strong className="text-blue-300">{regEmail || "указанный e-mail"}</strong>.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isRegistering ? "Регистрация..." : "Зарегистрировать и отправить на почту"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {emailToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-bounce font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{emailToast}</span>
        </div>
      )}

      {/* EMAIL NOTIFICATION CONFIRMATION MODAL */}
      {emailNotification && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Уведомление с доступами отправлено!</h3>
                  <p className="text-[11px] text-slate-400">Данные аккаунта отправлены на e-mail</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-slate-400">
                <span>Кому: <strong className="text-blue-300 font-mono">{emailNotification.recipientEmail}</strong></span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isSendingEmail ? "Отправка..." : "Отправлено сервером"}</span>
                </span>
              </div>

              <div className="space-y-1.5 text-slate-300 leading-relaxed">
                <p>Уважаемый(ая) <strong>{emailNotification.userName}</strong>!</p>
                <p>Вам создан аккаунт в рабочей системе <strong>Mystery Shopper AI</strong>.</p>
                <div className="py-2 space-y-1 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                  <div>Сеть / Филиал: <span className="text-white">{emailNotification.network}</span></div>
                  <div>Должность: <span className="text-white">{emailNotification.position}</span></div>
                  <div>Роль доступа: <span className="text-blue-400 font-bold">{emailNotification.roleName}</span></div>
                  <hr className="border-slate-800 my-1" />
                  <div>Логин: <strong className="text-white font-bold">{emailNotification.login}</strong></div>
                  <div>Пароль: <strong className="text-amber-300 font-bold">{emailNotification.password}</strong></div>
                </div>
              </div>

              {/* Direct Webmail Links Bar */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Открыть письмо в почтовом клиенте получателя:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                      emailNotification.recipientEmail
                    )}&su=${encodeURIComponent(
                      `Доступы к Mystery Shopper AI для ${emailNotification.userName}`
                    )}&body=${encodeURIComponent(
                      `Здравствуйте, ${emailNotification.userName}!\n\nВаши доступы к системе Mystery Shopper AI:\nЛогин: ${emailNotification.login}\nПароль: ${emailNotification.password}\n\nС уважением, Администратор`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-200 p-2 rounded-xl text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-red-400" />
                    <span>Gmail Web</span>
                  </a>

                  <a
                    href={`https://mail.yandex.ru/compose?to=${encodeURIComponent(
                      emailNotification.recipientEmail
                    )}&subject=${encodeURIComponent(
                      `Доступы к Mystery Shopper AI для ${emailNotification.userName}`
                    )}&body=${encodeURIComponent(
                      `Здравствуйте, ${emailNotification.userName}!\n\nВаши доступы к системе Mystery Shopper AI:\nЛогин: ${emailNotification.login}\nПароль: ${emailNotification.password}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 p-2 rounded-xl text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Яндекс Почта</span>
                  </a>

                  <a
                    href={`mailto:${emailNotification.recipientEmail}?subject=${encodeURIComponent(
                      `Доступы к Mystery Shopper AI для ${emailNotification.userName}`
                    )}&body=${encodeURIComponent(
                      `Здравствуйте, ${emailNotification.userName}!\n\nВаши доступы к системе Mystery Shopper AI:\nЛогин: ${emailNotification.login}\nПароль: ${emailNotification.password}`
                    )}`}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-slate-200 p-2 rounded-xl text-center font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>Почтовый клиент</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => triggerSendEmail(emailNotification)}
                disabled={isSendingEmail}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSendingEmail ? "animate-spin" : ""}`} />
                <span>{isSendingEmail ? "Отправляется..." : "Отправить повторно с сервера"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      `Логин: ${emailNotification.login}\nПароль: ${emailNotification.password}\nПочта: ${emailNotification.recipientEmail}`,
                      "modalCopy"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === "modalCopy" ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-400" />
                  )}
                  <span>{copiedKey === "modalCopy" ? "Скопировано!" : "Скопировать"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailNotification(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <span>Редактирование профиля: {editUser.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Имя:
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Фамилия:
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Электронная почта (Email):
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Бренд / Сеть:
                  </label>
                  <select
                    value={editNetwork}
                    onChange={(e) => setEditNetwork(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">— Не указан (Офис / Без бренда) —</option>
                    {dictionaries.brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Должность:
                  </label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Логин для входа в систему:
                </label>
                <input
                  type="text"
                  value={editLogin}
                  onChange={(e) => setEditLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Пароль доступа:
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Роль пользователя:
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none"
                >
                  <option value="admin">Администратор</option>
                  <option value="manager">Руководитель</option>
                  <option value="inspector">Проверяющий</option>
                  <option value="shopper">Шоппер</option>
                </select>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] p-3 rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Корректировка профиля обновляет текущую информацию пользователя. Все ранее созданные им акты в реестре, отчеты и аналитика на дэшбордах сохраняют историческую привязку.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>Удаление аккаунта пользователя</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-300 space-y-1.5">
              <p><strong className="text-white">Сотрудник:</strong> {deleteConfirmUser.name}</p>
              <p><strong className="text-white">Логин:</strong> <span className="font-mono text-blue-400">@{deleteConfirmUser.login}</span></p>
              <p><strong className="text-white">Email:</strong> {deleteConfirmUser.email || "не указан"}</p>
              <p><strong className="text-white">Роль:</strong> {
                deleteConfirmUser.role === "admin" ? "Администратор" :
                deleteConfirmUser.role === "manager" ? "Руководитель" :
                deleteConfirmUser.role === "shopper" ? "Шоппер" : "Проверяющий"
              }</p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Гарантия сохранности истории</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-300/90">
                При удалении учетной записи все проведенные пользователем проверки, внесенные активы, реестр актов, PDF-отчеты и показатели аналитических дэшбордов <strong>навсегда сохраняются в системе</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить учетную запись</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <span>Сброс пароля пользователя</span>
            </h3>

            <p className="text-xs text-slate-400">
              Укажите новый пароль для учетной записи:
            </p>

            <input
              type="text"
              placeholder="Новый пароль..."
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalUserId(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleConfirmResetPassword(resetModalUserId)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
              >
                Сохранить новый пароль
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP CONFIGURATION MODAL */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Настройка SMTP почтового сервера</h3>
                  <p className="text-[11px] text-slate-400">Для прямой отправки писем на реальные e-mail адреса</p>
                </div>
              </div>
              <button
                onClick={() => setShowSmtpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Presets Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Быстрый выбор почтового сервиса:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("yandex")}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 p-2 rounded-xl text-center font-bold text-slate-200 transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="text-amber-400">Яндекс Почта</span>
                  <span className="text-[9px] text-slate-500 font-normal">smtp.yandex.ru : 465</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("gmail")}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 p-2 rounded-xl text-center font-bold text-slate-200 transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="text-red-400">Gmail</span>
                  <span className="text-[9px] text-slate-500 font-normal">smtp.gmail.com : 465</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("mailru")}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 p-2 rounded-xl text-center font-bold text-slate-200 transition-all cursor-pointer flex flex-col items-center gap-1"
                >
                  <span className="text-blue-400">Mail.ru</span>
                  <span className="text-[9px] text-slate-500 font-normal">smtp.mail.ru : 465</span>
                </button>
              </div>
            </div>

            {/* Status or Toast inside modal */}
            {smtpStatusMsg && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  smtpStatusMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : smtpStatusMsg.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                }`}
              >
                {smtpStatusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : smtpStatusMsg.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0" />
                )}
                <span className="text-[11px] font-medium leading-relaxed">{smtpStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSmtpConfig} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">SMTP Сервер / Host *</label>
                  <input
                    type="text"
                    placeholder="smtp.yandex.ru или smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Порт *</label>
                  <input
                    type="number"
                    placeholder="465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Почта / Логин SMTP *</label>
                  <input
                    type="email"
                    placeholder="my-mail@yandex.ru"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Пароль Приложения *</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Имя отправителя</label>
                  <input
                    type="text"
                    placeholder="Mystery Shopper AI"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span>Защищенный SSL/TLS (Порт 465)</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Как получить Пароль Приложения:</span>
                </div>
                <p>
                  1. В Яндекс Почте: Настройки Yandex ID → Безопасность → Пароли приложений → Создать пароль для Почты.
                </p>
                <p>
                  2. В Gmail: Google Настройки → Двухфакторная аутентификация → Пароли приложений.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestSmtpConnection}
                  disabled={isTestingSmtp}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isTestingSmtp ? "animate-spin" : ""}`} />
                  <span>{isTestingSmtp ? "Проверка..." : "Проверить подключение"}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSmtpModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Закрыть
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSmtp}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isSavingSmtp ? "Сохранение..." : "Сохранить настройки"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SENT EMAILS HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Журнал отправленных писем и доступов</h3>
                  <p className="text-[11px] text-slate-400">История формирований и отправок логинов и паролей пользователям</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-slate-400 animate-pulse">Загрузка журнала писем...</div>
            ) : sentHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Письма еще не отправлялись</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {sentHistory.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-bold">{item.userName}</strong>
                        <span className="text-[10px] bg-blue-500/10 text-blue-300 font-semibold px-2 py-0.5 rounded-md border border-blue-500/20">
                          {item.roleName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.sentAt).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono flex items-center gap-3">
                        <span>E-mail: <strong className="text-blue-400">{item.recipientEmail}</strong></span>
                        <span>Логин: <strong className="text-emerald-400">{item.login}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.method === "smtp_direct" ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>SMTP Прямой</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Зафиксировано</span>
                        </span>
                      )}

                      {item.previewUrl && (
                        <a
                          href={item.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        >
                          Открыть предпросмотр ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">Всего писем в журнале: {sentHistory.length}</span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Management Modal for Admin */}
      {showDictionaryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Управление справочниками системы</h3>
                  <p className="text-xs text-slate-400">
                    Настройка глобальных списков Брендов, Регионов и Городов, используемых в проверках
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Бренды */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-200">Бренды ({dictionaries.brands.length})</h4>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    placeholder="Новый бренд..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddBrandDict()}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBrandDict}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {dictionaries.brands.map((b) => (
                    <div
                      key={b}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <span className="font-medium">{b}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBrandDict(b)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Регионы */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">Регионы ({dictionaries.regions.length})</h4>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRegionInput}
                    onChange={(e) => setNewRegionInput(e.target.value)}
                    placeholder="Новый регион..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddRegionDict()}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRegionDict}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {dictionaries.regions.map((r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <span className="font-medium">{r}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRegionDict(r)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Города */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200">Города ({dictionaries.cities.length})</h4>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCityInput}
                    onChange={(e) => setNewCityInput(e.target.value)}
                    placeholder="Новый город..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddCityDict()}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCityDict}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {dictionaries.cities.map((c) => (
                    <div
                      key={c}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <span className="font-medium">{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCityDict(c)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDictionaryModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20"
              >
                Сохранить и закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
