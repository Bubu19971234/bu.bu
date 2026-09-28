import 'server-only';
import { type AppErrorCode, toAppError } from '@ftn/supabase';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const STATUS: Partial<Record<AppErrorCode, number>> = {
  not_authenticated: 401,
  forbidden: 403,
  media_not_found: 404,
  clip_not_found: 404,
  player_not_found: 404,
  rate_limited: 429,
  request_in_progress: 409,
  version_conflict: 409,
  idempotency_mismatch: 422,
  validation_failed: 400,
};

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'validation_failed', issues: error.issues.map((i) => i.path.join('.')) }, { status: 400 });
  }
  const appError = toAppError(error);
  const status = STATUS[appError.code] ?? (appError.code === 'unknown' ? 500 : 400);
  if (status >= 500) console.error('[api]', error);
  // Unknown errors are not echoed to clients.
  return NextResponse.json({ error: appError.code }, { status });
}

export const unauthorized = () => NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

export function idempotencyKey(request: Request): string | null {
  const key = request.headers.get('idempotency-key');
  return key && /^[A-Za-z0-9_-]{8,128}$/.test(key) ? key : null;
}
