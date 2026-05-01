import { Award as AwardIcon, Medal, Trophy } from 'lucide-react';
import type { Award } from '../types/stats';

interface AwardsSectionProps {
  awards: Award[];
}

export default function AwardsSection({ awards }: AwardsSectionProps) {
  if (awards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-berry">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-ink">Награды</h2>
          <p className="text-sm text-ink/56">Маленькие титулы, собранные только из чисел.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {awards.map((award) => (
          <article key={award.title} className="soft-panel rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink/56">{award.title}</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">{award.winner}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint/12 text-mint">
                {award.value > 0 ? <Medal className="h-5 w-5" aria-hidden="true" /> : <AwardIcon className="h-5 w-5" aria-hidden="true" />}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/62">{award.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
