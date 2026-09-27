import './guard';

export interface GuardianInviteEmail {
  to: string;
  playerDisplayName: string;
  acceptUrl: string;
  expiresAt: string;
}

/** Email transport abstraction. Phase 1 ships a dev logger; plug a provider later. */
export interface Mailer {
  sendGuardianInvite(email: GuardianInviteEmail): Promise<void>;
}

/**
 * Development mailer: logs the invitation link server-side only (never
 * returned to the requesting minor's device). Must not be used in production.
 */
export function createDevLogMailer(log: (message: string) => void = console.info): Mailer {
  return {
    async sendGuardianInvite(email) {
      log(`[dev-mailer] guardian invite to ${email.to} for ${email.playerDisplayName}: ${email.acceptUrl} (expires ${email.expiresAt})`);
    },
  };
}
