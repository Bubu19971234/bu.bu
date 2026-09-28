import './guard';
import { createClient } from '@supabase/supabase-js';
import type { DbClient } from '../client';
import type { Database } from '../database.types';

/** Privileged client (bypasses RLS). Server-only; use for tightly scoped operations. */
export function createServiceClient(url: string, serviceRoleKey: string): DbClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Client that acts as the calling user (RLS applies), from their access token. */
export function createUserClient(url: string, publishableKey: string, accessToken: string | null): DbClient {
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
