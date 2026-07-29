# Процедура резервного копирования и восстановления (Backup & Restore)

Настоящий документ регламентирует порядок сохранения и восстановления данных CRM-системы AI Mystery Auditor.

---

## 1. Режим хранения данных и Бессрочный архив

В соответствии с регламентом компании:
- Все завершенные проверки (`APPROVED`, `APPROVED_WITH_COMMENT`, `FINALIZED_NO_SCORE_CHANGE`, `FINALIZED_WITH_SCORE_CHANGE`), исходные аудиозаписи шопперов, итоговые PDF-акты и история согласований **хранятся бессрочно**.
- В пользовательском интерфейсе удаление завершенных проверок заблокировано. Аннулирование или архивация доступна только администратору с обязательным фиксацией причины в журнале `audit_events`.

---

## 2. Экспорт метаданных и проверок (Manual Export)

Для тарифных планов без автоматического ежедневного бэкапа Supabase предусмотрен встроенный экспорт:

1. **Экспорт реляционных данных в формате JSON/SQL**:
   - Панель Supabase -> **Database -> Tables** -> Запрос экспорта таблиц `audits`, `criteria_results`, `approvals`, `audit_versions`.
   - Альтернативно через CLI:
     ```bash
     pg_dump --host=db.<project-id>.supabase.co --username=postgres --dbname=postgres -F c -b -v -f audit_backup_$(date +%Y%m%d).dump
     ```

2. **Экспорт файлов и аудиозаписей**:
   - Бакет `audit-files` синхронизируется через CLI Supabase или AWS S3 CLI:
     ```bash
     supabase storage download audit-files ./storage_backup/
     ```

---

## 3. Процедура восстановления (Restore Procedure)

1. **Восстановление базы данных**:
   - Создайте чистую схему через миграцию `supabase/migrations/20260729_init.sql`.
   - Загрузите дамп:
     ```bash
     pg_restore --host=db.<project-id>.supabase.co --username=postgres --dbname=postgres --clean --no-owner -d postgres audit_backup.dump
     ```

2. **Восстановление файлов**:
   - Загрузите содержимое директории `./storage_backup/` обратно в бакет `audit-files`.

3. **Проверка целостности после восстановления**:
   - Выполните SQL-проверку соответствия путей аудиозаписей записи в `audit_files`:
     ```sql
     SELECT a.id, a.audit_number, f.storage_path
     FROM public.audits a
     LEFT JOIN public.audit_files f ON a.id = f.audit_id
     WHERE f.id IS NULL AND a.status NOT IN ('DRAFT');
     ```

---

## 4. Контроль сбоев и оповещение

- Каждая транзакция изменения статусов защищена optimistic concurrency check (`lock_version`).
- При сбоях сетевого подключения локальный черновик формы сохраняется в браузерном хранилище и автоматически синхронизируется с сервером после восстановления связи.
