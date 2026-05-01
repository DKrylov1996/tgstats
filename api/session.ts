import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, serverError } from './_lib/http.js';
import { readSessionAccess } from './_lib/session.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res);
    return;
  }

  try {
    res.status(200).json({ access: readSessionAccess(req) });
  } catch {
    serverError(res);
  }
}
