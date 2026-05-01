import { FormEvent, useState } from 'react';
import { ArrowRight, ShieldCheck, SquareTerminal } from 'lucide-react';
import { loginEditor } from '../apiClient/auth';
import type { AccessLevel } from '../types/stats';

interface EditorLoginProps {
  onSuccess: (access: AccessLevel) => void;
}

export default function EditorLogin({ onSuccess }: EditorLoginProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setHasError(false);

    try {
      const session = await loginEditor(password);
      onSuccess(session.access);
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fff9fb,#f3fbf8_48%,#f9f6ff)] px-4 py-10">
      <section className="glass-card w-full max-w-md rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mint/12 text-mint">
            <SquareTerminal className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-ink">Редактирование статистики</h1>
            <p className="mt-1 text-sm text-ink/58">Здесь можно обновить данные сайта</p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/72">Пароль редактора</span>
            <span className="relative block">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/38" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-wine/10 bg-white/72 py-3 pl-11 pr-4 text-ink shadow-sm transition placeholder:text-ink/34 focus:border-mint focus:bg-white"
                placeholder="Введите пароль"
              />
            </span>
          </label>

          {hasError ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-wine">Доступ не получен</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-mint disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Проверяю...' : 'Войти'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}
