import type { Award, ChartPoint, ParticipantStats, SavedStats } from '../types/stats';
import type { NormalizedMessage, TelegramExport, TelegramMessage } from '../types/telegram';
import { countHeartEmoji, extractEmoji } from './emoji';
import { formatDate, formatHour, formatMonthKey } from './formatters';
import { countWords, extractWordsForTop, hasGreeting, hasLaugh, removePrivateTokens } from './textCleanup';

type ParticipantDraft = Omit<ParticipantStats, 'averageWordsPerTextMessage' | 'sharePercent'>;

const WEEKDAY_LABELS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readStringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function isTelegramExport(value: unknown): value is TelegramExport {
  return isRecord(value) && Array.isArray(value.messages);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseTelegramDate(message: TelegramMessage): Date | null {
  const dateString = readString(message.date);
  if (dateString) {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const unixTime = readString(message.date_unixtime);
  if (unixTime && /^\d+$/.test(unixTime)) {
    const date = new Date(Number(unixTime) * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function extractMessageText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (isRecord(part) && typeof part.text === 'string') {
        return part.text;
      }
      return '';
    })
    .join('')
    .trim();
}

function sanitizeAuthorName(name: string): string {
  const withoutUsernames = removePrivateTokens(name).replace(/@[a-zA-Z0-9_]{3,32}\b/g, '').replace(/\s+/g, ' ').trim();
  return withoutUsernames.length > 0 ? withoutUsernames.slice(0, 80) : 'Участник';
}

function createAuthorResolver() {
  const anonymousNames = new Map<string, string>();
  let index = 1;

  return (message: TelegramMessage): string => {
    const record = message as Record<string, unknown>;
    const displayName = readStringField(record, ['from', 'actor', 'sender', 'author']);
    if (displayName) {
      return sanitizeAuthorName(displayName);
    }

    const rawId = readStringField(record, ['from_id', 'actor_id', 'sender_id', 'user_id']);
    const key = rawId ?? `unknown-${index}`;
    const existing = anonymousNames.get(key);
    if (existing) {
      return existing;
    }

    const anonymousName = `Участник ${index}`;
    index += 1;
    anonymousNames.set(key, anonymousName);
    return anonymousName;
  };
}

function normalizeMessage(message: TelegramMessage, resolveAuthor: (message: TelegramMessage) => string): NormalizedMessage | null {
  const type = readString(message.type);
  if (type && type !== 'message') {
    return null;
  }

  const date = parseTelegramDate(message);
  if (!date) {
    return null;
  }

  const text = extractMessageText(message.text);
  const wordCount = text ? countWords(text) : 0;
  const hour = date.getHours();

  return {
    author: resolveAuthor(message),
    date,
    dayKey: toDayKey(date),
    monthKey: toMonthKey(date),
    weekday: date.getDay(),
    hour,
    text,
    isTextMessage: text.length > 0,
    wordCount,
    characterCount: text.length,
    emojis: text ? extractEmoji(text) : [],
    heartCount: text ? countHeartEmoji(text) : 0,
    hasLaugh: text ? hasLaugh(text) : false,
    hasGreeting: text ? hasGreeting(text) : false,
    isMorning: hour >= 5 && hour < 11,
    isNight: hour >= 0 && hour < 6,
  };
}

function createParticipant(name: string): ParticipantDraft {
  return {
    name,
    messageCount: 0,
    textMessageCount: 0,
    mediaMessageCount: 0,
    wordCount: 0,
    firstMessageCount: 0,
    nightMessageCount: 0,
    morningMessageCount: 0,
    heartCount: 0,
    laughCount: 0,
    greetingCount: 0,
    longestMessageCharacterCount: 0,
    longestMessageWordCount: 0,
  };
}

function increment(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function topEntries(map: Map<string, number>, limit: number): Array<[string, number]> {
  return [...map.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ru')).slice(0, limit);
}

function maxPeriod(points: ChartPoint[]): { key: string; label: string; count: number } | null {
  const winner = [...points].sort((left, right) => right.value - left.value)[0];
  return winner ? { key: winner.key, label: winner.label, count: winner.value } : null;
}

function maxParticipant(participants: ParticipantStats[], key: keyof ParticipantStats): ParticipantStats | null {
  const sorted = [...participants].sort((left, right) => {
    const leftValue = typeof left[key] === 'number' ? left[key] : 0;
    const rightValue = typeof right[key] === 'number' ? right[key] : 0;
    return rightValue - leftValue || left.name.localeCompare(right.name, 'ru');
  });
  return sorted[0] ?? null;
}

function makeAwards(participants: ParticipantStats[], longestMessage: SavedStats['longestMessage']): Award[] {
  const awards: Award[] = [];
  const messageWinner = maxParticipant(participants, 'messageCount');
  const heartWinner = maxParticipant(participants, 'heartCount');
  const nightWinner = maxParticipant(participants, 'nightMessageCount');
  const greetingWinner = maxParticipant(participants, 'greetingCount');
  const firstWinner = maxParticipant(participants, 'firstMessageCount');
  const laughWinner = maxParticipant(participants, 'laughCount');

  if (messageWinner) {
    awards.push({
      title: 'Главный спамер любви',
      winner: messageWinner.name,
      value: messageWinner.messageCount,
      detail: `${messageWinner.messageCount} сообщений`,
    });
  }
  if (heartWinner) {
    awards.push({
      title: 'Мастер сердечек',
      winner: heartWinner.name,
      value: heartWinner.heartCount,
      detail: `${heartWinner.heartCount} сердечек`,
    });
  }
  if (nightWinner) {
    awards.push({
      title: 'Король/королева ночных сообщений',
      winner: nightWinner.name,
      value: nightWinner.nightMessageCount,
      detail: `${nightWinner.nightMessageCount} сообщений с 00:00 до 05:59`,
    });
  }
  if (greetingWinner) {
    awards.push({
      title: 'Хранитель приветов',
      winner: greetingWinner.name,
      value: greetingWinner.greetingCount,
      detail: `${greetingWinner.greetingCount} приветствий`,
    });
  }
  if (firstWinner) {
    awards.push({
      title: 'Инициатор дней',
      winner: firstWinner.name,
      value: firstWinner.firstMessageCount,
      detail: `${firstWinner.firstMessageCount} первых сообщений дня`,
    });
  }
  if (longestMessage) {
    awards.push({
      title: 'Самый длинный монолог',
      winner: longestMessage.author,
      value: longestMessage.wordCount,
      detail: `${longestMessage.wordCount} слов, ${longestMessage.characterCount} символов`,
    });
  }
  if (laughWinner) {
    awards.push({
      title: 'Самый заразительный смех',
      winner: laughWinner.name,
      value: laughWinner.laughCount,
      detail: `${laughWinner.laughCount} сообщений со смехом`,
    });
  }

  return awards;
}

function daysBetweenInclusive(first: Date | null, last: Date | null): number {
  if (!first || !last) {
    return 0;
  }
  const firstDay = new Date(first.getFullYear(), first.getMonth(), first.getDate()).getTime();
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  return Math.max(1, Math.floor((lastDay - firstDay) / 86_400_000) + 1);
}

export function analyzeTelegramExport(raw: unknown): SavedStats {
  if (!isTelegramExport(raw)) {
    throw new Error('Файл не похож на Telegram result.json: не найден массив messages.');
  }

  const resolveAuthor = createAuthorResolver();
  const normalized = raw.messages
    .filter(isRecord)
    .map((message) => normalizeMessage(message, resolveAuthor))
    .filter((message): message is NormalizedMessage => Boolean(message))
    .sort((left, right) => left.date.getTime() - right.date.getTime());

  const participants = new Map<string, ParticipantDraft>();
  const monthMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  const weekdayMap = new Map<string, number>();
  const hourMap = new Map<string, number>();
  const wordMap = new Map<string, number>();
  const emojiMap = new Map<string, number>();
  const firstMessageByDay = new Map<string, NormalizedMessage>();

  let textMessages = 0;
  let mediaMessages = 0;
  let totalWords = 0;
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;
  let longestMessage: SavedStats['longestMessage'] = null;
  let laughMessages = 0;
  let heartCount = 0;
  let morningMessages = 0;
  let nightMessages = 0;
  let greetingMessages = 0;

  for (const message of normalized) {
    const participant = participants.get(message.author) ?? createParticipant(message.author);
    participant.messageCount += 1;
    participant.wordCount += message.wordCount;
    participant.heartCount += message.heartCount;

    if (message.isTextMessage) {
      textMessages += 1;
      participant.textMessageCount += 1;
    } else {
      mediaMessages += 1;
      participant.mediaMessageCount += 1;
    }

    if (message.isNight) {
      nightMessages += 1;
      participant.nightMessageCount += 1;
    }
    if (message.isMorning) {
      morningMessages += 1;
      participant.morningMessageCount += 1;
    }
    if (message.hasLaugh) {
      laughMessages += 1;
      participant.laughCount += 1;
    }
    if (message.hasGreeting) {
      greetingMessages += 1;
      participant.greetingCount += 1;
    }

    if (message.characterCount > participant.longestMessageCharacterCount) {
      participant.longestMessageCharacterCount = message.characterCount;
      participant.longestMessageWordCount = message.wordCount;
    }

    if (!longestMessage || message.characterCount > longestMessage.characterCount) {
      longestMessage = {
        author: message.author,
        characterCount: message.characterCount,
        wordCount: message.wordCount,
      };
    }

    participants.set(message.author, participant);
    totalWords += message.wordCount;
    heartCount += message.heartCount;
    if (!firstDate || message.date.getTime() < firstDate.getTime()) {
      firstDate = message.date;
    }
    if (!lastDate || message.date.getTime() > lastDate.getTime()) {
      lastDate = message.date;
    }

    increment(monthMap, message.monthKey);
    increment(dayMap, message.dayKey);
    increment(weekdayMap, String(message.weekday));
    increment(hourMap, String(message.hour));

    if (!firstMessageByDay.has(message.dayKey)) {
      firstMessageByDay.set(message.dayKey, message);
    }

    for (const emoji of message.emojis) {
      increment(emojiMap, emoji);
    }
    for (const word of extractWordsForTop(message.text)) {
      increment(wordMap, word);
    }
  }

  for (const message of firstMessageByDay.values()) {
    const participant = participants.get(message.author);
    if (participant) {
      participant.firstMessageCount += 1;
    }
  }

  const totalMessages = normalized.length;
  const participantStats = [...participants.values()]
    .map<ParticipantStats>((participant) => ({
      ...participant,
      averageWordsPerTextMessage:
        participant.textMessageCount > 0 ? Number((participant.wordCount / participant.textMessageCount).toFixed(1)) : 0,
      sharePercent: totalMessages > 0 ? Number(((participant.messageCount / totalMessages) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.messageCount - left.messageCount || left.name.localeCompare(right.name, 'ru'));

  const monthPoints = [...monthMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, label: formatMonthKey(key), value }));

  const dayPoints = [...dayMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({ key, label: formatDate(new Date(`${key}T12:00:00`)), value }));

  const weekdayPoints = WEEKDAY_ORDER.map((weekday) => {
    const value = weekdayMap.get(String(weekday)) ?? 0;
    return {
      key: String(weekday),
      label: WEEKDAY_LABELS[weekday],
      value,
      percentage: totalMessages > 0 ? Number(((value / totalMessages) * 100).toFixed(1)) : 0,
    };
  });

  const hourPoints = Array.from({ length: 24 }, (_, hour) => {
    const value = hourMap.get(String(hour)) ?? 0;
    return {
      key: String(hour),
      label: formatHour(hour),
      value,
      percentage: totalMessages > 0 ? Number(((value / totalMessages) * 100).toFixed(1)) : 0,
    };
  });

  const messagesByParticipant = participantStats.map((participant) => ({
    key: participant.name,
    label: participant.name,
    value: participant.messageCount,
    percentage: participant.sharePercent,
  }));

  const wordsByParticipant = participantStats.map((participant) => ({
    key: participant.name,
    label: participant.name,
    value: participant.wordCount,
  }));

  const firstMessagesByParticipant = participantStats.map((participant) => ({
    key: participant.name,
    label: participant.name,
    value: participant.firstMessageCount,
  }));

  const nightMessagesByParticipant = participantStats.map((participant) => ({
    key: participant.name,
    label: participant.name,
    value: participant.nightMessageCount,
  }));

  const daysSpan = daysBetweenInclusive(firstDate, lastDate);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    totalMessages,
    textMessages,
    mediaMessages,
    totalWords,
    firstDate: firstDate?.toISOString() ?? null,
    lastDate: lastDate?.toISOString() ?? null,
    daysSpan,
    averageMessagesPerDay: daysSpan > 0 ? Number((totalMessages / daysSpan).toFixed(1)) : 0,
    mostActiveDay: maxPeriod(dayPoints),
    mostActiveMonth: maxPeriod(monthPoints),
    mostActiveHour: maxPeriod(hourPoints),
    participants: participantStats,
    activityByMonth: monthPoints,
    activityByWeekday: weekdayPoints,
    activityByHour: hourPoints,
    messagesByParticipant,
    wordsByParticipant,
    firstMessagesByParticipant,
    nightMessagesByParticipant,
    topEmoji: topEntries(emojiMap, 10).map(([emoji, count]) => ({ emoji, count })),
    topWords: topEntries(wordMap, 20).map(([word, count]) => ({ word, count })),
    longestMessage,
    niceMetrics: {
      heartCount,
      laughMessages,
      morningMessages,
      nightMessages,
      greetingMessages,
    },
    awards: makeAwards(participantStats, longestMessage),
  };
}

export async function analyzeTelegramFile(file: File): Promise<SavedStats> {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('Нужен именно JSON-файл из Telegram export.');
  }

  const content = await file.text();
  const parsed = JSON.parse(content) as unknown;
  return analyzeTelegramExport(parsed);
}
