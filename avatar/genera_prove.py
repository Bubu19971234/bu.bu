"""Primo giro di foto prova del personaggio, via Higgsfield API.

Uso:
    python avatar/genera_prove.py

Ogni esecuzione è a pagamento (pochi centesimi in tutto). Le immagini vengono
scaricate in avatar/prove/giro1/ perché Higgsfield le cancella dopo sette giorni.
"""

import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env.local")

import higgsfield_client  # noqa: E402

OUT = ROOT / "avatar" / "prove" / "giro1"

# Blocco fisso del personaggio: identico a quello di prompt-immagini.md.
BLOCCO = (
    "Photorealistic photograph, 85mm lens, natural skin texture: a handsome, elegant "
    "Italian gentleman in his early forties, regular well-proportioned features, warm "
    "friendly eyes, a neat short moustache and a slightly raised right eyebrow. "
    "Realistic body proportions, upright posture, tailored clothes. He wears a "
    "short-brim burgundy felt fedora with a tan leather band. A single soft "
    "copper-coloured spiral curl of hair, loosely reminiscent of a corkscrew, escapes "
    "from under the hat on his left side; the rest of his hair is short and tidy. "
    "A real antique monocle sits on his right eye, wedged between cheekbone and brow: "
    "thin brass rim with gallery, clear glass lens with a subtle reflection. A short, "
    "taut, fine brass chain runs from the rim to the buttonhole of his lapel. "
    "Dark bottle-green three-piece suit, cream shirt, burgundy tie. Cognac leather "
    "brogues and matching cognac leather gloves. A slim cognac leather bottle-carrier "
    "bag hangs from a shoulder strap on his right side."
)

NEGATIVO = (
    "caricature, cartoon, exaggerated features, big nose, comic expression, handlebar "
    "moustache, wig, spring-like curl, multiple curls, two monocles, glasses, "
    "distorted eye, floating chain, text, watermark, extra fingers"
)

PROFILO = (
    " Head-and-shoulders portrait, facing camera, slight knowing smile, plain burgundy "
    "background, soft warm studio lighting, the copper curl and the monocle clearly "
    "visible."
)

PARLATO = (
    " Medium close-up from the chest up, facing camera, mouth closed in a relaxed "
    "neutral expression, head straight, the chain clear of the mouth and chin. "
    "Plain softly blurred warm interior behind him, soft frontal light."
)

TAVOLA = (
    " Character reference sheet on a plain cream background, soft even studio "
    "lighting: full body front view, three-quarter view, side profile, back view, "
    "plus a close-up of the face showing the monocle and chain clearly. Neutral "
    "standing pose, consistent proportions across all views. No text, no labels."
)

PROVE = [
    {
        "nome": "soul_profilo",
        "modello": "higgsfield-ai/soul/v2/standard",
        "argomenti": {
            "prompt": BLOCCO + PROFILO,
            "batch_size": 4,
            "resolution": "1080p",
            "aspect_ratio": "3:4",
            "enhance_prompt": False,
        },
    },
    {
        "nome": "soul_parlato",
        "modello": "higgsfield-ai/soul/v2/standard",
        "argomenti": {
            "prompt": BLOCCO + PARLATO,
            "batch_size": 4,
            "resolution": "1080p",
            "aspect_ratio": "9:16",
            "enhance_prompt": False,
        },
    },
    {
        "nome": "qwen_tavola",
        "modello": "alibaba/qwen-image-3/text-to-image",
        "argomenti": {
            "prompt": BLOCCO + TAVOLA,
            "negative_prompt": NEGATIVO,
            "resolution": "2k",
            "aspect_ratio": "16:9",
        },
    },
    {
        "nome": "qwen_profilo",
        "modello": "alibaba/qwen-image-3/text-to-image",
        "argomenti": {
            "prompt": BLOCCO + PROFILO,
            "negative_prompt": NEGATIVO,
            "resolution": "1k",
            "aspect_ratio": "3:4",
        },
    },
    {
        "nome": "grok_profilo",
        "modello": "xai/grok-imagine-image-2.0",
        "argomenti": {
            "prompt": BLOCCO + PROFILO,
            "resolution": "1k",
            "aspect_ratio": "3:4",
        },
    },
    {
        "nome": "influencer_scheda",
        "modello": "higgsfield/ai-influencer",
        "argomenti": {
            "tier": "normal",
            "brief": BLOCCO,
        },
    },
]


def esegui(prova: dict) -> dict:
    nome = prova["nome"]
    try:
        risultato = higgsfield_client.subscribe(prova["modello"], arguments=prova["argomenti"])
    except Exception as errore:  # un modello che fallisce non ferma gli altri
        return {"nome": nome, "stato": "errore", "dettaglio": str(errore), "file": []}

    stato = risultato.get("status")
    if stato != "completed":
        return {"nome": nome, "stato": stato, "dettaglio": risultato.get("error"), "file": []}

    file = []
    for indice, immagine in enumerate(risultato.get("images") or [], start=1):
        url = immagine.get("url")
        if not url:
            continue
        estensione = Path(url.split("?")[0]).suffix or ".png"
        destinazione = OUT / f"{nome}_{indice}{estensione}"
        urllib.request.urlretrieve(url, destinazione)
        file.append(destinazione.name)
    return {
        "nome": nome,
        "stato": stato if file else "completata senza immagini",
        "dettaglio": None if file else sorted(risultato),
        "request_id": risultato.get("request_id"),
        "file": file,
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=len(PROVE)) as pool:
        esiti = list(pool.map(esegui, PROVE))
    (OUT / "esiti.json").write_text(json.dumps(esiti, indent=2, ensure_ascii=False))
    for esito in esiti:
        print(esito["nome"], "->", esito["stato"], esito["file"] or esito["dettaglio"])
    return 0 if all(e["file"] for e in esiti) else 1


if __name__ == "__main__":
    sys.exit(main())
