import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readPassword, serverError, unauthorized } from '../_lib/http.js';
import { readPasswordConfig } from '../_lib/env.js';
import { safeCompare, setSessionCookie } from '../_lib/session.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const password = readPassword(req);
    const { viewPassword } = readPasswordConfig();

    if (!password || !safeCompare(password, viewPassword)) {
      unauthorized(res);
      return;
    }

    setSessionCookie(res, 'view');
    res.status(200).json({ access: 'view' });
  } catch {
    serverError(res);
  }
}
