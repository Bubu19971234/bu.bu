# AI som: stima dei costi (aggiornata al 24/11/2026)

Legenda: **[Certo]** = prezzo di listino ufficiale · **[Probabile]** = fonte secondaria o calcolo su dati certi · **[Ipotesi]** = stima da verificare misurando.

> La voce che decide se il modello di business sta in piedi è il costo della **chat sommelier**, non l'import del menu né gli store. Va misurata con traffico reale prima di fissare il prezzo dell'abbonamento.

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
| Vercel Pro (backend) | ~20 USD/utente/mese **[Probabile]** | Il piano Hobby gratuito è **solo per uso non commerciale** **[Certo]**: per un SaaS non va bene. |
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
| Claude Haiku 5.5 (prompt ≤100K token) | 0,10 | 0,50 | n/d |

Il modello si cambia senza toccare il codice: variabile `MENU_MODEL` (es. `claude-haiku-5-5`). Le cifre sotto sono **[Ipotesi]** calcolate su token stimati. Il costo reale va letto dal campo `usage` che il backend restituisce a ogni import.

### 4a. Import del menu (si fa una volta, poi agli aggiornamenti)

Ipotesi: PDF di 4 pagine (~10.000 token in input), 100 voci (~15.000 token in output, ragionamento incluso).

| Modello | Costo per import |
|---|---|
| Opus 5.5 | ~0,35 $ |
| Sonnet 5.5 | ~0,17 $ |
| Haiku 5.5 | ~0,01 $ |

Una carta dei vini da 300 etichette può costare 2–3 volte tanto. Su 100 ristoranti con 2 import al mese, anche con Opus si resta **sotto 100 $/mese**. Per l'import la precisione conta più del costo.

### 4b. Chat sommelier con i clienti del ristorante (non ancora implementata)

Ipotesi per ogni turno di chat:
- 8.000 token di menu e istruzioni, letti dalla cache;
- 500 token nuovi in input;
- ~700 token in output, ragionamento incluso.

Ipotesi per ristorante: 30 conversazioni al giorno da 4 turni, cioè ~3.600 turni al mese.

| Modello | Costo per turno | Costo per ristorante al mese |
|---|---|---|
| Opus 5.5 | ~0,018 $ | ~65 $ |
| Sonnet 5.5 | ~0,009 $ | ~32 $ |
| Haiku 5.5 | ~0,0012 $ | ~4 $ |

**Conseguenza:** con un abbonamento da ~30–50 €/mese a ristorante, Opus sulla chat mangia tutto il margine. Per la chat serve misurare la qualità di Haiku 5.5 e Sonnet 5.5 sui consigli di abbinamento prima di scegliere. Leve per abbassare il costo:
- tenere in cache il prompt con il menu (le scritture in cache non sono incluse sopra: su Opus aggiungono pochi $ al mese);
- limitare la lunghezza delle risposte;
- mettere un tetto ai turni per sessione.

## 5. Riepilogo del primo anno (scenario: 20 ristoranti, chat su Sonnet 5.5)

| Voce | Primo anno |
|---|---|
| Store (Apple + Google) | ~125 $ |
| Backend Vercel Pro + Supabase Pro | ~540 $ |
| iubenda Advanced | ~240 € |
| Dominio | ~15 € |
| AI: import menu | ~50 $ |
| AI: chat (20 × 32 $ × 12) | ~7.700 $ |
| Legale | 500–2.000 € |

**Totale: ~9.000–11.000 €/anno, di cui ~80% chat AI [Ipotesi].**
