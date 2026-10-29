# AI-SOM — audit definitivo di sito, brand, funnel e prodotto

**Revisione 6 — 27 ottobre 2026**  
**Ambito analizzato:** `ai-som.it`, pagina B2B del distributore, ambiente SaaS di prova nei piani Starter e Marginalità.  
**Obiettivo:** aumentare la probabilità che un ristoratore comprenda, provi e acquisti.

## Changelog R5 → R6

- Sostituito il CPLQ unico con soglie per offerta e con il ricavo annuo atteso per euro di spesa.
- Il social usa lo split test nativo e confronta l'offerta completa: annuncio più landing.
- Documento congelato: ulteriori modifiche richiedono dati nuovi.

## Verdetto strategico

I dati disponibili non permettono di scegliere Sommelier o Margini come proposta principale. Il primo sembra più differenziato e più specifico; il secondo potenzialmente più ampio. Mancano domanda, utilizzo e disponibilità a pagare comparabili.

La decisione corretta è **non riscrivere ancora l'intera homepage attorno a uno dei due prodotti**. Prima vanno confrontate due proposte autonome:

- **Sommelier:** “Fai scegliere il vino giusto dal tuo menù, anche quando in sala non c'è un sommelier.”
- **Margini:** “Scopri a quanto vendere ogni piatto per ottenere il margine che vuoi.”

Il confronto usa due landing e la stessa definizione di lead. Assegnazione e confronto cambiano per canale. In parallelo, 8–10 conversazioni `[Ipotesi]` presentano entrambe le proposte, alternandone l'ordine, e registrano problema, urgenza, obiezioni e disponibilità a pagare. Producono evidenza qualitativa, non un vincitore statistico.

La homepage definitiva si decide dopo la verifica. White label, e-commerce, produttori e hotel restano fuori perché hanno pubblici e cicli diversi.

## Verifica delle sei critiche

1. **ACCETTO — regola di arresto. `[Certo]`** La R4 non definiva budget, durata, numerosità o decisione con poco volume. Una soglia arbitraria non rende però il test statisticamente affidabile: servono conversione di base e minimo effetto rilevante. Il protocollo distingue regola operativa `[Ipotesi]` e analisi statistica. Con volume insufficiente non dichiara un vincitore.

2. **ACCETTO IN PARTE — canale e randomizzazione. `[Certo]`** Sui social serve lo split test nativo con annunci coerenti. La ricerca richiede invece campagne e keyword distinte. “Stessa sorgente” non era errato in assoluto; mancava la distinzione per canale.

3. **ACCETTO IN PARTE — pagina del distributore. `[Certo]` sul contenuto, `[Probabile]` sull'intento.** Il 27 ottobre 2026 la pagina ha URL `food-cost-ristorante.html`, ma titolo e hero parlano di “food cost e vendita del vino” e presentano entrambi i prodotti. L'URL da solo non dimostra l'intento dei visitatori. Per coerenza semantica, questa URL deve portare con Margini e collegare in seconda battuta il Sommelier; quest'ultimo deve avere un ingresso dedicato alla vendita del vino. Search Console e sorgenti reali devono confermare la scelta.

4. **ACCETTO — titolo Margini ambiguo. `[Probabile]`** “Quanto deve costare” può indicare costo industriale o prezzo al cliente. Formula scelta: **“Scopri a quanto vendere ogni piatto per ottenere il margine che vuoi.”**

5. **ACCETTO — prezzo come variabile confondente. `[Certo]`** Il sito e la pagina del distributore mostrano AI Som a 300 €/anno e Margini a 600 €/anno, IVA esclusa, rilevati il 27 ottobre 2026. Scelgo di mostrare i prezzi nella stessa posizione e formato: l'esperimento misura l'offerta reale, composta da problema, prodotto e prezzo. Non potrà stabilire quale prodotto piacerebbe di più a parità di prezzo, ma produrrà un'indicazione più utile sull'acquisto reale.

