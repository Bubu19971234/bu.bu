import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, createPublicClient, createServices } from '@ftn/supabase';
import { AppState, Platform } from 'react-native';
import { config } from './config';

export const db = createPublicClient(
  { url: config.supabaseUrl || 'http://localhost:54321', publishableKey: config.supabasePublishableKey || 'missing' },
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh tokens only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void db.auth.startAutoRefresh();
    else void db.auth.stopAutoRefresh();
  });
}

export const api = createApiClient({
  baseUrl: config.apiBaseUrl,
  getAccessToken: async () => (await db.auth.getSession()).data.session?.access_token ?? null,
});

export const services = createServices(db, api);
