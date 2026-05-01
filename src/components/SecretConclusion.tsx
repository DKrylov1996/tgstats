import { useState } from 'react';
import { Eye, Sparkles } from 'lucide-react';

export default function SecretConclusion() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <section className="soft-panel rounded-lg p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-berry">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-5 whitespace-pre-line text-2xl font-semibold leading-snug text-ink">
        Анализ завершён.{'\n'}Рекомендация: продолжать общение.{'\n'}Статус: перспективно.
      </p>
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-wine"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        Показать секретный вывод
      </button>
      {isVisible ? (
        <p className="mx-auto mt-5 max-w-2xl rounded-lg bg-white/72 px-5 py-4 text-base leading-7 text-ink/72">
          Главный вывод: за всеми этими сообщениями стоит история, которую хочется продолжать.
        </p>
      ) : null}
    </section>
  );
}
