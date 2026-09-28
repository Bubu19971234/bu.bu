/**
 * Errors surfaced by services. Database functions raise
 * `raise_app_error('<code>')`, which PostgREST returns as `message = code`.
 */
export const APP_ERROR_CODES = [
  'not_authenticated',
  'account_inactive',
  'under_minimum_age',
  'invalid_date_of_birth',
  'date_of_birth_already_set',
  'player_profile_required',
  'guardian_not_required',
  'guardian_email_is_self',
  'guardian_is_player',
  'guardian_email_mismatch',
  'guardian_email_unconfirmed',
  'guardian_date_of_birth_required',
  'guardian_not_adult',
  'guardian_consent_required',
  'public_profile_scope_required',
  'consent_version_outdated',
  'invitation_not_found',
  'invitation_not_pending',
  'invitation_expired',
  'not_guardian',
  'rate_limited',
  'mime_not_allowed',
  'file_too_large',
  'duration_missing',
  'duration_exceeded',
  'clip_limit_reached',
  'object_missing',
  'media_not_found',
  'media_not_usable',
  'media_not_ready',
  'clip_not_found',
  'invalid_avatar_media',
  'report_target_not_found',
  'cannot_block_self',
  'player_not_found',
  'forbidden',
  'version_conflict',
  'idempotency_mismatch',
  'request_in_progress',
  'validation_failed',
  'network_error',
  'unknown',
] as const;
export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message?: string,
    cause?: unknown,
  ) {
    super(message ?? code, { cause });
    this.name = 'AppError';
  }
}

const KNOWN = new Set<string>(APP_ERROR_CODES);

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  if (KNOWN.has(message)) return new AppError(message as AppErrorCode, message, error);
  return new AppError('unknown', message || 'Unexpected error', error);
}

/**
 * Unwraps a Supabase `{ data, error }` result or throws an AppError. Use for
 * results that are non-null on success (lists, RPCs returning a value).
 */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  return result.data as T;
}

/** Like `unwrap`, for results where `null` is a valid success value. */
export function unwrapMaybe<T>(result: { data: T | null; error: unknown }): T | null {
  if (result.error) throw toAppError(result.error);
  return result.data;
}

export const APP_ERROR_MESSAGES_IT: Partial<Record<AppErrorCode, string>> = {
  under_minimum_age: 'Devi avere almeno 13 anni per creare un profilo giocatore.',
  date_of_birth_already_set: 'La data di nascita è già registrata. Contatta il supporto per correggerla.',
  guardian_email_mismatch: 'Accedi con l’indirizzo email a cui è stato inviato l’invito.',
  guardian_email_unconfirmed: 'Conferma prima il tuo indirizzo email.',
  guardian_not_adult: 'Il genitore/tutore deve essere maggiorenne.',
  guardian_date_of_birth_required: 'Indica la tua data di nascita per confermare di essere maggiorenne.',
  guardian_consent_required: 'Serve l’approvazione del genitore/tutore.',
  invitation_expired: 'L’invito è scaduto. Chiedi al giocatore di inviarne uno nuovo.',
  rate_limited: 'Troppi tentativi. Riprova più tardi.',
  duration_exceeded: 'Il clip supera i 60 secondi.',
  mime_not_allowed: 'Formato file non supportato.',
  file_too_large: 'Il file è troppo grande.',
  clip_limit_reached: 'Hai raggiunto il numero massimo di clip attivi.',
  version_conflict: 'Il profilo è stato modificato altrove. Ricarica e riprova.',
  forbidden: 'Operazione non consentita.',
};
