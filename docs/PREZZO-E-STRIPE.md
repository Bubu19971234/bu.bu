# Prezzo di AI Som, Stripe e regole degli store (26/11/2026)

## 1. Tre verità da sapere prima del prezzo

1. **Le app non devono vendere l'abbonamento.** Se l'app per iPhone mostra prezzi o un pulsante "Abbonati", Apple impone il suo sistema di pagamento con commissione del 15–30% (il 15% vale con lo Small Business Program e per gli abbonamenti dopo il primo anno) **[Certo]**. Il percorso pulito:
   - l'abbonamento si compra **solo dal sito**, con Stripe;
   - l'app è un **accesso gratuito** a un servizio pagato altrove: regola Apple 3.1.3(f) "Free Stand-alone Apps", con anche la 3.1.3(c) per i servizi venduti a imprese;
   - nell'app **nessun prezzo, nessun pulsante d'acquisto, nessun link** al pagamento. Negli USA questo divieto è stato tolto, in Europa no **[Probabile]**.
   - Google Play: stesso schema, app di "solo consumo" senza acquisti in app **[Probabile: fonti secondarie, da confermare sulla pagina "Payments" di Google Play]**.
   - **Oggi l'app iOS non mostra né prezzi né acquisti [Certo, controllato nel codice]**. Il pannello web invece ha "Attiva l'abbonamento": se lo mostrerete dentro l'app (per esempio una WebView), va nascosto lì.
2. **Le fatture di Stripe non bastano in Italia.** Tra imprese la fattura elettronica deve passare dal Sistema di Interscambio (SdI); Stripe non lo fa **[Probabile, da confermare con il commercialista]**. Serve un collegamento Stripe → SdI, per esempio Fatture in Cloud, A-Cube o simili, a circa 10–30 €/mese **[Ipotesi sui costi]**.
3. **L'account Stripe è condiviso con altri tuoi siti [Certo, dal codice del webhook].** Funziona, ma per contabilità, ricevute e controlli degli store è più pulito un account Stripe dedicato ad AI Som.

## 2. Ragionamento sul prezzo

