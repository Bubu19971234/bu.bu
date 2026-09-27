import { DOMINANT_FOOT_LABELS_IT, FOOTBALL_ROLE_LABELS_IT, type FootballRole } from '@ftn/core';
import { router } from 'expo-router';
import { Badge, Body, Button, Card, Row, Screen, Title } from '@/components/ui';
import { useSession } from '@/lib/session';

/** Career / profile page. Club history and season stats arrive with Phase 2–3. */
export default function Career() {
  const { profile } = useSession();
  if (!profile) return null;
  const role = profile.preferred_role as FootballRole;
  return (
    <Screen>
      <Title>{profile.display_name}</Title>
      <Card>
        <Row wrap>
          <Badge label={`${role} · ${FOOTBALL_ROLE_LABELS_IT[role] ?? role}`} tone="accent" />
          <Badge label={`Classe ${profile.birth_year}`} />
          <Badge label={`Piede ${DOMINANT_FOOT_LABELS_IT[profile.dominant_foot].toLowerCase()}`} />
          {profile.height_cm ? <Badge label={`${profile.height_cm} cm`} /> : null}
        </Row>
        {profile.secondary_roles.length ? <Body muted>Ruoli secondari: {profile.secondary_roles.join(', ')}</Body> : null}
        {profile.bio ? <Body>{profile.bio}</Body> : null}
        <Body muted small>Origine dati: dichiarati dal giocatore{profile.verification_status === 'club_verified' ? ', verificati dal club' : ''}.</Body>
      </Card>
      <Card>
        <Body>Carriera</Body>
        <Row>
          <Badge label="Stagione attuale" />
          <Body>{profile.current_club_display ?? 'Nessun club indicato'}</Body>
        </Row>
        <Body muted small>
          Presto il tuo club potrà verificare tesseramento, presenze, minuti e gol partita per partita. Le statistiche verranno calcolate dalle
          partite, non inserite a mano.
        </Body>
      </Card>
      <Card>
        <Body>Statistiche stagione</Body>
        <Body muted small>Nessuna statistica verificata ancora.</Body>
      </Card>
      <Button label="Modifica profilo" onPress={() => router.push('/profile/edit')} />
      <Button label="Anteprima profilo pubblico" variant="secondary" onPress={() => router.push('/profile/preview')} />
    </Screen>
  );
}
