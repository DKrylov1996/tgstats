import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readPassword, serverError, unauthorized } from '../_lib/http';
import { readPasswordConfig } from '../_lib/env';
import { safeCompare, setSessionCookie } from '../_lib/session';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const password = readPassword(req);
    const { editorPassword } = readPasswordConfig();

    if (!password || !safeCompare(password, editorPassword)) {
      unauthorized(res);
      return;
    }

    setSessionCookie(res, 'editor');
    res.status(200).json({ access: 'editor' });
  } catch {
    serverError(res);
  }
}
