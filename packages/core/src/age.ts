/**
 * Age rules (master spec §3.2, §8). The authoritative check runs in the
 * database (`public.age_on`); this mirror exists for instant UI feedback.
 */

export const MIN_PLAYER_AGE = 13;
export const ADULT_AGE = 18;
/** Upper sanity bound for a declared date of birth. */
export const MAX_PLAUSIBLE_AGE = 100;

export type AgeBand = 'under_minimum' | 'minor' | 'adult';

/** Parses a strict `YYYY-MM-DD` calendar date. Returns null when invalid. */
export function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

/** Full years elapsed between `dateOfBirth` and `today` (both `YYYY-MM-DD`). */
export function ageOn(dateOfBirth: string, today: string): number {
  const dob = parseIsoDate(dateOfBirth);
  const now = parseIsoDate(today);
  if (!dob || !now) throw new Error('Invalid ISO date');
  let age = now.y - dob.y;
  if (now.m < dob.m || (now.m === dob.m && now.d < dob.d)) age -= 1;
  return age;
}

export function ageBand(age: number): AgeBand {
  if (age < MIN_PLAYER_AGE) return 'under_minimum';
  if (age < ADULT_AGE) return 'minor';
  return 'adult';
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function birthYearOf(dateOfBirth: string): number {
  const dob = parseIsoDate(dateOfBirth);
  if (!dob) throw new Error('Invalid ISO date');
  return dob.y;
}
