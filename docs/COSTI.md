# AI som: stima dei costi (aggiornata al 24/11/2026)

Legenda: **[Certo]** = prezzo di listino ufficiale · **[Probabile]** = fonte secondaria o calcolo su dati certi · **[Ipotesi]** = stima da verificare misurando.

> Con la scelta dei vini fatta dal codice e Haiku 5.5 solo per le frasi, il costo AI per ristorante scende a pochi dollari al mese [Ipotesi]. Va comunque misurato con traffico reale prima di fissare il prezzo dell'abbonamento.

## 1. Costi fissi per pubblicare

| Voce | Costo | Note |
|---|---|---|
| Apple Developer Program | 99 USD/anno **[Certo]** | Account organizzazione: serve D-U-N-S (gratuito). |
| Google Play Console | 25 USD una tantum **[Certo]** | Account **personale** nuovo: obbligo di closed test con ≥12 tester per 14 giorni prima della produzione. Un account **organizzazione** (D-U-N-S, fino a ~28 giorni per ottenerlo) evita questo blocco **[Probabile]**. |
| Mac con Xcode | 0 € se l'hai già, altrimenti l'acquisto di un Mac | Un'app iOS si compila **solo** su macOS. Per testare lo scanner QR serve un iPhone fisico (il simulatore non ha la fotocamera) **[Certo]**. |
| Dominio (.it/.com) | 10–20 €/anno **[Probabile]** | Serve per sito, privacy policy e link di cancellazione account richiesto da Google. |

## 2. Costi ricorrenti di infrastruttura

| Voce | Costo | Note |
|---|---|---|
| Vercel Pro (ai-som-saas) | ~20 USD/utente/mese **[Probabile]** | Il piano Hobby gratuito è **solo per uso non commerciale** **[Certo]**: per un SaaS non va bene. Cloudflare Workers costa ~5 USD/mese, ma spostare l'app Next.js richiede giorni di lavoro: non conviene per risparmiare ~15 $/mese. |
| Supabase (in alternativa o in aggiunta, per database/autenticazione) | Free 0 USD, Pro da 25 USD/mese **[Certo]** | Il Free si mette in pausa dopo 1 settimana di inattività: non adatto alla produzione. |
| iubenda (privacy/cookie/T&C) | 4,99–79,99 €/mese + IVA **[Certo]** | L'SDK per i consensi nell'app mobile è solo nel piano Ultimate (79,99 €). |
| Revisione legale di T&C, DPA, informative | 500–2.000 € una tantum **[Ipotesi]** | Consigliata: tratti alcol, allergeni e AI insieme. |

## 3. Commissioni degli store (solo se incassi tramite lo store)

| Scenario | Apple (UE) | Google Play (SEE) |
|---|---|---|
| Abbonamento via in-app purchase, Small Business Program (<1 M USD/anno) | 15% **[Certo]** | 10% + 5% di commissione di fatturazione sugli abbonamenti dal 30/6/2026 **[Probabile]** |
| Abbonamento B2B venduto fuori dall'app ai ristoranti | 0%, **se** App Review accetta la regola 3.1.3(c), "vendita a organizzazioni" **[Ipotesi]** | Da verificare con le policy Play sui pagamenti |

Il punto critico: se l'abbonamento è acquistabile anche da singoli consumatori, Apple tende a pretendere l'acquisto in-app (casi di rifiuto documentati sui forum Apple). Il link esterno all'acquisto che vale negli USA dopo Epic v. Apple **non vale in Italia**; nell'UE si applicano i termini DMA (link esterno: 10–15%) **[Probabile]**.

## 4. Costi dell'agente AI (API Claude, listino al 3/11/2026)

| Modello | Input $/1M token | Output $/1M token | Lettura cache $/1M |
|---|---|---|---|
| Claude Opus 5.5 (predefinito nel codice) | 4,00 | 20,00 | 0,20 |
| Claude Sonnet 5.5 | 2,00 | 10,00 | 0,10 |
| Claude Haiku 5.5 (frasi al cliente, traduzioni; prompt ≤100K token) | 0,10 | 0,50 | n/d |

I modelli si cambiano in un solo punto: `lib/claude.ts` in `ai-som-saas` (`MODELLI.opus`, `MODELLI.haiku`). Le cifre sotto sono **[Ipotesi]** calcolate su token stimati: il costo reale si legge nella console Anthropic.

### 4a. Import del menu (si fa una volta, poi agli aggiornamenti)

Ipotesi: PDF di 4 pagine (~10.000 token in input), 100 voci (~15.000 token in output, ragionamento incluso).

| Modello | Costo per import |
|---|---|
| Opus 5.5 | ~0,35 $ |
| Sonnet 5.5 | ~0,17 $ |
| Haiku 5.5 | ~0,01 $ |

Una carta dei vini da 300 etichette può costare 2–3 volte tanto. Su 100 ristoranti con 2 import al mese, anche con Opus si resta **sotto 100 $/mese**. Per l'import la precisione conta più del costo.

### 4b. Consigli sui vini al tavolo (architettura in `ai-som-saas`, ramo `claude/abbinamento-calcolato`)

Come funziona ora:
1. **Opus 5.5, una volta per piatto:** calcola il profilo sensoriale del piatto. Circa 0,07 $ ogni 25 piatti, quindi ~0,20 $ per un menù da 80 piatti [Ipotesi].
2. **Codice, a ogni ricerca:** sceglie i 3 vini confrontando i profili. Costo zero.
3. **Haiku 5.5, a ogni ricerca:** scrive solo le frasi per il cliente.
4. **Cache:** le ricerche già calcolate (stesso piatto, nessuna preferenza di gusto) costano zero.

