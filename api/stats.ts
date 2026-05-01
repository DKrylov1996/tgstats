import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SavedStats } from '../src/types/stats.js';
import { json, methodNotAllowed, readObjectBody, serverError, unauthorized } from './_lib/http.js';
import { getSupabase } from './_lib/supabase.js';
import { assertSavedStats } from './_lib/statsValidation.js';
import { hasStatsReadAccess, readSessionAccess } from './_lib/session.js';

const SINGLETON_ID = 'main';
const TABLE_NAME = 'telegram_stats';

interface StatsRow {
  data: SavedStats;
  updated_at: string;
}

async function getStats(res: VercelResponse): Promise<void> {
  const { data, error } = await getSupabase()
    .from(TABLE_NAME)
    .select('data, updated_at')
    .eq('id', SINGLETON_ID)
    .maybeSingle();

  if (error) {
    serverError(res);
    return;
  }

  const row = data as StatsRow | null;

  if (!row) {
    res.status(200).json({ stats: null });
    return;
  }

  res.status(200).json({
    stats: {
      ...row.data,
      updatedAt: row.updated_at,
    },
  });
}

async function postStats(req: VercelRequest, res: VercelResponse): Promise<void> {
  const body = readObjectBody(req);
  const stats = body?.stats;
  try {
    assertSavedStats(stats);
  } catch {
    json(res, 400, { error: 'invalid_stats' });
    return;
  }

  const updatedAt = new Date().toISOString();
  const dataToSave: SavedStats = {
    ...stats,
    updatedAt,
  };

  const { data, error } = await getSupabase()
    .from(TABLE_NAME)
    .upsert(
      {
        id: SINGLETON_ID,
        data: dataToSave,
        updated_at: updatedAt,
      },
      { onConflict: 'id' },
    )
    .select('data, updated_at')
    .single();

  if (error || !data) {
    serverError(res);
    return;
  }

  const row = data as StatsRow;

  res.status(200).json({
    stats: {
      ...row.data,
      updatedAt: row.updated_at,
    },
  });
}

async function deleteStats(res: VercelResponse): Promise<void> {
  const { error } = await getSupabase().from(TABLE_NAME).delete().eq('id', SINGLETON_ID);

  if (error) {
    serverError(res);
    return;
  }

  res.status(200).json({ ok: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const access = readSessionAccess(req);

    if (req.method === 'GET') {
      if (!hasStatsReadAccess(access)) {
        unauthorized(res);
        return;
      }
      await getStats(res);
      return;
    }

    if (req.method === 'POST') {
      if (access !== 'editor') {
        unauthorized(res);
        return;
      }
      await postStats(req, res);
      return;
    }

    if (req.method === 'DELETE') {
      if (access !== 'editor') {
        unauthorized(res);
        return;
      }
      await deleteStats(res);
      return;
    }

    methodNotAllowed(res);
  } catch {
    serverError(res);
  }
}
