import { describe, expect, it } from 'vitest';
import { ageBand, ageOn, birthYearOf, parseIsoDate } from './age';

describe('age', () => {
  it('computes full years, respecting birthdays not yet reached', () => {
    expect(ageOn('2011-06-15', '2026-06-14')).toBe(14);
    expect(ageOn('2011-06-15', '2026-06-15')).toBe(15);
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17);
    expect(ageOn('2008-02-29', '2026-03-01')).toBe(18);
  });

  it('rejects impossible dates', () => {
    expect(parseIsoDate('2011-02-30')).toBeNull();
    expect(parseIsoDate('11-02-2011')).toBeNull();
    expect(() => ageOn('nope', '2026-01-01')).toThrow();
  });

  it('bands ages by product policy', () => {
    expect(ageBand(12)).toBe('under_minimum');
    expect(ageBand(13)).toBe('minor');
    expect(ageBand(17)).toBe('minor');
    expect(ageBand(18)).toBe('adult');
  });

  it('exposes only the birth year', () => {
    expect(birthYearOf('2010-12-31')).toBe(2010);
  });
});
