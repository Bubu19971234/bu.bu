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
1. **Recuperare TUTTI i file del sito** dal progetto Vercel **cdb-sito** (team_czwHBipBy8FveMtKejtqg8Ud, prj_qLNzT9CsApOYD0Yc8Lmjo5TwTU9S): `assets/`, catalogo.html, contatti.html, chi-siamo.html, servizi.html, blog.html, regali.html, privacy.html, richiedi-accesso.html, assaggi-di-natale.html, ecc. Salvarli nel repo `centrodistribuzionebevande.it` SENZA sovrascrivere index.html, ai-som.html e ai-som-marginalita.html. Il sito era stato pubblicato da sessioni precedenti direttamente su Vercel, senza GitHub.
2. Solo dopo il punto 1: collegare cdb-sito al repo GitHub (Settings → Git, branch main, preset Other, nessuna build).
3. Verificare in Marginalità l'inserimento manuale dei prezzi al kg (il sito lo promette).
4. Allineare la pagina `/attiva` di ai-som-saas (prezzi vecchi: 19,90 €/mese) al listino 300/600/800.
5. Poi: analisi dei siti AI SOM che l'utente condividerà, allineamento di `sito-web-ai-som.it`, pagamento e installazione semplici.

## Regola
Ogni modifica va salvata su GitHub prima di essere pubblicata, mai direttamente su Vercel.
