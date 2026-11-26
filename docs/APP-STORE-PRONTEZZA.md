# App iOS e Android: cosa è pronto, cosa manca, come provarle (26/11/2026)

## 1. Stato in breve

| Cosa | Stato |
|---|---|
| App Android | **Compila** (qui e su GitHub). File di prova `AI-Som-prova.apk` pronto da installare. Pacchetto per Play (`.aab`) compila; va firmato quando c'è l'account. |
| App iOS | **Compila** su GitHub (Xcode 26.6, senza Mac). Per installarla serve TestFlight: mancano 4 dati del tuo account Apple (sezione 3). |
| Icona e schermata di avvio | **Fatte**: disegno originale (calice + scintilla). Prima c'era il segnaposto di Capacitor, che Apple rifiuta; il sito usava l'emoji del calice di Apple, non utilizzabile come marchio. |
| Prezzi e acquisti dentro l'app | **Assenti**, verificato simulando l'app: nessun prezzo né pulsante di pagamento in Home. |
| Cancellazione dell'account | **Fatta** nell'app (Altro → Cancella account) e spiegata nella pagina pubblica `/elimina-account`. |
| Pagina di assistenza | **Fatta**: `/assistenza`. |
| Schermate Menù, Carta, Clienti, QR, configurazione guidata | **Rifatte** nello stile di Home e pubblicate: niente tabelle fuori schermo, niente selettore di file in inglese. Provate su telefono simulato, in produzione. |
| Provate su telefoni veri | **No.** Finora solo simulazioni: è il primo passo da fare. |

Tutto è in produzione dal 26/11/2026 (PR #30 e #31 del repository `ai-som-saas`).

## 2. Cosa manca prima dell'invio agli store

### Bloccanti
1. **Informativa privacy pubblicata.** Entrambi gli store chiedono il link. Dipende dai testi dell'avvocato.
2. **Prova su telefoni veri** (sezione 3).
3. **Account Google Play** (dopo la risposta sul D-U-N-S) e **scheda dell'app su App Store Connect** (sezione 4).
4. **Account dimostrativo per i revisori**: un locale attivo con menù e carta, con email e password da indicare nella scheda. Lo preparo io a ridosso dell'invio.

### Non bloccanti
- Rifiniture grafiche rimaste: schermate secondarie (Abbinamenti, Grafica, Card, Anagrafica) e menù laterale su iPad e computer, che usano ancora in parte lo stile precedente. Resta il rischio, non eliminabile del tutto, che Apple consideri l'app «un sito in una cornice» (regola 4.2) [Ipotesi sull'esito].
- Accesso con Apple e Google: spento, quindi non richiesto. Se un giorno accendi Google, Apple pretende anche «Accedi con Apple» (regola 4.8).
- Notifiche: non previste nella prima versione.
- Dominio: l'app apre `ai-som-saas.vercel.app`. Passare a `ai-som.it` in seguito richiede un aggiornamento dell'app; l'indirizzo attuale continua comunque a funzionare.

## 3. Come provarle sul telefono

### Android (subito)
1. Apri sul telefono Android il file `AI-Som-prova.apk`.
2. Android chiede di consentire l'installazione da questa origine: consenti, poi **Installa**.
3. Apri «AI Som» ed entra con il tuo account.

È una versione di prova: non si aggiorna da sola e non è quella da mandare a Google.

### iPhone (TestFlight)
Serve una sola volta, dal computer:
1. **App Store Connect** → Utenti e accessi → **Integrazioni** → Chiavi API di App Store Connect → genera una chiave con ruolo **Admin** e scarica il file `.p8` (si scarica una volta sola).
2. Annota **Key ID** e **Issuer ID** (stessa pagina) e il **Team ID** (developer.apple.com → Membership details).
3. **App Store Connect** → App → **+** → Nuova app: piattaforma iOS, nome «AI Som», lingua italiano, ID bundle `it.aisom.app`, SKU `aisom`. Se l'ID bundle non compare nell'elenco, registralo prima da developer.apple.com → Identifiers.
4. **GitHub** → repository `ai-som-saas` → Settings → Secrets and variables → Actions → New repository secret. Crea questi quattro:

   | Nome | Valore |
   |---|---|
   | `ASC_KEY_ID` | Key ID |
   | `ASC_ISSUER_ID` | Issuer ID |
   | `ASC_KEY_P8` | tutto il testo del file `.p8` |
   | `APPLE_TEAM_ID` | Team ID |

