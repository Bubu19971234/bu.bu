# Stripe, account degli store, D-U-N-S e compilazione delle app (26/11/2026)

**Stato:** Apple Developer Program: iscritto come persona il 26/11/2026. Google Play: da aprire (sezione 3-bis). Stripe: configurato solo in modalità di prova (sezione 1).

## 1. Prompt per configurare Stripe

**Prima di iniziare:**
- Usa un **account Stripe dedicato ad AI Som**. Quello attuale è condiviso con altri siti: funziona, ma ricevute, contabilità e controlli si mescolano.
- Fai tutto prima in **modalità di test (Sandbox)**, prova un pagamento, poi ripeti in modalità reale.
- Le chiavi segrete non vanno mai in chat o in email.

Prompt da incollare nell'assistente della dashboard di Stripe, o da dare a chi configura:

```
Configura il mio account Stripe per "AI Som", servizio in abbonamento B2B venduto a ristoranti, enoteche e bar in Italia e nell'UE. Venditore: Oluvida di Tinti Marco (Italia). Lavora prima in modalità di test e dimmi quando ripetere in modalità reale.

1. PRODOTTO E PREZZI
   Crea il prodotto "AI Som — Abbonamento" (codice fiscale del prodotto: software as a service per uso aziendale) con due prezzi ricorrenti in EUR, comportamento fiscale "exclusive" (IVA esclusa):
   - 39,90 € al mese, lookup key "aisom_mensile";
   - 390,00 € all'anno, lookup key "aisom_annuale".
   Mostrami gli ID dei due prezzi (price_…).

2. IMPOSTE (Stripe Tax)
   Attiva Stripe Tax con la registrazione IVA in Italia. Al checkout raccogli la partita IVA del cliente: per le imprese UE con partita IVA valida si applica l'inversione contabile, per l'Italia l'IVA al 22%.

3. METODI DI PAGAMENTO
   Abilita carta, addebito diretto SEPA, Apple Pay e Google Pay sul sito. Non creare acquisti in app.

4. PORTALE CLIENTI
   Il cliente può: aggiornare il metodo di pagamento, scaricare le fatture, passare da mensile ad annuale e viceversa tra i due prezzi del prodotto, disdire con effetto a fine periodo. Lingua italiana.

5. PAGAMENTI NON RIUSCITI
   Smart Retries attivi ed email automatiche al cliente per carta scaduta o pagamento fallito. Dopo l'ultimo tentativo annulla l'abbonamento.

6. EMAIL E ASPETTO
   Ricevute e fatture in italiano, colore del marchio #B8323F, nome pubblico "AI Som", email di assistenza info@ai-som.it.

7. WEBHOOK
   Crea l'endpoint https://ai-som-saas.vercel.app/api/stripe/webhook con questi eventi:
   checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted.
   Dimmi dove trovo il "signing secret" dell'endpoint, senza mostrarlo.

8. CONTROLLO FINALE
   Elencami: ID dei due prezzi, stato di Stripe Tax, metodi di pagamento attivi, impostazioni del portale, eventi del webhook.
   Non modificare né cancellare altri prodotti, prezzi o webhook già presenti nell'account.
```

**Poi su Vercel** (Settings → Environment Variables → Production):

