'use client';
import { useState } from 'react';

/** Fetches a short-lived signed URL only when the viewer presses play. */
export function ClipPlayer({ mediaId }: { mediaId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  if (url) return <video src={url} controls autoPlay playsInline preload="metadata" />;
  return (
    <button
      className="secondary"
      style={{ width: '100%', aspectRatio: '16 / 9' }}
      onClick={async () => {
        setError(false);
        const res = await fetch(`/api/media/${mediaId}/url`);
        if (!res.ok) return setError(true);
        setUrl(((await res.json()) as { url: string }).url);
      }}
    >
      {error ? 'Clip non disponibile' : '▶ Guarda il clip'}
    </button>
  );
}
