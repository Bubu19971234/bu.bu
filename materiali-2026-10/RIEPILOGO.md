# AI Som · riepilogo del lavoro 27–29 ottobre 2026

Documento di passaggio per chi riprende il lavoro (persona o agente AI).
Scopo: capire **cosa è stato deciso, cosa è stato modificato, dove si trova e cosa resta aperto**, senza rileggere la conversazione.

- Titolare del progetto: Marco Tinti (Oluvida di Tinti Marco, P. IVA 02075290474).
- Obiettivo: essere operativi il **2 novembre 2026** per un test commerciale Sommelier contro Margini, con lettura dei risultati l'**8 novembre**.
- Stato al 29/10: siti e app aggiornati e **in produzione**; reel pronti; mancano le prove reali dei SaaS (previste per oggi), la campagna Meta e il processo di gestione dei contatti.

---

## 1. Dove si trova tutto

### Repository GitHub (tutti dell'account `Bubu19971234`)

| Repository | Cosa contiene | Branch di produzione | Ultimo commit rilevante |
|---|---|---|---|
| `ai-som-saas` | App Next.js + Supabase: pannello ristoratore, menù del cliente, sommelier, Margini. Deploy Vercel progetto `ai-som-saas` → `ai-som-saas.vercel.app` | `main` | `e58018d` |
| `sito-web-ai-som.it` | Sito statico di AI Som. Vercel progetto `sito-web-ai-som-it` → `www.ai-som.it` (apex reindirizza a www) | `main` | `04d758a` |
| `centrodistribuzionebevande.it` | Sito statico del distributore CDB. Vercel progetto `cdb-sito` → `www.centrodistribuzionebevande.it` | `main` | `6edb1b2` (verifica dominio Meta, non di questa sessione) / `66991e1` |
| `bu.bu` | Questo archivio: riepilogo, audit, reel, script | `claude/eloquent-mayer-vbpdd7` | questo commit |

Tutte le modifiche di codice sono state fatte sul branch `claude/eloquent-mayer-vbpdd7` di ciascun repository e poi portate su `main` (fast-forward) su via libera del titolare. **Non ci sono pull request aperte.** La cronologia completa si legge con `git log origin/main` in ogni repository.

### In questa cartella (`bu.bu/materiali-2026-10/`)

| Percorso | Contenuto |
|---|---|
| `RIEPILOGO.md` | questo documento |
| `audit/AI-SOM-AUDIT-R6.md` | audit definitivo (revisione 6, congelato) scritto da un altro agente e discusso qui |
| `reel/finali/reel2-margini.mp4`, `reel2-sommelier.mp4` | **reel da usare**: 9:16, 1080×1920, 30 fps, H.264, senza audio, 13,0 s e 13,6 s |
| `reel/finali/copertina2-*.jpg` | copertine dei reel |
| `reel/scartati-stile-cdb-bianco/` | versione con lo stile bianco del distributore, **scartata dal titolare** |
| `reel/sorgenti/stage2.html` + `registra2.js` | come sono stati prodotti i reel finali (scena HTML 1080×1920 + Playwright che registra lo strumento vero dentro un telefono) |
| `reel/sorgenti/stage.html` + `registra.js` | sorgenti della versione scartata |
| `reel/sorgenti/logo-*.{jpg,png}` | loghi CDB e AI Som usati nelle chiusure |
| `strumenti/mock-cliente.js` | apre le pagine del cliente del SaaS in locale con dati di esempio (per controlli visivi senza database) |
| `strumenti/hero.html` | sorgente dell'immagine `hero-dashboard.png` di ai-som.it |

---

## 2. Decisioni prese (non rimetterle in discussione senza dati nuovi)

1. **Audit congelato alla R6.** Le revisioni successive si fanno solo con dati nuovi.
2. **Test commerciale Sommelier contro Margini**, non una homepage riscritta su un solo prodotto. Il canale principale è il distributore CDB: pagina food cost, lista clienti, agenti. Meta con 5–10 €/giorno dal 2 all'8 novembre è **esplorativo**: con quel budget non dà un vincitore statistico.
3. **Domanda nel modulo Meta senza prezzo.** La domanda sul prezzo a freddo è stata scartata su obiezione del titolare: la disponibilità a pagare si misura sulla landing (prezzo visibile) e dopo la demo.
4. **Prezzi di listino** (fonte: `ai-som-saas/lib/piano.ts`):
   - AI Som: **350 €/anno** oppure 35 €/mese;
   - Margini: **600 €/anno** oppure 59 €/mese;
   - Combo: **800 €/anno**, solo annuale (risparmio 150 €).
   - IVA esclusa. **Nessun "prezzo di lancio"** e nessuna promessa sul rinnovo (tolte su richiesta).
