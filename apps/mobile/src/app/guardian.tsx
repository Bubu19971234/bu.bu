import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Badge, Body, Button, Card, Chip, ErrorText, Field, Row, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';

type Rel = Awaited<ReturnType<typeof services.guardianService.listForPlayer>>[number];

const STATUS_IT: Record<string, string> = {
  pending: 'In attesa',
  active: 'Approvato',
  revoked: 'Revocato',
  expired: 'Scaduto',
  declined: 'Rifiutato',
};

/** Guardian-required screen for players aged 13–17. */
export default function GuardianRequired() {
  const { status, refresh } = useSession();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<'parent' | 'legal_guardian'>('parent');
  const [rels, setRels] = useState<Rel[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useFocusEffect(
    useCallback(() => {
      services.guardianService.listForPlayer().then(setRels).catch(() => undefined);
      void refresh();
    }, [refresh]),
  );

  const approved = (status?.guardian_consent_scopes.length ?? 0) > 0;

  return (
    <Screen>
      <Title>Serve l’ok di un genitore</Title>
      <Body>
        Hai meno di 18 anni: puoi usare l’app e preparare il tuo profilo, ma diventerà pubblico solo quando un genitore o tutore lo approva
        dal suo account personale.
      </Body>
      {approved ? (
        <Card>
          <Badge label="Approvato" tone="accent" />
          <Body>Autorizzazioni attive: {status?.guardian_consent_scopes.join(', ')}</Body>
        </Card>
      ) : null}
      <Card>
        <Field
          label="Email del genitore o tutore"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Row>
          <Chip label="Genitore" selected={relationship === 'parent'} onPress={() => setRelationship('parent')} />
          <Chip label="Tutore legale" selected={relationship === 'legal_guardian'} onPress={() => setRelationship('legal_guardian')} />
        </Row>
        <Body muted small>Riceverà un’email con un link personale. Tu non vedrai il link: solo lui/lei può approvare.</Body>
        <ErrorText>{error}</ErrorText>
        {sent ? <Body>Invito inviato. Chiedi al tuo genitore di controllare la posta.</Body> : null}
        <Button
          label="Invia richiesta"
          busy={busy}
          disabled={!email.includes('@')}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await services.guardianService.createRequest({ guardianEmail: email.trim(), relationship });
              setSent(true);
              setRels(await services.guardianService.listForPlayer());
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
      {rels.length ? (
        <Card>
          <Body muted>Richieste</Body>
          {rels.map((r) => (
            <Row key={r.id}>
              <Body>{r.invited_email}</Body>
              <Badge label={STATUS_IT[r.status] ?? r.status} tone={r.status === 'active' ? 'accent' : 'muted'} />
            </Row>
          ))}
        </Card>
      ) : null}
      <Button label="Vai alla mia card" variant="secondary" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
