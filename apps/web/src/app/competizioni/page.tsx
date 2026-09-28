export const metadata = { title: 'Competizioni' };

export default function CompetitionsPage() {
  return (
    <div className="stack">
      <h1>Competizioni, risultati e classifiche</h1>
      <div className="panel">
        <p>
          In arrivo (Fase 3): stagioni, gironi, giornate, risultati e classifiche consultabili senza login, con fonte e data di
          verifica per ogni dato.
        </p>
        <p className="muted small">
          I dati verranno importati solo da fonti ufficiali o autorizzate, dopo verifica dei termini d’uso.
        </p>
      </div>
    </div>
  );
}
