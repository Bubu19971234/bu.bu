import { router, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Switch } from 'react-native';
import { Badge, Body, Button, Card, ErrorText, Row, Screen, Title } from '@/components/ui';
import { config } from '@/lib/config';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';
import { colors } from '@/lib/theme';

type Blocked = Awaited<ReturnType<typeof services.moderationService.listBlocked>>;

/** Privacy & settings: visibility, blocked users, reports, legal, deletion. */
export default function Settings() {
  const { profile, status, refresh } = useSession();
  const [blocked, setBlocked] = useState<Blocked>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      services.moderationService.listBlocked().then(setBlocked).catch(() => undefined);
    }, []),
  );

  if (!profile) return null;
  const minor = status?.is_minor ?? true;
  const consent = status?.guardian_consent_scopes.includes('public_profile') ?? false;

  return (
    <Screen>
      <Title>Privacy</Title>
      <Card>
        <Row>
          <Body>Profilo pubblico</Body>
          <Switch
            value={profile.visibility === 'public'}
            trackColor={{ true: colors.accent, false: colors.border }}
            onValueChange={async (v) => {
              setError(null);
              try {
                await services.playerService.updateVisibility(profile.id, profile.version, v ? 'public' : 'private');
              } catch (e) {
                setError(errorMessage(e));
              }
              await refresh();
            }}
          />
        </Row>
        {minor && !consent ? (
          <Body muted small>Anche se attivo, il profilo resta privato finché un genitore/tutore non approva.</Body>
        ) : null}
        <Row>
          <Body muted small>Stato effettivo:</Body>
          <Badge label={status?.is_public ? 'Pubblico' : 'Privato'} tone={status?.is_public ? 'accent' : 'muted'} />
        </Row>
        <ErrorText>{error}</ErrorText>
        <Body muted small>
          Pubblico significa: chiunque abbia il link vede nome visualizzato, anno di nascita, ruoli, piede, altezza, squadra e clip approvati.
          Mai email, telefono, data di nascita completa o dati del genitore. Non ci sono messaggi privati.
        </Body>
      </Card>
      {minor ? <Button label="Genitore / tutore" variant="secondary" onPress={() => router.push('/guardian')} /> : null}
      <Card>
        <Body>Utenti bloccati</Body>
        {blocked.length === 0 ? <Body muted small>Nessuno.</Body> : null}
        {blocked.map((b) => (
          <Row key={b.player_profile_id}>
            <Body>{b.display_name}</Body>
            <Button
              label="Sblocca"
              variant="secondary"
              onPress={async () => {
                await services.moderationService.unblockUser(b.player_profile_id);
                setBlocked(await services.moderationService.listBlocked());
              }}
            />
          </Row>
        ))}
      </Card>
      <Button label="Segnala un profilo o un contenuto" variant="secondary" onPress={() => router.push('/report')} />
      <Card>
        <Body>Informazioni</Body>
        <Button label="Informativa privacy" variant="secondary" onPress={() => void Linking.openURL(`${config.apiBaseUrl}/privacy`)} />
        <Button label="Termini di servizio" variant="secondary" onPress={() => void Linking.openURL(`${config.apiBaseUrl}/termini`)} />
        <Button label="Supporto" variant="secondary" onPress={() => void Linking.openURL(`${config.apiBaseUrl}/supporto`)} />
      </Card>
      <Button label="Esci" variant="secondary" onPress={async () => { await services.authService.signOut(); router.replace('/'); }} />
      <Button label="Elimina account" variant="danger" onPress={() => router.push('/delete-account')} />
    </Screen>
  );
}
