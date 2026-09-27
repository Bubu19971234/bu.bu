import {
  ADULT_AGE,
  ageOn,
  birthYearOf,
  DOMINANT_FEET,
  DOMINANT_FOOT_LABELS_IT,
  type DominantFoot,
  FOOTBALL_ROLE_LABELS_IT,
  FOOTBALL_ROLES,
  type FootballRole,
  MAX_SECONDARY_ROLES,
  todayIso,
} from '@ftn/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PlayerCard } from '@/components/PlayerCard';
import { Body, Button, Chip, ErrorText, Field, Row, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';
import { PhotoPicker } from '@/components/PhotoPicker';

const STEPS = ['name', 'body', 'role', 'secondary', 'club', 'review', 'photo'] as const;
type Step = (typeof STEPS)[number];

/** "Create your footballer" wizard (spec §4.1). */
export default function PlayerWizard() {
  const { dob } = useLocalSearchParams<{ dob: string }>();
  const { refresh } = useSession();
  const [step, setStep] = useState<Step>('name');
  const [displayName, setDisplayName] = useState('');
  const [height, setHeight] = useState('');
  const [foot, setFoot] = useState<DominantFoot>('right');
  const [role, setRole] = useState<FootballRole>('CM');
  const [secondary, setSecondary] = useState<FootballRole[]>([]);
  const [club, setClub] = useState('');
  const [shirt, setShirt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; version: number; minor: boolean } | null>(null);

  if (!dob) return <Screen><ErrorText>Data di nascita mancante.</ErrorText></Screen>;
  const minor = ageOn(dob, todayIso()) < ADULT_AGE;
  const next = () => setStep(STEPS[STEPS.indexOf(step) + 1] ?? step);
  const finish = () => router.replace(created?.minor ? '/guardian' : '/home');

  const preview = (
    <PlayerCard
      player={{
        displayName: displayName || 'Il tuo nome',
        birthYear: birthYearOf(dob),
        preferredRole: role,
        dominantFoot: foot,
        clubDisplay: club || null,
        shirtNumber: shirt ? Number(shirt) : null,
        verified: false,
      }}
      rating={null}
    />
  );

  return (
    <Screen>
      <Body muted small>
        Passo {STEPS.indexOf(step) + 1} di {STEPS.length}
      </Body>
      {step === 'name' && (
        <>
          <Title>Come ti chiami in campo?</Title>
          <Field label="Nome visualizzato" maxLength={40} value={displayName} onChangeText={setDisplayName} autoFocus />
          <Body muted small>Usa nome e cognome o come ti chiamano in squadra. Niente numeri di telefono o indirizzi.</Body>
          <Button label="Avanti" disabled={displayName.trim().length < 2} onPress={next} />
        </>
      )}
      {step === 'body' && (
        <>
          <Title>Fisico</Title>
          <Field label="Altezza (cm) — facoltativa" keyboardType="number-pad" maxLength={3} value={height} onChangeText={setHeight} />
          <Body muted>Piede preferito</Body>
          <Row wrap>
            {DOMINANT_FEET.map((f) => (
              <Chip key={f} label={DOMINANT_FOOT_LABELS_IT[f]} selected={foot === f} onPress={() => setFoot(f)} />
            ))}
          </Row>
          <Button label="Avanti" onPress={next} />
        </>
      )}
      {step === 'role' && (
        <>
          <Title>Ruolo principale</Title>
          <Row wrap>
            {FOOTBALL_ROLES.map((r) => (
              <Chip
                key={r}
                label={`${r} · ${FOOTBALL_ROLE_LABELS_IT[r]}`}
                selected={role === r}
                onPress={() => {
                  setRole(r);
                  setSecondary((s) => s.filter((x) => x !== r));
                }}
              />
            ))}
          </Row>
          <Button label="Avanti" onPress={next} />
        </>
      )}
      {step === 'secondary' && (
        <>
          <Title>Ruoli secondari</Title>
          <Body muted>Fino a {MAX_SECONDARY_ROLES}. Facoltativo.</Body>
          <Row wrap>
            {FOOTBALL_ROLES.filter((r) => r !== role).map((r) => (
              <Chip
                key={r}
                label={r}
                selected={secondary.includes(r)}
                onPress={() =>
                  setSecondary((s) => (s.includes(r) ? s.filter((x) => x !== r) : s.length < MAX_SECONDARY_ROLES ? [...s, r] : s))
                }
              />
            ))}
          </Row>
          <Button label="Avanti" onPress={next} />
        </>
      )}
      {step === 'club' && (
        <>
          <Title>La tua squadra</Title>
          <Field label="Club / squadra attuale (facoltativo)" maxLength={80} value={club} onChangeText={setClub} placeholder="Es. ASD Esempio U17" />
          <Body muted small>Lascia vuoto se al momento non sei tesserato. Il club potrà verificare il collegamento più avanti.</Body>
          <Field label="Numero di maglia (facoltativo)" keyboardType="number-pad" maxLength={2} value={shirt} onChangeText={setShirt} />
          <Button label="Avanti" onPress={next} />
        </>
      )}
      {step === 'review' && (
        <>
          <Title>Ecco il tuo giocatore</Title>
          {preview}
          <Body muted small>
            Il profilo nasce privato. Potrai renderlo pubblico dalle impostazioni
            {minor ? ' dopo l’approvazione di un genitore o tutore.' : '.'} Pubblicamente mostriamo solo: nome visualizzato, anno di nascita,
            ruoli, piede, altezza, squadra, numero e i clip approvati. Mai email, telefono o data di nascita completa.
          </Body>
          <ErrorText>{error}</ErrorText>
          <Button
            label="Crea il giocatore"
            busy={busy}
            onPress={async () => {
              setBusy(true);
              setError(null);
              try {
                const r = await services.playerService.createProfile({
                  displayName: displayName.trim(),
                  dateOfBirth: dob,
                  heightCm: height ? Number(height) : null,
                  dominantFoot: foot,
                  preferredRole: role,
                  secondaryRoles: secondary,
                  currentClubDisplay: club.trim() || null,
                  shirtNumber: shirt ? Number(shirt) : null,
                });
                const me = await services.playerService.getMyProfile();
                setCreated({ id: r.player_profile_id, version: me?.version ?? 1, minor: r.requires_guardian });
                await refresh();
                next();
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
      {step === 'photo' && created && (
        <>
          <Title>Foto profilo</Title>
          <Body muted>Una foto in cui si vede bene il viso. Verrà controllata prima di essere mostrata pubblicamente.</Body>
          <PhotoPicker profileId={created.id} version={created.version} onDone={finish} />
          <View style={{ height: 8 }} />
          <Button label="Salta per ora" variant="secondary" onPress={finish} />
        </>
      )}
    </Screen>
  );
}
