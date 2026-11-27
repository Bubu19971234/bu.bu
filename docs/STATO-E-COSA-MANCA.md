# AI Som: stato al 27/11/2026 (sera)

## Fatto oggi
- **Regole di sicurezza del database:** applicate e verificate con tre attacchi di prova, tutti respinti.
- **Richieste del legale:** allergie non inviate al fornitore dell'AI, IP mai in chiaro, doppia accettazione dei termini (anche al pagamento diretto), esportazione dei dati, regime forfettario.
- **Testi legali:** pubblicati su `/privacy`, `/termini`, `/accordo-dati` con i dati del Registro Imprese (sorgenti in `ai-som-saas/content/legale`).
- **Pagina menù per iPad:** sezioni a sinistra, piatti su due colonne.
- **Pulizia:** cancellati 8 locali di prova e 8 account; restano «Da Marco», «Locale di prova» e il dimostrativo «Kintsugi Bistrot» (`/locale/kintsugi-bistrot-demo`), attivo, tradotto in 8 lingue, con bartender.

## Ancora aperto
1. ~~Stripe~~ **Chiuso il 27/11:** pagamento reale funzionante dalla produzione.
   - Prodotto «AI Som – Abbonamento» con 39,90 €/mese (`aisom_mensile`) e 390 €/anno (`aisom_annuale`); i prezzi vecchi da 35 e 350 € sono archiviati.
   - Prova dal vero: pagamento da `/attiva`, locale attivato dal webhook, account creato, email con il link per la password arrivata, accettazione dei termini v4 e delle clausole registrata. Nessun errore nei registri di Vercel.
   - Codice FONDATORI: 10 € di sconto per 12 mesi, limitato al prodotto (Stripe non consente di limitarlo a un singolo prezzo), 20 utilizzi.
   - Da fare: chiudere l'abbonamento del locale usato per la prova, se era solo una prova; provare «Abbonamento e fatture» (portale) dal pannello.
2. ~~Piano di Vercel~~ **Chiuso:** il piano è Pro (confermato dal titolare il 27/11). L'accordo sul trattamento dei dati di Vercel si applica e l'uso commerciale è consentito. I registri tecnici durano un giorno: il testo dell'informativa lo copre già.
3. **Visura del 28/04/2026 (documento T 649033801): dati dei testi legali confermati.** Denominazione, sede, partita IVA, REA PT-614875 e PEC oluvida@pec.it coincidono con quanto pubblicato: nessuna modifica ai testi.
   - **Attività registrate:** grafica di pagine web (74.12.01, prevalente dal 05/05/2025), campagne di marketing e servizi pubblicitari (73.11.02), commercio su internet di cosmetici (47.75.00).
   - **Da chiedere al commercialista:** nessuno dei tre codici descrive la vendita di un software in abbonamento. Valutare l'aggiunta di un codice per software o servizi informatici prima di fatturare gli abbonamenti, anche per il coefficiente del forfettario.
   - **Regime forfettario (RF19)** e invio allo SdI tramite intermediario confermati dalla fattura n. 17 del 07/07/2026.
4. **Prova gratuita:** ancora chiusa. Si apre impostando `PROVA_APERTA=1` e `NEXT_PUBLIC_PROVA_APERTA=1` quando Stripe funziona.
5. **Apple:** in attesa della verifica dell'identità; poi i 4 segreti su GitHub per TestFlight.
6. **Google Play:** account da aprire con il D-U-N-S 507652847.
7. **Database condiviso:** il progetto Supabase si chiama «check-in» e ospita anche un'altra applicazione. Funziona, ma per AI Som sarebbe più pulito un progetto dedicato.
8. **File orfani:** 3 file della copia del sito di un locale di prova cancellato restano nell'archivio `menu-clones`.
9. **Token da revocare a lavori finiti:** Supabase, Clarity e (quando inserita) Stripe, nell'ambiente «Predefinito».

---

## Storico: stato del 26/11/2026

### AI Som: stato e cosa manca (26/11/2026, dopo il controllo di sicurezza e il test d'uso)

## 1. Verificato oggi

| Cosa | Esito |
|---|---|
| Tentativi di attacco sul sito di produzione | 12 su 12 respinti |
| Percorso completo da ristoratore nuovo (telefono simulato) | registrazione → lettura PDF in 22–24 s → salvataggio → allergeni → schede dei vini → consiglio in 2,0 s → QR → cancellazione dell'account |
| Bartender visto dal titolare in prova | domanda «Cosa vuoi bere?», consiglio in 2,5 s |
| Home: riga «allergeni da confermare» | visibile dopo 2,8 s |
| Una sola prova gratuita per account | secondo locale → lettura del menù rifiutata |
| Cancellazione dell'account con abbonamento | 7 test automatici (disdetta Stripe prima; se Stripe non risponde non si cancella nulla) |
| Test automatici | 217 superati |

## 2. Bloccanti: senza questi non si può vendere