| Variabile | Valore |
|---|---|
| `STRIPE_SECRET_KEY` | chiave segreta live (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | signing secret dell'endpoint (`whsec_…`) |
| `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL` | non servono più se i prezzi hanno le lookup key (vedi sotto) |
| `STRIPE_TAX` | `1`, solo dopo aver attivato Stripe Tax |

Poi ridistribuisci e fai un pagamento di prova.

**Restano due cose fuori da Stripe:**
- la **fattura elettronica allo SdI**: Stripe non la invia, serve un collegamento (Fatture in Cloud, A-Cube o simili);
- la conferma del commercialista sull'IVA.

### Dopo la prova in modalità di test (26/11/2026)

L'agente di Stripe ha configurato tutto in modalità di prova **nell'account condiviso con gli altri siti**. Prima di passare in modalità reale:

- **Usa un account Stripe nuovo, solo per AI Som.** Nome pubblico, colore, email di assistenza, tentativi sui pagamenti falliti, portale clienti e metodi di pagamento valgono per tutto l'account: impostarli per AI Som nell'account condiviso li cambierebbe anche per gli altri siti. Nessun locale ha oggi un abbonamento collegato (verificato nel database), quindi non c'è nulla da migrare.
  - Come: in Stripe, menù dell'account in alto a sinistra → **Nuovo account** → nome «AI Som» → completa l'attivazione con gli stessi dati dell'impresa.
- **Stripe Tax resta spento** finché il commercialista non conferma il regime. In regime forfettario l'IVA non si applica e la registrazione IVA su Stripe Tax sarebbe sbagliata. Sul sito il calcolo dell'IVA si accende solo con `STRIPE_TAX=1`.
- **La prova completa in modalità di test non si può fare dal sito**: il sito usa le chiavi reali e non vede i prezzi di prova (verificato: la ricerca per lookup key non trova nulla). Si prova in modalità reale con un codice sconto del 100%, a costo zero.
- **Gli ID dei prezzi non vanno più copiati su Vercel**: il sito cerca i prezzi per lookup key (`aisom_mensile`, `aisom_annuale`) e controlla che l'importo sia quello del listino. Vale da quando la modifica è pubblicata (ramo `claude/stripe-chiavi-portale`).
- **Nel pannello c'è «Abbonamento e fatture»** (Altro → Account, solo sul sito e solo per chi ha pagato online): apre il portale clienti di Stripe. Stessa modifica.

Prompt per l'agente di Stripe, **da usare nell'account nuovo**:

```
Stai lavorando in un account Stripe nuovo, dedicato solo ad "AI Som" (abbonamento B2B per ristoranti, Italia e UE). Configuralo in modalità reale con queste decisioni. Non mostrare mai chiavi segrete.

1. PRODOTTO E PREZZI
   Prodotto "AI Som — Abbonamento" (software as a service per uso aziendale), due prezzi ricorrenti in EUR, IVA esclusa:
   - 39,90 € al mese, lookup key "aisom_mensile";
   - 390,00 € all'anno, lookup key "aisom_annuale".
   Le lookup key devono essere esattamente queste: il sito trova i prezzi così.

2. IMPOSTE
   NON attivare Stripe Tax e non registrare l'Italia: aspetto la conferma del commercialista sul regime fiscale. Te lo dirò io.

3. METODI DI PAGAMENTO
   Attivi solo: carta, addebito SEPA, Apple Pay, Google Pay, Link. Disattiva tutti gli altri.
   Registra il dominio ai-som-saas.vercel.app per Apple Pay e Google Pay.

4. PORTALE CLIENTI
   Aggiornamento del metodo di pagamento, fatture scaricabili, cambio solo tra i due prezzi del prodotto, disdetta con effetto a fine periodo.
   Cambio piano: da mensile ad annuale subito, con calcolo proporzionale; da annuale a mensile a fine periodo, senza rimborsi o accrediti.

5. PAGAMENTI NON RIUSCITI
   Smart Retries attivi, email automatiche al cliente per carta scaduta e pagamento fallito, abbonamento annullato dopo l'ultimo tentativo.

6. EMAIL E ASPETTO
   Nome pubblico "AI Som", colore #B8323F, assistenza info@ai-som.it, ricevute e fatture in italiano.

7. WEBHOOK
   Endpoint https://ai-som-saas.vercel.app/api/stripe/webhook con gli eventi:
   checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted.
   Dimmi dove trovo il signing secret, senza mostrarlo.

8. CODICE PER LA PROVA
   Crea un codice promozionale "PROVA100": sconto 100%, durata "una volta", massimo 1 utilizzo, scadenza tra 7 giorni. Mi serve per un pagamento di prova reale a 0 €.

9. CONTROLLO FINALE
   Elencami: ID e lookup key dei due prezzi, stato di Stripe Tax (deve essere spento), metodi attivi, impostazioni del portale, eventi del webhook, codice promozionale.
```

Nell'account vecchio basta una riga all'agente: «Disattiva l'endpoint webhook "AI Som SaaS" creato in modalità di prova: punta al sito reale, che usa le chiavi reali, quindi ogni consegna fallirebbe. Non toccare nient'altro.»

**Poi su Vercel** (Production): `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` dell'account nuovo, e ridistribuisci. Le chiavi si inseriscono solo nel pannello di Vercel, mai in chat.

**Prova reale a 0 €:** registra un locale di prova → «Attiva abbonamento» → codice `PROVA100` → controlla che il locale diventi attivo, che arrivi l'email, che «Abbonamento e fatture» apra il portale e che la disdetta spenga il locale a fine periodo.

**Due scelte ancora aperte:**
- **Primo pagamento fallito:** oggi il sito spegne il locale al primo addebito non riuscito e lo riaccende quando il pagamento va a buon fine. Con i tentativi automatici attivi conviene lasciarlo acceso fino all'annullamento dell'abbonamento: un ristorante non resta senza menù per una carta scaduta.
- **Regime forfettario:** se è il tuo caso, sul sito va tolta la dicitura «IVA esclusa» accanto ai prezzi.

## 2. Account degli store: link e costi

| | Link | Costo |
|---|---|---|
| Apple Developer Program | <https://developer.apple.com/programs/enroll/> | 99 USD/anno [Certo] (in euro secondo il listino Apple del momento) |
| Google Play Console | <https://play.google.com/console/signup> | 25 USD una volta sola [Probabile] |

### Cosa cambia per una ditta individuale [Certo, dalle pagine ufficiali]
- **Apple:**
  - chi ha una ditta individuale si iscrive **come persona**, e non serve il D-U-N-S;
  - sull'App Store come venditore compare il tuo **nome e cognome**;
  - l'iscrizione come organizzazione (nome dell'azienda come venditore) è solo per le società con personalità giuridica, per esempio SRL o SRLS;
  - Apple non accetta ditte individuali, nomi commerciali o insegne.
  - Fonti: [iscrizione](https://developer.apple.com/programs/enroll/), [D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/).
- **Google:**
  - **Account personale:** compare il tuo nome. Per gli account personali nuovi serve un **test chiuso con almeno 12 tester per 14 giorni consecutivi** prima di pubblicare ([requisiti](https://support.google.com/googleplay/android-developer/answer/14151465)).
  - **Account organizzazione:** compare il nome dell'impresa e il test con 12 tester non serve, ma il **D-U-N-S è obbligatorio**. Ottenerlo può richiedere 30 giorni o più. Nome e indirizzo devono coincidere con il profilo pagamenti Google ([tipi di account](https://support.google.com/googleplay/android-developer/answer/13634885)).

**Il mio consiglio** [Ipotesi sulle tue priorità]:
- **Se vuoi pubblicare presto:** Apple come persona, Google come persona con 12 ristoratori o conoscenti come tester per 14 giorni (utile anche come prova sul campo).
- **Se vuoi "AI Som" o il nome dell'azienda come venditore su entrambi gli store:** serve una SRL o SRLS, poi il D-U-N-S, poi le iscrizioni come organizzazione. È una decisione da prendere con il commercialista.

## 3. D-U-N-S: quando serve e come richiederlo

**Quando serve** [Certo per Apple, dalle pagine ufficiali; Probabile per Google]:
- **Apple:** non serve. Una ditta individuale si iscrive come persona, ed è quello che hai fatto il 26/11/2026.
- **Google Play, account personale:** non serve. Servono però 12 tester per 14 giorni e compare il tuo nome.
- **Google Play, account organizzazione:** è obbligatorio. È l'unico motivo per chiederlo.
- **Non verificato:** Google non scrive se un'impresa individuale può aprire l'account organizzazione. Dun & Bradstreet censisce anche le ditte individuali [Probabile], ma l'esito si saprà solo provando. La richiesta è gratuita.

**Prompt per l'agente del browser** (che altrimenti risponde «non serve», pensando ad Apple):

```
Contesto (sono fatti, non ridiscuterli):
- Sono il titolare di una ditta individuale italiana iscritta al Registro delle Imprese.
- Su Apple Developer Program sono già iscritto come persona fisica: lì il D-U-N-S non serve e non te lo chiedo per Apple.
- Il D-U-N-S mi serve per un altro scopo: aprire Google Play Console come account "Organizzazione". Google lo richiede obbligatoriamente per quel tipo di account (pagina ufficiale: https://support.google.com/googleplay/android-developer/answer/13628312). Con l'account personale dovrei invece fare un test chiuso con 12 tester per 14 giorni e pubblicare con il mio nome e cognome.

Compito, in quest'ordine:
1. Apri la pagina di Google qui sopra e riportami, citandola, la frase sul D-U-N-S per gli account organizzazione. Se la pagina dice una cosa diversa da quella che ho scritto, fermati e mostrami il testo.
2. Verifica se la mia ditta ha già un D-U-N-S: usa solo lo strumento di ricerca ufficiale di Dun & Bradstreet, raggiunto dal link che trovi nella pagina di Google (nessun sito intermediario). Chiedimi ragione sociale, partita IVA e indirizzo della sede come da visura: non inventarli e non dedurli.
3. Se il numero esiste: mostrami numero, denominazione e indirizzo registrati e dimmi se coincidono carattere per carattere con i dati che ti ho dato. Non modificare nulla.
4. Se non esiste: avvia la richiesta gratuita dallo stesso sito ufficiale, compila con i miei dati, fermati prima dell'invio e mostrami il riepilogo. Invia solo dopo il mio "conferma".

Regole:
- Il D-U-N-S è gratuito: non pagare nulla, rifiuta procedure accelerate, report di credito e pacchetti a pagamento.
- Non creare l'account Google Play, non inserire dati di pagamento, non accettare contratti al posto mio.
- Se Dun & Bradstreet scrive che una ditta individuale non può ottenere il numero, o Google che un'impresa individuale non può aprire un account organizzazione, riportami il testo esatto con il link e fermati: non cercare vie alternative.
- Se una cosa non la trovi scritta in una pagina ufficiale, dimmi "non verificato" invece di dedurla.

Alla fine dammi: esito (trovato / richiesto / non possibile), dati registrati, tempi indicati dal sito, prossimo passo.
```

**I passi, se lo fai a mano:**
1. Dalla [pagina di Google sui dati richiesti](https://support.google.com/googleplay/android-developer/answer/13628312) segui il link a Dun & Bradstreet e **cerca prima se l'impresa ha già un numero**: spesso è già assegnato.
2. Se non c'è, invia la richiesta dallo stesso strumento, gratuitamente. Servono:
   - ragione sociale esatta come in visura;
   - indirizzo della sede legale e indirizzo postale;
   - i tuoi recapiti di lavoro;
   - visura camerale a portata di mano, perché Dun & Bradstreet può chiamarti o scriverti per verificare.
3. Attendi l'email con il numero: da qualche giorno a oltre 30 giorni [Probabile]. Poi Apple può impiegare qualche giorno a vederlo nel suo sistema [Ipotesi].
4. Nome e indirizzo del D-U-N-S devono coincidere con quelli del profilo pagamenti di Google.
5. **Non pagare servizi di terze parti** che si offrono di ottenerlo: è gratuito.

Problemi noti segnalati dagli sviluppatori: lo strumento di ricerca a volte non funziona con Chrome (con Safari sì); il nome nel D-U-N-S deve coincidere esattamente con quello dell'iscrizione.

## 3-bis. Aprire Google Play Console

**Prima scegli il tipo di account** (dopo è laborioso cambiarlo [Probabile]):

| | Personale | Organizzazione |
|---|---|---|
| D-U-N-S | non serve | obbligatorio |
| Nome mostrato | il tuo nome e cognome | il nome dell'impresa |
| Prima di pubblicare | test chiuso: 12 tester iscritti per 14 giorni di fila | nessun test obbligatorio |
| Tempi | subito | dopo l'arrivo del D-U-N-S (fino a 30 giorni) |

**Consiglio:** chiedi oggi il D-U-N-S e apri l'account quando arriva la risposta. L'app Android non è ancora compilata e mancano icone, screenshot e testi legali: l'attesa non rallenta nulla. Se dopo 2–3 settimane non c'è risposta, o la risposta è negativa, apri l'account personale e fai il test con 12 tester.

**Cosa serve per aprirlo** ([requisiti ufficiali](https://support.google.com/googleplay/android-developer/answer/13628312)):
1. Un account Google dedicato al lavoro, con verifica in due passaggi.
2. Iscrizione da <https://play.google.com/console/signup>; quota di registrazione una tantum (25 USD [Probabile]).
3. Nome sviluppatore (quello pubblico: «AI Som»), nome legale, indirizzo legale, email e telefono di contatto: email e telefono si verificano con un codice.
4. Verifica dell'identità con un documento; per l'organizzazione anche il D-U-N-S e i documenti dell'impresa.
5. Dopo la verifica: crea l'app «AI Som», identificativo `it.aisom.app`.

**Test chiuso** (solo account personale; [regole](https://support.google.com/googleplay/android-developer/answer/14151465)): 12 tester con account Google, iscritti senza interruzioni per 14 giorni; chi esce e rientra riparte da zero. Poi si chiede l'accesso alla produzione; l'esame dura di norma fino a 7 giorni.

## 4. Compilare le app (dopo l'iscrizione agli store)
Il codice è pronto nel repository `ai-som-saas`: progetti Capacitor 8 in `ios/` e `android/`, identificativo `it.aisom.app`.

- **iOS:** serve un **Mac con Xcode**. In alternativa un servizio di compilazione nel cloud (per esempio Codemagic) che firma e carica su App Store Connect.
  - Passi: `npm install` → `npx cap sync ios` → apri `ios/App/App.xcodeproj` → imposta il Team → Product → Archive → carica su TestFlight.
- **Android:** **Android Studio** (Windows, Mac o Linux).
  - Passi: `npx cap sync android` → apri la cartella `android/` → Build → Generate Signed App Bundle → carica il file `.aab` su Play Console (test chiuso).
  - **Conserva la chiave di firma**: senza, non potrai più aggiornare l'app.
- **Ancora da fare prima dell'invio:**
  - icone e schermata di avvio con il logo definitivo;
  - accesso con Apple e Google in versione nativa, se li attivi;
  - notifiche: servono la chiave APNs di Apple e un progetto Firebase per Android;
  - screenshot per gli store;
  - scheda privacy (App Store) e Data safety (Play);
  - account di prova per i revisori.
