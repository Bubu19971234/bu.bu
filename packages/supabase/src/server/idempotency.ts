import './guard';
import type { DbClient } from '../client';
import type { Json } from '../database.types';
import { AppError, unwrap } from '../errors';

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Executes `fn` at most once per (actor, action, Idempotency-Key). A replay
 * returns the stored response; a concurrent duplicate gets `request_in_progress`;
 * reusing a key with a different payload gets `idempotency_mismatch`.
 */
export async function withIdempotency<T extends Json>(
  service: DbClient,
  params: { actorUserId: string; action: string; key: string | null; requestBody: unknown },
  fn: () => Promise<T>,
): Promise<T> {
  if (!params.key) return fn();
  const hash = await sha256Hex(JSON.stringify(params.requestBody ?? null));
  const [claim] = unwrap(
    await service.rpc('idempotency_begin', {
      p_actor: params.actorUserId,
      p_action: params.action,
      p_key: params.key,
      p_request_hash: hash,
    }),
  );
  if (!claim) throw new AppError('unknown');
  if (claim.outcome === 'replay') return claim.response as T;
  if (claim.outcome === 'mismatch') throw new AppError('idempotency_mismatch');
  if (claim.outcome === 'in_progress') throw new AppError('request_in_progress');
  try {
    const result = await fn();
    await service.rpc('idempotency_finish', { p_id: claim.id, p_status: 'completed', p_response: result });
    return result;
  } catch (error) {
    await service.rpc('idempotency_finish', { p_id: claim.id, p_status: 'failed', p_response: null });
    throw error;
  }
}
