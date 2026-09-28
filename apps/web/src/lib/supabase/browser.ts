'use client';
import { assertNotServiceKey, type DbClient, type Database } from '@ftn/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '../env';

let client: DbClient | null = null;

export function getBrowserClient(): DbClient {
  if (!client) {
    assertNotServiceKey(publicEnv.supabasePublishableKey);
    client = createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey) as unknown as DbClient;
  }
  return client;
}
