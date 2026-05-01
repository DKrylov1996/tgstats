import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isProduction, requiredEnv } from './env';

export type SessionAccess = 'view' | 'editor';

const COOKIE_NAME = 'telegram_stats_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionPayload {
  access: SessionAccess;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string): string {
  return createHmac('sha256', requiredEnv('SESSION_SECRET')).update(value).digest('base64url');
}

function parseCookieHeader(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) {
    return cookies;
  }

  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || rawValue.length === 0) {
      continue;
    }
    cookies.set(rawKey, decodeURIComponent(rawValue.join('=')));
  }

  return cookies;
}

function serializeCookie(value: string, maxAge: number): string {
  const secure = isProduction() ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function setSessionCookie(res: VercelResponse, access: SessionAccess): void {
  const payload: SessionPayload = {
    access,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const cookieValue = `${encodedPayload}.${sign(encodedPayload)}`;
  res.setHeader('Set-Cookie', serializeCookie(cookieValue, SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', serializeCookie('', 0));
}

export function readSessionAccess(req: VercelRequest): SessionAccess | 'none' {
  const cookie = parseCookieHeader(req.headers.cookie).get(COOKIE_NAME);
  if (!cookie) {
    return 'none';
  }

  const [encodedPayload, signature] = cookie.split('.');
  if (!encodedPayload || !signature || !safeCompare(sign(encodedPayload), signature)) {
    return 'none';
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    if ((payload.access !== 'view' && payload.access !== 'editor') || typeof payload.exp !== 'number') {
      return 'none';
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return 'none';
    }
    return payload.access;
  } catch {
    return 'none';
  }
}

export function hasStatsReadAccess(access: SessionAccess | 'none'): boolean {
  return access === 'view' || access === 'editor';
}
