# AI Som: layout delle app iOS e Android e prompt per le prove grafiche con ChatGPT (26/11/2026)

## 1. Decisioni prima di disegnare

1. **Sugli store va l'app del ristoratore**, cioè il pannello più la modalità iPad.
   - I clienti continuano a usare il menù dal QR nel browser: nessuno scarica un'app per leggere un menù al tavolo [Probabile].
   - L'app installabile di oggi apre già sul pannello (`start_url: /ristoratore`).
2. **Tecnologia: Capacitor**, cioè lo stesso codice web dentro un'app nativa, con funzioni native aggiunte.
   - Lo stress test del 26/11 dà 60 fps e tocchi entro 80 ms su un telefono medio simulato: la base regge.
   - React Native vorrebbe dire riscrivere tutto.
3. **Apple rifiuta le app che sono solo un sito impacchettato** (regola 4.2, "funzionalità minima") [Certo]. Servono funzioni native vere:
   - **notifiche**: segnalazioni dei clienti, menù pronto dopo la lettura, abbonamento in scadenza;
   - **fotocamera**: foto del menù cartaceo → lettura con l'AI;
   - **condivisione** del QR e del PDF dei QR (foglio di condivisione nativo);
   - **modalità iPad bloccata** per il menù al tavolo, con ripristino automatico (esiste già);
   - **vibrazione** leggera alle conferme (allergeni confermati, menù pubblicato).
4. **Nell'app nessun prezzo e nessun invito all'acquisto** (Apple 3.1.1 / 3.1.3(f)).
   - Va tolta, nell'app, la scheda «Marginalità · Non incluso · scopri»; il pulsante «Attiva l'abbonamento» resta solo sul sito.
   - Nell'app un locale in prova vede: «Il tuo abbonamento si gestisce dal sito ai-som.it».
5. **Cancellazione dell'account dall'app**: obbligatoria su entrambi gli store, va in Altro → Account.

## 2. Sistema grafico (dal codice attuale)

| Elemento | Valore |
|---|---|
| Sfondo | `#F4F3F1` (app), `#F7F4EE` carta calda (pannello) |
| Superfici | `#FFFFFF`, bordi `rgba(0,0,0,.08)` |
| Testo | `#111111` principale, `#6E6A66` secondario |
| Accento | vino `#B8323F` (pulsanti principali), scuro `#872532` |
| Secondario | oro/rame `#C08A3E` (dettagli, mai per i pulsanti) |
| Avvisi | ambra `#F4E6D0` sfondo, `#9A4A06` testo |
| Carattere | Plus Jakarta Sans (titoli 700–800, testo 400–500) |
| Forme | schede raggio 20–28 px, pulsanti e filtri a pillola, campi 16 px di testo |
| Tocco | aree di almeno 44×44 pt (iOS) / 48×48 dp (Android) |

**iOS e Android: stessa identità, convenzioni di ciascuno**

| | iOS | Android (Material 3) |
|---|---|---|
| Navigazione | Tab bar in basso, 5 voci, icone SF Symbols | Navigation bar in basso, 5 voci, Material Symbols, pillola attiva |
| Titoli | Titolo grande che si riduce scorrendo | Top app bar media che si riduce scorrendo |
| Finestre | Sheet dal basso con maniglia, chiusura trascinando | Bottom sheet modale |
| Indietro | Scorrimento dal bordo sinistro | Gesto o tasto Indietro di sistema |
| Azione principale | Pulsante pieno vino in fondo alla schermata | FAB esteso vino in basso a destra |
| Conferme | Vibrazione leggera e spunta | Snackbar in basso |

## 3. Struttura dell'app

**Barra in basso (5 voci):**

| Voce | Contenuto |
|---|---|
| **Home** | Cosa manca (allergeni da confermare, vini senza scheda, segnalazioni aperte), ricerche dei clienti, vini più scelti |
| **Menù** | Sezioni e piatti, conferma degli allergeni, modifica del piatto, «Carica menù» (PDF, foto, link) |
| **Carta** | Vini, cocktail, birre, analcolici; schede del sommelier; interruttore «Bartender» |
| **Clienti** | Segnalazioni dei clienti; ultime domande al sommelier e al bartender |
| **Altro** | Grafica del menù, QR e iPad, Abbinamenti, Anagrafica, Account (esci, cancella account), Aiuto |

