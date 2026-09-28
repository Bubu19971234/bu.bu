import { CLIP_CATEGORIES, CLIP_CATEGORY_LABELS_IT, type ClipCategory, DEFAULT_MEDIA_LIMITS, PLAYER_CLIP_MAX_DURATION_MS } from '@ftn/core';
import { newOperationId } from '@ftn/supabase';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Body, Button, Card, Chip, ErrorText, Field, Row, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { type LocalAsset, STAGE_LABELS_IT, type UploadStage, uploadMedia } from '@/lib/media';
import { services } from '@/lib/supabase';

/** Pick (with system trim to 60 s and 720p export on iOS), categorize, upload. */
export default function UploadClip() {
  const [asset, setAsset] = useState<LocalAsset | null>(null);
  const [category, setCategory] = useState<ClipCategory>('dribbling');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const op = useRef(newOperationId());

  const pick = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true, // iOS trim UI
      videoMaxDuration: PLAYER_CLIP_MAX_DURATION_MS / 1000,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.IFrame1280x720,
    });
    const a = result.assets?.[0];
    if (result.canceled || !a) return;
    const durationMs = a.duration ?? null;
    if (durationMs === null) return setError('Impossibile leggere la durata del video.');
    if (durationMs > PLAYER_CLIP_MAX_DURATION_MS) return setError('Il clip supera i 60 secondi: taglialo e riprova.');
    if ((a.fileSize ?? 0) > DEFAULT_MEDIA_LIMITS.playerClipMaxBytes) return setError('Il file è troppo grande.');
    op.current = newOperationId();
    setAsset({ uri: a.uri, mimeType: a.mimeType ?? 'video/mp4', sizeBytes: a.fileSize ?? 0, durationMs: Math.round(durationMs) });
  };

  const busy = stage !== null && stage !== 'done';

  return (
    <Screen>
      <Title>Nuovo clip</Title>
      <Card>
        <Body>{asset ? `Video selezionato · ${Math.round((asset.durationMs ?? 0) / 1000)} s` : 'Nessun video selezionato'}</Body>
        <Button label={asset ? 'Cambia video' : 'Scegli video'} variant="secondary" onPress={pick} disabled={busy} />
      </Card>
      <Body muted>Categoria</Body>
      <Row wrap>
        {CLIP_CATEGORIES.map((c) => (
          <Chip key={c} label={CLIP_CATEGORY_LABELS_IT[c]} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </Row>
      <Field label="Titolo (facoltativo)" maxLength={80} value={title} onChangeText={setTitle} />
      <Field
        label="Come ti riconosciamo nel video?"
        hint="Es. “maglia bianca numero 10, parto da sinistra”. Aiuta l’analisi."
        maxLength={200}
        value={note}
        onChangeText={setNote}
      />
      {stage ? <Body muted>{STAGE_LABELS_IT[stage]}</Body> : null}
      <ErrorText>{error}</ErrorText>
      <Button
        label="Carica"
        busy={busy}
        disabled={!asset}
        onPress={async () => {
          if (!asset) return;
          setError(null);
          try {
            const { target, status } = await uploadMedia('player_clip', asset, op.current, setStage);
            if (status === 'rejected') throw new Error('duration_exceeded');
            const clipId = await services.clipService.createClip({
              mediaId: target.mediaId,
              category,
              title: title.trim() || null,
              identificationNote: note.trim() || null,
            });
            router.replace({ pathname: '/clips/[id]', params: { id: clipId } });
          } catch (e) {
            setStage(null);
            setError(errorMessage(e));
          }
        }}
      />
      <Body muted small>Se la connessione cade, riprova: non verranno creati duplicati.</Body>
    </Screen>
  );
}
