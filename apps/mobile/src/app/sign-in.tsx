import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { services } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Title>Bentornato</Title>
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
      <Field label="Password" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} />
      <ErrorText>{error}</ErrorText>
      <Button
        label="Accedi"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await services.authService.signIn(email.trim(), password);
            router.replace('/');
          } catch {
            setError('Email o password non validi.');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Body muted small>
        Non hai un account? Torna indietro e tocca “Inizia”.
      </Body>
    </Screen>
  );
}
