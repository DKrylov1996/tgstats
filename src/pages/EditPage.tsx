import { useEffect, useMemo, useState } from 'react';
import { DoorOpen, Eye, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { getSession, logout } from '../apiClient/auth';
import { deleteStats, getSavedStats, saveStats } from '../apiClient/stats';
import EditorLogin from '../components/EditorLogin';
import FileUpload, { type UploadStatus } from '../components/FileUpload';
import LoadingState from '../components/LoadingState';
import type { AccessLevel, SavedStats } from '../types/stats';
import { analyzeTelegramExport } from '../utils/analyzeTelegram';
import { formatDate, formatNumber } from '../utils/formatters';

export default function EditPage() {
  const [access, setAccess] = useState<AccessLevel | null>(null);
  const [preview, setPreview] = useState<SavedStats | null>(null);
  const [savedStats, setSavedStats] = useState<SavedStats | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const cuteMetricCount = useMemo(() => {
    if (!preview) {
      return 0;
    }
    return (
      preview.niceMetrics.heartCount +
      preview.niceMetrics.laughMessages +
      preview.niceMetrics.greetingMessages +
      preview.niceMetrics.morningMessages +
      preview.niceMetrics.nightMessages
    );
  }, [preview]);

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then(async (session) => {
        if (!isMounted) {
          return;
        }
        setAccess(session.access === 'editor' ? 'editor' : 'none');
        if (session.access === 'editor') {
          const currentStats = await getSavedStats();
          if (isMounted) {
            setSavedStats(currentStats);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccess('none');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setStatus('reading');

    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Нужен файл result.json из Telegram export.');
      }
      const content = await file.text();
      setStatus('analyzing');
      const parsed = JSON.parse(content) as unknown;
      const stats = analyzeTelegramExport(parsed);
      setPreview(stats);
      setStatus('ready');
    } catch (caughtError) {
      setStatus('idle');
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось разобрать файл.');
    }
  }

  async function handleSave() {
    if (!preview) {
      return;
    }
    setError(null);
    setStatus('saving');
    try {
      const saved = await saveStats(preview);
      setSavedStats(saved);
      setPreview(saved);
      setStatus('saved');
    } catch (caughtError) {
      setStatus('ready');
      setError(
        caughtError instanceof Error && caughtError.message === 'stats_invalid'
          ? 'Сервер отклонил статистику. Попробуй заново проанализировать файл или обновить страницу.'
          : 'Не удалось сохранить статистику. Проверь переменные окружения и Supabase.',
      );
    }
  }

  async function handleDelete() {
    const shouldDelete = window.confirm('Очистить сохранённую статистику? Это действие уберёт данные с главной страницы.');
    if (!shouldDelete) {
      return;
    }
    setError(null);
    try {
      await deleteStats();
      setSavedStats(null);
      setPreview(null);
      setStatus('idle');
    } catch {
      setError('Не удалось очистить статистику.');
    }
  }

  async function handleLogout() {
    await logout();
    setAccess('none');
    setPreview(null);
  }

  if (access === null) {
    return <LoadingState title="Проверяю режим редактирования" subtitle="Страница откроется только после отдельного входа." />;
  }

  if (access !== 'editor') {
    return <EditorLogin onSuccess={setAccess} />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff9fb,#f3fbf8_48%,#f9f6ff)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm font-medium text-mint shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Режим редактора
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-ink">Редактирование статистики</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/62">
              Загрузи Telegram result.json. Сайт проанализирует файл в браузере и сохранит только агрегированную статистику.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/76 px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <DoorOpen className="h-4 w-4" aria-hidden="true" />
            Выйти из режима редактирования
          </button>
        </header>

        <section className="mt-8">
          <FileUpload status={status} onFile={handleFile} />
        </section>

        {error ? <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-wine">{error}</p> : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="soft-panel rounded-lg p-5">
            <h2 className="text-2xl font-semibold text-ink">Предпросмотр</h2>
            {preview ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <PreviewItem label="Всего сообщений" value={formatNumber(preview.totalMessages)} />
                <PreviewItem label="Период переписки" value={`${formatDate(preview.firstDate)} — ${formatDate(preview.lastDate)}`} />
                <PreviewItem label="Участники" value={preview.participants.map((participant) => participant.name).join(', ')} />
                <PreviewItem
                  label="Топ эмодзи"
                  value={preview.topEmoji.length ? preview.topEmoji.map((item) => `${item.emoji} ${item.count}`).join(' · ') : 'не найдены'}
                />
                <PreviewItem label="Количество милых метрик" value={formatNumber(cuteMetricCount)} />
                <PreviewItem label="Текстовых сообщений" value={formatNumber(preview.textMessages)} />
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-white/62 p-6 text-sm leading-6 text-ink/58">
                Жду файл. После анализа здесь появится короткое резюме, и только потом можно будет сохранить статистику.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="soft-panel rounded-lg p-5">
              <h2 className="text-xl font-semibold text-ink">Что сохраняется?</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/62">
                <li>только числа, графики, топ эмодзи и агрегированные метрики;</li>
                <li>даты периода, участники по отображаемым именам и награды;</li>
                <li>последняя сохранённая версия статистики.</li>
              </ul>
            </div>
            <div className="soft-panel rounded-lg p-5">
              <h2 className="text-xl font-semibold text-ink">Что не сохраняется?</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/62">
                <li>исходный файл;</li>
                <li>тексты сообщений;</li>
                <li>отдельные сообщения;</li>
                <li>медиа;</li>
                <li>ссылки, телефоны и email.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={!preview || status === 'saving'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-wine disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Сохранить статистику
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/76 px-5 py-3 text-sm font-semibold text-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Очистить сохранённую статистику
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/76 px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Перейти на сайт
          </a>
        </section>

        {savedStats ? (
          <p className="mt-5 rounded-lg bg-white/68 px-4 py-3 text-sm text-ink/58">
            Сейчас в Supabase сохранена статистика от {formatDate(savedStats.updatedAt ?? savedStats.generatedAt)}.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/68 p-4">
      <p className="text-sm text-ink/52">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold leading-7 text-ink">{value}</p>
    </div>
  );
}
