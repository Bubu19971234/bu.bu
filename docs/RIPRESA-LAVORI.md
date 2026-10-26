# Da dove ripartire (26/10/2026)

Decisioni prese:
- Due prodotti DIVISI ma complementari: **AI SOM** (consiglia il vino) e **AI SOM Marginalità**. Cassa e Sala dopo.
- AI SOM uguale per tutti, personalizzato importando il menù del locale: corrispondenza 99% garantita dalla schermata di correzione prima dell'attivazione (piatti, prezzi, allergeni, vini).
- Marginalità: prezzi al kg delle materie prime caricabili da PDF, foto o a mano.

Fatto:
- `ai-som-saas`, branch `claude/conferma-menu`: schermata "Controlla il tuo menù" prima del salvataggio (non ancora unita).

Da fare:
1. Recuperare l'HTML del sito distributore: progetto Vercel **cdb-sito** (team_czwHBipBy8FveMtKejtqg8Ud, prj_qLNzT9CsApOYD0Yc8Lmjo5TwTU9S). Salvarlo nel repo `centrodistribuzionebevande.it` (oggi contiene solo README).
2. Aggiungere al sito le due pagine AI SOM e AI SOM Marginalità.
3. Sicurezza: `app/api/onboarding-import` in ai-som-saas non verifica che l'utente sia il proprietario del locale.
4. Verificare in Marginalità l'inserimento manuale dei prezzi al kg.
5. Poi: analisi siti AI SOM dell'utente, allineare `sito-web-ai-som.it`, pagamento e installazione semplici.
