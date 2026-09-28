import { CARD_ATTRIBUTE_LABELS_IT, CARD_ATTRIBUTES, type ClipCategory, MISSION_LABELS_IT, profileMissions } from '@ftn/core';
import type { PlayerRatingSnapshotRow } from '@ftn/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { PlayerCard, ratingFromSnapshot } from '@/components/PlayerCard';
import { Badge, Body, Button, Card, Row } from '@/components/ui';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';
import { colors } from '@/lib/theme';

/** Player home: card, progression, publication status, missions. */
export default function Home() {
  const { profile, status, refresh } = useSession();
  const [snapshot, setSnapshot] = useState<PlayerRatingSnapshotRow | null>(null);
  const [previous, setPrevious] = useState<PlayerRatingSnapshotRow | null>(null);
  const [categories, setCategories] = useState<ClipCategory[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPublished, setAvatarPublished] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const [analysis, clips] = await Promise.all([
      services.aiService.getLatestPlayerAnalysis(profile.id),
      services.clipService.listPlayerClips(profile.id),
    ]);
    setSnapshot(analysis.snapshot);
    setPrevious(analysis.previous);
    setCategories(clips.map((c) => c.category as ClipCategory));
    if (profile.avatar_media_id) {
      services.mediaService.getPlayableUrl(profile.avatar_media_id).then((r) => setAvatarUrl(r.url)).catch(() => setAvatarUrl(null));
      const media = await services.mediaService.getStatus(profile.avatar_media_id);
      setAvatarPublished(media?.status === 'published');
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!profile) return null;
  const minor = status?.is_minor ?? true;
  const consent = (status?.guardian_consent_scopes.length ?? 0) > 0;
  const missions = profileMissions({
    hasPublishedAvatar: avatarPublished,
    hasSecondaryRoles: profile.secondary_roles.length > 0,
    hasClubDisplay: Boolean(profile.current_club_display),
    ageBand: minor ? 'minor' : 'adult',
    hasActiveGuardianConsent: consent,
    clipCategories: categories,
    visibility: profile.visibility,
  });
  const done = missions.filter((m) => m.done).length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([refresh(), load()]);
            setRefreshing(false);
          }}
        />
      }
    >
      <PlayerCard
        avatarUrl={avatarUrl}
        rating={snapshot ? ratingFromSnapshot(snapshot) : null}
        player={{
          displayName: profile.display_name,
          birthYear: profile.birth_year,
          preferredRole: profile.preferred_role,
          dominantFoot: profile.dominant_foot,
          clubDisplay: profile.current_club_display,
          shirtNumber: profile.shirt_number,
          verified: profile.verification_status === 'club_verified',
        }}
      />

      <Card>
        <Row wrap>
          <Badge label={status?.is_public ? 'Profilo pubblico' : 'Profilo privato'} tone={status?.is_public ? 'accent' : 'muted'} />
          {minor ? <Badge label={consent ? 'Genitore: approvato' : 'Genitore: in attesa'} tone={consent ? 'accent' : 'gold'} /> : null}
          {profile.moderation_status === 'hidden' ? <Badge label="Nascosto dalla moderazione" tone="danger" /> : null}
        </Row>
        {minor && !consent ? <Button label="Chiedi l’approvazione" variant="secondary" onPress={() => router.push('/guardian')} /> : null}
      </Card>

      {snapshot && previous ? (
        <Card>
          <Body muted>Rispetto alla versione precedente (v{previous.version})</Body>
          {CARD_ATTRIBUTES.map((a) => {
            const now = snapshot[a];
            const before = previous[a];
            if (now === null || before === null || now === before) return null;
            const delta = now - before;
            return (
              <Row key={a}>
                <Body>{CARD_ATTRIBUTE_LABELS_IT[a]}</Body>
                <Text style={{ color: delta > 0 ? colors.accent : colors.danger, fontWeight: '800' }}>
                  {delta > 0 ? `+${delta}` : delta}
                </Text>
              </Row>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Row>
          <Body>Completa il profilo</Body>
          <Badge label={`${done}/${missions.length}`} tone="gold" />
        </Row>
        {missions.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: m.done ? colors.accent : colors.muted }}>{m.done ? '✓' : '○'}</Text>
            <Body muted={m.done}>{MISSION_LABELS_IT[m.id]}</Body>
          </View>
        ))}
      </Card>

      <Body muted small>
        I valori della card sono stime generate automaticamente dai clip che scegli: non sono misure certificate. “Dati insufficienti”
        significa solo che non abbiamo ancora abbastanza clip su quell’aspetto.
      </Body>
    </ScrollView>
  );
}