**Mercato** (prezzi pubblici, novembre 2026):
- Menù digitali con QR, senza AI: 10–40 €/mese. MenuDigitale.io 9,90 €; Doxmenu 12,99 €; One2one da 19,99 €; RenMenu 25–39 €; Qromo 39 € (29 € con l'annuale).
- Sommelier digitali con AI venduti come servizio in Italia: **non ho trovato un concorrente diretto con prezzi pubblici [Ipotesi: mercato poco presidiato]**.

**Cosa offre AI Som rispetto a un menù QR:**
- grafica del locale;
- 8 lingue;
- sommelier e bartender sui prodotti del locale;
- verifica degli allergeni e segnalazioni.

Il confronto naturale del ristoratore è con un menù QR da 10–20 €. Quindi il prezzo regge solo se il valore del sommelier si vede durante la prova gratuita.

**Valore per il locale** [Ipotesi]:
- 2 bottiglie in più a settimana con 15 € di margine l'una ≈ 120 €/mese di margine in più.
- Un cameriere esperto di vini costa oltre 30.000 €/anno.

**Nostri costi per locale:**
- fissi ≈ 2,9 €/mese (Stripe e infrastruttura con 20 clienti);
- AI ≈ 0,5 €/mese con un uso tipico, 6,7 € nel caso peggiore;
- collegamento SdI da aggiungere ai costi fissi.

**Opzioni:**

| Opzione | Pro | Contro |
|---|---|---|
| A. Un solo piano a 39 €/mese, 390 €/anno | Semplice; margine circa 90% | 39 € è il tetto dei menù QR: il valore va dimostrato nella prova |
| B. Due piani: "Menù" 24 € (menù con grafica e lingue) e "Sommelier" 49 € (tutto) | Entra anche chi vuole solo il menù; 49 € per chi vuole il sommelier | Più limiti da gestire; rischio che quasi tutti scelgano il piano basso |
| C. 49 €/mese, 490 €/anno | Posiziona AI Som come strumento di vendita, non come menù | Meno conversioni all'inizio senza recensioni e casi di successo |

**Decisione (26/11/2026): 39,90 €/mese o 390 €/anno, IVA esclusa.**

**Raccomandazione iniziale** [Ipotesi: senza dati di conversione reali]:
- **Opzione A a 39 €/mese o 390 €/anno, IVA esclusa.** 390 vale 2 mesi gratis ed è più leggibile di 385.
- **Prezzo "fondatori" per i primi 20 locali: 29 €/mese bloccato per 12 mesi**, in cambio di una recensione o di un caso di studio.
- Dopo 3 mesi si guardano i dati: se più del 25% delle prove diventa abbonamento si passa a 49 € per i nuovi clienti; se meno del 10%, si valuta il piano "Menù" dell'opzione B.

## 3. Configurazione di Stripe (dalla dashboard)

### Passi
1. **Prodotto** "AI Som — Abbonamento", con due prezzi ricorrenti in EUR:
   - **39,90 € al mese**, comportamento fiscale **IVA esclusa** ("exclusive");
   - **390,00 € all'anno**, IVA esclusa.

   Annota i due ID `price_…`.
2. **Codice promozionale "FONDATORI"** (facoltativo, da decidere): coupon da 10,90 € di sconto al mese (→ 29 €), durata 12 mesi, massimo 20 utilizzi. Il checkout accetta già i codici promozionali.
3. **Stripe Tax:**
   - attivalo;
   - aggiungi la registrazione IVA italiana;
   - per gli altri paesi UE lascia l'inversione contabile (le imprese UE con P.IVA valida pagano senza IVA).
4. **Portale clienti** (Impostazioni → Billing → Customer portal):
   - permetti di cambiare metodo di pagamento, scaricare le fatture e disdire **a fine periodo**;
   - permetti il passaggio mensile ↔ annuale tra i due prezzi.
5. **Metodi di pagamento:** carta, **addebito diretto SEPA** (molto usato dalle imprese), Apple Pay e Google Pay *sul sito*.
6. **Pagamenti non riusciti:** Smart Retries attivi, email automatiche al cliente. Dopo l'ultimo tentativo l'abbonamento si **annulla**: il nostro webhook gestisce `customer.subscription.deleted` e spegne il locale.
7. **Webhook** verso `https://<dominio>/api/stripe/webhook` con gli eventi gestiti dal codice:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
8. **Su Vercel:**
   - `STRIPE_PRICE_STARTER_MONTHLY` = ID del prezzo mensile;
   - `STRIPE_PRICE_STARTER_ANNUAL` = ID del prezzo annuale;
   - `STRIPE_TAX=1` **solo dopo** il passo 3;
   - `LISTINO` in `lib/piano.ts` è già aggiornato a 39,90/390.
9. **Fatturazione elettronica:** collegare Stripe a un servizio SdI (vedi verità n. 2).

### Prompt per l'assistente della dashboard di Stripe (o per chi la configura)
```
Configura il mio account Stripe per il servizio B2B "AI Som" venduto a ristoranti italiani ed europei:
1. Crea il prodotto "AI Som — Abbonamento" con due prezzi ricorrenti in EUR, comportamento fiscale "exclusive":
   39,90 € al mese e 390,00 € all'anno. Mostrami gli ID dei due prezzi.
2. (Facoltativo) Crea un coupon da 10,90 € di sconto, durata 12 mesi, e un codice promozionale "FONDATORI" con massimo 20 utilizzi.
3. Attiva Stripe Tax con registrazione IVA in Italia; per le imprese UE con partita IVA valida applica l'inversione contabile.
4. Configura il portale clienti: aggiornamento del metodo di pagamento, download fatture, disdetta a fine periodo,
   passaggio tra i due prezzi del prodotto.
5. Abilita come metodi di pagamento carta, addebito diretto SEPA, Apple Pay e Google Pay.
6. Attiva Smart Retries e le email per i pagamenti non riusciti; dopo l'ultimo tentativo annulla l'abbonamento.
7. Verifica che esista un endpoint webhook verso https://<dominio>/api/stripe/webhook con gli eventi
   checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted.
Non creare acquisti in app e non modificare altri prodotti già presenti nell'account.
```

## 4. Lista di controllo per gli store

| Requisito | Apple | Google | Stato |
|---|---|---|---|
| Nessun acquisto né link al pagamento nell'app | 3.1.1 / 3.1.3(f) | Payments policy | ✓ app iOS; da tenere |
| Cancellazione dell'account dall'app | 5.1.1(v) | Account deletion | **da fare** |
| Informativa privacy pubblicata e "etichette privacy" / Data safety | sì | sì | bozza pronta, da far rivedere |
| Classificazione d'età (riferimenti ad alcolici) | probabilmente 17+/18+ | contenuti per adulti | da compilare |
| Account di prova per i revisori | sì | sì | da preparare (locale di prova già attivo) |

**Fonti:**
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple, aggiornamento linee guida 2025 (USA)](https://developer.apple.com/news/?id=flmb6ri3)
- [Google Play, fatturazione alternativa USA](https://support.google.com/googleplay/android-developer/answer/16497028?hl=en)
- [Coda, politiche Google Play 2026](https://www.coda.co/blog/epic-v-google-policy-update-2026/)
- Prezzi del mercato: [Menucini](https://blog.menucini.com/menu-digitale-prezzi/), [One2one](https://www.one2one.it/blog/migliori-menu-digitali-ristoranti-confronto), [Qromo](https://qromo.it/miglior-menu-digitale), [MenuDigitale.io](https://blog.menudigitale.io/prezzo-menu-digitale.php), [Doxmenu](https://www.doxmenu.com/it/blog/perche-doxmenu-e-il-miglior-menu-qr/), [RenMenu](https://renmenu.com/)
