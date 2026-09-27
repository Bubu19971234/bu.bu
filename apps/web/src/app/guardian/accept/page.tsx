'use client';
import dynamic from 'next/dynamic';

const AcceptFlow = dynamic(() => import('./AcceptFlow'), { ssr: false, loading: () => <div className="panel">Caricamento…</div> });

export default function GuardianAcceptPage() {
  return <AcceptFlow />;
}
