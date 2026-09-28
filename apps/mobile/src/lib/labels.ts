/** Italian labels for media lifecycle states. */
export const MEDIA_STATUS_IT: Record<string, { label: string; tone: 'muted' | 'accent' | 'gold' | 'danger' }> = {
  uploading: { label: 'Caricamento', tone: 'muted' },
  uploaded: { label: 'Caricato', tone: 'muted' },
  processing: { label: 'In verifica', tone: 'muted' },
  pending_moderation: { label: 'In moderazione', tone: 'gold' },
  published: { label: 'Approvato', tone: 'accent' },
  rejected: { label: 'Rifiutato', tone: 'danger' },
  failed: { label: 'Errore', tone: 'danger' },
  deleted: { label: 'Eliminato', tone: 'muted' },
};
