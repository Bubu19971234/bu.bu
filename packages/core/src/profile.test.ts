import { describe, expect, it } from 'vitest';
import { profileMissions, publicationBlockers, slugify } from './profile';

describe('publicationBlockers', () => {
  it('blocks a public minor profile without guardian consent', () => {
    expect(
      publicationBlockers({ visibility: 'public', accountStatus: 'active', ageBand: 'minor', hasActiveGuardianConsent: false, moderationHidden: false }),
    ).toEqual(['guardian_consent_required']);
  });
  it('allows an adult public profile', () => {
    expect(
      publicationBlockers({ visibility: 'public', accountStatus: 'active', ageBand: 'adult', hasActiveGuardianConsent: false, moderationHidden: false }),
    ).toEqual([]);
  });
});

describe('slugify', () => {
  it('normalizes accents and symbols', () => {
    expect(slugify('Niccolò D’Angelo')).toBe('niccolo-d-angelo');
    expect(slugify('!!!')).toBe('giocatore');
  });
});

describe('profileMissions', () => {
  it('adds guardian mission for minors only', () => {
    const base = { hasPublishedAvatar: false, hasSecondaryRoles: false, hasClubDisplay: false, hasActiveGuardianConsent: false, clipCategories: [], visibility: 'private' as const };
    expect(profileMissions({ ...base, ageBand: 'minor' })[0]?.id).toBe('guardian_approval');
    expect(profileMissions({ ...base, ageBand: 'adult' }).some((m) => m.id === 'guardian_approval')).toBe(false);
  });
});
