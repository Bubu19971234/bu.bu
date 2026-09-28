import '@/lib/polyfills';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/lib/session';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ title: 'Accedi' }} />
          <Stack.Screen name="sign-up" options={{ title: 'Crea account' }} />
          <Stack.Screen name="onboarding/age" options={{ title: 'Età' }} />
          <Stack.Screen name="onboarding/player" options={{ title: 'Crea il tuo giocatore' }} />
          <Stack.Screen name="guardian" options={{ title: 'Genitore / tutore' }} />
          <Stack.Screen name="clips/upload" options={{ title: 'Nuovo clip', presentation: 'modal' }} />
          <Stack.Screen name="clips/[id]" options={{ title: 'Clip' }} />
          <Stack.Screen name="profile/edit" options={{ title: 'Modifica profilo' }} />
          <Stack.Screen name="profile/preview" options={{ title: 'Anteprima pubblica' }} />
          <Stack.Screen name="report" options={{ title: 'Segnala o blocca' }} />
          <Stack.Screen name="delete-account" options={{ title: 'Elimina account' }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
