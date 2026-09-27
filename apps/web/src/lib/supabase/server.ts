import 'server-only';
import type { Database, DbClient } from '@ftn/supabase';
import { createPublicClient } from '@ftn/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '../env';

/** Acts as the signed-in user (cookie session). RLS applies. */
export async function getServerClient(): Promise<DbClient> {
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there.
        }
      },
    },
  }) as unknown as DbClient;
}

/** Anonymous client for cacheable public reads (no cookies → no per-user data). */
export function getAnonClient(): DbClient {
  return createPublicClient(
    { url: publicEnv.supabaseUrl, publishableKey: publicEnv.supabasePublishableKey },
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