| Percorso | Costo per ricerca | Ristorante con 3.600 ricerche/mese |
|---|---|---|
| Prima (Haiku 4.5 sceglie dalla carta di 40 vini) | ~0,0065 $ | ~23 $ |
| Ora (codice + Haiku 5.5 per le frasi) | ~0,0004 $ | ~1,5 $ |

Tutte le cifre sono **[Ipotesi]**: vanno verificate con i dati reali di consumo nella console Anthropic dopo una settimana di traffico. Haiku 5.5 conta circa il 30% di token in più di Haiku 4.5 per lo stesso testo; la stima ne tiene conto.

## 5. Riepilogo del primo anno (scenario: 20 ristoranti, architettura attuale)

| Voce | Primo anno |
|---|---|
| Store (Apple + Google) | ~125 $ |
| Backend Vercel Pro + Supabase Pro | ~540 $ |
| iubenda Advanced | ~240 € |
| Dominio | ~15 € |
| AI: import menu | ~50 $ |
| AI: consigli vini (20 × 1,5 $ × 12) | ~360 $ |
| Legale | 500–2.000 € |

**Totale: ~1.800–3.300 €/anno. Con la scelta dei vini fatta dal codice, l'AI non è più la voce principale [Ipotesi].**

## 6. Prova gratuita e abbonamento a 39 €/mese o 385 €/anno

Cifre in euro, con 1 $ ≈ 0,93 €. Tutte **[Ipotesi]** da verificare sui consumi reali della console Anthropic, salvo dove indicato.

### 6a. Quanto costa un ristoratore che prova gratis (non paga)

Locale tipo: menù da 60 piatti e carta da 40 vini. Traduzioni con **Haiku 5.5** dal 24/11/2026.

| Operazione | Modello | Costo | Base |
|---|---|---|---|
| Lettura di menù e carta (2 tentativi) | Opus 5.5 | ~0,45 € | stima |
| Schede dei 40 vini ("Arricchisci") | Opus 5.5 | ~0,30 € | stima |
| Profilo sensoriale dei 60 piatti | Opus 5.5 | ~0,17 € | stima |
| Abbinamenti pronti per 60 piatti | codice + Haiku 5.5 | ~0,02 € | stima |
| Traduzione dei 60 piatti in 7 lingue | **Haiku 5.5** | **~0,03 €** (con Opus erano ~0,69 €) | **misurato**: 0,0005 $ a piatto con Haiku, 0,0124 $ con Opus |
| 20 prove del sommelier in anteprima | codice + Haiku 5.5 | ~0,01 € | stima |
| **Totale per prova** | | **~1,0 €** (prima ~1,6 €) | |

- **Tetto massimo per prova:** circa 4 € (prima ~6 €), più al massimo ~1 €/mese se prova il sommelier ogni giorno.
- **Costo per cliente acquisito:** se si abbona 1 ristoratore su 10 [Ipotesi], circa **10 €** di prove gratuite (prima ~16 €).
- **Qualità della traduzione Haiku.** Prova su 10 piatti × 7 lingue dopo la revisione delle istruzioni: nessun ingrediente inventato, nessun termine sbagliato, nessun alfabeto mescolato. Il campione è piccolo: controlla a campione i primi menù tradotti. Con `MODELLO_TRADUZIONE=opus` su Vercel si torna a Opus in un minuto.

### 6b. Margine di un cliente pagante (ricalcolato)

Ipotesi: 20 clienti.

| Voce al mese per cliente | Mensile 39 € | Annuale 385 € (= 32,08 €/mese) |
|---|---|---|
| Commissione Stripe (~1,5% + 0,25 €) **[Probabile]** | −0,84 € | −0,50 € |
| AI: sommelier (3.600 ricerche, metà dalla cache) + aggiornamenti e traduzioni | −1,3 / −2,3 € | −1,3 / −2,3 € |
| Infrastruttura (≈ 42 €/mese divisi per 20 clienti) | −2,10 € | −2,10 € |
| **Margine, prezzo IVA esclusa** | **~33,8–34,8 € (≈ 88%)** | **~27,2–28,2 € (≈ 86%)** |
| **Margine se 39 € / 385 € sono IVA inclusa** (netto 31,97 € / 26,30 €) | ~26,7–27,7 € | ~21,4–22,4 € |

- **Effetto del passaggio a Haiku:** sul cliente pagante cambia poco (pochi centesimi al mese, perché le traduzioni si rifanno solo quando cambia il menù). Il guadagno vero è sulla prova gratuita: −40% di costo per prova.
- **Costi fissi** (~70 €/mese tra infrastruttura, Apple e iubenda): si coprono con **3 clienti**.
- **Cosa conta di più:** con 100 clienti l'infrastruttura scende a ~0,42 €/cliente e il margine supera il 90%. A quel punto la voce principale diventa il sommelier: va misurata sui dati reali della console Anthropic dopo il primo mese.

### 6c. Da fare per passare a 39 € / 385 €

Oggi codice e Stripe sono a **35 € / 350 €** **[Certo]**. I passaggi, in ordine:
1. In Stripe crea due nuovi prezzi ricorrenti per il prodotto AI Som: 39 €/mese e 385 €/anno.
2. Su Vercel aggiorna `STRIPE_PRICE_STARTER_MONTHLY` e `STRIPE_PRICE_STARTER_ANNUAL` con i nuovi ID prezzo.
3. Cambia `LISTINO.starter` in `lib/piano.ts` di ai-som-saas: è una riga, la faccio io quando i prezzi esistono.

Gli abbonati attuali restano al prezzo vecchio finché non li sposti tu in Stripe.
