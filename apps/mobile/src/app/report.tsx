import { REPORT_REASONS } from '@ftn/validation';
import { newOperationId, type PublicPlayerProfile } from '@ftn/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Body, Button, Card, Chip, ErrorText, Field, Row, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { services } from '@/lib/supabase';

const REASON_IT: Record<(typeof REPORT_REASONS)[number], string> = {
  inappropriate: 'Inappropriato',
  harassment: 'Molestie',
  impersonation: 'Si spaccia per qualcun altro',
  minor_safety: 'Sicurezza di un minore',
  spam: 'Spam',
  copyright: 'Copyright',
  other: 'Altro',
};

/** Report / block flow. Accepts a profile link or slug. */
export default function Report() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const [link, setLink] = useState(params.slug ?? '');
  const [target, setTarget] = useState<PublicPlayerProfile | null>(null);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>('inappropriate');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const op = useRef(newOperationId());

  const slug = link.trim().split('/').filter(Boolean).pop() ?? '';

  if (done) return <Screen><Title>Grazie</Title><Body>{done}</Body></Screen>;

  return (
    <Screen>
      <Title>Segnala o blocca</Title>
      {!target ? (
        <>
          <Field label="Link o codice del profilo" autoCapitalize="none" value={link} onChangeText={setLink} />
          <ErrorText>{error}</ErrorText>
          <Button
            label="Trova profilo"
            disabled={slug.length < 3}
            onPress={async () => {
              setError(null);
              const p = await services.playerService.getPublicProfile(slug).catch(() => null);
              if (!p) return setError('Profilo non trovato o non pubblico.');
              setTarget(p);
            }}
          />
          <Body muted small>Per problemi urgenti di sicurezza di un minore contatta anche le autorità competenti.</Body>
        </>
      ) : (
        <Card>
          <Body>Profilo: {target.display_name}</Body>
          <Row wrap>
            {REPORT_REASONS.map((r) => (
              <Chip key={r} label={REASON_IT[r]} selected={reason === r} onPress={() => setReason(r)} />
            ))}
          </Row>
          <Field label="Dettagli (facoltativo)" multiline maxLength={1000} value={details} onChangeText={setDetails} />
          <ErrorText>{error}</ErrorText>
          <Button
            label="Invia segnalazione"
            onPress={async () => {
              try {
                await services.moderationService.reportContent({
                  targetType: 'player_profile',
                  targetId: target.id,
                  reason,
                  details: details.trim() || null,
                  clientOperationId: op.current,
                });
                setDone('La segnalazione è stata inviata al team di moderazione.');
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          />
          <Button
            label="Blocca questo utente"
            variant="danger"
            onPress={async () => {
              try {
                await services.moderationService.blockUser(target.id);
                setDone('Utente bloccato: non vedrai più il suo profilo e i suoi contenuti.');
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
