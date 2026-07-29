# Пошаговая инструкция по настройке Supabase для AI Mystery Auditor

Документ описывает процедуру подсоединения облачной базы данных Supabase к системе контроля качества проверок (OKK CRM).

---

## Шаг 1. Создание проекта в Supabase

1. Перейдите на официальный сайт [https://supabase.com](https://supabase.com) и войдите под своей учетной записью.
2. Нажмите **"New Project"**.
3. Укажите имя проекта (например, `ai-mystery-auditor`).
4. Задайте надёжный пароль для базы данных PostgreSQL.
5. Выберите ближайший регион (например, `Frankfurt (eu-central-1)`).
6. Нажмите **"Create new project"** и дождитесь завершения развертывания (1–2 минуты).

---

## Шаг 2. Выполнение SQL-миграции

1. В левой панели управления Supabase перейдите в раздел **SQL Editor**.
2. Нажмите **"New query"**.
3. Откройте файл миграции из данного репозитория: `supabase/migrations/20260729_init.sql`.
4. Скопируйте всё содержимое SQL-скрипта и вставьте его в редактор SQL Editor.
5. Нажмите кнопку **"Run"** (или `Ctrl + Enter`).
6. Убедитесь, что все таблицы (`profiles`, `brands`, `locations`, `audits`, `shopper_submissions`, `audit_files`, `transcripts`, `criteria_results`, `sales_driver_results`, `approvals`, `audit_versions`, `audit_events`, `notifications`, `ai_jobs`), индексы и RLS-политики успешно созданы.

---

## Шаг 3. Настройка хранилища файлов (Supabase Storage)

1. В левом меню Supabase перейдите в раздел **Storage**.
2. Нажмите **"New bucket"**.
3. Создайте приватный бакет с именем **`audit-files`**:
   - **Public bucket**: `Disabled` (выключено, доступ только по защищенным Signed URL).
   - **Allowed MIME types**: `audio/*`, `application/pdf`, `image/*`.
4. В разделе **Storage -> Policies** примените политики доступа:
   - Разрешить чтение и загрузку только аутентифицированным пользователям системы.

---

## Шаг 4. Настройка переменных окружения

1. В панели управления Supabase перейдите в **Project Settings -> API**.
2. Скопируйте следующие ключи:
   - **Project URL** (`https://<project-id>.supabase.co`)
   - **anon / public key** (`eyJhbGci...`)
3. В корневом каталоге проекта создайте или отредактируйте файл `.env`:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
VITE_DEMO_MODE=false
```

---

## Шаг 5. Создание первого администратора (Initial Seed)

Для первого входа в систему создайте пользователя через **Authentication -> Users** в панели Supabase:

1. В левом меню нажмите **Authentication -> Users -> Add User -> Create User**.
2. Укажите Email и Пароль.
3. Перейдите в **SQL Editor** и выполните команду назначения роли администратора:

```sql
INSERT INTO public.profiles (id, login, full_name, role, status)
VALUES (
  'UUID_СОЗДАННОГО_ПОЛЬЗОВАТЕЛЯ_ИЗ_AUTH_USERS',
  'admin@company.com',
  'Главный Администратор',
  'admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
```

4. Выполните вход под созданным аккаунтом в интерфейсе приложения.
