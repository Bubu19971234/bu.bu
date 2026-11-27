# BOZZA v4 (27/11/2026): informativa privacy di AI Som

> **Bozza rivista dopo le osservazioni del legale del 27/11/2026.** Le parti tra **[ ]** sono da completare o confermare.
> I fatti tecnici qui descritti sono stati verificati sul codice e sulla configurazione dei servizi il 27/11/2026.

---

## Titolare del trattamento

**Oluvida di Tinti Marco** **[sede legale, partita IVA, codice fiscale, numero REA, PEC: dalla visura]**
Contatto per la privacy: **info@ai-som.it [da confermare]**

AI Som tratta i dati con ruoli diversi a seconda dell'attività:

| Attività | Ruolo di Oluvida |
|---|---|
| Registrazione dell'account, prova gratuita, abbonamento, fatturazione, assistenza | Titolare |
| Sicurezza del servizio e prevenzione degli abusi | Titolare |
| Dati trattati per conto del locale: clienti che usano il menù, personale che conferma gli allergeni, contenuti caricati | Responsabile del trattamento (art. 28 GDPR); il titolare è il locale |

Il rapporto tra il locale e Oluvida come responsabile è regolato dall'**Accordo sul trattamento dei dati personali**, che fa parte del contratto.

---

## 1. Titolari dei locali (chi si registra)

| Dati | Perché | Base giuridica | Per quanto |
|---|---|---|---|
| Email, password (cifrata), nome e tipo del locale | Creare e gestire l'account, anche in prova gratuita | Contratto o misure precontrattuali | Fino alla cancellazione dell'account; account in prova mai attivati: 12 mesi dall'ultimo accesso |
| Dati anagrafici e fiscali (ragione sociale, partita IVA, PEC, indirizzo, telefono) | Fatturazione | Contratto e obblighi fiscali | 10 anni |
| Accettazione dei termini e approvazione specifica delle clausole: data, ora e versione | Prova del contratto | Contratto / legittimo interesse | Per la durata del rapporto e 10 anni dopo |
| Menù, carta delle bevande, prezzi, allergeni, PDF, foto e link caricati | Fornire il servizio | Contratto | Finché restano nell'account |
| Copia della pagina del menù dal sito del locale, logo, colori e font | Mostrare ai clienti il menù con la grafica del locale | Contratto, su dichiarazione di averne i diritti | Finché resta nell'account |
| Dati di pagamento | Gestire l'abbonamento | Contratto | Li tratta Stripe; noi conserviamo solo gli identificativi dell'abbonamento |
| Conteggi di utilizzo (letture del menù, consigli) | Applicare i limiti della prova e dell'abbonamento | Contratto | Per la durata del rapporto |
| Impronta dell'indirizzo IP alla registrazione | Limitare le registrazioni abusive | Legittimo interesse (sicurezza) | Cancellata il giorno successivo |

## 2. Clienti del locale (chi usa il menù al tavolo)

**Il cliente non si registra, non crea un account e non inserisce nome, email o telefono.** Per questi dati il titolare è il locale; Oluvida li tratta come responsabile.

Cosa viene trattato:
- **Piatti scelti, gusti indicati e lingua:** servono a calcolare il consiglio. Restano nelle statistiche del locale senza alcun identificativo della persona.
- **Numero del tavolo e bevanda scelta**, se indicati: per le statistiche del locale.
- **Allergie o intolleranze indicate al bartender:**
  - servono solo a escludere dalla risposta le bevande non adatte;
  - il calcolo avviene sui nostri server;
  - **non vengono salvate** in nessun archivio;
  - **non vengono inviate al fornitore dell'intelligenza artificiale**;
  - non sono collegate a un nome, a un account o a un dispositivo.
- **Segnalazioni** di una risposta sbagliata o inappropriata: motivo, nota facoltativa e lingua. Le vede il locale nel suo pannello. Si chiede di non scrivere dati personali nella nota.
- **Indirizzo IP:** non viene salvato. Per limitare l'uso eccessivo si calcola un'impronta non reversibile, diversa ogni giorno, che viene cancellata il giorno successivo. I registri tecnici del fornitore di hosting possono contenere l'indirizzo IP per un tempo breve **[verificare la durata nel contratto Vercel]**.

