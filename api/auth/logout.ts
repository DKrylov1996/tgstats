import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed } from '../_lib/http';
import { clearSessionCookie } from '../_lib/session';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
