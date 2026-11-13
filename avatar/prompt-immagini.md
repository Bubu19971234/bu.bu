# Progetto AVATAR — prompt per le immagini (v0.4)

I generatori lavorano meglio in inglese: i prompt sono in inglese, le note in italiano.
Non sono ancora stati provati: vanno aggiustati dopo il primo giro di immagini.

## Blocco fisso del personaggio

Va incollato identico in ogni prompt, prima della scena. Non contiene la luce:
quella va nella scena.

```
Photorealistic photograph, 85mm lens, natural skin texture: a handsome, elegant
Italian gentleman in his early forties, regular well-proportioned features, warm
friendly eyes, a neat short moustache and a slightly raised right eyebrow.
Realistic body proportions, upright posture, tailored clothes. He wears a
short-brim burgundy felt fedora with a tan leather band. A single soft
copper-coloured spiral curl of hair, loosely reminiscent of a corkscrew, escapes
from under the hat on his left side; the rest of his hair is short and tidy.
A real antique monocle sits on his right eye, wedged between cheekbone and brow:
thin brass rim with gallery, clear glass lens with a subtle reflection. A short,
taut, fine brass chain runs from the rim to the buttonhole of his lapel.
Dark bottle-green three-piece suit, cream shirt, burgundy tie. Cognac leather
brogues and matching cognac leather gloves. A slim cognac leather bottle-carrier
bag hangs from a shoulder strap on his right side.
```

Da escludere (campo "negative prompt", se il generatore lo ha):

```
caricature, cartoon, exaggerated features, big nose, comic expression, handlebar
moustache, wig, spring-like curl, multiple curls, two monocles, glasses,
distorted eye, floating chain, text, watermark, extra fingers
```

Note sulle scelte:
- I colori sono scritti a parole. I codici hex restano solo nella scheda: nei
  prompt fotorealistici vengono ignorati o stampati come testo nell'immagine.
- Niente ingrandimento dell'occhio dietro la lente: deforma l'occhio destro.
- La tracolla è nel blocco fisso, così non cambia forma da una scena all'altra.

## 1. Tavola di riferimento (da fare per prima)

```
[BLOCCO FISSO]
Character reference sheet on a plain cream background, soft even studio
lighting: full body front view, three-quarter view, side profile, back view,
plus a close-up of the face showing the monocle and chain clearly. Neutral
standing pose, consistent proportions across all views. No text, no labels.
```

Si generano più varianti, se ne sceglie **una** e da lì in poi si usa sempre come
immagine di riferimento (character reference) insieme al blocco fisso.

Criterio di scelta: prima il volto (bello, caldo, credibile come testimonial),
poi la resa di monocolo e catena. Una variante col monocolo perfetto e il volto
da macchietta si scarta.

## 2. Foto profilo

```
[BLOCCO FISSO]
Head-and-shoulders portrait, facing camera, slight knowing smile, plain burgundy
background, soft warm studio lighting, the copper curl and the monocle clearly
visible. Square format.
```

## 3. Primo piano per i video parlati

Immagine di partenza per labiale e trasferimento di movimento.

```
[BLOCCO FISSO]
Medium close-up from the chest up, facing camera, mouth closed in a relaxed
neutral expression, head straight, the chain clear of the mouth and chin.
Plain softly blurred warm interior behind him, soft frontal light. Vertical 9:16.
```

## 4. Scene tipo

```
[BLOCCO FISSO]
He stands in a vaulted brick wine cellar, holding a bottle and reading its label
through the monocle. Barrels in soft focus behind him, warm low cellar light.
Vertical 4:5.
```

```
[BLOCCO FISSO]
He sits at a small bistro table, the leather bottle-carrier bag on the chair
beside him. His right glove is off and lies on the table; he holds a smartphone
in his bare right hand. An untouched full glass of red wine on the table.
Soft daylight from a window. Vertical 4:5.
```

```
[BLOCCO FISSO]
Close-up of his cognac leather brogues and the leather bottle-carrier bag on a
stone floor, vineyard light coming through a doorway. Vertical 4:5.
```

Nota: il calice è sempre **pieno e non toccato**. Non beve mai — è parte del personaggio.

## Controlli su ogni immagine prima di usarla

- volto gradevole e uguale all'immagine canonica, nessun tratto esagerato;
- monocolo sull'occhio **destro**, occhio non deformato, catena attaccata al
  bavero (non sospesa nel vuoto) e lontana dalla bocca;
- un solo ricciolo, a **sinistra**, color rame, morbido;
- cappello vinaccia con nastro in cuoio;
- mani: cinque dita; guanti dello stesso cuoio delle scarpe;
- tracolla sempre della stessa forma;
- nessuna scritta inventata su etichette o insegne.
