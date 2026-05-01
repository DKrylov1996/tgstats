const BASE_STOP_WORDS = [
  'и',
  'а',
  'но',
  'да',
  'не',
  'нет',
  'что',
  'это',
  'как',
  'так',
  'вот',
  'там',
  'тут',
  'тебя',
  'тебе',
  'меня',
  'мне',
  'мой',
  'моя',
  'твой',
  'твоя',
  'мы',
  'вы',
  'он',
  'она',
  'они',
  'я',
  'ты',
  'же',
  'ли',
  'бы',
  'на',
  'в',
  'во',
  'с',
  'со',
  'к',
  'ко',
  'от',
  'до',
  'из',
  'за',
  'у',
  'по',
  'для',
  'про',
  'или',
  'если',
  'когда',
  'уже',
  'ещё',
  'еще',
  'просто',
  'очень',
];

const EXTRA_STOP_WORDS: string[] = [];

export const STOP_WORDS = new Set([...BASE_STOP_WORDS, ...EXTRA_STOP_WORDS]);

const URL_REGEX = /https?:\/\/\S+|www\.\S+/giu;
const EMAIL_REGEX = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/gu;
const USERNAME_REGEX = /(^|\s)@[a-zA-Z0-9_]{3,32}\b/gu;
const WORD_REGEX = /[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)?/gu;

export function removePrivateTokens(text: string): string {
  return text
    .replace(URL_REGEX, ' ')
    .replace(EMAIL_REGEX, ' ')
    .replace(PHONE_REGEX, ' ')
    .replace(USERNAME_REGEX, ' ');
}

export function countWords(text: string): number {
  return removePrivateTokens(text).match(WORD_REGEX)?.length ?? 0;
}

export function extractWordsForTop(text: string): string[] {
  const cleaned = removePrivateTokens(text).toLowerCase().replace(/ё/g, 'е');
  const words = cleaned.match(WORD_REGEX) ?? [];

  return words
    .map((word) => word.replace(/^[-']+|[-']+$/g, ''))
    .filter((word) => word.length >= 3)
    .filter((word) => !STOP_WORDS.has(word))
    .filter((word) => !/^\d+$/.test(word));
}

export function hasLaugh(text: string): boolean {
  const lower = text.toLowerCase();
  return /(?:а?ха){2,}|(?:хе){2,}|лол|ору|😂|🤣|😹/.test(lower);
}

export function hasGreeting(text: string): boolean {
  const lower = removePrivateTokens(text).toLowerCase().replace(/ё/g, 'е');
  return /(?:^|[^\p{L}])(?:прив(?:ет|еты|етик)?|здравствуй(?:те)?|доброе\s+утро|добрый\s+(?:день|вечер)|хай|hello|hi|hey|ку|салют)(?=$|[^\p{L}])/u.test(
    lower,
  );
}
