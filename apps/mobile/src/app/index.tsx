import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import { Body, Button, Loading, Screen } from '@/components/ui';
import { isConfigured } from '@/lib/config';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

/** Splash / welcome. Routes signed-in users to onboarding or home. */
export default function Welcome() {
  const { loading, session, profile } = useSession();
  if (loading) return <Loading />;
  if (session && !profile) return <Redirect href="/onboarding/age" />;
  if (session && profile) return <Redirect href="/home" />;

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 16, letterSpacing: 2 }}>FOOTBALL TALENT NETWORK</Text>
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 40, lineHeight: 44 }}>Crea il tuo calciatore.</Text>
        <Body muted>Card, clip, carriera. Il tuo passaporto calcistico digitale — gratis per i giocatori, sempre.</Body>
        {!isConfigured ? <Body muted small>Configurazione mancante: imposta EXPO_PUBLIC_SUPABASE_URL e la chiave pubblica.</Body> : null}
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Inizia" onPress={() => router.push('/sign-up')} />
        <Button label="Ho già un account" variant="secondary" onPress={() => router.push('/sign-in')} />
      </View>
    </Screen>
  );
}
