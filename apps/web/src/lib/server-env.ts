import 'server-only';
import { z } from 'zod';
import { publicEnv } from './env';

const schema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  APP_BASE_URL: z.url(),
  AI_PROVIDER: z.enum(['mock']).default('mock'),
  MAILER: z.enum(['dev-log']).default('dev-log'),
  MEDIA_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
});

let cached: (z.infer<typeof schema> & typeof publicEnv) | null = null;

/** Server-only secrets. Throws at request time if misconfigured. */
export function serverEnv() {
  if (!cached) {
    const parsed = schema.parse(process.env);
    if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) throw new Error('Supabase public env missing');
    cached = { ...parsed, ...publicEnv };
  }
  return cached;
}
