import { Inbox, LockKeyhole } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  editorHint?: boolean;
}

export default function EmptyState({
  title = 'Статистика ещё не добавлена',
  subtitle = 'Когда данные будут загружены через страницу редактирования, здесь появится аккуратный дашборд.',
  editorHint = false,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-xl rounded-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-rose-100 text-berry">
          <Inbox className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-base leading-7 text-ink/64">{subtitle}</p>
        {editorHint ? (
          <a
            href="/editpage"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-wine"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Открыть редактирование
          </a>
        ) : null}
      </div>
    </div>
  );
}
