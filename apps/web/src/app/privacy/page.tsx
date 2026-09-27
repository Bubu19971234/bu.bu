export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <div className="panel stack">
      <h1>Informativa privacy (bozza)</h1>
      <p className="muted">
        Documento provvisorio per il prototipo: la versione definitiva richiede revisione legale prima del lancio.
      </p>
      <ul>
        <li>La data di nascita completa non è mai pubblica: sul profilo compare solo l’anno.</li>
        <li>I profili dei minori (13–17) sono pubblicabili solo con consenso registrato di un genitore/tutore, revocabile.</li>
        <li>Non raccogliamo dati sanitari o sugli infortuni.</li>
        <li>Le valutazioni della card sono stime generate automaticamente (AI) e non misure certificate.</li>
        <li>Puoi chiedere la cancellazione dell’account direttamente dall’app.</li>
      </ul>
    </div>
  );
}