5. **Claim tolti ovunque**: +117%, garanzia 90 giorni, "in 3 secondi", "in 48 ore", "10 lingue", "risposta garantita entro 24 ore". Le lingue supportate sono **8**: it, en, es, fr, de, ru, zh, ar (lo spagnolo, non il giapponese).
6. **Stile**:
   - ai-som.it e l'**app del cliente**: fondo bianco o scuro come da sito, font **Plus Jakarta Sans**, rosso vino **#C43C4D**;
   - sul sito CDB gli strumenti di prova restano con lo **stile scuro AI Som**. Un tema bianco "CDB" è stato fatto e poi **annullato su richiesta** (commit `e19f07b`, `9ac6186`).
7. **Scheda "Menù digitale e comande" tolta** dalla home CDB: le comande sono sospese nel SaaS dal 18/10. Si rimette se il prodotto torna in vendita.

---

## 3. Cosa è stato modificato

### 3.1 SaaS `ai-som-saas`

**`f28c1a5` · Bug dell'audit (Priorità 0)**
- `lib/prontezza.ts` è la fonte unica dello stato del locale: Da iniziare → Importato → Da verificare → **Pronto per il pubblico**.
  - "Pronto" solo con allergeni confermati, vini arricchiti e piatti tradotti.
  - I QR si sbloccano con allergeni e vini completi.
- `app/ristoratore/onboarding/page.tsx` non mostra più "Tutto pronto" con attività in sospeso; ogni passo dice cosa manca (es. "Completa 2 vini per attivare il sommelier").
- `app/api/consiglia/route.ts`: se nessun vino è arricchito risponde `code: carta_non_pronta` con messaggio chiaro, senza chiamare il modello.
- `app/api/consiglia/engine.ts`: estrazione JSON robusta (`lib/json-ai.ts`) e messaggio comprensibile al posto di "Risposta non valida".
- Test: `lib/__tests__/prontezza.test.ts`. Totale **87 test superati**, `tsc` pulito.

**`e58018d` · App del cliente nello stile del sito**
- `app/globals.css`, classe `.tema-cliente`: rimappa le classi scure legacy (`dark-bg`, `dark-card`, `copper`, grigi) su bianco, inchiostro e #C43C4D, **solo** dentro le pagine del cliente.
- Applicata a `app/locale/[slug]/page.tsx`, `menu/page.tsx`, `carta/page.tsx`, `tavolo/[numero]/page.tsx`.
- Tolto l'interruttore chiaro/scuro del menù; pallini del profilo in toni rosso vino.
- **Admin e pannello ristoratore invariati.**
- Verificato solo **in locale con dati finti** (`strumenti/mock-cliente.js`), non su un locale reale.

### 3.2 Sito `sito-web-ai-som.it` (www.ai-som.it)

- **Landing**: `prova-sommelier.html` e `prova-margini.html`. Una promessa per pagina, demo provabile prima del modulo, prezzo, FAQ, dati strutturati (SoftwareApplication + FAQPage), modulo FormSubmit verso info@ai-som.it con campi `Offerta` e UTM.
- **`widget/demo-sommelier.js`**: demo su carta campione (30 vini), autonoma e riusabile; 8 lingue allineate all'app; prima schermata con vino, prezzo e motivo; dettagli espandibili.
- **`widget/calcolatore-margini.js`**:
  - tre locali di esempio (ristorante/pizzeria, bar, gelateria);
  - **stesse formule dell'app** (`lib/margini/calcolo.ts`, costi variabili a 0);
  - tabella a schede su mobile.
- **`analytics.js`**:
  - GA4 **G-3MBYY15RHV** (proprietà "AI som") con Consent Mode v2: tutto negato fino al consenso;
  - banner di consenso (compare solo se GA è attivo);
  - eventi `form_start`, `generate_lead` (parametri `offerta`, `sorgente`, `campagna`), `prenota_call`, `chiama`, `demo_*`;
  - UTM e fbclid copiati nei moduli.
  - Verificato in produzione: `gcs=G100` prima del consenso, `G111` dopo.
- **Homepage**:
  - claim tolti, prezzi di listino, demo rinominata "carta campione";
  - `hero-dashboard.png` rifatta bianca con font e colori del sito (`93aca32`; sorgente in `strumenti/hero.html`). È una **ricostruzione**, non uno screenshot dell'app.
