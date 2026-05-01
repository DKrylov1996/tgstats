import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

export default function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <article className="soft-panel rounded-lg p-5 transition duration-200 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink/58">{title}</p>
          <strong className="mt-2 block text-3xl font-semibold tracking-normal text-ink">{value}</strong>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-berry">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {subtitle ? <p className="mt-4 text-sm leading-6 text-ink/58">{subtitle}</p> : null}
    </article>
  );
}