**Schermate da disegnare:**
1. Benvenuto e accesso (con «Hai già un account?»).
2. Configurazione guidata: tre passi (grafica, menù, carta) con avanzamento.
3. Lettura del menù in corso: fasi e secondi, poi «Controlla prima di salvare».
4. Controllo del menù letto: sezioni, piatti, prezzi, allergeni da confermare.
5. Home.
6. Menù: elenco per sezioni con stato degli allergeni.
7. Modifica piatto (sheet): nome, descrizione, prezzo, allergeni a icone, «Ho verificato gli allergeni».
8. Carta: filtri Vini / Cocktail / Birre / Analcolici, scheda vino con le barre del profilo.
9. Clienti: segnalazioni con stato «da gestire / risolta».
10. QR e iPad: «Classico da stampare» o «iPad fisso», anteprima del QR, Condividi.
11. Altro / Account.
12. **iPad orizzontale, modalità cliente**: menù a due colonne (sezioni a sinistra, piatti a destra), barra in basso «2 piatti · Consiglia il vino», nessuna uscita per il cliente.
13. Riferimento (web, non nell'app): menù cliente dal QR, bartender, risultato del consiglio.

## 4. Come usare ChatGPT per le prove grafiche

- **Carica insieme al prompt gli screenshot** di `docs/riferimenti-app/`: così ChatGPT parte dall'app vera e non da un'app inventata.
- **Una schermata per immagine**, formato verticale per il telefono e orizzontale per l'iPad.
- **ChatGPT sbaglia spesso le scritte nelle immagini** [Probabile]: usa le prove per decidere disposizione, gerarchia e atmosfera. I testi esatti e le misure li mettiamo nel codice.
- **Chiedi sempre due varianti**, una iOS e una Android, poi scegli la direzione e mandami le immagini: le traduco in codice.
- **Non chiedere la cornice del telefono**: complica le immagini e non serve.

### Blocco di stile (da incollare all'inizio di ogni prompt)

```
Progetta una schermata di app mobile per "AI Som", app per ristoratori italiani che gestisce menù digitale, carta dei vini e un sommelier con intelligenza artificiale. Mockup di interfaccia piatto, ad alta risoluzione, senza cornice del telefono, testi in italiano.
Stile: minimale ed elegante, da ristorazione di qualità, molto spazio bianco. Sfondo #F4F3F1, schede bianche con angoli molto arrotondati (24 px) e ombra appena accennata, testo quasi nero #111111, testo secondario grigio caldo #6E6A66, colore d'accento rosso vino #B8323F solo per l'azione principale, dettagli oro #C08A3E usati con parsimonia. Carattere Plus Jakarta Sans: titoli grandi e decisi, testo pulito. Pulsanti e filtri a pillola. Icone lineari sottili. Niente illustrazioni pesanti, niente gradienti vistosi, niente emoji.
Usa come riferimento per contenuti e colori gli screenshot allegati, migliorandone la composizione per un'app nativa.
```

### Prompt per le schermate (dopo il blocco di stile)

**Home: iOS**
```
Schermata Home per iPhone (1179×2556), stile iOS: titolo grande "Osteria Grafica" in alto, tab bar in basso con 5 voci e icone SF Symbols lineari: Home (attiva), Menù, Carta, Clienti, Altro. Contenuto: una scheda ambra "Da sistemare · 2" con le righe "3 piatti con allergeni da confermare" e "2 vini senza scheda del sommelier", ognuna con una freccia; due schede numeriche affiancate "24 ricerche questa settimana" e "6 bottiglie scelte"; una lista "Vini più scelti" con 3 righe (nome del vino, cantina, numero di scelte).
```

**Home: Android**
```
Stessa schermata Home per Android (1080×2400) in Material 3: top app bar media con "Osteria Grafica", navigation bar in basso con 5 voci e Material Symbols (pillola di selezione su Home), stesso contenuto e stessi colori. Rispetta le convenzioni Android: bordi, spaziature e tipografia Material, ma con l'identità di AI Som.
```

**Lettura del menù in corso**
```
Schermata "Leggo il tuo menù" per iPhone: in alto l'anteprima ridotta della prima pagina del PDF caricato; al centro la fase attuale "Riconosco prezzi e allergeni con la legenda del menù…" con un indicatore di avanzamento sottile in rosso vino e il contatore "18 s"; sotto, un elenco di tre passi con spunte (Apro il documento ✓, Leggo piatti e bevande ✓, Riconosco prezzi e allergeni in corso); in basso il testo "Di solito 20–40 secondi. Ti mostro tutto prima di salvare." Nessun pulsante d'acquisto.
```

**Controllo del menù letto**
```
Schermata "Controlla prima di salvare" per iPhone: sezioni comprimibili (Antipasti 6, Primi 8, Secondi 7, Dolci 5). Nella sezione aperta ogni piatto è una riga con nome, prezzo a destra e icone piccole degli allergeni; un piatto ha un'etichetta ambra "Allergeni da confermare". In alto una scheda ambra con 1 avviso "Il simbolo ° non è spiegato nella legenda: controlla 2 piatti". In basso pulsante pieno rosso vino "Salva menù (26 piatti)".
```

**Modifica piatto (sheet)**
```
Sheet dal basso su iPhone sopra la schermata Menù oscurata: maniglia in alto, titolo "Modifica piatto", campi Nome ("Trofie al pesto genovese"), Descrizione, Prezzo ("14,00 €"), griglia dei 14 allergeni europei come pillole con icona lineare (Glutine e Frutta a guscio selezionate), interruttore "Ho verificato gli allergeni", pulsante pieno "Salva".
```

**Carta dei vini**
```
Schermata Carta per iPhone: filtri a pillola in alto "Vini 13 · Cocktail 10 · Birre 1 · Analcolici 2" (Vini attivo), interruttore "Bartender per i clienti" acceso; elenco di vini raggruppati per colore (Bollicine, Bianchi, Rossi) con nome, cantina, prezzo bottiglia e calice; un vino aperto mostra la scheda del sommelier con 5 barre orizzontali sottili (Struttura, Acidità, Tannino, Sapidità, Aromaticità) in oro.
```

**QR e iPad**
```
Schermata "QR del menù" per iPhone con due grandi opzioni a scheda: "Classico da stampare" (QR vettoriale, uno per tavolo) e "iPad fisso" (menù su un tablet al tavolo o al banco). La prima è selezionata e mostra l'anteprima di un QR nero su bianco con la scritta "Tavolo 3", un selettore "dal tavolo 1 al tavolo 20" e i pulsanti "Condividi PDF" (pieno rosso vino) e "Scarica SVG".
```

**Clienti: segnalazioni**
```
Schermata Clienti per iPhone: segmenti "Da gestire 2 · Risolte 5"; ogni segnalazione è una scheda con l'origine (Sommelier o Bartender), la data, la frase del cliente tra virgolette ("Il vino consigliato non è in carta") e due azioni "Correggi" e "Segna come risolta".
```

**iPad: modalità cliente (orizzontale)**
```
Schermata per iPad orizzontale (2732×2048) della modalità cliente di "Kintsugi Bistrot": a sinistra una colonna stretta con le sezioni del menù (Small plates, Ramen, Dal wok, Dolci) e quella attiva evidenziata; a destra una griglia a due colonne di schede piatto (nome, descrizione breve, prezzo, icone allergeni, pillola "+ Aggiungi"); in alto a destra il selettore lingua con bandiera; in basso una barra fissa "2 piatti selezionati · Consiglia il vino" con pulsante pieno rosso vino; un piccolo pulsante "Bartender" con icona di cocktail. Nessuna uscita dall'app visibile.
```

**Risultato del consiglio (riferimento web, cliente)**
```
Schermata del cliente su iPhone dopo "Consiglia il vino": una frase di benvenuto breve, tre schede vino ordinate (nome, cantina, prezzo bottiglia e calice), per ciascuna "Perché funziona" in due righe e "Nel bicchiere" con temperatura di servizio; una nota piccola "Consigli generati da un'intelligenza artificiale: per allergie chiedi al personale".
```

## 5. Dopo le prove grafiche

1. Mi mandi le immagini scelte (una per schermata, iOS e Android).
2. Le traduco nel codice: barra in basso, titoli grandi, sheet, sistema grafico condiviso.
3. Preparo l'involucro Capacitor (iOS e Android) con notifiche, fotocamera, condivisione e vibrazione.
4. Pacchetti per gli store: icone, schermata di avvio, screenshot per gli store, scheda privacy / Data safety, account di prova per i revisori.

Riferimenti: [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (4.2, 3.1.1, 3.1.3(f), 5.1.1(v)) · [Material 3](https://m3.material.io/) · [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).
