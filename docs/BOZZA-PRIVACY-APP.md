# BOZZA: integrazione dell'informativa privacy per l'app AI Som

> **Bozza da far rivedere a un legale o a iubenda prima di pubblicarla.**
>
> - Si aggiunge come nuova sezione alla pagina già esistente `www.ai-som.it/privacy.html`, che oggi copre solo i moduli del sito.
> - Una volta pubblicata, su Vercel imposta `NEXT_PUBLIC_PRIVACY_URL` con l'indirizzo della pagina.
> - Fonti dei dati tecnici:
>   - il database Supabase è nella regione `eu-west-1` (Irlanda) **[Certo]**, dato letto dalla configurazione del progetto;
>   - gli altri dati vengono dal codice di ai-som-saas.

---

## Area riservata, prova gratuita e abbonamento AI Som

**Titolare:** lo stesso indicato sopra (Oluvida di Tinti Marco).

### Quali dati trattiamo e perché

| Dati | Perché | Base giuridica | Per quanto |
|---|---|---|---|
| Email, password (cifrata), nome e tipo del locale | Creare e gestire il tuo account, anche in prova gratuita | Contratto o misure precontrattuali | Fino alla cancellazione dell'account; account in prova mai attivati: 12 mesi dall'ultimo accesso |
| Menù, carta dei vini, prezzi, allergeni, foto o PDF che carichi | Creare il menù digitale e i consigli del sommelier | Contratto | Finché resta nel tuo account |
| Dati di fatturazione e pagamento | Gestire l'abbonamento | Contratto e obblighi fiscali | 10 anni per gli obblighi fiscali |
| Indirizzo IP, salvato solo come impronta cifrata (hash) | Limitare le registrazioni abusive alla prova gratuita | Legittimo interesse (sicurezza) | Pochi giorni |
| Conferma degli allergeni: chi l'ha data e quando | Dimostrare la verifica fatta dal titolare del locale (Reg. UE 1169/2011) | Obbligo legale del locale / legittimo interesse | Per la durata del rapporto |

**Clienti del ristorante.** Chi usa il menù o il sommelier al tavolo non crea un account. Registriamo:
- i piatti cercati;
- la lingua;
- il vino scelto;
- il tavolo.

Questi dati servono alle statistiche del locale, senza nome né email. L'indirizzo IP del cliente è usato in forma ridotta solo per limitare l'uso eccessivo.

### Intelligenza artificiale

I menù e le carte che carichi, e le richieste dei clienti al sommelier, sono elaborati da **Anthropic** (modelli Claude) per:
- leggere i documenti;
- tradurre;
- scrivere i consigli.

Anthropic agisce come responsabile del trattamento. Secondo i suoi termini commerciali non usa questi contenuti per addestrare i propri modelli.

**Non inviare dati personali di terzi dentro i menù.**

I consigli del sommelier sono generati da un'intelligenza artificiale e il cliente ne è informato sulla pagina.

### Chi tratta i dati per nostro conto

- **Supabase Inc.:** database e accessi. Dati ospitati nell'Unione europea (Irlanda).
- **Vercel Inc.:** hosting dell'applicazione.
- **Anthropic PBC:** elaborazione con intelligenza artificiale.
- **Stripe Payments Europe Ltd:** pagamenti dell'abbonamento.
- **Resend Inc.:** invio delle email di servizio (conferma dell'account, attivazione).

Alcuni fornitori hanno sede negli Stati Uniti. Il trasferimento avviene sulla base dell'EU-US Data Privacy Framework o delle clausole contrattuali standard. **[Da verificare per ciascun fornitore.]**

### Minori

Il servizio è riservato a maggiorenni che lo usano per la propria attività. I contenuti riguardano bevande alcoliche.

### I tuoi diritti

Valgono i diritti indicati sopra. Puoi cancellare l'account scrivendo a info@ai-som.it **[da sostituire con il pulsante "Elimina account" nell'app, obbligatorio per Apple e Google]**.
