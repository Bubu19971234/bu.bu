'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

function safeNext(next: string | null): string {
  // Only same-origin relative paths (prevents open redirects).
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/guardian';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get('next'));

  return (
    <form
      className="panel stack"
      style={{ maxWidth: 420 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        const db = getBrowserClient();
        if (mode === 'signin') {
          const { error } = await db.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (error) return setMessage('Credenziali non valide.');
          router.push(next);
          router.refresh();
        } else {
          const { error } = await db.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
          setBusy(false);
          setMessage(error ? 'Registrazione non riuscita.' : 'Controlla la tua email per confermare l’account.');
        }
      }}
    >
      <h1 style={{ margin: 0 }}>{mode === 'signin' ? 'Accedi' : 'Crea account'}</h1>
      <p className="muted small">Area web per genitori/tutori e staff. I giocatori usano l’app.</p>
      <label>
        Email
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" disabled={busy}>
        {mode === 'signin' ? 'Accedi' : 'Registrati'}
      </button>
      <button type="button" className="secondary" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
      </button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