- **Pagine di servizio**:
  - `privacy.html` con titolare Oluvida;
  - `grazie.html` per offerta (evento `lead_confermato`);
  - `sitemap.xml` / `robots.txt` con canonical www;
  - `llms.txt` per i motori AI.

### 3.3 Sito `centrodistribuzionebevande.it`

- **`food-cost-ristorante.html`** (destinazione degli annunci):
  - sezione **"Provali adesso"** con calcolatore e demo a schede;
  - claim corretti;
  - prezzo AI Som 350 €;
  - `?strumento=sommelier|margini` apre la scheda giusta e preseleziona l'interesse nel modulo.
- **Pixel Meta** `1309682050708320` (dataset di cdb_srl):
  - file `assets/cdb-misurazione.js`, solo su questa pagina e **solo dopo consenso**;
  - eventi `PageView`, `Lead` (all'invio riuscito del modulo, con l'interesse), `demo_*` (trackCustom).
  - Verificato: nessuna richiesta a Meta prima di "Accetta".
- **`privacy.html`** aggiornata: pixel, revoca del consenso, Meta e Oluvida tra i destinatari.
- **Home**:
  - sezione "Prova AI Som e Margini" **in fondo alla pagina**, prima del footer;
  - voce di menu "Prova AI Som" su tutte le pagine;
  - tolta la scheda comande.
- Copie dei widget: `assets/aisom-demo-sommelier.js`, `assets/aisom-calcolatore-margini.js`. Sono **copie** di quelli di ai-som.it: se si modifica l'originale va ricopiato.

---

## 4. Materiale per la campagna

### Reel finali (`reel/finali/`)
- Stile scuro AI Som, gancio nei primi 2 secondi, testi grandi in alto, telefono con lo strumento vero, chiusura con loghi **CDB × AI Som**.
- **Margini (13,0 s)**:
  1. "Il tuo panino a 5 €… ti fa perdere soldi" (esempio bar, badge "In perdita");
  2. costi veri → food cost massimo 28%;
  3. prezzo giusto 8,60 €;
  4. si cambia il prezzo → "Ok".
  - Dentro il telefono: calcolatore sulla pagina CDB.
- **Sommelier (13,6 s)**:
  1. "Il cliente non sa che vino ordinare?";
  2. app del cliente reale (nuovo stile bianco) con trattoria inventata → consiglio dalla carta;
  3. passaggio all'inglese → stesso consiglio in inglese;
  4. "Nessuna app. Solo un QR".
  - Dati di esempio iniettati via Playwright: nessun locale reale.
- **Senza audio**: la musica va aggiunta in Meta dalla libreria commerciale, **la stessa su entrambi**.

### Link degli annunci
- Margini: `https://www.centrodistribuzionebevande.it/food-cost-ristorante.html?strumento=margini&utm_source=meta&utm_campaign=test-nov&utm_content=reel-margini`
- Sommelier: `https://www.centrodistribuzionebevande.it/food-cost-ristorante.html?strumento=sommelier&utm_source=meta&utm_campaign=test-nov&utm_content=reel-sommelier`
- Obiettivo campagna: **Lead** sul pixel 1309682050708320. Split test nativo Meta: due gruppi di inserzioni con annuncio coerente con la propria scheda.

### Come rigenerare i reel
- Servono tre server locali:
  - `centrodistribuzionebevande.it` su `:8769` (`python3 -m http.server 8769`);
  - cartella dei sorgenti reel su `:8770`;
  - per il sommelier, `ai-som-saas` in `next dev -p 3005` con `NEXT_PUBLIC_SUPABASE_URL=http://localhost:9999` (le chiamate vengono intercettate da `registra2.js`).
- Poi: `node registra2.js margini|sommelier`, e taglio/conversione con ffmpeg usando i tempi salvati in `tempi2-*.json`. Il clic nell'iframe scalato non è affidabile: lo script usa `element.click()` via `evaluate`.

---

## 5. Cosa resta aperto (in ordine di urgenza)

