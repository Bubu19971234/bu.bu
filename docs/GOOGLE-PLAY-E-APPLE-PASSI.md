# Google Play e Apple: i passi che restano (27/11/2026)

Dati dell'impresa, dalla visura del 28/04/2026:

| | |
|---|---|
| Nome legale | OLUVIDA DI TINTI MARCO |
| Forma | impresa individuale |
| Indirizzo | Via Giuseppe Mazzini 312, 51036 Larciano (PT), Italia |
| Partita IVA | 02075290474 |
| D-U-N-S | 507652847 |
| Nome pubblico dello sviluppatore | AI Som |
| Identificativo dell'app | `it.aisom.app` |

## 1. Google Play: aprire l'account

Da qui non posso aprire il tuo browser: lo fai tu, oppure il tuo agente del browser con il prompt qui sotto. In entrambi i casi **pagamento e documento d'identità li inserisci tu**.

**Prima di iniziare, tieni pronti:**
- l'account Google da usare per il lavoro, con la verifica in due passaggi attiva;
- una carta per la quota di registrazione, una tantum (25 USD [Probabile]);
- il tuo documento d'identità;
- un numero di telefono e un'email di contatto: Google li verifica con un codice.

**Scegli «Organizzazione», non «Personale».** Con l'account personale Google impone un test chiuso con 12 tester per 14 giorni prima di pubblicare; con l'organizzazione no, ma serve il D-U-N-S, che hai.

### Prompt per l'agente del browser

```
Devo aprire un account sviluppatore Google Play come ORGANIZZAZIONE. Procedi un passo alla volta e fermati dove indicato.

1. Apri https://play.google.com/console/signup. Se chiede con quale account Google proseguire, fermati e chiedimelo.
2. Tipo di account: "Organizzazione" (non "Personale").
3. Inserisci questi dati, esattamente così:
   - Nome dell'organizzazione: OLUVIDA DI TINTI MARCO
   - Numero D-U-N-S: 507652847
   - Tipo di organizzazione: impresa individuale / sole proprietorship (se manca la voce esatta, fermati e mostrami le opzioni)
   - Indirizzo: Via Giuseppe Mazzini 312, 51036 Larciano (PT), Italia
   - Nome dello sviluppatore mostrato al pubblico: AI Som
   - Email di contatto e telefono: chiedili a me, non inventarli
   - Sito web dell'organizzazione: chiedilo a me
4. Se Google dice che un dato non coincide con quello associato al D-U-N-S, NON correggerlo di tua iniziativa: fermati e riportami il messaggio parola per parola.
5. Codici di verifica via email o SMS: fermati e chiedimeli.
6. Quando arrivi al pagamento della quota di registrazione, FERMATI: lo completo io.
7. Quando chiede il documento d'identità o i documenti dell'impresa, FERMATI: li carico io.
8. Non accettare a nome mio programmi o condizioni facoltative. Per le condizioni obbligatorie, fermati e mostrami cosa sto accettando.

Alla fine dimmi a che punto è la verifica e cosa Google sta aspettando.
```

**Dove può incepparsi:**
- **Nome o indirizzo diversi da quelli del D-U-N-S.** Google confronta con la banca dati di Dun & Bradstreet: usa il nome e l'indirizzo esatti della tabella sopra.
- **Sito web dell'organizzazione.** Google lo chiede [Probabile]. Oggi AI Som risponde su `ai-som-saas.vercel.app`: meglio collegare prima il dominio `ai-som.it`.
- **Tempi.** La verifica dell'organizzazione può richiedere alcuni giorni [Probabile].

### Dopo l'apertura
1. In Play Console: **Crea app** → nome «AI Som», lingua italiano, tipo «App», gratuita.
2. Scrivimi «Play aperto»: preparo io il pacchetto firmato, la scheda (testi e immagini), il modulo sulla sicurezza dei dati e il questionario sui contenuti.
3. La **chiave di caricamento** Android va creata una volta e conservata: ti guido io quando ci arriviamo.

## 2. Apple: l'account è attivo, mancano quattro valori

Si fanno una sola volta, dal computer.

1. **App Store Connect** → Utenti e accessi → **Integrazioni** → Chiavi API di App Store Connect → genera una chiave con ruolo **Admin** e scarica il file `.p8`. Si scarica una volta sola.
2. Nella stessa pagina annota **Key ID** e **Issuer ID**. Su developer.apple.com → Membership details annota il **Team ID**.
3. **App Store Connect** → App → **+** → Nuova app: piattaforma iOS, nome «AI Som», lingua italiano, ID bundle `it.aisom.app`, SKU `aisom`. Se l'ID bundle non compare nell'elenco, registralo prima da developer.apple.com → Identifiers.
4. **GitHub** → repository `ai-som-saas` → Settings → Secrets and variables → Actions → New repository secret:

   | Nome | Valore |
   |---|---|
   | `ASC_KEY_ID` | Key ID |
   | `ASC_ISSUER_ID` | Issuer ID |
   | `ASC_KEY_P8` | tutto il testo del file `.p8` |
   | `APPLE_TEAM_ID` | Team ID |

5. Scrivimi «segreti messi»: lancio la compilazione e in circa 10 minuti l'app arriva su TestFlight.

Questi valori sono segreti: vanno solo su GitHub, mai in chat o in email. Il caricamento firmato non è mai stato eseguito: la prima volta può servire una correzione.

## 3. Per i revisori degli store
- **Account dimostrativo:** il locale «Kintsugi Bistrot» (le credenziali sono nel file `AI-Som-locale-dimostrativo.txt` che ti ho già inviato). Vanno nelle note per il revisore, non nella scheda pubblica.
- **Cosa scrivere al revisore:** l'app è per ristoratori già clienti; l'abbonamento si attiva sul sito; nell'app non ci sono acquisti né prezzi.
- **Indirizzi:** assistenza `/assistenza`, privacy `/privacy`, cancellazione dell'account `/elimina-account`.