6. **ACCETTO — destinazione delle campagne. `[Certo]`** Portare nuovo traffico alla homepage attuale aggiungerebbe una variabile confondente. La baseline usa traffico già esistente e nessuna spesa incrementale. Le campagne partono soltanto dopo landing, eventi e controllo qualità.

## Segmenti e problemi da confrontare

### Ipotesi Sommelier

Ristoranti, trattorie, enoteche e wine bar con carta vini significativa, competenza discontinua in sala o clientela internazionale. Il beneficio da testare è la capacità di far scegliere con sicurezza, spiegare gli abbinamenti e osservare l'interesse per le bottiglie presenti.

### Ipotesi Margini

Ristoranti, pizzerie, bar, gelaterie e altre attività che devono aggiornare prezzi, food cost e redditività. Il beneficio da testare è ricavare il prezzo di vendita di ogni prodotto dai costi reali e dal margine desiderato.

I due problemi non vanno sommati nella stessa hero durante la validazione. Ogni landing deve parlare a un solo bisogno e usare una conversione confrontabile: richiesta di prova qualificata o prenotazione di una demo.

## Benchmark: SaaS per ristorazione indipendente e piccoli gruppi

Il confronto usa prodotti rivolti a ristoranti indipendenti o realtà contenute, senza dedurne la dimensione societaria. Osserva come riducono rischio e incertezza prima dell'acquisto.

