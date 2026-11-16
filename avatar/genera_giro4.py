"""Quarto giro: direzione "tutto vino", formale ma esagerata, in quattro gradi.

Uso:
    python avatar/genera_giro4.py

Usa il volto di giro3/1_tutto_vino.jpg come immagine di riferimento.
A pagamento (pochi centesimi a immagine). Risultati in avatar/prove/giro4/.
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

OUT = ROOT / "avatar" / "prove" / "giro4"
RIFERIMENTO = ROOT / "avatar" / "prove" / "giro3" / "1_tutto_vino.jpg"
MODELLO = "xai/grok-imagine-image-2.0"

APERTURA = (
    "Photorealistic photograph, natural skin texture. The same man as in the "
    "reference image, same face: a handsome Italian gentleman in his early forties "
    "with thick deep wine-burgundy hair and a wine-burgundy moustache, a real antique "
    "brass monocle on his right eye with a short fine brass chain. Everything he "
    "wears is the same deep burgundy colour, head to toe. "
)
CHIUSURA = (
    " Three-quarter length portrait, standing, facing camera, confident warm smile, "
    "impeccably formal and deliberately over the top, plain warm cream background, "
    "soft studio lighting."
)

VARIANTI = {
    "a_velluto_base": (
        "Burgundy velvet three-piece suit with wide peak lapels, burgundy shirt and "
        "tie, burgundy pocket square, burgundy leather gloves held in one hand."
    ),
    "b_frac_e_cilindro": (
        "Full white-tie evening dress entirely in burgundy: velvet tailcoat with satin "
        "lapels, burgundy waistcoat, burgundy wing-collar shirt, a large burgundy silk "
        "bow tie, a tall burgundy silk top hat, burgundy gloves."
    ),
    "c_mantello": (
        "Burgundy velvet double-breasted suit with a huge burgundy silk cravat and a "
        "brass grape-cluster brooch, and a long sweeping burgundy opera cape with "
        "satin lining draped over his shoulders, burgundy gloves."
    ),
    "d_capelli_e_baffi_grandi": (
        "His wine-burgundy hair is styled in a tall, glossy, voluminous pompadour and "
        "his wine-burgundy moustache is long with tips waxed and curled upward. "
        "Burgundy velvet tuxedo with wide satin shawl lapels, an oversized burgundy "
        "velvet bow tie, a burgundy ruffled dress shirt."
    ),
}


def esegui(voce: tuple[str, str], url_riferimento: str) -> dict:
    nome, abito = voce
    prompt = APERTURA + abito + CHIUSURA
    try:
        risultato = higgsfield_client.subscribe(
            MODELLO,
            arguments={
                "prompt": prompt,
                "image_urls": [url_riferimento],
                "resolution": "1k",
                "aspect_ratio": "3:4",
            },
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
    url_riferimento = higgsfield_client.upload_file(str(RIFERIMENTO))
    with ThreadPoolExecutor(max_workers=len(VARIANTI)) as pool:
        esiti = list(pool.map(lambda voce: esegui(voce, url_riferimento), VARIANTI.items()))
    (OUT / "esiti.json").write_text(json.dumps(esiti, indent=2, ensure_ascii=False))
    for esito in esiti:
        print(esito["nome"], "->", esito["stato"], esito["file"] or esito.get("dettaglio"))
    return 0 if all(e["file"] for e in esiti) else 1


if __name__ == "__main__":
    sys.exit(main())
