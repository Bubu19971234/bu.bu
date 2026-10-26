# AI SOM e AI SOM Marginalità: analisi prima di costruire le pagine

> Stato: bozza 1, scritta **prima** di vedere il sito del centro distribuzione bevande e l'analisi sui siti AI SOM che arriverà dopo.
> Assunzione di base [Ipotesi]: "AI SOM" è un sommelier/consulente AI che consiglia le bevande (vino, birra, spirits) ai clienti horeca del distributore. "AI SOM Marginalità" è lo stesso motore orientato al margine: suggerisce le referenze e il mix che fanno guadagnare di più il locale (e il distributore).

---

## 1. Lettura da Senior Marketing Analyst

### Problema di posizionamento (la verità scomoda)
- **Due prodotti con quasi lo stesso nome confondono.** [Probabile] Un ristoratore che vede "AI SOM" e "AI SOM Marginalità" non capisce se deve comprarne uno, l'altro o entrambi. Va presentato come **un solo prodotto con due livelli**, non come due prodotti.
- **"Marginalità" è un termine da controller, non da ristoratore.** [Probabile] Il titolare di un locale ragiona in "quanto mi resta in tasca per bottiglia/coperto", non in "marginalità".
- **Il sito di un distributore non è un sito SaaS.** [Certo] Il visitatore arriva per ordinare o per il listino. L'AI deve essere presentata come *servizio incluso o a valore aggiunto per i clienti del distributore*, non come software autonomo, altrimenti sembra un corpo estraneo.

### Target e messaggio per ambiente
| | Ambiente 1 – consiglio | Ambiente 2 – margine |
|---|---|---|
| Chi | Sala, camerieri, piccoli locali | Titolare, F&B manager, catene |
| Dolore | "Non so cosa abbinare/proporre" | "Vendo tanto ma guadagno poco sul beverage" |
| Promessa | Proponi la bottiglia giusta in 10 secondi | Più margine per coperto senza alzare i prezzi |
| Prova necessaria | Demo dal vivo (domanda → risposta) | Numero: "+X € di margine al mese" con un calcolatore |
| KPI pagina | Prove gratuite avviate | Richieste di analisi carta / demo |

### Nomi proposti (scelta da fare)
Un'unica famiglia, due livelli:
1. **AI SOM** (consiglio) + **AI SOM Pro** (margine) – più semplice, standard SaaS. *Mia raccomandazione.*
2. **AI SOM Sala** + **AI SOM Cassa** – parla la lingua del locale (sala = vendere, cassa = guadagnare).
3. **AI SOM Abbina** + **AI SOM Rende** – più evocativo, meno immediato.

Da evitare: "AI SOM Marginalità" come nome pubblico (lungo, tecnico, non vende).

### Rischi di marketing
- Promettere numeri di margine senza dati reali del cliente → perdita di credibilità al primo controllo. Il calcolatore deve dire "stima" e basarsi sui dati inseriti dall'utente.
- Comunicazione diversa tra sito distributore e sito AI SOM → il cliente percepisce due aziende. Serve un brand kit unico (nome, colori, claim, prezzi) prima di toccare entrambi i siti.

---

## 2. Lettura da esperto di vendita SaaS

### Modello commerciale
- **Il canale è il distributore, non il web.** [Probabile] Gli agenti che visitano i locali sono il miglior canale di vendita. La pagina serve a: (a) dare all'agente un link/QR da mostrare, (b) chiudere l'attivazione in autonomia dopo la visita.
- **Struttura prezzi consigliata** [Ipotesi sui valori, da validare]:
  - *AI SOM*: gratis/incluso per clienti del distributore sopra una soglia d'ordine, oppure ~19–29 €/mese. Funziona da cavallo di Troia per fidelizzare.
  - *AI SOM Pro*: ~49–79 €/mese, prova 14 giorni, sconto annuale (2 mesi gratis).
  - Catene/multi-locale: "parla con noi".
- **Upgrade naturale**: il livello base deve mostrare un'anteprima bloccata del margine ("questo abbinamento ti rende +2,40 € – sblocca con Pro"). È il motore dell'upsell.
- **Lock-in sano**: se l'AI consiglia prima le referenze del catalogo del distributore, l'app aumenta anche il venduto del distributore. Questo è il vero ROI per chi la offre, e va misurato.

### Obiezioni prevedibili e risposta sulla pagina
| Obiezione | Risposta da mettere in pagina |
|---|---|
| "Non ho tempo di configurarla" | Attiva in 5 minuti, carichiamo noi la tua carta vini |
| "I miei camerieri non la useranno" | Funziona dal telefono, nessuna app da scaricare (PWA) |
| "Costa" | Calcolatore: basta 1 bottiglia in più al mese per ripagarla |
| "Mi vincola al distributore" | Puoi aggiungere anche referenze esterne |

---

## 3. Confronto tra le due letture

**Dove concordano:** un solo brand con due livelli; la prova del valore (demo + calcolatore) conta più del testo; l'attivazione deve essere quasi immediata.

**Dove divergono:**
- Il marketing vuole due pagine con identità forti; la vendita vuole un percorso unico che porti all'upgrade. → **Sintesi:** una pagina "hub" AI SOM sul sito del distributore con due schede livello, ciascuna con una sottopagina dedicata, prezzi affiancati e un solo pulsante d'acquisto per livello.
- Il marketing spinge sul consiglio (più facile da capire); la vendita sui soldi (più facile da far pagare). → Il livello base si vende con la demo, il Pro con il calcolatore.

---

## 4. Piano pagine (da costruire dopo la tua conferma)

1. `/ai-som` – hub: claim, demo, confronto tra i due livelli, FAQ.
2. `/ai-som/consiglio` (nome da scegliere) – demo interattiva, casi d'uso in sala.
3. `/ai-som/pro` – calcolatore del margine, caso studio, prezzi.
4. `/ai-som/attiva` – pagamento + installazione in 3 passi.

## 5. Pagamento e installazione semplici (punto finale)
- **Niente app store**: PWA, "aggiungi alla schermata Home" + QR da stampare per la sala. [Probabile] scelta che elimina il passaggio più fragile.
- **Pagamento**: Stripe Checkout / Payment Links (carta, Apple/Google Pay, SEPA), prova senza carta per il livello base. Fattura elettronica automatica (necessaria in Italia per i B2B).
- **Onboarding in 3 passi**: 1) paga o avvia la prova → 2) carica la foto della carta vini o scegli dal catalogo del distributore → 3) scansiona il QR e sei operativo.
- **Accesso**: link magico via email, niente password.

---

## Decisioni che servono da te
1. Nome dei due livelli (raccomando AI SOM / AI SOM Pro).
2. Prezzi reali o fascia, e se il base è incluso per i clienti del distributore.
3. Dove sta il sito del distributore (repository/URL): **questo repository contiene solo un README vuoto**, quindi le pagine non possono ancora essere integrate.
