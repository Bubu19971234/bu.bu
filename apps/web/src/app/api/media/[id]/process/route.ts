import { uuidSchema } from '@ftn/validation';
import { unwrapMaybe } from '@ftn/supabase';
import { createSupabaseMediaStorage, processUploadedMedia } from '@ftn/supabase/server';
import { NextResponse } from 'next/server';
import { jsonError, unauthorized } from '@/lib/http';
import { getRequestContext, getServiceClient } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

/**
 * Server-side verification of an uploaded asset (size, sniffed MIME, video
 * duration via range reads). Safe to call repeatedly.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext(request);
    if (!ctx.userId) return unauthorized();
    const mediaId = uuidSchema.parse((await params).id);
    // Ownership check through RLS as the caller.
    const own = unwrapMaybe(await ctx.db.from('media_assets').select('id').eq('id', mediaId).eq('owner_user_id', ctx.userId).maybeSingle());
    if (!own) return NextResponse.json({ error: 'media_not_found' }, { status: 404 });
    const service = getServiceClient();
    const status = await processUploadedMedia(service, createSupabaseMediaStorage(service), mediaId);
    return NextResponse.json({ status });
  } catch (error) {
    return jsonError(error);
  }
}