5. GitHub → **Actions** → «App iOS» → **Run workflow**. In circa 10 minuti la versione arriva su TestFlight.
6. Sul telefono installa l'app **TestFlight**, accedi con il tuo Apple ID e installa «AI Som».

Questi valori sono segreti: si inseriscono solo in GitHub, mai in chat o in email. Il caricamento firmato non è ancora stato eseguito: la prima esecuzione dirà se serve una correzione [Probabile che funzioni; la compilazione senza firma è riuscita].

### Cosa guardare nella prova
- Avvio: icona, schermata iniziale, tempo di apertura.
- Barra in basso e tasto Indietro (Android).
- Fotocamera: «fotografa le pagine» nella lettura del menù.
- Condivisione del link del locale.
- Senza rete: deve comparire «Sembra che manchi la connessione», non una pagina bianca.
- Tastiera: i campi non devono finire sotto la tastiera.

## 4. Invio agli store, quando tutto il resto è pronto

### App Store (Apple)
- **Scheda:** nome «AI Som», sottotitolo, descrizione, parole chiave (sezione 5), categoria «Food & Drink» (secondaria «Business»).
- **Indirizzi:** assistenza `https://ai-som-saas.vercel.app/assistenza`; privacy: il link dei testi legali.
- **Screenshot:** iPhone 6,9" (1320×2868) e iPad 13" (2064×2752). Una prima serie è già generata dalle schermate nuove; la rifaccio con il locale dimostrativo a ridosso dell'invio.
- **Privacy dell'app:** dati raccolti = email, nome del locale, contenuti caricati (menù, foto); collegati all'utente; non usati per tracciamento.
- **Classificazione per età:** riferimenti ad alcolici «poco frequenti».
- **Note per il revisore:** account dimostrativo; l'app è per ristoratori già clienti; l'abbonamento si attiva sul sito; nessun acquisto in app.

### Google Play
- **Scheda:** nome, descrizione breve e completa (sezione 5), icona 512×512, immagine in evidenza 1024×500, screenshot.
- **Sicurezza dei dati:** stessi dati della scheda Apple; cifrati in transito; cancellazione disponibile a `https://ai-som-saas.vercel.app/elimina-account`.
- **Classificazione dei contenuti:** questionario; riferimenti ad alcolici.
- **Firma:** chiave di caricamento da creare e conservare; Google custodisce la chiave dell'app.
- **Account personale:** prima della produzione, test chiuso con 12 tester per 14 giorni.

## 5. Testi per le schede (bozza)

- **Nome:** AI Som
- **Sottotitolo (30 caratteri):** Menù digitale e sommelier AI
- **Descrizione breve (Google, 80 caratteri):** Menù digitale, carta dei vini e consigli del sommelier AI per il tuo locale.
- **Parole chiave (Apple):** menù digitale,carta vini,sommelier,ristorante,QR menù,allergeni,abbinamento vino,enoteca,bar
- **Descrizione:**

  AI Som è lo strumento per ristoranti, enoteche e bar che vogliono un menù digitale curato e un sommelier sempre presente in sala.

  - Carica il menù da PDF, foto o dal tuo sito: l'AI lo legge e lo ordina per te.
  - Gli allergeni li confermi tu, piatto per piatto: l'AI non li deduce mai.
  - I clienti inquadrano il QR, scelgono i piatti e ricevono il consiglio sul vino dalla tua carta, in pochi secondi e in 8 lingue.
  - Bartender: cocktail e birre consigliati in base ai gusti del cliente.
  - Vedi cosa cercano i clienti e quali vini scelgono.
  - QR da stampare per ogni tavolo, oppure un iPad fisso al banco.

  L'app è riservata ai titolari dei locali. I clienti non installano nulla.

## 6. Ordine consigliato

1. Provi l'app su iPhone con TestFlight (sezione 3): servono i 4 dati in GitHub e la scheda dell'app su App Store Connect.
2. Avvocato → testi legali pubblicati.
3. Stripe in modalità reale nell'account dedicato (`STORE-STRIPE-DUNS.md`, sezione 1).
4. Account per i revisori, screenshot definitivi, schede compilate.
5. Invio: Apple (revisione di norma in pochi giorni), Google quando c'è l'account (test chiuso se è personale).
