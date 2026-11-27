# bu.bu

Sito di presentazione di Marco Tinti: SaaS, app e strumenti di sviluppo per siti web.

Sito statico, senza passaggi di build e senza dipendenze esterne.

- `index.html`: la pagina, in sei tavole.
- `privacy.html`: informativa privacy.
- `css/style.css`: stili.
- `js/scene.js`: la scultura di punti in WebGL2. Sei figure fatte delle stesse particelle, che si trasformano una nell'altra con lo scorrimento.
- `js/main.js`: collega scorrimento, puntatore e indice delle tavole alla scena.
- `fonts/`: Fraunces e IBM Plex, serviti dal sito (licenza SIL OFL 1.1).
- `vercel.json`: URL puliti e intestazioni.

## Provarlo in locale

```bash
python3 -m http.server 4173
```

Poi apri `http://127.0.0.1:4173/`.

## Dove si cambiano i contenuti

Testi, progetti e recapiti sono scritti direttamente in `index.html`. Le figure 3D si trovano in `js/scene.js`: l'elenco `FIGURE` stabilisce l'ordine, `POSE` l'inclinazione e il lato dello schermo di ciascuna.
