# Accordo sul trattamento dei dati personali (art. 28 GDPR)

Versione 1 del 27 novembre 2026. Fa parte dei termini di servizio di AI Som (articolo 16) ed è accettato insieme a essi.


---

## Parti
- **Titolare del trattamento:** il locale che usa AI Som (il «Locale»).
- **Responsabile del trattamento:** **Oluvida di Tinti Marco**, impresa individuale · Via Giuseppe Mazzini 312, 51036 Larciano (PT) · partita IVA 02075290474 · REA PT-614875 · PEC oluvida@pec.it («AI Som»).

## 1. Oggetto e ruoli
Questo accordo regola i trattamenti che AI Som svolge **per conto del Locale** nel fornire il servizio.

| Trattamento | Ruolo di AI Som |
|---|---|
| Dati dei clienti che usano il menù, il sommelier e il bartender del Locale | Responsabile |
| Dati del personale del Locale registrati nel servizio (per esempio chi conferma gli allergeni) | Responsabile |
| Dati personali eventualmente presenti nei contenuti caricati dal Locale | Responsabile |
| Account, abbonamento, fatturazione, assistenza | Titolare (fuori da questo accordo: vedi informativa privacy) |
| Sicurezza del servizio e prevenzione degli abusi | Titolare (fuori da questo accordo) |

## 2. Descrizione del trattamento

| | |
|---|---|
| **Finalità** | Mostrare il menù digitale, calcolare i consigli su vini e drink, raccogliere le segnalazioni, fornire al Locale le statistiche |
| **Natura** | Raccolta, registrazione, elaborazione automatica, conservazione, cancellazione |
| **Durata** | Per la durata del contratto e fino alla cancellazione prevista all'articolo 10 |
| **Interessati** | Clienti del Locale; personale del Locale |
| **Dati dei clienti** | Piatti scelti, gusti indicati, lingua, numero del tavolo, bevanda scelta, testo delle segnalazioni |
| **Dati del personale** | Nominativo o email di chi conferma gli allergeni, data e ora della conferma |
| **Categorie particolari** | Allergie o intolleranze indicate dal cliente al bartender: usate solo per calcolare la risposta, **non salvate**, non inviate a sub-responsabili, non collegate a una persona |
| **Dati non raccolti** | Nome, email, telefono dei clienti; indirizzo IP in chiaro |

## 3. Istruzioni del Locale
- AI Som tratta i dati solo su istruzione documentata del Locale: il contratto, questo accordo e le impostazioni che il Locale sceglie nel pannello.
- Se ritiene che un'istruzione violi la legge, AI Som lo comunica al Locale.

## 4. Riservatezza
Le persone autorizzate da AI Som a trattare i dati sono vincolate alla riservatezza.

## 5. Misure di sicurezza
AI Som applica le misure descritte nell'Allegato 2 e le aggiorna tenendo conto dei rischi.

## 6. Sub-responsabili
- Il Locale autorizza in via generale AI Som a servirsi dei sub-responsabili elencati nell'Allegato 1.
- AI Som comunica l'aggiunta o la sostituzione di un sub-responsabile con almeno **15 giorni** di anticipo; il Locale può opporsi per motivi fondati e, se non si trova una soluzione, recedere dal contratto.
- AI Som impone ai sub-responsabili obblighi equivalenti a quelli di questo accordo e ne risponde verso il Locale.

## 7. Trasferimenti fuori dallo Spazio economico europeo
- Database e hosting sono nell'Unione europea.
- L'elaborazione con intelligenza artificiale (Anthropic) può avvenire fuori dallo Spazio economico europeo: il fornitore non offre oggi un'opzione limitata all'Unione europea.
- Il trasferimento avviene sulla base delle clausole contrattuali standard della Commissione europea incorporate nell'accordo di Anthropic. Gli altri fornitori con sede negli Stati Uniti operano sulla base delle clausole contrattuali standard e, dove certificati, dell'EU-US Data Privacy Framework.

## 8. Assistenza al Locale
AI Som assiste il Locale, per quanto possibile:
- nel rispondere alle richieste degli interessati (accesso, cancellazione e altri diritti);
- negli obblighi di sicurezza, di notifica delle violazioni e di valutazione d'impatto.

## 9. Violazioni dei dati
AI Som informa il Locale senza ingiustificato ritardo, e comunque entro **48 ore** da quando ne viene a conoscenza, di ogni violazione dei dati trattati per suo conto, fornendo le informazioni disponibili.

## 10. Cancellazione e restituzione
- Il Locale può esportare menù, carta e anagrafica dal pannello in qualsiasi momento.
- Alla cancellazione dell'account i dati trattati per conto del Locale sono eliminati subito dagli archivi attivi.
- Le copie di sicurezza del fornitore del database si sovrascrivono entro **30 giorni**.
- Restano i dati che la legge impone di conservare.

## 11. Verifiche
- AI Som mette a disposizione le informazioni necessarie a dimostrare il rispetto di questo accordo.
- Il Locale può chiedere una verifica, con preavviso di **30 giorni**, non più di una volta l'anno, a proprie spese e senza compromettere la sicurezza degli altri clienti.

## 12. Responsabilità e durata
- Si applicano i limiti di responsabilità dei termini di servizio, nei limiti consentiti dalla legge.
- L'accordo dura quanto il contratto e fino alla cancellazione dei dati.

---

## Allegato 1: sub-responsabili

| Fornitore | Servizio | Luogo del trattamento |
|---|---|---|
| Supabase Inc. | Database, accessi, archivio dei file | Unione europea (Irlanda) |
| Vercel Inc. | Hosting dell'applicazione | Unione europea (Dublino) |
| Anthropic PBC | Lettura dei menù, traduzioni, frasi dei consigli | Stati Uniti o altra area |
| Resend (Plus Five Five, Inc.) | Email di servizio | Stati Uniti |

Stripe tratta i dati di pagamento del Locale come fornitore di AI Som in qualità di titolare: non è un sub-responsabile di questo accordo.

## Allegato 2: misure di sicurezza

- **Cifratura:** connessioni cifrate (HTTPS); dati e copie di sicurezza cifrati negli archivi del fornitore del database (AES-256); password conservate solo in forma cifrata.
- **Separazione dei dati:** ogni locale accede solo ai propri dati, con regole applicate nel database e controlli nelle funzioni dell'applicazione.
- **Accessi:** chiavi di servizio conservate come segreti; accesso amministrativo riservato al titolare di Oluvida.
- **Minimizzazione:**
  - i clienti non si registrano;
  - l'indirizzo IP non viene salvato: solo un'impronta non reversibile, diversa ogni giorno, cancellata il giorno successivo;
  - le allergie indicate dai clienti non vengono salvate né inviate ai sub-responsabili;
  - al fornitore dell'intelligenza artificiale non si inviano dati dell'account.
- **Limiti d'uso:** limiti giornalieri per prevenire abusi e consumi anomali.
- **Verifiche:** test automatici a ogni modifica del software; controlli periodici di sicurezza sulle regole di accesso.
- **Copie di sicurezza:** a cura del fornitore del database, cifrate, conservate per un massimo di 30 giorni.
- **Cancellazione:** funzione di cancellazione dell'account disponibile al titolare del locale, con effetto immediato.
