# AI Som: risposta alle osservazioni del legale (27/11/2026)

Per ogni osservazione: cosa è stato fatto nel software o nei testi, e cosa resta da decidere.

## 1. Cosa è stato fatto

| Osservazione | Intervento | Dove |
|---|---|---|
| Dati reali del titolare | Predisposti i campi nei tre documenti | **Mancano i dati della visura** |
| Allergie dei clienti | Verificato: il cliente non si registra. Le allergie servono solo a escludere i drink sui nostri server, non vengono salvate. **Prima venivano inviate ad Anthropic insieme alla richiesta: ora non più** | Software; informativa §2–3 |
| Indirizzo IP | **Prima era salvato in chiaro nei contatori giornalieri e, in forma reversibile, nelle statistiche.** Ora si salva solo un'impronta non reversibile, diversa ogni giorno, cancellata il giorno successivo. Le statistiche non registrano più l'IP | Software; informativa §1–2 |
| Conservazione presso Anthropic | L'informativa non dice più «cancellati dopo la risposta». Dichiara: cancellazione automatica entro 30 giorni; fino a 2 anni per i contenuti segnalati dai sistemi di sicurezza; nessun uso per l'addestramento | Informativa §3 |
| `inference_geo` | Dichiarato che esistono solo «globale» e «solo Stati Uniti», nessuna opzione europea | Informativa §3; accordo art. 7 |
| DPA e garanzie di trasferimento | Anthropic: DPA incorporato nelle condizioni commerciali, con clausole contrattuali standard moduli 2 e 3 (verificato sul testo ufficiale). Altri fornitori: da verificare | Informativa §4 |
| Regime forfettario | Tolta la dicitura «IVA esclusa» dal sito e dai termini; prezzi indicati come finali | Software; termini art. 4 |
| Nessun rimborso; cancellazione immediata senza altri addebiti | Due percorsi distinti con la tabella indicata. La cancellazione dell'account annulla subito l'abbonamento: se l'annullamento non riesce, l'account non viene cancellato | Termini art. 5; software già esistente |
| Terzo documento (art. 28) | Scritto l'accordo sul trattamento dei dati, con ruoli, sub-responsabili e misure di sicurezza | Nuovo documento |
| Clausole aggiuntive | Uso professionale, divieto di rivendita, uso abusivo, esportazione dei dati, variazione dei prezzi, recesso per modifiche, disponibilità, sospensione, limitazione di responsabilità | Termini art. 2, 6, 7, 12–15, 17 |
| Esportazione dei dati | Realizzata: file Excel con anagrafica, menù e carta | Software |
| Art. 1341 c.c. | Seconda spunta separata, con data, ora e versione registrate, in registrazione e al pagamento. **Il pagamento diretto dal sito prima non chiedeva alcuna accettazione: ora la chiede** | Software; termini art. 19 |
| Responsabilità sugli allergeni | Clausola esplicita: AI Som è uno strumento; informazione e somministrazione sono a carico del locale, con manleva | Termini art. 10 |
| AI Act | Avviso «generato da un'intelligenza artificiale» accanto a ogni consiglio, ora anche nella pagina menù; nota di inquadramento | Software; nota AI Act |

## 2. Fonti verificate su Anthropic (27/11/2026)

- **Conservazione:** «For Anthropic API users, we automatically delete inputs and outputs on our backend within 30 days of receipt or generation» (centro privacy di Anthropic, aggiornato al 1° luglio 2026). La documentazione tecnica dice invece che i contenuti non sono conservati per impostazione predefinita, salvo alcuni modelli che non usiamo. Le due pagine non coincidono: nell'informativa è indicato il termine più lungo.
- **Contenuti segnalati:** conservati fino a 2 anni.
- **Addestramento:** non usati per impostazione predefinita.
- **Luogo:** valori ammessi «global» (predefinito) e «us»; dati a riposo solo negli Stati Uniti.
- **DPA:** Anthropic è responsabile del trattamento; clausole contrattuali standard, moduli 2 e 3, legge irlandese; notifica delle violazioni entro 48 ore.
- **Conservazione zero:** esiste, ma si ottiene solo con un accordo commerciale con Anthropic.

Pagine: <https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data>, <https://platform.claude.com/docs/en/manage-claude/api-and-data-retention>, <https://platform.claude.com/docs/en/manage-claude/data-residency>, <https://www.anthropic.com/legal/data-processing-addendum>.

## 3. Domande aperte per il legale

1. **Allergie:** con le misure adottate basta l'avviso accanto alla domanda, senza consenso esplicito?
2. **Art. 1341:** la doppia spunta online è sufficiente o serve una firma elettronica?
3. **Abbonamento annuale:** nessun rimborso anche in caso di cancellazione immediata, o rimborso proporzionale?
4. **Recesso per modifiche (art. 17):** ho previsto il rimborso della parte non goduta. Va bene?
5. **Conservazione dopo la scadenza (art. 15):** 12 mesi sono adeguati?
6. **Foro:** Pistoia?
7. **Manleva sugli allergeni (art. 10):** la formulazione è adeguata?
8. **Trasferimenti:** serve una valutazione d'impatto del trasferimento scritta per Anthropic e Vercel?

## 4. Da verificare con i fornitori

- Vercel: durata dei registri tecnici con indirizzo IP; DPA.
- Supabase: frequenza e durata delle copie di sicurezza; cifratura; DPA.
- Resend: regione di invio; DPA.
- Stripe: ruolo e garanzie.

## 5. Da chiedere al commercialista

- Conferma del regime forfettario e della dicitura in fattura.
- Imposta di bollo sulle fatture oltre 77,47 €: chi la sostiene.
- Fattura elettronica verso lo SdI.
