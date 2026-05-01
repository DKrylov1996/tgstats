export const ruNumber = new Intl.NumberFormat('ru-RU');

const ruDate = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const ruShortDate = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const ruMonth = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

export function formatNumber(value: number): string {
  return ruNumber.format(Math.round(value));
}

export function formatCompactNumber(value: number): string {
  if (value < 10_000) {
    return formatNumber(value);
  }
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string | Date | null): string {
  if (!value) {
    return 'пока нет данных';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 'пока нет данных';
  }
  return ruDate.format(date);
}

export function formatShortDate(value: string | Date | null): string {
  if (!value) {
    return 'пока нет данных';
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 'пока нет данных';
  }
  return ruShortDate.format(date);
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) {
    return monthKey;
  }
  return ruMonth.format(new Date(year, month - 1, 1));
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}
