# Деплой на Vercel

## 1. Supabase

1. Создай новый Supabase project.
2. Открой SQL Editor.
3. Выполни `supabase/schema.sql`.
4. Скопируй `SUPABASE_URL`.
5. Скопируй `SUPABASE_SERVICE_ROLE_KEY` из Project Settings → API.

Service role key нужен только serverless API. Не добавляй его в переменные с префиксом `VITE_`.

## 2. Vercel project

1. Создай новый проект Vercel из репозитория.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## 3. Environment variables

В Vercel Project Settings → Environment Variables добавь:

```env
VIEW_PASSWORD=
EDITOR_PASSWORD=
SESSION_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Рекомендации:

- `VIEW_PASSWORD` и `EDITOR_PASSWORD` должны быть разными.
- `SESSION_SECRET` сделай длинной случайной строкой.
- `SUPABASE_SERVICE_ROLE_KEY` не должен использоваться во frontend.

## 4. Deploy

1. Запусти деплой в Vercel.
2. Открой `/editpage`.
3. Войди с `EDITOR_PASSWORD`.
4. Загрузи Telegram `result.json`.
5. Нажми «Сохранить статистику».
6. Открой `/`.
7. Войди с `VIEW_PASSWORD` и проверь дашборд.

## 5. Обновление статистики

Для новой версии экспорта снова открой `/editpage`, загрузи новый `result.json` и сохрани. Старая запись в Supabase будет перезаписана singleton-записью `main`.

## 6. Очистка статистики

На `/editpage` нажми «Очистить сохранённую статистику». После этого главная страница после входа покажет состояние «Статистика ещё не добавлена».
