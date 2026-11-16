"""Secondo giro: senza ricciolo, quattro candidati per il segno distintivo.

Uso:
    python avatar/genera_giro2.py

A pagamento (circa 0,06 dollari a immagine). Risultati in avatar/prove/giro2/.
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

OUT = ROOT / "avatar" / "prove" / "giro2"
MODELLO = "xai/grok-imagine-image-2.0"

# {LENTE} e {SEGNO} cambiano da una variante all'altra; il resto è fisso.
BASE = (
    "Photorealistic photograph, 85mm lens, natural skin texture: a handsome, elegant "
    "Italian gentleman in his early forties, regular well-proportioned features, warm "
    "friendly eyes, a neat short moustache and a slightly raised right eyebrow. "
    "Short tidy dark hair under a short-brim burgundy felt fedora with a tan leather "
    "band. A real antique monocle sits on his right eye, wedged between cheekbone and "
    "brow: thin brass rim with gallery, {LENTE}. A short fine brass chain runs from "
    "the rim to the buttonhole of his lapel. Dark bottle-green three-piece suit, "
    "cream shirt, burgundy tie. A slim cognac leather shoulder strap on his right "
    "side. {SEGNO} Head-and-shoulders portrait, facing camera, slight knowing smile, "
    "plain burgundy background, soft warm studio lighting."
)

LENTE_CHIARA = "clear glass lens with a subtle reflection"

VARIANTI = {
    "a_lente_rubino": {
        "LENTE": "the lens is deep ruby-red tinted glass, like red wine held to the light, "
        "translucent so the eye is still visible behind it",
        "SEGNO": "",
    },
    "b_tastevin": {
        "LENTE": LENTE_CHIARA,
        "SEGNO": "Around his neck, resting on his chest over the tie, hangs a polished "
        "silver tastevin, the shallow sommelier's tasting cup, on a silver chain.",
    },
    "c_tappi_sul_cappello": {
        "LENTE": LENTE_CHIARA,
        "SEGNO": "Tucked into the leather hat band on his left side are three natural "
        "wine corks in a neat row and one small green vine leaf.",
    },
    "d_spilla_cavatappi": {
        "LENTE": LENTE_CHIARA,
        "SEGNO": "On his left lapel he wears a large brass brooch shaped like a classic "
        "corkscrew, clearly visible, and a matching brass corkscrew tie pin.",
    },
}


def esegui(voce: tuple[str, dict]) -> dict:
    nome, campi = voce
    prompt = BASE.format(**campi).replace("  ", " ")
    try:
        risultato = higgsfield_client.subscribe(
            MODELLO,
            arguments={"prompt": prompt, "resolution": "1k", "aspect_ratio": "3:4"},
        )
    except Exception as errore:  # una variante che fallisce non ferma le altre
        return {"nome": nome, "stato": "errore", "dettaglio": str(errore), "file": None}

    stato = risultato.get("status")
    immagini = risultato.get("images") or []
    if stato != "completed" or not immagini or not immagini[0].get("url"):
        return {"nome": nome, "stato": stato, "dettaglio": risultato.get("error"), "file": None}

    destinazione = OUT / f"{nome}.jpg"
    urllib.request.urlretrieve(immagini[0]["url"], destinazione)
    return {"nome": nome, "stato": stato, "file": destinazione.name, "prompt": prompt}


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=len(VARIANTI)) as pool:
        esiti = list(pool.map(esegui, VARIANTI.items()))
    (OUT / "esiti.json").write_text(json.dumps(esiti, indent=2, ensure_ascii=False))
    for esito in esiti:
        print(esito["nome"], "->", esito["stato"], esito["file"] or esito.get("dettaglio"))
    return 0 if all(e["file"] for e in esiti) else 1


if __name__ == "__main__":
    sys.exit(main())
