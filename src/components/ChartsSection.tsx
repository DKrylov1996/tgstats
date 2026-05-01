import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { SavedStats } from '../types/stats';
import { formatNumber } from '../utils/formatters';

interface ChartsSectionProps {
  stats: SavedStats;
}

const COLORS = ['#a43b62', '#4f9b8f', '#d86f6f', '#6b2543', '#6c7a89', '#b45f7e', '#2f8377'];
const CHART_MARGIN = { left: 12, right: 12, top: 8, bottom: 0 };
const EMOJI_CHART_MARGIN = { left: 12, right: 12, top: 8, bottom: 24 };
const Y_AXIS_WIDTH = 72;
const Y_AXIS_TICK = { fontSize: 12 };
const EMOJI_FONT_FAMILY = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const EMOJI_PARTICLE_COUNT = 16;

interface EmojiParticle {
  id: number;
  emoji: string;
  left: number;
  top: number;
  drift: number;
  rotate: number;
  pop: number;
  delay: number;
  duration: number;
  size: number;
}

interface EmojiAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
  onBurst: (emoji: string, event: MouseEvent<SVGGElement>) => void;
}

function renderPieLabel({ name, percent }: { name?: string; percent?: number }) {
  return `${name ?? ''}: ${Math.round((percent ?? 0) * 100)}%`;
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="soft-panel min-h-[340px] min-w-0 overflow-hidden rounded-lg p-5">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-5 h-[260px] min-w-0">{children}</div>
    </article>
  );
}

function EmojiAxisTick({ x = 0, y = 0, payload, onBurst }: EmojiAxisTickProps) {
  const emoji = payload?.value ?? '';

  return (
    <g
      transform={`translate(${x},${y})`}
      className="cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label={`Запустить ${emoji}`}
      onClick={(event) => onBurst(emoji, event)}
    >
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#25202a" fontSize={18} fontFamily={EMOJI_FONT_FAMILY}>
        {emoji}
      </text>
    </g>
  );
}

function createEmojiParticles(emoji: string, left: number, top: number): EmojiParticle[] {
  const seed = Date.now();

  return Array.from({ length: EMOJI_PARTICLE_COUNT }, (_, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    const spread = 24 + Math.random() * 116;

    return {
      id: seed + index + Math.round(Math.random() * 100_000),
      emoji,
      left: left + (Math.random() - 0.5) * 14,
      top: top - 8,
      drift: direction * spread,
      rotate: direction * (60 + Math.random() * 220),
      pop: -(36 + Math.random() * 76),
      delay: Math.random() * 0.08,
      duration: 1.08 + Math.random() * 0.28,
      size: 18 + Math.random() * 12,
    };
  });
}

export default function ChartsSection({ stats }: ChartsSectionProps) {
  const emojiChartRef = useRef<HTMLDivElement | null>(null);
  const cleanupTimersRef = useRef<number[]>([]);
  const [emojiParticles, setEmojiParticles] = useState<EmojiParticle[]>([]);

  const emojiData = stats.topEmoji.map((item) => ({
    key: item.emoji,
    label: item.emoji,
    value: item.count,
  }));

  const burstEmoji = useCallback((emoji: string, event: MouseEvent<SVGGElement>) => {
    if (!emojiChartRef.current) {
      return;
    }

    const bounds = emojiChartRef.current.getBoundingClientRect();
    const nextParticles = createEmojiParticles(emoji, event.clientX - bounds.left, event.clientY - bounds.top);
    const nextIds = new Set(nextParticles.map((particle) => particle.id));

    setEmojiParticles((current) => [...current.slice(-64), ...nextParticles]);

    const timer = window.setTimeout(() => {
      setEmojiParticles((current) => current.filter((particle) => !nextIds.has(particle.id)));
    }, 2300);

    cleanupTimersRef.current.push(timer);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of cleanupTimersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ChartCard title="Сообщения по месяцам">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.activityByMonth} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="monthGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#a43b62" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#a43b62" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eadfe5" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={10} minTickGap={22} />
            <YAxis tick={Y_AXIS_TICK} width={Y_AXIS_WIDTH} tickMargin={8} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Area type="monotone" dataKey="value" stroke="#a43b62" strokeWidth={3} fill="url(#monthGradient)" name="Сообщения" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Сообщения по участникам">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.messagesByParticipant} margin={CHART_MARGIN}>
            <CartesianGrid stroke="#eadfe5" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={10} />
            <YAxis tick={Y_AXIS_TICK} width={Y_AXIS_WIDTH} tickMargin={8} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Bar dataKey="value" name="Сообщения" radius={[6, 6, 0, 0]}>
              {stats.messagesByParticipant.map((entry, index) => (
                <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Доля сообщений">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 24, right: 24, bottom: 22, left: 24 }}>
            <Pie
              data={stats.messagesByParticipant}
              dataKey="value"
              nameKey="label"
              outerRadius={78}
              innerRadius={48}
              paddingAngle={3}
              label={renderPieLabel}
            >
              {stats.messagesByParticipant.map((entry, index) => (
                <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Активность по часам">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.activityByHour} margin={CHART_MARGIN}>
            <CartesianGrid stroke="#eadfe5" strokeDasharray="3 3" />
            <XAxis dataKey="label" interval={2} tick={{ fontSize: 11 }} />
            <YAxis tick={Y_AXIS_TICK} width={Y_AXIS_WIDTH} tickMargin={8} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Bar dataKey="value" name="Сообщения" fill="#4f9b8f" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Активность по дням недели">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.activityByWeekday} margin={CHART_MARGIN}>
            <CartesianGrid stroke="#eadfe5" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={10} />
            <YAxis tick={Y_AXIS_TICK} width={Y_AXIS_WIDTH} tickMargin={8} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Bar dataKey="value" name="Сообщения" fill="#d86f6f" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Топ эмодзи">
        {emojiData.length > 0 ? (
          <div ref={emojiChartRef} className="relative h-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emojiData} margin={EMOJI_CHART_MARGIN}>
                <CartesianGrid stroke="#eadfe5" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  interval={0}
                  tick={<EmojiAxisTick onBurst={burstEmoji} />}
                  tickLine={false}
                  tickMargin={14}
                  height={42}
                />
                <YAxis tick={Y_AXIS_TICK} width={Y_AXIS_WIDTH} tickMargin={8} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Bar dataKey="value" name="Количество" fill="#6b2543" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 overflow-hidden" aria-hidden="true">
              {emojiParticles.map((particle) => {
                const style = {
                  left: `${particle.left}px`,
                  top: `${particle.top + 64}px`,
                  fontSize: `${particle.size}px`,
                  '--emoji-drift': `${particle.drift}px`,
                  '--emoji-pop': `${particle.pop}px`,
                  '--emoji-rotate': `${particle.rotate}deg`,
                  '--emoji-delay': `${particle.delay}s`,
                  '--emoji-duration': `${particle.duration}s`,
                } as CSSProperties;

                return (
                  <span key={particle.id} className="emoji-burst-particle" style={style}>
                    {particle.emoji}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg bg-white/58 text-center text-sm text-ink/56">
            Эмодзи в текстовых сообщениях не найдены.
          </div>
        )}
      </ChartCard>
    </section>
  );
}
