import type { AccessLevel } from '../types/stats';

export interface SessionResponse {
  access: AccessLevel;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function getSession(): Promise<SessionResponse> {
  const response = await fetch('/api/session', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return { access: 'none' };
  }

  return readJson<SessionResponse>(response);
}

export async function loginView(password: string): Promise<SessionResponse> {
  const response = await fetch('/api/auth/view', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('invalid_password');
  }

  return readJson<SessionResponse>(response);
}

export async function loginEditor(password: string): Promise<SessionResponse> {
  const response = await fetch('/api/auth/editor', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('invalid_password');
  }

  return readJson<SessionResponse>(response);
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}
