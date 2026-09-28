import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Card, ErrorText, Field, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { services } from '@/lib/supabase';

/** In-app account deletion (App Store requirement). */
export default function DeleteAccount() {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <Screen>
        <Title>Richiesta ricevuta</Title>
        <Body>Il tuo profilo è stato nascosto subito. Completeremo la cancellazione dei dati personali secondo la nostra informativa.</Body>
        <Button label="Chiudi" onPress={async () => { await services.authService.signOut(); router.replace('/'); }} />
      </Screen>
    );

  return (
    <Screen>
      <Title>Elimina account</Title>
      <Card>
        <Body>Cosa succede:</Body>
        <Body muted small>• Il profilo e i clip vengono nascosti immediatamente.</Body>
        <Body muted small>• Foto, clip, data di nascita e dati dell’account vengono cancellati.</Body>
        <Body muted small>
          • Alcuni fatti sportivi storici (es. risultati di partite ufficiali) possono restare in forma anonima; i registri di sicurezza e
          moderazione sono conservati per il tempo previsto dall’informativa.
        </Body>
      </Card>
      <Field label="Motivo (facoltativo)" maxLength={500} value={reason} onChangeText={setReason} />
      <Field label="Scrivi ELIMINA per confermare" autoCapitalize="characters" value={confirm} onChangeText={setConfirm} />
      <ErrorText>{error}</ErrorText>
      <Button
        label="Elimina definitivamente"
        variant="danger"
        busy={busy}
        disabled={confirm.trim() !== 'ELIMINA'}
        onPress={async () => {
          setBusy(true);
          try {
            await services.authService.requestDeletion(reason.trim() || null);
            setDone(true);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
