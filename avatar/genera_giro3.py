"""Terzo giro: cinque direzioni forti, diverse nel volto e nella sagoma.

Uso:
    python avatar/genera_giro3.py

A pagamento (circa 0,06 dollari a immagine). Risultati in avatar/prove/giro3/.
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

OUT = ROOT / "avatar" / "prove" / "giro3"
MODELLO = "xai/grok-imagine-image-2.0"

APERTURA = "Photorealistic photograph, 85mm lens, natural skin texture, half-body portrait: "
MONOCOLO = (
    " A real antique brass monocle on his right eye with a clear glass lens and a "
    "short fine brass chain to his lapel."
)
CHIUSURA = (
    " Facing camera, warm knowing smile, charismatic and likeable, plain deep "
    "burgundy background, soft warm studio lighting."
)

DIREZIONI = {
    "1_tutto_vino": (
        "a handsome Italian gentleman in his early forties whose thick swept-back hair "
        "and neat moustache are a deep glossy wine-burgundy colour, clearly dyed and "
        "striking. No hat. He wears a rich burgundy velvet three-piece suit, burgundy "
        "shirt and burgundy tie, a head-to-toe single-colour look."
    ),
    "2_volpe_argentata": (
        "a very handsome, charismatic Italian gentleman of about sixty, tanned skin, "
        "thick swept-back silver-white hair, a full groomed white moustache and short "
        "white beard, bright lively eyes, laugh lines. No hat. Dark bottle-green "
        "three-piece suit, cream shirt, burgundy tie, burgundy pocket square."
    ),
    "3_baffo_firma": (
        "a handsome Italian gentleman in his early forties with slicked-back jet-black "
        "hair, strong dark eyebrows and a magnificent jet-black waxed moustache with "
        "long tips curled elegantly upward, his unmistakable signature. No hat. Dark "
        "bottle-green three-piece suit, cream shirt, burgundy tie."
    ),
    "4_gigante_buono": (
        "a big, tall, broad-shouldered, barrel-chested Italian gentleman in his "
        "mid-forties with a kind jovial face, rosy cheeks, a full thick well-groomed "
        "chestnut beard and short hair, a gentle giant. Short-brim burgundy felt "
        "fedora. Dark bottle-green three-piece suit stretched over his big frame, "
        "cream shirt, burgundy tie."
    ),
    "5_rosso_rame": (
        "a handsome Italian gentleman in his early forties with a full head of wavy "
        "natural copper-red hair, a neat copper-red moustache and short beard, "
        "freckles and green eyes. No hat. Dark bottle-green three-piece suit, cream "
        "shirt, burgundy tie."
    ),
}


def esegui(voce: tuple[str, str]) -> dict:
    nome, descrizione = voce
    prompt = APERTURA + descrizione + MONOCOLO + CHIUSURA
    try:
        risultato = higgsfield_client.subscribe(
            MODELLO,
            arguments={"prompt": prompt, "resolution": "1k", "aspect_ratio": "3:4"},
        )
    except Exception as errore:  # una direzione che fallisce non ferma le altre
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
    with ThreadPoolExecutor(max_workers=len(DIREZIONI)) as pool:
        esiti = list(pool.map(esegui, DIREZIONI.items()))
    (OUT / "esiti.json").write_text(json.dumps(esiti, indent=2, ensure_ascii=False))
    for esito in esiti:
        print(esito["nome"], "->", esito["stato"], esito["file"] or esito.get("dettaglio"))
    return 0 if all(e["file"] for e in esiti) else 1


if __name__ == "__main__":
    sys.exit(main())
