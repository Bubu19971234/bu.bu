'use server';
import { unwrap } from '@ftn/supabase';
import { createSupabaseMediaStorage } from '@ftn/supabase/server';
import { uuidSchema } from '@ftn/validation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceClient } from '@/lib/request-context';
import { getServerClient } from '@/lib/supabase/server';

const text = (v: FormDataEntryValue | null) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 1000) : null);

/** Authorization is enforced inside moderation_* functions (require_staff). */
export async function decideMedia(form: FormData) {
  const mediaId = uuidSchema.parse(form.get('mediaId'));
  const decision = z.enum(['published', 'rejected']).parse(form.get('decision'));
  const db = await getServerClient();
  unwrap(await db.rpc('moderation_decide_media', { p_media_id: mediaId, p_decision: decision, p_reason: text(form.get('reason')) }));
  revalidatePath('/admin');
}

export async function resolveReport(form: FormData) {
  const reportId = uuidSchema.parse(form.get('reportId'));
  const status = z.enum(['actioned', 'dismissed']).parse(form.get('status'));
  const db = await getServerClient();
  unwrap(await db.rpc('moderation_resolve_report', { p_report_id: reportId, p_status: status, p_reason: null }));
  revalidatePath('/admin');
}

/**
 * Executes a deletion request (docs/SECURITY.md §Account deletion):
 * DB anonymization → storage object removal → auth user removal.
 * Only admins may run it; the service role is used after that check.
 */
export async function processDeletion(form: FormData) {
  const requestId = uuidSchema.parse(form.get('requestId'));
  const db = await getServerClient();
  const isAdmin = unwrap(await db.rpc('is_platform_admin'));
  if (!isAdmin) throw new Error('forbidden');

  const service = getServiceClient();
  const { data: req } = await service.from('account_deletion_requests').select('user_id').eq('id', requestId).single();
  const objects = unwrap(await service.rpc('account_process_deletion', { p_request_id: requestId }));
  const storage = createSupabaseMediaStorage(service);
  const byBucket = new Map<string, string[]>();
  for (const o of objects) byBucket.set(o.bucket, [...(byBucket.get(o.bucket) ?? []), o.storage_path]);
  for (const [bucket, paths] of byBucket) await storage.remove(bucket, paths);
  if (req?.user_id) await service.auth.admin.deleteUser(req.user_id);
  revalidatePath('/admin');
}
