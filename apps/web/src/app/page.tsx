import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <h1>Il tuo passaporto calcistico digitale.</h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 640 }}>
          Crea il tuo giocatore, costruisci la tua carriera con clip e statistiche, fatti verificare dal tuo club. Gratis per i
          giocatori, sempre.
        </p>
        <div className="row">
          <span className="button">Scarica l’app (presto su iOS)</span>
          <Link className="button secondary" href="/competizioni">
            Risultati e classifiche
          </Link>
        </div>
      </section>
      <section className="grid-3">
        <div className="panel">
          <h3>Giocatori</h3>
          <p className="muted">Profilo, card, clip fino a 60 secondi, storia della carriera. Controlli privacy granulari.</p>
        </div>
        <div className="panel">
          <h3>Club</h3>
          <p className="muted">Area club con staff illimitato, rose e verifica dei dati. In arrivo.</p>
        </div>
        <div className="panel">
          <h3>Genitori</h3>
          <p className="muted">
            Per i giocatori 13–17 anni il profilo diventa pubblico solo con l’approvazione di un genitore o tutore.{' '}
            <Link href="/guardian">Area genitori</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
