# Развёртывание исправления 30.07.2026

Код проверен командами `npm run lint`, `npm test` (25/25) и `npm run build`.

После загрузки содержимого проекта в `main`:

1. В Supabase SQL Editor выполнить файл:
   `supabase/migrations/20260730_03_feedback_notes.sql`.
2. В Supabase открыть Project Settings → API и скопировать `service_role` key.
3. В Vercel → Project → Environment Variables добавить:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: скопированный service-role key
   - Environments: Production and Preview
   - Sensitive: включено.
4. Ключ не отправлять в чат и не добавлять в GitHub.
5. Выполнить Redeploy без Build Cache.
6. Проверить один полный сценарий:
   - администратор создаёт шоппера, аудитора и руководителя;
   - шоппер отправляет анкету и аудио;
   - аудитор запускает анализ и попадает на шаг 3;
   - аудитор формирует акт и назначает руководителя;
   - руководитель утверждает или возвращает с комментарием;
   - финальная проверка остаётся в реестре и появляется в дашборде.
