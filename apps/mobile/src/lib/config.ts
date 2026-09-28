/**
 * Only EXPO_PUBLIC_* variables are available here and they ship inside the
 * app binary. Never add secrets (service-role key, AI keys) to the mobile app.
 */
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
};

export const isConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