| # | Cosa | Chi | Note |
|---|---|---|---|
| 1 | **Prove reali da vuoto dei due SaaS** | Titolare (previste il 29/10) | Checklist: import menù/carta → onboarding deve dire "Da verificare" → consiglio prima dell'arricchimento deve dire "non ancora attivo" → conferma allergeni + arricchisci + traduci → "Pronto per il pubblico" e QR sbloccati → consiglio da telefono in it/en/es. Margini: costi fissi + una ricetta + una fattura XML/PDF; i prezzi devono coincidere con il calcolatore. **Primo controllo dell'app cliente bianca con dati veri.** Ambiente di prova per agenti: `ai-som-saas/docs/AGENTI-PROVA.md` (serve `PROVA_AGENT_TOKEN`, su Vercel). |
| 2 | **Gestione dei contatti** | Titolare ("sarà fatto") | I lead arrivano in due posti: info@ai-som.it (FormSubmit) e il foglio Google CDB (Apps Script del modulo). Serve un responsabile che li controlli ogni giorno e un accordo con CDB per girarli. |
| 3 | **Campagna Meta** | Da costruire | Account cdb_srl; verifica del dominio fatta (commit `6edb1b2`). Mancano testi, impostazione split test, musica sui reel. |
| 4 | **GA4** | Titolare | Segnare `generate_lead` (e `prenota_call`) come eventi chiave; creare le dimensioni personalizzate `offerta` e `sorgente`. Nei dati c'è un lead di prova con `offerta = test-configurazione`: **escluderlo**. |
| 5 | **Canale distributore** | Da fare | Lista email/WhatsApp CDB divisa a caso in due metà (messaggio Sommelier / Margini) e script di 5 righe per gli agenti con la domanda sul problema (A vino / B prezzi / C entrambi / D nessuno). |
| 6 | **Video lungo con voce** | Proposto | 60–75 s, da usare su pagina CDB, WhatsApp e retargeting, **non** nel test A/B. Flusso: testo scritto da un agente → audio generato dal titolare su ElevenLabs (piano a pagamento, nessuna voce clonata senza consenso) → montaggio sulle schermate vere. |
| 7 | **Search Console** | Titolare | Aggiungere ai-som.it e inviare `sitemap.xml`. |
| 8 | **Dopo l'8 novembre** | — | Sito ricostruito attorno al prodotto che vince; accessibilità (contrasti su #242424, focus, target touch) e semplificazione di Margini nel SaaS. |

---

## 6. Rischi e punti deboli noti (da verificare, non da dare per scontati)

1. **Volume del test**: 35–70 € su Meta producono pochi contatti. Le decisioni le prenderanno soprattutto le conversazioni con i ristoratori e il canale CDB.
2. **App del cliente bianca non provata su un locale reale.** Le classi legacy sono rimappate via CSS con `!important`: elementi con colori non previsti potrebbero restare scuri o poco leggibili.
3. **Coerenza visiva**:
   - il calcolatore Margini è scuro, l'app del cliente è bianca;
   - l'immagine hero del sito è una ricostruzione, non uno screenshot;
   - dentro il reel Margini lo strumento è scuro, nel reel Sommelier è bianco.
4. **Widget duplicati** tra i due siti (copie manuali in `assets/` del CDB).
5. **Errore 404 preesistente** su `assets/76e251ff54-gsap.min.js` nelle pagine CDB: non introdotto da queste modifiche, non corretto.
6. **Consent banner ai-som.it**: categoria unica "statistica e marketing" (Accetta/Rifiuta). Da far rivedere a chi segue la conformità GDPR, insieme alle due informative.
7. Il lavoro sul **Supabase collegato al connettore** (progetto "AI SOM") **non** corrisponde al database dell'app: le tabelle `locali`, `vini` lì non esistono. Il database reale dell'app non è stato toccato.

---

## 7. Come verificare velocemente lo stato (per un agente)

```bash
# codice
git clone https://github.com/Bubu19971234/ai-som-saas && cd ai-som-saas && npm ci && npx vitest run && npx tsc --noEmit
# siti pubblicati: nessun claim vecchio, prezzi giusti, tracciamento presente
for u in https://www.ai-som.it/ https://www.ai-som.it/prova-sommelier.html https://www.ai-som.it/prova-margini.html \
         https://www.centrodistribuzionebevande.it/ https://www.centrodistribuzionebevande.it/food-cost-ristorante.html; do
  curl -s "$u" | grep -c -E "117%|garanzia 90|3 secondi|48 ore|10 lingue|300 €|lancio" ; done   # atteso: 0 ovunque
curl -s https://www.ai-som.it/analytics.js | grep -o "G-3MBYY15RHV"
curl -s https://www.centrodistribuzionebevande.it/assets/cdb-misurazione.js | grep -o "1309682050708320"
```
