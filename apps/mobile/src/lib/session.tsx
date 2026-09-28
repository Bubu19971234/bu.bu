import type { MyPlayerProfile, MyPlayerStatus } from '@ftn/supabase';
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { db, services } from './supabase';

interface SessionState {
  loading: boolean;
  session: Session | null;
  profile: MyPlayerProfile | null;
  status: MyPlayerStatus | null;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MyPlayerProfile | null>(null);
  const [status, setStatus] = useState<MyPlayerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setStatus(null);
      return;
    }
    const [p, st] = await Promise.all([services.playerService.getMyProfile(), services.playerService.getMyStatus()]);
    setProfile(p);
    setStatus(st);
  }, []);

  useEffect(() => {
    let active = true;
    db.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session).catch(() => undefined);
      setLoading(false);
    });
    const { data: sub } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      void loadProfile(s).catch(() => undefined);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refresh = useCallback(() => loadProfile(session), [loadProfile, session]);
  const value = useMemo(() => ({ loading, session, profile, status, refresh }), [loading, session, profile, status, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession outside SessionProvider');
  return ctx;
}
