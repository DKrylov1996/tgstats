import type { SavedStats } from '../../src/types/stats.js';

const FORBIDDEN_KEYS = new Set([
  'messages',
  'rawMessages',
  'result',
  'resultJson',
  'telegramJson',
  'fullText',
  'messageText',
  'text',
  'entities',
  'textEntities',
  'media',
  'links',
  'emails',
  'phones',
  'usernames',
  'from_id',
  'fromId',
  'actor_id',
  'actorId',
  'sender_id',
  'senderId',
  'user_id',
  'userId',
  'telegramId',
  'telegramUserId',
  'phone',
  'email',
  'username',
  'url',
  'urls',
  'link',
  'raw',
]);

const URL_REGEX = /https?:\/\/\S+|www\.\S+/iu;
const EMAIL_REGEX = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/iu;
const PHONE_CHARS_REGEX = /^\+?[\d\s().-]+$/u;
const USERNAME_REGEX = /(^|\s)@[a-zA-Z0-9_]{3,32}\b/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateLikeString(value: string): boolean {
  return (
    /^\d{4}-\d{2}(?:-\d{2})?(?:T[\d:.+-]+Z?)?$/u.test(value) ||
    /^\d{1,2}:\d{2}$/u.test(value) ||
    /^\d{2}\.\d{2}\.\d{4}$/u.test(value)
  );
}

function isPhoneLikeString(value: string): boolean {
  const trimmed = value.trim();
  const digitCount = trimmed.replace(/\D/gu, '').length;

  return digitCount >= 7 && PHONE_CHARS_REGEX.test(trimmed) && !isDateLikeString(trimmed);
}

function containsPrivateToken(value: string): boolean {
  return URL_REGEX.test(value) || EMAIL_REGEX.test(value) || USERNAME_REGEX.test(value) || isPhoneLikeString(value);
}

function scanForPrivatePayload(value: unknown, depth = 0): void {
  if (depth > 8) {
    throw new Error('stats_too_deep');
  }

  if (typeof value === 'string') {
    if (value.length > 240) {
      throw new Error('stats_string_too_long');
    }
    if (containsPrivateToken(value)) {
      throw new Error('stats_contains_private_token');
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > 500) {
      throw new Error('stats_array_too_large');
    }
    for (const item of value) {
      scanForPrivatePayload(item, depth + 1);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new Error('stats_contains_forbidden_key');
      }
      scanForPrivatePayload(item, depth + 1);
    }
  }
}

function validateTopWords(value: Record<string, unknown>): void {
  if (!Array.isArray(value.topWords)) {
    return;
  }

  for (const item of value.topWords) {
    if (!isRecord(item) || typeof item.word !== 'string' || typeof item.count !== 'number') {
      throw new Error('invalid_top_words');
    }
    if (item.word.length > 64 || /\s/u.test(item.word)) {
      throw new Error('top_words_must_be_single_terms');
    }
  }
}

function hasNumber(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === 'number' && Number.isFinite(record[key]);
}

export function assertSavedStats(value: unknown): asserts value is SavedStats {
  if (!isRecord(value)) {
    throw new Error('stats_must_be_object');
  }

  if (value.schemaVersion !== 1) {
    throw new Error('unsupported_stats_schema');
  }

  const requiredNumbers = ['totalMessages', 'textMessages', 'mediaMessages', 'totalWords', 'daysSpan', 'averageMessagesPerDay'];
  for (const key of requiredNumbers) {
    if (!hasNumber(value, key)) {
      throw new Error('invalid_stats_shape');
    }
  }

  const requiredArrays = [
    'participants',
    'activityByMonth',
    'activityByWeekday',
    'activityByHour',
    'messagesByParticipant',
    'wordsByParticipant',
    'firstMessagesByParticipant',
    'nightMessagesByParticipant',
    'topEmoji',
    'topWords',
    'awards',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(value[key])) {
      throw new Error('invalid_stats_shape');
    }
  }

  const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
  if (size > 512_000) {
    throw new Error('stats_payload_too_large');
  }

  scanForPrivatePayload(value);
  validateTopWords(value);
}
