import { describe, expect, it } from 'vitest';
import { assertNotServiceKey } from '../client';
import { AppError, toAppError } from '../errors';

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');

describe('assertNotServiceKey', () => {
  it('rejects secret and service-role keys in public clients', () => {
    expect(() => assertNotServiceKey('sb_secret_abc')).toThrow();
    expect(() => assertNotServiceKey(`${b64({ alg: 'HS256' })}.${b64({ role: 'service_role' })}.sig`)).toThrow();
  });
  it('accepts publishable/anon keys', () => {
    expect(() => assertNotServiceKey('sb_publishable_abc')).not.toThrow();
    expect(() => assertNotServiceKey(`${b64({ alg: 'HS256' })}.${b64({ role: 'anon' })}.sig`)).not.toThrow();
  });
});

describe('toAppError', () => {
  it('maps database error codes and hides unknown ones', () => {
    expect(toAppError({ message: 'duration_exceeded' }).code).toBe('duration_exceeded');
    expect(toAppError({ message: 'relation "x" does not exist' }).code).toBe('unknown');
    expect(toAppError(new AppError('forbidden')).code).toBe('forbidden');
  });
});
