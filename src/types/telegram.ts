export type TelegramTextPart =
  | string
  | {
      text?: unknown;
      type?: unknown;
      [key: string]: unknown;
    };

export type TelegramText = string | TelegramTextPart[];

export interface TelegramMessage {
  id?: unknown;
  type?: unknown;
  date?: unknown;
  date_unixtime?: unknown;
  from?: unknown;
  from_id?: unknown;
  actor?: unknown;
  actor_id?: unknown;
  sender?: unknown;
  sender_id?: unknown;
  text?: unknown;
  [key: string]: unknown;
}

export interface TelegramExport {
  messages: TelegramMessage[];
  [key: string]: unknown;
}

export interface NormalizedMessage {
  author: string;
  date: Date;
  dayKey: string;
  monthKey: string;
  weekday: number;
  hour: number;
  text: string;
  isTextMessage: boolean;
  wordCount: number;
  characterCount: number;
  emojis: string[];
  heartCount: number;
  hasLaugh: boolean;
  hasGreeting: boolean;
  isMorning: boolean;
  isNight: boolean;
}