| SaaS | Cosa comunica bene | Cosa deve adottare AI-SOM |
|---|---|---|
| [Servio](https://servio.rest/?lang=en) | Mostra prodotto e stati `Ready`, `Needs review`, `Blocked` | Usare stati reali e bloccare ciò che non è pronto |
| [Menumigo](https://menumigo.com/about) | Import da foto/PDF, nessun hardware, prova senza carta | Ridurre il primo passo al caricamento del menù |
| [Fustesia](https://www.fustesia.com/) | Demo senza registrazione e prova con durata esplicita | Far vivere il risultato prima del form |
| [Plazn](https://www.plazn.com/en) | Moduli, prezzo piatto e prova chiaramente esposti | Rendere confrontabili contenuto, prezzo e prova |
| [Menutech](https://www.menutech.com/it/prezzi) | Mensile, annuale e pausa stagionale | Chiarire durata, IVA, rinnovo e stagionalità |

## Protocollo dell'esperimento

**Ipotesi.** H1: l'offerta Sommelier genera domanda commerciale sostenibile. H2: l'offerta Margini genera domanda commerciale sostenibile. L'obiettivo non è dimostrare che un prodotto sia universalmente migliore, ma scegliere l'offerta e il segmento su cui concentrare il ciclo commerciale successivo.

**Segmento.** Titolare o responsabile di un locale indipendente italiano. Un lead è qualificato quando: il locale è attivo; la persona influenza l'acquisto; riconosce il problema descritto dalla landing; lascia un contatto valido; accetta una call o una prova. La definizione va applicata allo stesso modo a entrambi i prodotti.

**Offerte.** Sommelier: “Fai scegliere il vino giusto dal tuo menù, anche quando in sala non c'è un sommelier”, 300 €/anno più IVA. Margini: “Scopri a quanto vendere ogni piatto per ottenere il margine che vuoi”, 600 €/anno più IVA. Prezzo, rinnovo e contenuto sono mostrati nella stessa posizione e formato. Il test confronta quindi le offerte reali, prezzo incluso.

**Canali.** Sui social a pagamento rivolti genericamente a ristoratori, usare lo split test nativo della piattaforma: due gruppi di inserzioni, pubblico e budget controllati, annunci coerenti con la rispettiva landing. Il test confronta l'offerta completa **annuncio + landing**, non la sola pagina. Su una lista email generalista, divisione casuale della stessa lista. Sulla ricerca a pagamento, campagne separate: keyword sul vino verso Sommelier; keyword su food cost, prezzi e margini verso Margini. Traffico diretto e organico non entra nel confronto causale se non è assegnabile in modo controllato. I canali non vengono aggregati in un'unica percentuale.

**Baseline.** Prima della spesa, raccogliere 28 giorni di traffico esistente `[Ipotesi]` oppure documentare che il volume è insufficiente. Misurare sorgente, demo, form, call, prova, primo risultato, acquisto, ricavo annuale, obiezioni e ore di assistenza. La baseline non usa budget incrementale.

**Budget.** Il test non parte finché il titolare non approva `B_max = €___`, la quota massima di ricavo annuo spendibile in acquisizione `q = ___%` e una soglia per offerta: `CPLQ_max Sommelier = 300 € × tasso di chiusura Sommelier × q`; `CPLQ_max Margini = 600 € × tasso di chiusura Margini × q`. Il prezzo da solo non basta: senza `q` e tasso di chiusura la soglia non è calcolabile. Se i tassi non sono ancora osservabili, usare la stessa ipotesi per entrambe le offerte e marcarla `[Ipotesi]`.

**Durata e arresto.** Durata massima: 6 settimane `[Ipotesi]`, oppure esaurimento di `B_max`, qualunque evento arrivi prima. Controlli tecnici ammessi ogni settimana; nessuna scelta del vincitore prima dell'arresto. Soglia operativa minima: 20 lead qualificati per offerta e almeno 5 call o prove svolte per offerta `[Ipotesi]`. Queste soglie non assicurano significatività statistica. Dopo la baseline, se si vuole un'affermazione statistica, il campione va ricalcolato dichiarando conversione di base, minimo effetto rilevante, livello di confidenza e potenza.

**Metrica primaria per i canali a pagamento.** Ricavo annuo atteso per euro di spesa: `(lead qualificati × tasso di chiusura osservato × prezzo annuo) ÷ spesa`. Calcolarla separatamente per offerta e canale. Se il tasso di chiusura non è ancora osservabile, dichiararlo e usare la stessa ipotesi per entrambe `[Ipotesi]`. Per email, dove la spesa media può non essere attribuibile, usare lead qualificati per 100 messaggi consegnati come metrica secondaria.

**Regola di decisione.** All'interno dello stesso canale, un'offerta riceve il focus commerciale successivo se raggiunge la propria soglia `CPLQ_max` e la metrica primaria è almeno 2× quella dell'altra, senza segnali contrari su attivazione e acquisto `[Ipotesi: euristica di business, non prova statistica]`. Se mancano tassi di chiusura osservati, il risultato resta provvisorio. Se la soglia non è raggiunta, il vantaggio è inferiore o le metriche a valle contraddicono il risultato, l'esito è “inconcludente”.

**Pareggio o volume insufficiente.** Non si dichiara un vincitore. Le 8–10 interviste comparative `[Ipotesi]` e i pilot valutano, con la stessa scheda, gravità del problema, urgenza, disponibilità a pagare, sforzo di attivazione e costo di servizio. Questi dati possono scegliere il focus provvisorio del ciclo commerciale seguente, ma non giustificano una homepage universale. Se emergono segmenti distinti, si mantengono entrambe le landing e si instrada ogni intento al prodotto pertinente.

**Costo della prova.** Su cinque pilot `[Ipotesi]` registrare ore di importazione, QA, assistenza e call, più API, infrastruttura e materiali. `Costo prova = ore × costo orario pieno + costi variabili`. `Costo per cliente acquisito = costo medio prova ÷ tasso prova→acquisto`. Nessuna prova assistita standard prima di questa misura.

## Pagina del distributore: ruolo e contenuto

La [pagina B2B del distributore](https://www.centrodistribuzionebevande.it/food-cost-ristorante.html), verificata il 27 ottobre 2026, presenta già entrambi i prodotti: hero su food cost e vendita del vino, blocco Sommelier, blocco Margini e prezzi. Il collegamento ad `ai-som.it` è in fondo, ma AI-SOM non è assente dal contenuto.

Questo intervento appartiene al **canale partner**, non ai prerequisiti delle campagne a pagamento. Può procedere separatamente dopo aver assegnato un responsabile commerciale e definito attribuzione, passaggio del lead e assistenza.

### Posizione nel sito

Usare `food-cost-ristorante.html` come ingresso principale a **Margini**, coerente con URL e query attese, mantenendo il Sommelier come soluzione complementare. Creare una pagina distinta dedicata alla vendita del vino per il Sommelier e collegarla dalla sezione servizi. Questa scelta è `[Probabile]`: prima di consolidarla vanno controllate query Search Console, sorgenti e CTA selezionate nel form esistente.

### Testo consigliato per il blocco Sommelier nella pagina dedicata

**Titolo**  
La carta vini che acquisti deve lavorare meglio al tavolo.

**Sottotitolo**  
Con AI-SOM il cliente descrive il piatto o l'occasione e riceve consigli soltanto tra le bottiglie disponibili nel tuo locale. La sala lavora con più continuità, anche con clienti stranieri, e tu scopri quali etichette attirano interesse.

**Benefici:** valorizza soltanto le referenze presenti; aiuta il personale a spiegare gli abbinamenti; mostra quali bottiglie attirano interesse. Il numero di lingue va pubblicato dopo la verifica end-to-end.

**CTA primaria**  
Prova AI-SOM sulla tua carta vini

**Microtesto**  
Invia menù e carta. Ti mostriamo il risultato prima di decidere.

### Collegamento fra i due siti

- Aprire una landing partner, non la homepage generica, passando sorgente e partner al form.
- Chiarire chi eroga prodotto, assistenza e trattamento dei dati e cosa succede dopo l'invio.
- Non promettere integrazione con il catalogo finché dati, responsabilità e aggiornamenti non sono definiti.

## Sistema di brand

### Situazione osservata sul sito pubblico

- Font: **Plus Jakarta Sans**, pesi 400–800.
- Fondo principale: `#0F0F0F`.
- Superfici: `#1A1A1A` e `#242424`.
- Rosso vino: `#C43C4D`; variante scura `#A6303D`; rosa `#E39AA4`.
- Testo principale: `#EDE6DD`; testo secondario `#C0B0A0`; testo attenuato `#8A7A6A`.

Il sito pubblico ha già una direzione riconoscibile e adatta al vino. Non serve cambiare identità: serve renderla più coerente e funzionale.

### Decisioni di brand

- **Mantenere Plus Jakarta Sans** per sito e prodotto. È leggibile, contemporaneo e permette numeri compatti. Usare 700–800 solo per titolo, KPI e prezzo; 400–500 per testo e controlli.
- **Usare il rosso vino per azioni primarie**, selezione e punti di attenzione. Sui colori rilevati il 27 ottobre 2026, il rapporto fra `#C43C4D` e `#0F0F0F` è circa 3,74:1 e scende a circa 3,03:1 su `#242424`: non usarlo come testo normale. Bianco su rosso raggiunge circa 5,12:1. Rapporti calcolati con la formula di luminanza relativa [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **Usare avorio e sabbia per la lettura.** Sugli stessi colori, `#C0B0A0` sul nero raggiunge circa 9,09:1. `#8A7A6A` raggiunge circa 4,63:1 su `#0F0F0F`, ma scende a circa 3,75:1 su `#242424`: su quella superficie non supera AA per il testo normale.
- **Riservare l'oro ai dati di Margini** e mantenere il rosso vino per AI-SOM.
- **Adottare una scala fissa:** 48–64 px hero desktop, 36–44 px mobile, 28–36 px titoli, 16–18 px testo, minimo 14 px per note non essenziali.
- **Incasellare i numeri con regole comuni:** etichetta sopra, valore grande, unità allineata, spiegazione breve e fonte sotto. Euro, percentuali e quantità non devono competere nello stesso riquadro senza gerarchia.
- **Rendere gli stati indipendenti dal colore:** icona, testo e azione per `Pronto`, `Da verificare`, `Bloccato`, `Errore`.

## Prova del prodotto: risultati osservati

### Starter

- Reset, accesso e importazione del menù riusciti: 4 piatti e 2 vini, mantenuti fino alla conferma.
- Dopo il salvataggio, la dashboard mostrava “3/3 completati” e “Tutto pronto” mentre restavano allergeni da confermare, traduzioni da eseguire e vini da arricchire. È un errore di stato e di fiducia.
- Prima dell'arricchimento dei vini, il consiglio ha restituito “Risposta non valida”. Dopo l'arricchimento dei due vini ha funzionato.
- Il consiglio riuscito ha mostrato un Chianti con match 68% e una spiegazione lunga. Con due vini e uno compatibile, un solo risultato non dimostra un difetto.
- La vista cliente è leggibile; allergeni non confermati rimandano al personale, ma devono impedire lo stato “Pronto”. La pagina QR propone 20 tavoli e stampa complessiva.

### Marginalità

- Lo Starter blocca correttamente la funzione. L'upgrade mostra 600 €/anno o 59 €/mese; il sito mostra 600 €/anno, equivalente a 50 €/mese con fatturazione annuale, senza spiegare la differenza.
- Inserendo 20 giorni, 50 coperti al giorno, 30 € di scontrino, obiettivo 10% e 3.000 € di affitto mensile, il pannello ha aggiornato in tempo reale costi fissi, costo per cliente e food cost massimo.
- Ricerca ingredienti, stima e prezzo reale sono ben impostati; le 11 sezioni rendono però impegnativo il percorso verso il primo risultato.

### Copertura reale della prova

| Funzione | Stato |
|---|---|
| Reset, login, onboarding Starter | Provata |
| Import testuale, revisione e salvataggio | Provata |
| Arricchimento di due vini e consiglio cliente | Provata |
| QR tavoli e stampa | Ispezionata, non stampata fisicamente |
| Setup di base Margini e ingredienti | Provato |
| Ricetta completa e verifica contabile finale | Parzialmente provata |
| Piano Combo completo | Non verificato |
| Traduzione di tutti i contenuti nelle otto lingue | Non verificata end-to-end |
| Importazione PDF, fotografia, Excel/XML | Non verificata |
| Checkout e pagamento | Non provati, per evitare transazioni reali |
| Inviti, ruoli, export e integrazioni | Non verificati |
| Accessibilità con tastiera e screen reader | Non verificata end-to-end |
| Browser e dispositivi multipli | Non verificati in modo completo |

Non è quindi corretto affermare che tutte le funzioni del tool siano state validate. La prova è sufficiente per identificare problemi critici nel percorso principale, non per certificare l'intero prodotto.

## Modifiche da eseguire

### Priorità 0 — prerequisiti minimi per le campagne

- **Correggere lo stato di prontezza.** `Tutto pronto` deve comparire soltanto quando dati obbligatori, allergeni, carta vini e passaggi necessari alla pubblicazione sono completati. Mostrare `Importato`, `Da verificare`, `Pronto per il pubblico`.
- **Impedire il consiglio su una carta non pronta.** Il pulsante deve spiegare l'attività mancante e portare all'azione. Eliminare “Risposta non valida”.
- **Allineare le lingue.** Sito, app, demo, materiali commerciali e contratto devono riportare lo stesso elenco effettivamente funzionante.
- **Allineare prezzi e periodicità.** Esporre `600 €/anno, pari a 50 €/mese` e, se disponibile, `59 €/mese con fatturazione mensile`. Indicare IVA, rinnovo e disdetta.
- **Rinominare la demo.** Quella con 30 vini è una “demo interattiva con catalogo campione”; “live sul tuo catalogo” va usato soltanto per dati del ristorante.
- **Rimuovere temporaneamente garanzia e `+117%` dalle prove di risultato.** La garanzia può tornare solo dopo la definizione e approvazione di baseline, requisiti, esclusioni, prova del risultato e procedura di rimborso. Il numero richiede un confronto valido prima di essere usato per vendere.

### Priorità 1 — UX, UI e accessibilità

- **Ridurre la risposta del sommelier al tavolo.** Prima schermata: vino, prezzo e una frase; dettagli in un'espansione. Spiegare il match o rimuoverlo dalla vista cliente.
- **Semplificare Margini:** primo risultato con stime dichiarate, seguito dalla checklist per sostituirle con fatture, personale, costi fissi e ricette.
- **Riorganizzare i KPI in una griglia stabile:** massimo quattro indicatori per riga desktop e uno o due su mobile, stessa altezza e unità non spezzate.
- **Usare cifre tabellari** per prezzi e percentuali; mantenere due decimali soltanto quando utili.
- **Correggere i contrasti sulle superfici `#242424`** e verificare 4,5:1 per tutto il testo normale.
- **Rendere i controlli touch almeno 24×24 CSS px** o rispettare le eccezioni di spaziatura previste da [WCAG 2.2 Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); 44×44 resta una raccomandazione progettuale per le azioni primarie.
- **Aggiungere focus visibile, label persistenti, errori specifici e stato non affidato al solo colore.**
- **Verificare a 320, 390, 768 e 1280 px**, poi con tastiera e lettore di schermo, i percorsi principali.

### Priorità 2 — canali, retention e crescita

- **Costruire il percorso del distributore** con landing partner e attribuzione solo dopo aver definito responsabile commerciale, SLA e passaggio del lead.
- **Trasformare i report in azioni:** metti in evidenza, proponi al calice, rivedi prezzo, contatta il distributore.
- **Creare un report mensile** con scelte, richieste senza risultato, bottiglie ferme e azioni consigliate.

## Piano operativo con responsabili e sforzo

Le stime sono `[Ipotesi]`, ricavate da un'ispezione esterna e non da una scomposizione tecnica del repository: **S** fino a 1 giornata-persona, **M** 2–5 giornate, **L** oltre 5 giornate. Devono essere confermate dai responsabili.

| Ordine | Intervento | Responsabile primario | Sforzo | Dipendenza / risultato atteso |
|---:|---|---|:---:|---|
| 1 | Correggere `Tutto pronto` | Prodotto + sviluppo | M | Regole condivise sui requisiti di pubblicazione |
| 2 | Bloccare il consiglio non pronto e sostituire l'errore | Sviluppo | M | Stato dei vini affidabile e messaggio con azione |
| 3 | Allineare lingue in prodotto e comunicazione | Prodotto + QA + marketing | M | Test end-to-end dell'elenco supportato |
| 4 | Allineare prezzi, IVA e periodicità | Responsabile commerciale + marketing | S | Decisione contrattuale sul mensile |
| 5 | Rinominare la demo campione | Marketing | S | Nessuna dipendenza tecnica |
| 6 | Rimuovere garanzia e `+117%`; rivalutarli con basi valide | Titolare + legale/commerciale | S per rimozione | Termini e confronto approvati prima del ripristino |
| 7 | Installare e verificare gli eventi della baseline | Growth/analytics + sviluppo | M | Nomi evento e sorgenti concordati |
| 8 | Creare landing Sommelier e Margini coerenti per struttura | UX/UI + sviluppo + marketing | L | Eventi funzionanti e stessa definizione di lead |
| 9 | Condurre interviste comparative | Commerciale + prodotto | M | Script unico e registrazione delle obiezioni |
| 10 | Misurare cinque pilot e costo per prova | Operations + commerciale | M | Timesheet, costi API e risultato di ogni prova |
| 11 | Correggere contrasto, focus, touch e reflow | UX/UI + sviluppo frontend | L | Test ai breakpoint e controllo tastiera |
| 12 | Attivare il canale distributore | Partnership + marketing | M/L | Responsabile lead, SLA, attribuzione e privacy |

Nessuna campagna di acquisizione parte prima delle righe 1–8, del controllo qualità degli eventi e dell'approvazione di `B_max`, `q` e dei due `CPLQ_max`. La raccolta della baseline usa soltanto traffico già esistente. Il canale distributore non blocca l'esperimento.

## Autocritica della Revisione 6

### Tre assunzioni deboli

1. **Sommelier e Margini possono essere confrontati nello stesso pubblico. `[Ipotesi]`** Se è falso, un vincitore generale nasconderebbe due segmenti diversi. Verifica economica: classificare settore, carta vini e problema principale nei contatti già disponibili e nelle prime 8–10 interviste; se i segmenti divergono, mantenere due funnel.
2. **Esiste volume sufficiente per raggiungere le soglie entro sei settimane. `[Ipotesi]`** Se è falso, il test quantitativo resterà inconcludente. Verifica economica: controllare impression e query storiche, dimensione delle liste contattabili e previsioni delle piattaforme prima di produrre le landing complete.
3. **Il tasso di chiusura iniziale anticipa quello futuro. `[Ipotesi]`** Se è falso, la metrica primaria sovrastima o sottostima il ricavo. Verifica economica: aggiornare separatamente i tassi di Sommelier e Margini a ogni chiusura e non confermare la scelta finché le conversioni a valle la contraddicono.

### Stime senza base storica

- **S/M/L:** stima esterna, senza ticket tecnici o analisi delle dipendenze; `[Ipotesi]`.
- **8–10 interviste:** quantità pratica per cercare schemi qualitativi, senza garanzia di saturazione; `[Ipotesi]`.
- **Cinque pilot:** sufficiente per una prima osservazione operativa, non per stimare stabilmente costo medio o conversione; `[Ipotesi]`.
- **28 giorni di baseline, sei settimane di test, 20 lead e cinque call/prove per offerta:** soglie operative non derivate da storico AI-SOM; `[Ipotesi]`.
- **Vantaggio 2× sulla metrica economica:** euristica commerciale, non soglia statistica; `[Ipotesi]`.

### Decisioni che mancano al titolare

- **Quali sono `B_max` e la quota `q` di ricavo annuo spendibile in acquisizione?** Senza questi valori i due `CPLQ_max` non sono calcolabili e l'esperimento non parte.
- **Esistono tassi di chiusura osservati e separati per Sommelier e Margini?** Se no, quale unica ipotesi iniziale si approva per entrambe, marcata `[Ipotesi]`?
- **Chi è il responsabile unico dell'esperimento e chi decide se un lead è qualificato?** Senza un proprietario la classificazione può cambiare fra i due rami.
- **I prezzi 300 €/anno e 600 €/anno, IVA esclusa, sono le offerte che si vogliono davvero vendere durante il test?** Se cambiano, il protocollo e i materiali vanno aggiornati prima del traffico.
- **Qual è il costo orario pieno delle persone coinvolte e quante ore settimanali possono sostenere i pilot?** Senza questi dati non si può approvare la prova assistita.

### Cosa cambia rispetto alla Revisione 4

La R5 sostituisce il confronto generico con un protocollo per canale, introduce arresto e risultato “inconcludente”, mostra entrambi i prezzi, impedisce campagne verso la homepage, riallinea la pagina food cost a Margini e separa la pagina Sommelier. Le soglie prima implicite sono ora marcate come ipotesi. Non viene più promesso che il test selezioni necessariamente un unico prodotto: può concludere che servono due segmenti e due funnel.

## Claim e numeri: correzioni necessarie

- **+117%:** va rimosso dalla hero e dalle prove di risultato. Confronta il valore dei vini scelti tramite AI-SOM con la media dei prezzi presenti in carta, non con la spesa media per vino prima di AI-SOM o con un gruppo di controllo. I clienti, anche senza il prodotto, non acquistano necessariamente il vino medio della carta. Una settimana e 39 tavoli non permettono una conclusione commerciale robusta. Il caso può restare come racconto qualitativo, senza percentuale, finché non esiste una baseline comparabile.
- **8/10 lingue:** il sito contiene entrambe le versioni; la demo mostra otto. Pubblicare un solo numero dopo una prova completa.
- **“In 3 secondi”:** usarlo soltanto dopo misurazione su rete mobile e dispositivo reale; altrimenti “in pochi passaggi”.
- **“In 48 ore”:** deve diventare un impegno operativo misurato, con condizioni sull'invio dei materiali.
- **Garanzia 90 giorni:** definire baseline, eventi misurati, volume minimo, esclusioni e richiesta di rimborso prima di promuoverla.
