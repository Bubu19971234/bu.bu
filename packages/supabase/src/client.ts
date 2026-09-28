import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type DbClient = SupabaseClient<Database>;

export interface PublicSupabaseConfig {
  /** Project URL, e.g. https://<ref>.supabase.co */
  url: string;
  /** Publishable (anon) key. Never pass the service-role key here. */
  publishableKey: string;
}

/**
 * Client for browsers/mobile. Uses only the publishable key; every request is
 * subject to RLS.
 */
export function createPublicClient(config: PublicSupabaseConfig, options?: SupabaseClientOptions<'public'>): DbClient {
  assertNotServiceKey(config.publishableKey);
  return createClient<Database>(config.url, config.publishableKey, options);
}

/** Defense in depth: refuse keys that look like a service-role credential. */
export function assertNotServiceKey(key: string): void {
  if (key.startsWith('sb_secret_')) throw new Error('Secret key passed to a public Supabase client');
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
      if (payload.role === 'service_role') throw new Error('Service-role key passed to a public Supabase client');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Service-role')) throw error;
    }
  }
}
