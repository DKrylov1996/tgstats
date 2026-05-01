# Мы в цифрах

Приватный production-ready сайт для красивой статистики Telegram-переписки. Сырой `result.json` анализируется в браузере, а в Supabase сохраняется только агрегированная статистика: числа, графики, топ эмодзи, топ слов и награды.

## Что важно

- исходный Telegram `result.json` не сохраняется;
- полные тексты сообщений и массив сообщений не отправляются на сервер;
- Supabase доступен только из Vercel Serverless Functions;
- главная страница `/` закрыта паролем просмотра;
- страница `/editpage` закрыта отдельным паролем редактора;
- пароли и service role key не попадают во frontend-код.

## Локальный запуск

```bash
npm install
npm run dev
```

Открой `http://localhost:5173`.

Локальный dev-сервер Vite прокидывает `/api` в те же handlers, которые лежат в папке `api/`.

## Переменные окружения

Создай `.env` рядом с `.env.example`:

```env
VIEW_PASSWORD=пароль_для_просмотра
EDITOR_PASSWORD=другой_пароль_для_редактирования
SESSION_SECRET=длинная_случайная_строка
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key
```

`VIEW_PASSWORD` и `EDITOR_PASSWORD` должны отличаться. Не коммить `.env`: он уже исключён через `.gitignore`.

## Supabase

1. Создай проект Supabase.
2. Открой SQL Editor.
3. Выполни содержимое `supabase/schema.sql`.

Таблица `telegram_stats` хранит одну актуальную запись с `id = 'main'`.

## Как загрузить Telegram export

1. В Telegram Desktop открой экспорт истории чата.
2. Выбери формат JSON.
3. После экспорта найди файл `result.json`.
4. Открой `/editpage`.
5. Войди с `EDITOR_PASSWORD`.
6. Загрузи `result.json`.
7. Проверь предпросмотр.
8. Нажми «Сохранить статистику».

После этого главная страница `/` покажет последнюю сохранённую статистику без повторной загрузки JSON.

## Сборка

```bash
npm run build
```

Команда запускает TypeScript-проверку и Vite production build.
