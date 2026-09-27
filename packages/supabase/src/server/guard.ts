// Server-only module guard: service-role code must never run in a browser/app bundle.
if (typeof window !== 'undefined' || (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')) {
  throw new Error('@ftn/supabase/server must not be imported in client code');
}
export {};
