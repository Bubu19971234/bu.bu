# Stripe, account degli store, D-U-N-S e compilazione delle app (26/11/2026)

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
| `STRIPE_PRICE_STARTER_MONTHLY` | ID del prezzo mensile |
| `STRIPE_PRICE_STARTER_ANNUAL` | ID del prezzo annuale |
| `STRIPE_TAX` | `1`, solo dopo aver attivato Stripe Tax |

Poi ridistribuisci e fai un pagamento di prova.

**Restano due cose fuori da Stripe:**
- la **fattura elettronica allo SdI**: Stripe non la invia, serve un collegamento (Fatture in Cloud, A-Cube o simili);
- la conferma del commercialista sull'IVA.

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

## 3. Come richiedere il D-U-N-S (solo per una società: SRL, SRLS…)
1. Apri lo strumento di Apple dalla pagina [D-U-N-S Number](https://developer.apple.com/help/account/membership/D-U-N-S/) e **cerca prima se la società ha già un numero**: spesso Dun & Bradstreet l'ha già assegnato.
2. Se non c'è, invia la richiesta dallo stesso strumento, gratuitamente. Servono:
   - ragione sociale esatta come in visura;
   - indirizzo della sede legale e indirizzo postale;
   - i tuoi recapiti di lavoro;
   - visura camerale a portata di mano, perché Dun & Bradstreet può chiamarti o scriverti per verificare.
3. Attendi l'email con il numero: da qualche giorno a oltre 30 giorni [Probabile]. Poi Apple può impiegare qualche giorno a vederlo nel suo sistema [Ipotesi].
4. Usa lo stesso numero anche per l'account organizzazione di Google Play.
5. **Non pagare servizi di terze parti** che si offrono di ottenerlo: è gratuito.

Problemi noti segnalati dagli sviluppatori: lo strumento di ricerca a volte non funziona con Chrome (con Safari sì); il nome nel D-U-N-S deve coincidere esattamente con quello dell'iscrizione.

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
