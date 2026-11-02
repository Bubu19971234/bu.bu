# Task: allineare le annate delle offerte Amazon a Shopify CDF ed eliminare le offerte problematiche

## Contesto
- **Negozio Shopify:** "Centro distribuzione Felicità" (CDF), dominio `centrodistribuzionefelicita.it`.
- **Marketplace:** Amazon Seller Central **Italia** (amazon.it).
- **Fonte:** stampa di un report Amazon con le offerte segnate come "codice non presente su Shopify". Le righe evidenziate in giallo hanno un'annata sbagliata o un prodotto mancante. Sono 29 in tutto.
- **"Codice non presente su Shopify":** significa che lo **SKU Amazon** non corrisponde a nessuno SKU Shopify. Non vuol dire che il vino manchi.
- **Annata corretta:** è quella di Shopify, nel metafield `custom.annata` del prodotto, perché corrisponde alla merce in magazzino CDF.
- **Trascrizione:** gli SKU Amazon sono stati trascritti da foto. **Prima di ogni azione, verifica in Seller Central che lo SKU esista e che il titolo corrisponda.** Se non corrisponde, NON agire e segnala la riga.

## Regole generali
1. **Prima di modificare:** rileggi l'annata su Shopify (`custom.annata` dello SKU Shopify indicato). Se è cambiata rispetto alla tabella, usa il valore attuale di Shopify.
2. **Prima di eliminare un'offerta:** controlla se ha stock **FBA**. Se ne ha, crea prima un ordine di rimozione o segnala, altrimenti l'inventario resta bloccato.
3. **Preferisci "Chiudi offerta" a "Elimina":** chiudere si può annullare. Elimina definitivamente solo se il proprietario lo conferma esplicitamente.
4. **Registro:** annota ogni azione con SKU, azione, esito ed eventuale errore di Amazon.

## Parte A: cambio annata (24 offerte)

Per ogni riga:
1. Apri l'offerta tramite lo SKU (Gestisci inventario → Modifica, oppure Listings Items API con `patchListingsItem`).
2. Aggiorna il **titolo** (`item_name`) con il "Nuovo titolo" e l'attributo **annata/vintage**, se presente nel tipo di prodotto, con l'"Annata corretta".
3. Se Amazon **rifiuta o non applica** la modifica, perché l'ASIN non è nostro (non siamo creatori o proprietari del brand) o il campo è bloccato:
   - **Chiudi o elimina l'offerta** e registra il motivo.
   - Attendi l'elaborazione (fino a 15-30 minuti) e ricontrolla la pagina prodotto: "inviata" non vuol dire "applicata".
4. Non toccare prezzo né quantità.

