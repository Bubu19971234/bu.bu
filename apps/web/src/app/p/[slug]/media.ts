import 'server-only';
import { createSupabaseMediaStorage } from '@ftn/supabase/server';
import { getServiceClient } from '@/lib/request-context';
import { getAnonClient } from '@/lib/supabase/server';

/** Signed URL for media the *anonymous* public may see (checked in the DB). */
export async function signedPublicMediaUrl(mediaId: string): Promise<string | null> {
  const { data } = await getAnonClient().rpc('media_playback_target', { p_media_id: mediaId });
  const target = data?.[0];
  if (!target) return null;
  try {
    return await createSupabaseMediaStorage(getServiceClient()).signedUrl(target.bucket, target.storage_path, 3600);
  } catch {
    return null;
  }
}
