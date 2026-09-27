import {
  DOMINANT_FEET,
  DOMINANT_FOOT_LABELS_IT,
  type DominantFoot,
  FOOTBALL_ROLES,
  type FootballRole,
  MAX_SECONDARY_ROLES,
} from '@ftn/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Body, Button, Card, Chip, ErrorText, Field, Row, Screen } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';

export default function EditProfile() {
  const { profile, refresh } = useSession();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [height, setHeight] = useState(profile?.height_cm ? String(profile.height_cm) : '');
  const [foot, setFoot] = useState<DominantFoot>(profile?.dominant_foot ?? 'right');
  const [role, setRole] = useState<FootballRole>((profile?.preferred_role as FootballRole) ?? 'CM');
  const [secondary, setSecondary] = useState<FootballRole[]>((profile?.secondary_roles as FootballRole[]) ?? []);
  const [club, setClub] = useState(profile?.current_club_display ?? '');
  const [shirt, setShirt] = useState(profile?.shirt_number ? String(profile.shirt_number) : '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  return (
    <Screen>
      <Card>
        <Body>Foto profilo</Body>
        <PhotoPicker profileId={profile.id} version={profile.version} />
      </Card>
      <Field label="Nome visualizzato" maxLength={40} value={displayName} onChangeText={setDisplayName} />
      <Field label="Altezza (cm)" keyboardType="number-pad" maxLength={3} value={height} onChangeText={setHeight} />
      <Body muted>Piede</Body>
      <Row wrap>
        {DOMINANT_FEET.map((f) => (
          <Chip key={f} label={DOMINANT_FOOT_LABELS_IT[f]} selected={foot === f} onPress={() => setFoot(f)} />
        ))}
      </Row>
      <Body muted>Ruolo principale</Body>
      <Row wrap>
        {FOOTBALL_ROLES.map((r) => (
          <Chip
            key={r}
            label={r}
            selected={role === r}
            onPress={() => {
              setRole(r);
              setSecondary((s) => s.filter((x) => x !== r));
            }}
          />
        ))}
      </Row>
      <Body muted>Ruoli secondari (max {MAX_SECONDARY_ROLES})</Body>
      <Row wrap>
        {FOOTBALL_ROLES.filter((r) => r !== role).map((r) => (
          <Chip
            key={r}
            label={r}
            selected={secondary.includes(r)}
            onPress={() => setSecondary((s) => (s.includes(r) ? s.filter((x) => x !== r) : s.length < MAX_SECONDARY_ROLES ? [...s, r] : s))}
          />
        ))}
      </Row>
      <Field label="Club / squadra attuale" maxLength={80} value={club} onChangeText={setClub} />
      <Field label="Numero di maglia" keyboardType="number-pad" maxLength={2} value={shirt} onChangeText={setShirt} />
      <Field label="Bio (max 280)" multiline maxLength={280} value={bio} onChangeText={setBio} />
      <ErrorText>{error}</ErrorText>
      <Button
        label="Salva"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await services.playerService.updateProfile(profile.id, profile.version, {
              displayName: displayName.trim(),
              heightCm: height ? Number(height) : null,
              dominantFoot: foot,
              preferredRole: role,
              secondaryRoles: secondary,
              currentClubDisplay: club.trim() || null,
              shirtNumber: shirt ? Number(shirt) : null,
              bio: bio.trim() || null,
            });
            await refresh();
            router.back();
          } catch (e) {
            // version_conflict → reload the latest profile before retrying.
            await refresh();
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
