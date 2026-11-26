# BOZZA v3 (26/11/2026): informativa privacy di AI Som — area ristoratori, pagine clienti e app

> **Bozza da far rivedere a un legale prima della pubblicazione.** Le parti tra **[ ]** sono da verificare o completare.
>
> - Va aggiunta come sezione alla pagina `www.ai-som.it/privacy.html`; poi su Vercel si imposta `NEXT_PUBLIC_PRIVACY_URL`.
> - Fonti dei dati tecnici: configurazione dei servizi letta il 26/11/2026 e codice di ai-som-saas.
>   - Database Supabase: regione `eu-west-1` (Irlanda) **[Certo]**.
>   - Funzioni dell'applicazione su Vercel: spostate dalla regione `iad1` (USA) a `dub1` (Dublino) il 26/11/2026 **[Certo, da verificare dopo il rilascio]**.
>   - Font: inclusi nell'app o serviti dal nostro dominio; il browser dei visitatori non contatta Google **[Certo, dopo il rilascio del 26/11/2026]**.

---

## Area riservata, prova gratuita, abbonamento e pagine dei clienti di AI Som

**Titolare del trattamento:** Oluvida di Tinti Marco **[indirizzo, P.IVA, email di contatto]**.

### 1. Quali dati trattiamo, perché e per quanto

| Dati | Perché | Base giuridica | Per quanto |
|---|---|---|---|
| Email, password (cifrata), nome e tipo del locale | Creare e gestire l'account, anche in prova gratuita | Contratto o misure precontrattuali | Fino alla cancellazione dell'account; account in prova mai attivati: 12 mesi dall'ultimo accesso |
| Dati anagrafici e fiscali del locale (ragione sociale, P.IVA, PEC, indirizzo, telefono) | Fatturazione e intestazione dei documenti | Contratto e obblighi fiscali | 10 anni per gli obblighi fiscali |
| Menù, carta delle bevande, prezzi, allergeni, PDF, foto e link caricati | Creare il menù digitale, le traduzioni e i consigli di sommelier e bartender | Contratto | Finché restano nell'account |
| Copia della pagina del menù dal sito del locale, logo, colori e font | Mostrare ai clienti il menù con la grafica del locale | Contratto, su dichiarazione del ristoratore di averne i diritti | Finché resta nell'account; la data della dichiarazione dei diritti per la durata del rapporto |
| Conferma degli allergeni: chi l'ha data e quando | Dimostrare la verifica fatta dal titolare del locale (Reg. UE 1169/2011) | Obbligo legale del locale / legittimo interesse | Per la durata del rapporto |
| Dati di pagamento | Gestire l'abbonamento | Contratto | Li tratta Stripe; noi conserviamo solo gli identificativi dell'abbonamento |
| Impronta cifrata (hash) dell'indirizzo IP | Limitare le registrazioni abusive e l'uso eccessivo | Legittimo interesse (sicurezza) | Pochi giorni |
| Conteggi di utilizzo (letture del menù, consigli) | Applicare i limiti della prova e dell'abbonamento | Contratto | Per la durata del rapporto |

### 2. Clienti del ristorante (chi usa il menù al tavolo)

Chi usa il menù, il sommelier o il bartender **non crea un account e non inserisce nome né email**. Trattiamo:
- i piatti cercati o scelti, i gusti indicati (per esempio "fruttato", "analcolico") e la lingua;
- le eventuali **allergie indicate** per escludere bevande non adatte: **sono dati relativi alla salute** (art. 9 GDPR). Le usiamo solo per calcolare la risposta, non le colleghiamo a una persona e non le conserviamo dopo la risposta **[Da verificare: il testo della richiesta può finire nei log tecnici per qualche giorno]**;
- il numero del tavolo, se indicato, e la bevanda scelta, per le statistiche del locale;
- le **segnalazioni** di una risposta sbagliata o inappropriata (motivo, nota facoltativa, lingua), che il locale vede nel suo pannello;
- l'indirizzo IP, solo per limitare l'uso eccessivo, per pochi giorni.

**[Per il legale: per i dati sulle allergie valutare la base giuridica (consenso esplicito o art. 9.2.a con avviso al momento della scelta) e il testo dell'avviso da mostrare accanto alla domanda "Allergie o intolleranze?".]**

### 3. Intelligenza artificiale

Menù, carte e richieste dei clienti sono elaborati da **Anthropic PBC** (modelli Claude) per:
- leggere i documenti e la grafica del menù;
- tradurre;
- scrivere le frasi dei consigli.

Le scelte di vini e cocktail le fa un sistema di calcolo di AI Som; l'intelligenza artificiale scrive solo le frasi, che vengono controllate da un sistema di verifica.

- Anthropic agisce come responsabile del trattamento e, secondo i suoi termini commerciali, non usa questi contenuti per addestrare i modelli.
- **L'elaborazione avviene negli Stati Uniti** **[Probabile: l'API diretta di Anthropic non offre oggi un'elaborazione solo UE; verificare DPA e impostazioni "inference_geo"]**. Il trasferimento avviene sulla base dell'EU-US Data Privacy Framework e/o delle clausole contrattuali standard **[verificare l'adesione di Anthropic al DPF]**.
- Inviamo ad Anthropic solo ciò che serve: testi del menù e scelte del cliente, **mai** email, nomi o dati dell'account.
- Le pagine dei clienti indicano che i consigli sono generati da un'intelligenza artificiale.

**Non inserire dati personali di terzi nei menù.**

### 4. Chi tratta i dati per nostro conto e dove

| Fornitore | Ruolo | Dove sono i dati |
|---|---|---|
| Supabase Inc. | Database, accessi, archivio file | Unione europea (Irlanda) |
| Vercel Inc. | Hosting dell'applicazione | Elaborazione in UE (Dublino); società con sede negli USA |
| Anthropic PBC | Elaborazione con intelligenza artificiale | Stati Uniti |
| Stripe Payments Europe Ltd | Pagamenti dell'abbonamento | Irlanda / UE |
| Resend Inc. | Email di servizio | **[da verificare: regione di invio]** |

I fornitori con sede negli Stati Uniti trattano i dati sulla base dell'EU-US Data Privacy Framework o delle clausole contrattuali standard **[verificare per ciascuno]**.

### 5. Minori
Il servizio è riservato a maggiorenni che lo usano per la propria attività. Le pagine dei clienti riguardano anche bevande alcoliche.

### 6. I tuoi diritti
Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e reclamo al Garante privacy.
- **Cancellazione dell'account:** dall'app o dal sito, in «Altro» → «Cancella account». Cancella subito il locale, il menù, la carta, la grafica, le statistiche, i file caricati e l'accesso; se c'è un abbonamento attivo viene disdetto. I passaggi sono descritti anche nella pagina pubblica `/elimina-account`.
- Restano conservati, per gli obblighi fiscali, le fatture e i dati di pagamento già registrati (10 anni).
- Oppure scrivendo a **info@ai-som.it [da confermare]**: rispondiamo entro 30 giorni.
