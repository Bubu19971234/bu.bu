# AI Som: stato e cosa manca (26/11/2026, dopo il controllo di sicurezza e il test d'uso)

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
