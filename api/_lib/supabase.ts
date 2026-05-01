import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requiredEnv } from './env';

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
