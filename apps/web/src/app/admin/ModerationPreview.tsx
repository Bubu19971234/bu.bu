'use client';
import { useState } from 'react';

export function ModerationPreview({ mediaId, kind }: { mediaId: string; kind: string }) {
  const [url, setUrl] = useState<string | null>(null);
  if (url)
    // eslint-disable-next-line @next/next/no-img-element -- signed URL preview
    return kind === 'avatar' ? <img src={url} alt="" style={{ width: '100%', borderRadius: 12 }} /> : <video src={url} controls playsInline />;
  return (
    <button
      className="secondary"
      onClick={async () => {
        const res = await fetch(`/api/media/${mediaId}/url`);
        if (res.ok) setUrl(((await res.json()) as { url: string }).url);
      }}
    >
      Anteprima
    </button>
  );
}
