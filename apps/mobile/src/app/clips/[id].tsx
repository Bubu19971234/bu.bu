import { CARD_ATTRIBUTE_LABELS_IT, type CardAttribute, CLIP_CATEGORY_LABELS_IT, type ClipCategory, confidenceLevel } from '@ftn/core';
import type { AiAnalysisRunRow, AiObservationRow, MyClip } from '@ftn/supabase';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { Badge, Body, Button, Card, ErrorText, Row, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { MEDIA_STATUS_IT } from '@/lib/labels';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';

type Run = AiAnalysisRunRow & { observations: AiObservationRow[] };
const LEVEL_IT = { low: 'bassa', medium: 'media', high: 'alta' } as const;

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} nativeControls />;
}

/** Clip detail + AI analysis result (conservative, with provenance). */
export default function ClipDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const [clip, setClip] = useState<MyClip | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const clips = await services.clipService.listPlayerClips(profile.id, undefined, 50);
    const c = clips.find((x) => x.id === id) ?? null;
    setClip(c);
    const analysis = await services.aiService.getLatestPlayerAnalysis(profile.id);
    setRun(analysis.runs.find((r) => r.clip_id === id) ?? null);
    if (c) services.mediaService.getPlayableUrl(c.media_id).then((r) => setUrl(r.url)).catch(() => undefined);
  }, [id, profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!clip) return <Screen><Body muted>Caricamento…</Body></Screen>;
  const status = clip.media?.status ?? 'uploading';
  const st = MEDIA_STATUS_IT[status] ?? { label: status, tone: 'muted' as const };
  const analyzable = status === 'pending_moderation' || status === 'published';

  return (
    <Screen>
      <Title>{clip.title ?? CLIP_CATEGORY_LABELS_IT[clip.category as ClipCategory]}</Title>
      {url ? <Player url={url} /> : null}
      <Row wrap>
        <Badge label={st.label} tone={st.tone} />
        <Badge label={clip.visibility === 'public' ? 'Visibile sul profilo' : 'Solo per te'} />
      </Row>
      {status === 'rejected' ? <ErrorText>Il clip non è stato accettato ({clip.media?.rejection_reason ?? 'moderazione'}).</ErrorText> : null}

      <Card>
        <Body>Analisi AI (demo)</Body>
        {run?.status === 'succeeded' ? (
          <>
            <Body muted small>{run.summary}</Body>
            {run.observations.map((o) => (
              <Row key={o.id}>
                <Body>{CARD_ATTRIBUTE_LABELS_IT[o.attribute as CardAttribute] ?? o.attribute}</Body>
                <Body>{o.score ?? 'n/d'}</Body>
                <Badge label={`confidenza ${LEVEL_IT[confidenceLevel(Number(o.confidence))]}`} tone="gold" />
              </Row>
            ))}
            {run.missing_evidence.length ? (
              <Body muted small>
                Servono altri clip per: {run.missing_evidence.map((a) => CARD_ATTRIBUTE_LABELS_IT[a as CardAttribute] ?? a).join(', ')}.
              </Body>
            ) : null}
            <Body muted small>
              Limiti: highlight scelti da te, nessun contesto di partita intera. Modello {run.provider}/{run.model} v{run.model_version}, prompt{' '}
              {run.prompt_version}.
            </Body>
          </>
        ) : (
          <Body muted small>
            {analyzable ? 'Genera osservazioni conservative sulla base di questo clip.' : 'Disponibile dopo la verifica del file.'}
          </Body>
        )}
        {run?.status !== 'succeeded' ? (
          <Button
            label="Analizza clip"
            busy={busy}
            disabled={!analyzable}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                await services.aiService.requestClipAnalysis(clip.id);
                await load();
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
        <ErrorText>{error}</ErrorText>
      </Card>

      <View style={{ gap: 12 }}>
        <Button
          label={clip.visibility === 'public' ? 'Nascondi dal profilo' : 'Mostra sul profilo pubblico'}
          variant="secondary"
          onPress={async () => {
            try {
              await services.clipService.publishClip(clip.id, clip.version, clip.visibility !== 'public');
              await load();
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        />
        <Body muted small>Sarà visibile pubblicamente solo dopo l’approvazione della moderazione{' '}e, se minorenne, del genitore.</Body>
        <Button
          label="Elimina clip"
          variant="danger"
          onPress={() =>
            Alert.alert('Eliminare il clip?', 'Il clip non sarà più visibile.', [
              { text: 'Annulla', style: 'cancel' },
              {
                text: 'Elimina',
                style: 'destructive',
                onPress: async () => {
                  await services.clipService.deleteClip(clip.id);
                  router.back();
                },
              },
            ])
          }
        />
      </View>
    </Screen>
  );
}