**[Per il legale: con queste misure le allergie non sono associabili a una persona identificata o identificabile. Confermare se è sufficiente l'avviso accanto alla domanda «Allergie o intolleranze?» senza consenso esplicito.]**

## 3. Intelligenza artificiale

Per leggere i menù, tradurre e scrivere le frasi dei consigli usiamo i modelli Claude di **Anthropic PBC**, che agisce come nostro responsabile (sub-responsabile per i dati trattati per conto del locale).

**Cosa inviamo ad Anthropic:**
- i documenti del menù e della carta caricati dal locale (PDF, foto, testo, pagina del sito);
- i nomi dei piatti scelti dal cliente e i vini o i drink candidati;
- i gusti indicati dal cliente (per esempio «fruttato», «analcolico») e la lingua.

**Cosa non inviamo mai:** email, nomi, dati dell'account, dati di pagamento, indirizzo IP, numero del tavolo, **allergie indicate dai clienti**.

**Chi decide:** vini e drink sono scelti da un sistema di calcolo di AI Som. L'intelligenza artificiale scrive solo le frasi, che un controllo automatico verifica prima di mostrarle.

**Conservazione presso Anthropic** (fonti ufficiali consultate il 27/11/2026):
- i dati inviati e le risposte sono cancellati automaticamente **entro 30 giorni**;
- i contenuti segnalati dai sistemi di sicurezza di Anthropic come violazione delle sue regole d'uso possono essere conservati fino a 2 anni;
- per impostazione predefinita Anthropic **non usa** questi contenuti per addestrare i modelli.

**Dove avviene l'elaborazione:** l'interfaccia di Anthropic che usiamo offre due sole opzioni, «globale» (predefinita) e «solo Stati Uniti». Non esiste un'opzione «solo Unione europea». I dati possono quindi essere trattati fuori dallo Spazio economico europeo.

**Garanzie per il trasferimento:** l'accordo sul trattamento dei dati di Anthropic (DPA) fa parte delle sue condizioni commerciali e incorpora le **clausole contrattuali standard** della Commissione europea, moduli 2 e 3. **[Per il legale: conservare copia del DPA e completare la valutazione d'impatto del trasferimento.]**

**Trasparenza:** le pagine dei clienti indicano, accanto a ogni consiglio, che il testo è generato da un'intelligenza artificiale.

**Non inserire dati personali di terzi nei menù.**

## 4. Chi tratta i dati per nostro conto

| Fornitore | Servizio | Dove sono trattati i dati | Garanzia per il trasferimento |
|---|---|---|---|
| Supabase Inc. | Database, accessi, archivio dei file | Unione europea (Irlanda) | **[verificare DPA]** |
| Vercel Inc. | Hosting dell'applicazione | Elaborazione nell'Unione europea (Dublino); società con sede negli Stati Uniti | **[verificare DPA e clausole standard]** |
| Anthropic PBC | Intelligenza artificiale | Stati Uniti o altra area («globale») | DPA con clausole contrattuali standard |
| Stripe Payments Europe Ltd | Pagamenti dell'abbonamento | Irlanda / Unione europea | **[verificare]** |
| Resend Inc. | Email di servizio | **[verificare la regione]** | **[verificare DPA]** |

L'elenco aggiornato dei fornitori è disponibile su richiesta. Le modifiche sono comunicate ai locali con almeno 15 giorni di anticipo.

## 5. Minori
Il servizio è riservato a maggiorenni che lo usano per la propria attività. Le pagine dei clienti riguardano anche bevande alcoliche.

## 6. I tuoi diritti
Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e reclamo al Garante per la protezione dei dati personali.

- **Esportazione dei dati:** dal sito, in «Altro» → «Esporta i miei dati», si scarica un file Excel con anagrafica del locale, menù e carta.
- **Cancellazione dell'account:** dall'app o dal sito, in «Altro» → «Cancella account».
  - Cancella subito il locale, il menù, la carta, la grafica, le statistiche, i file caricati e l'accesso.
  - Se c'è un abbonamento attivo, viene disdetto subito e non ci sono altri addebiti.
  - I passaggi sono descritti anche nella pagina pubblica `/elimina-account`.
- **Cosa resta dopo la cancellazione:** fatture e dati di pagamento già registrati, per 10 anni, per gli obblighi fiscali.
- **Clienti dei locali:** per esercitare i diritti possono rivolgersi al locale, che è il titolare; noi lo assistiamo.
- Per ogni richiesta: **info@ai-som.it [da confermare]**. Rispondiamo entro 30 giorni.

## 7. Modifiche
Possiamo aggiornare questa informativa. Le modifiche rilevanti sono comunicate via email ai titolari dei locali.
