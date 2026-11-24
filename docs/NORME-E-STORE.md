# AI som: norme, policy degli store e termini d'uso (verifica al 24/11/2026)

Legenda: **[Certo]** = fonte primaria letta · **[Probabile]** = fonte secondaria o interpretazione forte · **[Ipotesi]** = da confermare con un legale o con App Review.

Questo documento **non è una consulenza legale**. È una mappa dei punti da chiudere prima della pubblicazione. La colonna "Stato nel codice" si riferisce a quanto c'è in questo repository.

## A. I 10 blocchi che possono fermare la pubblicazione o creare responsabilità

| # | Requisito | Fonte | Cosa fare | Stato nel codice |
|---|---|---|---|---|
| 1 | **Consenso esplicito prima di inviare dati personali a un'AI di terzi** (Apple, regola 5.1.2(i), aggiornata il 13/11/2025). Risultano già rifiuti. | [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/) **[Certo]** | Schermata di consenso prima della chat sommelier; non inviare a Claude nome, email o posizione dell'utente. | Avviso presente nell'import; consenso per la chat da fare quando la chat esiste. |
| 2 | **Il chatbot deve dichiarare di essere un'AI** (AI Act art. 50(1), applicabile dal 2/8/2026). Le linee guida UE del 20/7/2026 dicono che un rimando nei termini e condizioni non basta. | [Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force), [DLA Piper](https://www.dlapiper.com/en-gl/insights/publications/2026/08/the-eus-new-guidelines-on-ai-transparency) **[Probabile]** | Etichetta visibile "Sommelier AI, non una persona" nella UI della chat. Lo chiede anche la Usage Policy di Anthropic. | Da fare con la chat. |
| 3 | **Allergeni** (Reg. UE 1169/2011 art. 44): informazione obbligatoria e scritta; sanzioni previste dal D.Lgs. 231/2017. Un errore dell'AI ricade sul ristoratore e, potenzialmente, su di te. | [FIPE](https://fipe.it/wp-content/uploads/2021/12/allergici_sanzioni_web.pdf) **[Certo]** sull'obbligo; importo delle sanzioni **[Ipotesi]** (fonti discordanti: 2.000–16.000 € oppure 3.000–24.000 €) | L'AI non deduce mai gli allergeni. Il ristoratore conferma voce per voce. Nei T&C la responsabilità dei contenuti del menu va al ristoratore. | ✅ Il prompt vieta la deduzione; il campo `allergens_declared` segnala le voci senza allergeni dichiarati; la revisione è obbligatoria prima della pubblicazione. |
| 4 | **Alcol.** Apple 1.4.3: vietate le app che incoraggiano un consumo eccessivo o il bere dei minori. Google vieta lo stesso. L. 125/2001 art. 13: vietata la pubblicità che rappresenta in modo positivo l'assunzione di alcol. | [Apple](https://developer.apple.com/app-store/review/guidelines/), [Google](https://support.google.com/googleplay/android-developer/answer/9878810), [Normattiva L.125/2001](https://www.normattiva.it/eli/id/2001/04/18/001G0181/CONSOLIDATED) **[Certo]**; applicazione a un sommelier AI **[Ipotesi]** | Questionario d'età Apple: alcol → probabile fascia **18+**. Su Google: questionario IARC. Prompt della chat: tono informativo, nessun invito a bere di più, nessun claim salutistico. | Da fare con la chat. |
| 5 | **Funzionalità minima** (Apple 4.2): un menu-webview "impacchettato" viene rifiutato. | [Apple](https://developer.apple.com/app-store/review/guidelines/) **[Certo]** | Layout nativo SwiftUI, import, revisione, chat: tutto in nativo. | ✅ Layout nativo (`MenuLayoutView`). |
| 6 | **Pagamenti.** Apple 3.1.1 impone l'acquisto in-app per sbloccare funzioni. L'eccezione 3.1.3(c) vale solo per servizi venduti a organizzazioni per i loro dipendenti. | [Apple](https://developer.apple.com/app-store/review/guidelines/) **[Certo]**; applicazione al tuo caso **[Ipotesi]** | Vendere l'abbonamento solo ai ristoranti (B2B), fuori dall'app, e non mostrare prezzi o link d'acquisto nell'app. In alternativa: acquisto in-app al 15%. Va confermato con App Review. | Nessun pagamento implementato. |
| 7 | **Cancellazione dell'account.** Apple 5.1.1(v): dall'interno dell'app. Google: anche un link web. | [Apple](https://developer.apple.com/app-store/review/guidelines/), [Google](https://support.google.com/googleplay/android-developer/answer/13327111) **[Certo]** | "Elimina account" nelle impostazioni + pagina web. | Account non ancora implementati. |
| 8 | **Privacy: GDPR + dichiarazioni degli store.** Servono informativa, base giuridica, accordo sul trattamento dei dati (DPA) con Anthropic e con l'hosting, privacy label Apple e sezione Data safety di Google coerenti con l'invio dei dati all'LLM. | [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj) **[Certo]** | Firmare il DPA di Anthropic (incluso nei Commercial Terms), dichiarare l'invio dei dati al fornitore AI, usare iubenda o un legale per le informative. | Da fare. |
| 9 | **Diritti sul menu importato.** Possibili diritto d'autore su testi e foto, diritto sulle banche dati (art. 102-bis L. 633/1941) e termini d'uso di siti terzi (piattaforme di delivery). | [Brocardi art. 102-bis](https://brocardi.it/legge-diritto-autore/titolo-ii-bis/capo-i/art102bis.html) **[Probabile]** | Importare **solo** il menu del ristorante cliente, con autorizzazione nei T&C. Non clonare menu di concorrenti né di piattaforme di delivery. | ✅ Spunta obbligatoria "sono il titolare / ho l'autorizzazione" prima dell'import. |
| 10 | **Minori.** L. 132/2025 art. 4: sotto i 14 anni serve il consenso dei genitori per usare un'AI. Anthropic considera minori gli under 18. Un'app che parla di vino deve comunque essere 18+. | [Normattiva L.132/2025](https://www.normattiva.it/eli/id/2025/09/25/25G00143), [Anthropic AUP](https://www.anthropic.com/aup) **[Certo]** | Fascia d'età 18+ negli store; nei T&C "riservato ai maggiorenni". | Da fare negli store. |

## B. Apple App Store: checklist

- **Account e costi.** Apple Developer Program: 99 USD/anno. Per un'organizzazione serve il D-U-N-S. [Apple](https://developer.apple.com/programs/enroll/) **[Certo]**
- **Fasce d'età.** Il nuovo sistema 13+/16+/18+ sostituisce 12+/17+. Il questionario aggiornato è obbligatorio per inviare aggiornamenti dal 31/1/2026. [Apple](https://developer.apple.com/news/upcoming-requirements?id=07242025a) **[Certo]**
- **Commissioni.**
  - Small Business Program: 15% sotto 1 milione USD di proventi. [Apple](https://developer.apple.com/app-store/small-business-program/) **[Certo]**
  - Nell'UE, termini unici dall'1/10/2026. Esempio: link esterno per l'acquisto al 10% per le piccole imprese. [Apple Newsroom](https://www.apple.com/newsroom/2026/08/apple-announces-changes-for-apps-in-the-european-union/) **[Probabile]**
- **Link esterni.** L'esenzione che consente i link all'acquisto esterno vale **solo per lo storefront USA**: non per l'Italia. **[Certo]**
- **Fotocamera.** Va dichiarata `NSCameraUsageDescription` per lo scanner QR. **[Certo]**

## C. Google Play: checklist

- **Account.**
  - 25 USD una tantum. **[Certo]**
  - Account personale nuovo: closed test con ≥12 tester per 14 giorni consecutivi. [Google](https://support.google.com/googleplay/android-developer/answer/14151465) **[Certo]**
  - Account organizzazione (con D-U-N-S): esente, secondo fonti secondarie **[Probabile]**.
- **Verifica dello sviluppatore Android.** Applicata in regioni selezionate dal 30/9/2026, a livello globale nel 2027. [Android](https://developer.android.com/developer-verification/guides/faq) **[Certo]**
- **Target API.** App nuove e aggiornamenti dal 31/8/2026: **API 36 (Android 16)**. [Android](https://developer.android.com/google/play/requirements/target-sdk) **[Certo]**
- **Policy sui contenuti generati dall'AI.** In ambito per i chatbot: vanno impediti output offensivi. [Google](https://support.google.com/googleplay/android-developer/answer/14094294) **[Certo]**
  - Pulsante in-app per segnalare un output offensivo: le versioni precedenti della policy lo richiedevano. **[Probabile]**: implementalo comunque.
- **Commissioni.** Nel SEE dal 30/6/2026: abbonamenti al 10% + 5% di commissione di fatturazione. [Google](https://support.google.com/googleplay/android-developer/answer/112622) **[Probabile]**
- **Data safety.** Compilazione obbligatoria. **[Certo]**

## D. Termini d'uso di Anthropic (API Claude)

- **[Usage Policy](https://www.anthropic.com/aup)**, in vigore dal 12/11/2026:
  - Un chatbot per consumatori deve dichiarare all'utente che parla con un'AI. **[Certo]**
  - Vietata la disinformazione sulla salute: nessun claim "il vino rosso fa bene al cuore". **[Certo]**
- **[Commercial Terms](https://www.anthropic.com/legal/commercial-terms):**
  - Rispondi tu dei tuoi utenti. **[Certo]**
  - Devi avvisarli che le affermazioni negli output vanno verificate. **[Certo]**
  - Anthropic non addestra i modelli sui contenuti dei clienti. **[Certo]**
  - Gli output appartengono al cliente. **[Certo]**
- **Fallback automatico.** Il backend usa il fallback lato server (`fallbacks: "default"`): se il modello principale rifiuta una richiesta, l'API la riprova su un modello di riserva. Si disattiva rimuovendo due righe in `backend/src/extractMenu.ts`.

## E. Regole commerciali per ristoranti

- **Prezzi esposti.** Obbligo di esporre i prezzi (art. 180 TULPS). [Corte Costituzionale](https://www.cortecostituzionale.it/elenco-massime/singola/25563) **[Probabile]**
- **Coperto.** Va indicato nel menu; nel Lazio è vietato (L.R. 21/2006). [Altroconsumo](https://www.altroconsumo.it/vita-privata-famiglia/viaggi-tempo-libero/speciali/coperto-al-ristorante) **[Probabile]**
  - Nel codice: ✅ il prompt sposta coperto e servizio in `notes`, che il layout mostra.
- **Prodotti surgelati o abbattuti.** Indicazione nel menu. **[Probabile]**
  - Nel codice: ✅ estratta in `notes` o `tags`, se presente nella sorgente.

## F. Punti non verificati da chiudere con un professionista

1. Se l'abbonamento B2B rientra nella 3.1.3(c) di Apple: chiedere ad App Review prima di costruire il flusso di pagamento.
2. Importo esatto delle sanzioni sugli allergeni (D.Lgs. 231/2017).
3. Se la L. 125/2001 sulla pubblicità degli alcolici si applica ai consigli di un sommelier AI.
4. Validità dell'EU-US Data Privacy Framework per il trasferimento dei dati ad Anthropic, al 2026.
5. Perimetro della proroga dell'art. 50(2) dell'AI Act al 2/12/2026 (riguarda la marcatura dei contenuti generati, non l'obbligo di dichiarare che il chatbot è un'AI).
