import { APP_ERROR_MESSAGES_IT, toAppError } from '@ftn/supabase';
import { ZodError } from 'zod';

export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Dati non validi.';
  const e = toAppError(error);
  return APP_ERROR_MESSAGES_IT[e.code] ?? 'Qualcosa è andato storto. Riprova.';
}
