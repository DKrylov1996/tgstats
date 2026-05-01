import type { VercelRequest, VercelResponse } from '@vercel/node';

export function json(res: VercelResponse, status: number, payload: unknown): void {
  res.status(status).json(payload);
}

export function methodNotAllowed(res: VercelResponse): void {
  json(res, 405, { error: 'method_not_allowed' });
}

export function serverError(res: VercelResponse): void {
  json(res, 500, { error: 'server_error' });
}

export function unauthorized(res: VercelResponse): void {
  json(res, 401, { error: 'unauthorized' });
}

export function readObjectBody(req: VercelRequest): Record<string, unknown> | null {
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body) as unknown;
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)
    : null;
}

export function readPassword(req: VercelRequest): string | null {
  const body = readObjectBody(req);
  const password = body?.password;
  return typeof password === 'string' ? password : null;
}
