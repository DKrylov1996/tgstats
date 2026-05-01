const EMOJI_REGEX =
  /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|\p{Emoji_Presentation}/gu;

const HEART_REGEX = /[❤♥💌💍💋💘💝💖💗💓💞💕❣💟💜💙💚💛🧡❤️🤍🤎🖤]/gu;

export function extractEmoji(text: string): string[] {
  return text.match(EMOJI_REGEX) ?? [];
}

export function countHeartEmoji(text: string): number {
  return text.match(HEART_REGEX)?.length ?? 0;
}
