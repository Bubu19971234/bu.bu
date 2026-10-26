# Da dove ripartire (aggiornato 26/10/2026)

## Decisioni prese
- Due prodotti DIVISI ma complementari: **AI SOM** (consiglia il vino, 300 €/anno) e **AI SOM Marginalità** (600 €/anno). Insieme 800 €/anno (fonte: `lib/piano.ts` di ai-som-saas). Cassa e Sala dopo.
- AI SOM uguale per tutti, personalizzato importando il menù: il 99% di corrispondenza è garantito dalla schermata di correzione prima dell'attivazione.
- Marginalità: prezzi al kg delle materie prime da PDF, foto o a mano.
- Lingue del menù pubblico: 8 (it + en, es, fr, de, ru, zh, ar).

## Fatto (tutto unito in main)
- ai-som-saas #2: schermata "Controlla il tuo menù" prima del salvataggio.
- ai-som-saas #3: import di menù e carta solo per il titolare del locale o l'admin.
- centrodistribuzionebevande.it #1 e #2: `index.html` (home salvata), `ai-som.html`, `ai-som-marginalita.html`, testo "otto lingue".

## Da fare
1. FATTO: tutti i file del sito sono in `centrodistribuzionebevande.it` (main), identici al deploy Vercel. Mancavano già online: assets/76e251ff54-gsap.min.js e 8 immagini in assets/ufficio/.
2. Collegare cdb-sito al repo GitHub (Settings → Git, branch main, preset Other, nessuna build).
3. Verificare in Marginalità l'inserimento manuale dei prezzi al kg (il sito lo promette).
4. Allineare la pagina `/attiva` di ai-som-saas (prezzi vecchi: 19,90 €/mese) al listino 300/600/800.
5. Poi: analisi dei siti AI SOM che l'utente condividerà, allineamento di `sito-web-ai-som.it`, pagamento e installazione semplici.

## Regola
Ogni modifica va salvata su GitHub prima di essere pubblicata, mai direttamente su Vercel.
