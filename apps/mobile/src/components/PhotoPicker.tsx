import { DEFAULT_MEDIA_LIMITS } from '@ftn/core';
import { newOperationId } from '@ftn/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Body, Button, ErrorText } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { STAGE_LABELS_IT, type UploadStage, uploadMedia } from '@/lib/media';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';

/** Picks, uploads and assigns a profile photo (moderated before public display). */
export function PhotoPicker({ profileId, version, onDone }: { profileId: string; version: number; onDone?: () => void }) {
  const { refresh } = useSession();
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Same operation id across retries of the same pick → no duplicate uploads.
  const op = useRef<string>(newOperationId());

  return (
    <>
      {stage ? <Body muted>{STAGE_LABELS_IT[stage]}</Body> : null}
      <ErrorText>{error}</ErrorText>
      <Button
        label="Scegli una foto"
        busy={stage !== null && stage !== 'done'}
        onPress={async () => {
          setError(null);
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          const asset = result.assets?.[0];
          if (result.canceled || !asset) return;
          const mimeType = asset.mimeType ?? 'image/jpeg';
          const sizeBytes = asset.fileSize ?? 0;
          if (sizeBytes > DEFAULT_MEDIA_LIMITS.avatarMaxBytes) return setError('La foto è troppo grande (max 5 MB).');
          try {
            const { target, status } = await uploadMedia('avatar', { uri: asset.uri, mimeType, sizeBytes, durationMs: null }, op.current, setStage);
            if (status === 'rejected' || status === 'failed') throw new Error('mime_not_allowed');
            await services.playerService.setAvatar(profileId, version, target.mediaId);
            op.current = newOperationId();
            await refresh();
            onDone?.();
          } catch (e) {
            setStage(null);
            setError(errorMessage(e));
          }
        }}
      />
    </>
  );
}