| # | SKU Amazon | Titolo attuale | Annata attuale | Annata corretta | Nuovo titolo | SKU Shopify |
|---|---|---|---|---|---|---|
| 1 | `7I-TFER-FLJ7` | Barbaresco DOCG "Garassino" 2015 | 2015 | **2022** | Barbaresco DOCG "Garassino" 2022 | VI890 |
| 2 | `41-TB7N-4UXG` | Barbaresco Riserva DOCG "Cascina Bordino" 2012 | 2012 | **2021** | Barbaresco Riserva DOCG "Cascina Bordino" 2021 | VI2626 |
| 3 | `RI-3CCG-1P9X` | Barolo DOCG "Cannubi" 2012 | 2012 | **2018** | Barolo DOCG "Cannubi" 2018 | VI726 |
| 4 | `V9-WQI3-C0GS` | Barolo DOCG "Cascina Ferrero" 2014 | 2014 | **2022** | Barolo DOCG "Cascina Ferrero" 2022 | VI729 |
| 5 | `KO-07SE-5AQV` | BRUNELLO DI MONTALCINO DOCG 2006 POGGIO ALLE MURA 0,750 | 2006 | **2020** | BRUNELLO DI MONTALCINO DOCG 2020 POGGIO ALLE MURA 0,750 | VI429 |
| 6 | `TF-CI2F-SNRY` | Castello della Sala Cervaro della Sala 2023 | 2023 | **2022** | Castello della Sala Cervaro della Sala 2022 | VI178 |
| 7 | `DP-6C3O-492Y` | Castello di Ama Chianti Classico San Lorenzo Gran Selezione Docg, 2014-750 Ml | 2014 | **2018** | Castello di Ama Chianti Classico San Lorenzo Gran Selezione Docg, 2018-750 Ml | VI1660 |
| 8 | `QE-42T7-EAYL` | Costaripa Lugana "Pievecroce" 2022 | 2022 | **2024** | Costaripa Lugana "Pievecroce" 2024 | VI714 |
| 9 | `9L-AD5O-PBUL` | Da Vinci I Capolavori Chianti Vergine delle Rocce Riserva 2015 | 2015 | **2020** | Da Vinci I Capolavori Chianti Vergine delle Rocce Riserva 2020 | VI465 |
| 10 | `1Q-KJ34-UDF0` | Daumas Gassac Moulin de Gassac Pinot Noir 2018 | 2018 | **2022** | Daumas Gassac Moulin de Gassac Pinot Noir 2022 | VIF011 |
| 11 | `18-X92X-EZAX` | Dolcetto D Alba Doc "Il Palazzo" 2019 | 2019 | **2020** | Dolcetto D Alba Doc "Il Palazzo" 2020 | VI100 |
| 12 | `QF-QUPX-KXLH` | Insoglio del Cinghiale Campo di Sasso Bibbona IGT 2020 14% Vol. 0,75l | 2020 | **2024** | Insoglio del Cinghiale Campo di Sasso Bibbona IGT 2024 14% Vol. 0,75l | VI075 |
| 13 | `F9-9ITZ-Z16K` | Langhe Rosato DOC "CEREJA" 2019 | 2019 | **2024** | Langhe Rosato DOC "CEREJA" 2024 | VI892 |
| 14 | `EU-YWDW-WV97` | MALGRA' BARBERA D'ASTI 2018 DOCG BRIGA DELLA MORA 75 CL | 2018 | **2022** | MALGRA' BARBERA D'ASTI 2022 DOCG BRIGA DELLA MORA 75 CL | VI856 |
| 15 | `FF-LEFT-8TQK` | Mazzei Fonterutoli Chianti Classico Gran Selezione 2013 | 2013 | **2021** | Mazzei Fonterutoli Chianti Classico Gran Selezione 2021 | VI084 |
| 16 | `FY-MV1L-3QWG` | Mea Rosa Igt Lunae 2023 Liguria di Levante 0.75 l | 2023 | **2025** | Mea Rosa Igt Lunae 2025 Liguria di Levante 0.75 l | VI601 |
| 17 | `11-9WJZ-T2XW` | Petra 2021 Toscana Rosso Igt Petra | 2021 | **2022** | Petra 2022 Toscana Rosso Igt Petra | VI258 |
| 18 | `GG-NSOR-40BK` | PETRA Quercegobbe Merlot IGT 2011 | 2011 | **2022** | PETRA Quercegobbe Merlot IGT 2022 | VI262 |
| 19 | `N8-8LRI-M298` | Petra Sangiovese Alto 2021 | 2021 | **2020** | Petra Sangiovese Alto 2020 | VI259 |
| 20 | `1B-HH8U-4MLD` | Pojer e Sandri Pinot Nero 2024-75 cl | 2024 | **2025** | Pojer e Sandri Pinot Nero 2025-75 cl | VI1506 |
| 21 | `1I-U37F-44S1` | Pojer e Sandri Riesling 2022 | 2022 | **2023** | Pojer e Sandri Riesling 2023 | VI1505 |
| 22 | `IB-2R4P-F9XW` | Pojer e Sandri Traminer Aromatico 2021 | 2021 | **2025** | Pojer e Sandri Traminer Aromatico 2025 | VI1503 |
| 23 | `E7-6MNE-9ZES` | Roero Arneis DOCG 2018 "CAYEGA" | 2018 | **2025** | Roero Arneis DOCG 2025 "CAYEGA" | VI855 |
| 24 | `EL-DWF7-SLWA` | Rosso di Montepulciano DOC Fattoria del Cerro 2022 0,75 l | 2022 | **2024** | Rosso di Montepulciano DOC Fattoria del Cerro 2024 0,75 l | VI066 |