1. **Stripe non ancora in modalità reale.**
   - I prezzi nuovi (39,90 e 390) esistono solo in modalità di prova, nell'account condiviso con gli altri siti. In produzione il pagamento resta **chiuso**: il sito vede ancora i prezzi vecchi (35 e 350) e non apre il checkout se l'importo non coincide con il listino.
   - Da fare: account Stripe nuovo solo per AI Som, configurato con il prompt di `STORE-STRIPE-DUNS.md` (sezione 1), poi le due chiavi su Vercel e una prova reale a 0 € con il codice sconto.
   - Stripe Tax spento finché il commercialista non conferma il regime (forfettario o ordinario).
   - In produzione: prezzi trovati per lookup key (niente ID da copiare su Vercel), checkout in italiano con partita IVA, voce «Abbonamento e fatture» nel pannello, locale acceso durante i tentativi di pagamento.
2. **Testi legali.** `NEXT_PUBLIC_PRIVACY_URL` e `NEXT_PUBLIC_TERMINI_URL` non sono impostate: alla registrazione si accettano termini che non si possono leggere. Servono i testi approvati dall'avvocato, pubblicati, e i due link su Vercel.
3. **Prova gratuita chiusa.** `PROVA_APERTA` e `NEXT_PUBLIC_PROVA_APERTA` non sono impostate: in produzione nessuno può registrarsi da solo. È voluto finché non ci sono i testi legali; poi vanno messe a `1`.
4. **Fattura elettronica (SdI).** Stripe non la invia: serve un collegamento (Fatture in Cloud, A-Cube…) e la conferma del commercialista sull'IVA. `STRIPE_TAX` non è impostata.
5. **Regole del database da applicare** (`supabase-sicurezza-2026-11-26.sql` nel repository dell'app, punti 2–4). Il controllo automatico ha bloccato l'esecuzione da qui: vanno incollate nell'editor SQL di Supabase. Finché non si applicano:
   - un utente può ancora creare righe «locale» scrivendo direttamente nel database (senza quota di AI, ma sporca i dati);
   - il titolare può scrivere i vini direttamente, saltando il limite del piano;
   - il titolare può riscrivere la data del proprio consenso ai termini.

## 3. Per pubblicare sugli store

1. Apple Developer Program: **fatto** il 26/11/2026 (come persona). Google Play Console: da aprire, dopo la risposta sul D-U-N-S (`STORE-STRIPE-DUNS.md`, sezioni 3 e 3-bis).
2. Compilazione: **automatica su GitHub**, senza Mac (iOS verso TestFlight, Android APK e pacchetto per Play). Dettagli in `APP-STORE-PRONTEZZA.md`.
3. Prova su telefoni veri: finora tutto è stato provato su telefoni simulati.
4. Icona e schermata di avvio: **fatte**. Screenshot definitivi a ridosso dell'invio.
5. Scheda privacy (App Store) e Data safety (Google Play); classificazione per età (alcolici).
6. Account di prova per i revisori.
7. Notifiche (segnalazioni dei clienti, menù pronto): servono la chiave APNs di Apple e un progetto Firebase.
8. Google Play, account personale: test chiuso con 12 tester per 14 giorni.

## 4. Da completare nel prodotto

- **Grafica:** fatte Home, accesso, barra in basso, Altro, Menù, Carta, Clienti, QR e configurazione guidata. Mancano la modalità iPad a due colonne per il cliente e le rifiniture delle schermate secondarie (Abbinamenti, Grafica, Card, Anagrafica).
- **Accesso con Google e Apple:** codice pronto e spento; mancano le chiavi (`ACCESSO-GOOGLE-APPLE.md`). Nell'app servirà la versione nativa e la revoca Apple alla cancellazione dell'account.
- **Dominio:** il sito gira su `ai-som-saas.vercel.app`. Per usare `ai-som.it` va collegato il dominio a Vercel, impostato `NEXT_PUBLIC_SITE_URL` e aggiornato l'elenco degli indirizzi consentiti in Supabase.
- **Scheda «Marginalità · Non incluso»:** nascosta nell'app, ancora visibile sul sito.
- **Menù lunghi:** la lettura resta 20–26 s; oltre i 3 MB di PDF o le 10 foto va caricato a pezzi.

## 5. Pulizia e manutenzione

- Locali di prova nel database (11, tutti di test tranne «Da Marco» e «Locale di prova»): da cancellare a test finiti, con conferma.
- Token di Supabase nell'ambiente «Predefinito»: da revocare a lavori finiti.
- `PROVA_AGENT_TOKEN` su Vercel è salvato come variabile leggibile: conviene ricrearlo come «sensitive».
- Password minima in Supabase: 6 caratteri (il nostro modulo ne chiede 8). Si alza a 8 da Authentication → Policies.
- Chiave segreta di «Accedi con Apple» (quando ci sarà): scade ogni 6 mesi.
