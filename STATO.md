# Punto della situazione – 26/10/2026

## Fatto
- Policy: testi corretti incollati (Rimborsi, Spedizioni, Contatti, Informativa legale). Termini lasciati in versione automatica Shopify.
- Menu "Footer legale" creato su Shopify (da assegnare al footer nel tema, se non già fatto).
- Analisi catalogo: 2.725 prodotti attivi; 48 ordini su 50 arrivano da Amazon, quasi nulla dal sito.

## In corso (da verificare alla ripresa)
- Correzione massiva prodotti: titoli normalizzati + formato (75 cl vini, 70 cl spirits), brand, tipo prodotto, tag.
- Confermati: test 10 + blocco 00 (90 prodotti). Blocchi 01–35 lanciati in background: se la sessione si è chiusa
  potrebbero essersi interrotti. Verifica: confrontare i titoli live con `catalogo/modifiche_titoli.csv`
  e riapplicare solo quelli ancora in MAIUSCOLO.

## Prossimi passi (messa a terra Google)
1. Metafield `mm-google-shopping.custom_product = true` solo su vini/bollicine senza EAN (in attesa di ok).
2. Screenshot Diagnostica di Google Merchant Center.
3. Alt text immagini, apostrofi nelle descrizioni.
4. Campagna Performance Max Shopping (Vini / Bollicine-Champagne / Spirits / Natale), esclusi prodotti < 15 € ed esauriti.

## Decisioni in sospeso
- Formato 70 cl anche su amari/liquori?
- Rimuovere i paesi esteri dalle spedizioni (accise dovute nel paese di destinazione, nessuna soglia).
