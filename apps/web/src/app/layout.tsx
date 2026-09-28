import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Football Talent Network', template: '%s · Football Talent Network' },
  description: 'Il passaporto digitale del calcio giovanile e dilettantistico.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="site-header">
          <nav>
            <Link href="/" className="brand">
              FTN
            </Link>
            <Link href="/competizioni">Competizioni</Link>
            <Link href="/guardian">Area genitori</Link>
            <Link href="/login">Accedi</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/termini">Termini</Link>
            <Link href="/supporto">Supporto e segnalazioni</Link>
            <span>Prototipo — nome e marchio provvisori</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
