export type AccessLevel = 'none' | 'view' | 'editor';

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
  percentage?: number;
}

export interface RankedEmoji {
  emoji: string;
  count: number;
}

export interface RankedWord {
  word: string;
  count: number;
}

export interface ParticipantStats {
  name: string;
  messageCount: number;
  textMessageCount: number;
  mediaMessageCount: number;
  wordCount: number;
  averageWordsPerTextMessage: number;
  sharePercent: number;
  firstMessageCount: number;
  nightMessageCount: number;
  morningMessageCount: number;
  heartCount: number;
  laughCount: number;
  greetingCount: number;
  longestMessageCharacterCount: number;
  longestMessageWordCount: number;
}

export interface Award {
  title: string;
  winner: string;
  value: number;
  detail: string;
}

export interface ActivePeriod {
  key: string;
  label: string;
  count: number;
}

export interface LongestMessageStat {
  author: string;
  characterCount: number;
  wordCount: number;
}

export interface NiceMetrics {
  heartCount: number;
  laughMessages: number;
  morningMessages: number;
  nightMessages: number;
  greetingMessages: number;
}

export interface SavedStats {
  schemaVersion: 1;
  generatedAt: string;
  updatedAt?: string;
  totalMessages: number;
  textMessages: number;
  mediaMessages: number;
  totalWords: number;
  firstDate: string | null;
  lastDate: string | null;
  daysSpan: number;
  averageMessagesPerDay: number;
  mostActiveDay: ActivePeriod | null;
  mostActiveMonth: ActivePeriod | null;
  mostActiveHour: ActivePeriod | null;
  participants: ParticipantStats[];
  activityByMonth: ChartPoint[];
  activityByWeekday: ChartPoint[];
  activityByHour: ChartPoint[];
  messagesByParticipant: ChartPoint[];
  wordsByParticipant: ChartPoint[];
  firstMessagesByParticipant: ChartPoint[];
  nightMessagesByParticipant: ChartPoint[];
  topEmoji: RankedEmoji[];
  topWords: RankedWord[];
  longestMessage: LongestMessageStat | null;
  niceMetrics: NiceMetrics;
  awards: Award[];
}
