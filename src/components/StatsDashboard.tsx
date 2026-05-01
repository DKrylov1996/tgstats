import {
  CalendarDays,
  Clock3,
  DoorOpen,
  Heart,
  MessageCircle,
  Moon,
  Sparkles,
  Users,
  WholeWord,
} from 'lucide-react';
import type { SavedStats } from '../types/stats';
import { formatDate, formatDecimal, formatHour, formatNumber } from '../utils/formatters';
import AwardsSection from './AwardsSection';
import ChartsSection from './ChartsSection';
import SecretConclusion from './SecretConclusion';
import StatCard from './StatCard';

interface StatsDashboardProps {
  stats: SavedStats;
  onLogout: () => void;
}

function ParticipantMetric({
  label,
  rows,
}: {
  label: string;
  rows: Array<{ key: string; label: string; value: number; percentage?: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="soft-panel min-w-0 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-ink">{label}</h3>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-4 text-sm">
              <span className="min-w-0 truncate font-medium text-ink">{row.label}</span>
              <span className="text-right tabular-nums text-ink/58">
                {formatNumber(row.value)}
                {typeof row.percentage === 'number' ? ` · ${formatDecimal(row.percentage)}%` : ''}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-lg bg-rose-100">
              <div className="h-full rounded-lg bg-berry" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsDashboard({ stats, onLogout }: StatsDashboardProps) {
  const mostActiveHour =
    stats.mostActiveHour && Number.isFinite(Number(stats.mostActiveHour.key))
      ? formatHour(Number(stats.mostActiveHour.key))
      : stats.mostActiveHour?.label ?? 'нет данных';

  return (
    <main className="dashboard-bg min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/78 text-berry shadow-card">
              <Heart className="h-4 w-4" aria-hidden="true" />
            </span>
            Мы в цифрах
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-white/76 px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <DoorOpen className="h-4 w-4" aria-hidden="true" />
            Выйти
          </button>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-lg bg-white/70 px-3 py-2 text-sm font-medium text-wine shadow-sm">
              На этой странице нет текста переписки — только статистика.
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-ink sm:text-6xl">
              Мы в цифрах
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-ink/68">
              Наша переписка в графиках и диаграммах
            </p>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/58">Здесь нет самих сообщений — всё безопасно :)</p>
          </div>

          <div className="soft-panel rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint/12 text-mint">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-ink/56">Последнее обновление</p>
                <p className="font-semibold text-ink">{formatDate(stats.updatedAt ?? stats.generatedAt)}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/62 p-3">
                <span className="block text-ink/52">С</span>
                <strong className="mt-1 block text-ink">{formatDate(stats.firstDate)}</strong>
              </div>
              <div className="rounded-lg bg-white/62 p-3">
                <span className="block text-ink/52">До</span>
                <strong className="mt-1 block text-ink">{formatDate(stats.lastDate)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Всего сообщений" value={formatNumber(stats.totalMessages)} icon={MessageCircle} />
          <StatCard title="Всего слов" value={formatNumber(stats.totalWords)} icon={WholeWord} />
          <StatCard title="Дней между первым и последним" value={formatNumber(stats.daysSpan)} icon={CalendarDays} />
          <StatCard title="Среднее количество сообщений в день" value={formatDecimal(stats.averageMessagesPerDay)} icon={Sparkles} />
          <StatCard title="Самый активный день" value={stats.mostActiveDay?.label ?? 'нет данных'} subtitle={`${stats.mostActiveDay?.count ?? 0} сообщений`} icon={CalendarDays} />
          <StatCard title="Самый активный месяц" value={stats.mostActiveMonth?.label ?? 'нет данных'} subtitle={`${stats.mostActiveMonth?.count ?? 0} сообщений`} icon={Users} />
          <StatCard title="Самый активный час" value={mostActiveHour} subtitle={`${stats.mostActiveHour?.count ?? 0} сообщений`} icon={Clock3} />
          <StatCard title="Ночных сообщений" value={formatNumber(stats.niceMetrics.nightMessages)} subtitle="С 00:00 до 05:59" icon={Moon} />
        </section>

        <section className="mt-10 space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Участники</h2>
            <p className="mt-1 text-sm text-ink/56">Соотношение активности, слов и инициативы по дням.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ParticipantMetric label="Сообщения по участникам" rows={stats.messagesByParticipant} />
            <ParticipantMetric label="Слова по участникам" rows={stats.wordsByParticipant} />
            <ParticipantMetric label="Кто чаще писал первым" rows={stats.firstMessagesByParticipant} />
            <ParticipantMetric label="Кто чаще писал ночью" rows={stats.nightMessagesByParticipant} />
          </div>
        </section>

        <div className="mt-10">
          <ChartsSection stats={stats} />
        </div>

        {stats.topWords.length > 0 ? (
          <section className="mt-10 soft-panel rounded-lg p-5">
            <h2 className="text-2xl font-semibold text-ink">Топ слов</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {stats.topWords.map((item) => (
                <span key={item.word} className="rounded-lg bg-white/76 px-3 py-2 text-sm font-medium text-ink/72 shadow-sm">
                  {item.word} · {formatNumber(item.count)}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10">
          <AwardsSection awards={stats.awards} />
        </div>

        <div className="mt-10 pb-12">
          <SecretConclusion />
        </div>
      </div>
    </main>
  );
}
