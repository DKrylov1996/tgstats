import type { SavedStats } from '../types/stats';

export interface StatsResponse {
  stats: SavedStats | null;
}

async function parseStatsResponse(response: Response): Promise<StatsResponse> {
  if (response.status === 404) {
    return { stats: null };
  }

  if (!response.ok) {
    throw new Error('stats_request_failed');
  }

  return (await response.json()) as StatsResponse;
}

export async function getSavedStats(): Promise<SavedStats | null> {
  const response = await fetch('/api/stats', {
    method: 'GET',
    credentials: 'include',
  });
  return (await parseStatsResponse(response)).stats;
}

export async function saveStats(stats: SavedStats): Promise<SavedStats> {
  const response = await fetch('/api/stats', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ stats }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('stats_invalid');
    }
    throw new Error('stats_save_failed');
  }

  const payload = (await response.json()) as StatsResponse;
  if (!payload.stats) {
    throw new Error('stats_save_failed');
  }
  return payload.stats;
}

export async function deleteStats(): Promise<void> {
  const response = await fetch('/api/stats', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('stats_delete_failed');
  }
}
