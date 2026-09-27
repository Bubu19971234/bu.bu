import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { services } from '@/lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Title>Crea il tuo account</Title>
      <Body muted>Il tuo account è personale: non condividere la password, nemmeno con i genitori — loro avranno un account proprio.</Body>
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
      <Field
        label="Password"
        hint="Almeno 8 caratteri"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      <ErrorText>{error}</ErrorText>
      {info ? <Body>{info}</Body> : null}
      <Button
        label="Continua"
        busy={busy}
        disabled={password.length < 8 || !email.includes('@')}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            const r = await services.authService.signUp(email.trim(), password);
            if (r.needsEmailConfirmation) setInfo('Ti abbiamo inviato un’email: confermala e poi accedi.');
            else router.replace('/onboarding/age');
          } catch {
            setError('Registrazione non riuscita. Controlla i dati e riprova.');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Body muted small>Continuando accetti i Termini e l’Informativa privacy (bozza del prototipo).</Body>
    </Screen>
  );
}
