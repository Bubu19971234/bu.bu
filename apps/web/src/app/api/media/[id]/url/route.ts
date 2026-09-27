import { unwrap } from '@ftn/supabase';
import { createSupabaseMediaStorage } from '@ftn/supabase/server';
import { uuidSchema } from '@ftn/validation';
import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/http';
import { getRequestContext, getServiceClient } from '@/lib/request-context';
import { serverEnv } from '@/lib/server-env';

export const dynamic = 'force-dynamic';

/**
 * Mints a short-lived signed URL. Access is decided by the database
 * (media_playback_target) as the caller — anonymous callers only get
 * published media of publicly visible, guardian-approved players.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext(request);
    const mediaId = uuidSchema.parse((await params).id);
    const [target] = unwrap(await ctx.db.rpc('media_playback_target', { p_media_id: mediaId }));
    if (!target) return NextResponse.json({ error: 'media_not_found' }, { status: 404 });
    const ttl = serverEnv().MEDIA_SIGNED_URL_TTL_SECONDS;
    const url = await createSupabaseMediaStorage(getServiceClient()).signedUrl(target.bucket, target.storage_path, ttl);
    return NextResponse.json({ url, expiresIn: ttl }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return jsonError(error);
  }
}
