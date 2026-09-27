import type { DbClient } from '../client';
import { AppError, unwrap } from '../errors';

export function createAuthService(db: DbClient) {
  return {
    async signUp(email: string, password: string, emailRedirectTo?: string) {
      const { data, error } = await db.auth.signUp({ email, password, options: { emailRedirectTo } });
      if (error) throw new AppError('unknown', error.message, error);
      return { userId: data.user?.id ?? null, needsEmailConfirmation: !data.session };
    },
    async signIn(email: string, password: string) {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw new AppError('not_authenticated', error.message, error);
      return data.session;
    },
    async signOut() {
      await db.auth.signOut();
    },
    async getUserId(): Promise<string | null> {
      const { data } = await db.auth.getSession();
      return data.session?.user.id ?? null;
    },
    /** Starts the deletion workflow; the account is hidden immediately. */
    async requestDeletion(reason: string | null): Promise<string> {
      return unwrap(await db.rpc('account_request_deletion', { p_reason: reason }));
    },
    async setDateOfBirth(dateOfBirth: string) {
      unwrap(await db.rpc('account_set_date_of_birth', { p_date_of_birth: dateOfBirth }));
    },
  };
}