**Da controllare a vista prima di procedere:**
- **#3 Cascina Bordino:** sul foglio c'era una correzione a penna illeggibile.
- **#20 Fonterutoli Gran Selezione:** su Amazon costa 28,02 €, su Shopify 45,40 €. Verifica che l'ASIN sia davvero la Gran Selezione. Se è un altro vino, elimina l'offerta.
- **#22 e #24 Petra:** collegati per nome a "Petra Petra" (VI258) e "Petra Alto" (VI259). Se non corrispondono, elimina l'offerta.
- **Scarti di annata molto grandi** (#6 Brunello 2006 → 2020, #23 Quercegobbe 2011 → 2022): verifica che l'ASIN non sia un'annata storica o da collezione. In quel caso elimina invece di modificare.

## Parte B: offerte da eliminare (5)

Elimina o chiudi direttamente, senza tentare modifiche.

| # | SKU Amazon | Titolo Amazon | Motivo |
|---|---|---|---|
| 1 | `DN-JGQU-YDNJ` | Banfi La Pettegola Vermentino Toscana IGT, Vino Bianco, Limited Edition, 750ml | Riga segnata come problematica; annata non indicata |
| 2 | `JC-MQSH-7ILI` | Ceci Otello FTF Bolle di Chardonnay - bolledichardonnay | Probabile prodotto diverso (Shopify ha 'Otello Ceci Forthefuture Chardonnay' VI1002, senza annata) |
| 3 | `5F-VS4Q-B2Z0` | Centine Igt Banfi 7518077 Vino, Cl 75 | Riga segnata come problematica; annata non indicata |
| 4 | `LF-J02J-CDF6` | Jermann Vinnae Ribolla Gialla 2024 | Prodotto non presente su Shopify CDF |
| 5 | `M7-ZCL4-6S6Z` | MARCHESI ANTINORI BOLGHERI GUADO AL TASSO IL BRUCIATO 2022 DOC 75 CL 6 BOTTIGLIE | Confezione 6 bottiglie non presente su Shopify (solo bottiglia singola VI186, annata 2024) |

**Opzione in blocco:** Inventory Loader, file di testo separato da tabulazioni:
```
sku	add-delete
DN-JGQU-YDNJ	x
JC-MQSH-7ILI	x
5F-VS4Q-B2Z0	x
LF-J02J-CDF6	x
M7-ZCL4-6S6Z	x
```
Il valore di `add-delete` va verificato sul template attuale di Amazon: `x` elimina l'offerta e il prodotto dal proprio inventario. Prova prima con uno SKU solo.

## Output atteso
Una tabella finale con una riga per ognuno dei 29 SKU e queste colonne:

| SKU Amazon | Azione eseguita (modificato / chiuso / eliminato / non trovato / saltato) | Annata finale online | Note o errore Amazon |
|---|---|---|---|

Più un riepilogo con il numero di offerte modificate, eliminate o chiuse, e le righe da rivedere a mano.

## Cosa NON fare
- Non modificare prezzi, quantità o prodotti su Shopify: la fonte di verità resta Shopify.
- Non eliminare offerte che non sono in questo elenco. Nel report ci sono altre righe con segni a penna (es. "NO" su Dom Pérignon, Lindt, Colomba), ma **non** fanno parte di questo task.
- Non creare nuovi ASIN.
