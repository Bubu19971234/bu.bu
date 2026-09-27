import 'server-only';
import type { DbClient } from '@ftn/supabase';
import { createServiceClient, createUserClient } from '@ftn/supabase/server';
import { publicEnv } from './env';
import { serverEnv } from './server-env';
import { getServerClient } from './supabase/server';

export interface RequestContext {
  userId: string | null;
  /** Client acting as the caller — RLS applies. */
  db: DbClient;
}

/**
 * Resolves the caller from `Authorization: Bearer` (mobile) or the cookie
 * session (web). The JWT is validated by Supabase Auth, not decoded locally.
 */
export async function getRequestContext(request: Request): Promise<RequestContext> {
  const header = request.headers.get('authorization');
  const token = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
  if (token) {
    const db = createUserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, token);
    const { data } = await db.auth.getUser(token);
    return { userId: data.user?.id ?? null, db };
  }
  const db = await getServerClient();
  const { data } = await db.auth.getUser();
  return { userId: data.user?.id ?? null, db };
}

let service: DbClient | null = null;
/** Privileged client. Server-only; never pass it to client components. */
export function getServiceClient(): DbClient {
  if (!service) {
    const env = serverEnv();
    service = createServiceClient(env.supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return service;
}
