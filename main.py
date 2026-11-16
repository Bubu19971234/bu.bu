"""Esempio Higgsfield API: Seedance 2.5 text-to-video con l'SDK ufficiale.

Uso:
    python main.py

Le credenziali si leggono da .env.local (HF_KEY=key-id:key-secret), mai dal codice.
Ogni esecuzione andata a buon fine è una generazione a pagamento.
"""

import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env.local"))

import higgsfield_client  # noqa: E402  (dopo il caricamento delle credenziali)
from higgsfield_client import (  # noqa: E402
    CredentialsMissedError,
    HiggsfieldClientError,
)

MODEL = "bytedance/seedance-2.5/text-to-video"

ARGUMENTS = {
    "prompt": "A cinematic scene at sunset",
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
}


def video_url(result: dict) -> str | None:
    """Estrae l'URL del video dalla risposta finale, se presente."""
    video = result.get("video")
    if isinstance(video, dict) and video.get("url"):
        return video["url"]
    for item in result.get("videos") or []:
        if isinstance(item, dict) and item.get("url"):
            return item["url"]
    return None


def main() -> int:
    seen: list[str] = []

    def on_status(status: object) -> None:
        name = type(status).__name__
        if not seen or seen[-1] != name:
            seen.append(name)
            print(f"Stato: {name}")

    try:
        result = higgsfield_client.subscribe(
            MODEL,
            arguments=ARGUMENTS,
            on_enqueue=lambda request_id: print(f"Richiesta inviata: {request_id}"),
            on_queue_update=on_status,
        )
    except CredentialsMissedError:
        print("Credenziali mancanti: imposta HF_KEY in .env.local.", file=sys.stderr)
        return 2
    except HiggsfieldClientError as error:
        print(f"Richiesta rifiutata dall'API: {error}", file=sys.stderr)
        return 1

    status = result.get("status")
    if status != "completed":
        reasons = {
            "failed": "generazione fallita (non addebitata)",
            "nsfw": "bloccata dalla moderazione (non addebitata)",
            "canceled": "richiesta annullata",
            "cancelled": "richiesta annullata",
        }
        detail = reasons.get(status, f"stato inatteso: {status!r}")
        print(f"Nessun video: {detail}.", file=sys.stderr)
        if result.get("error"):
            print(f"Dettaglio: {result['error']}", file=sys.stderr)
        return 1

    url = video_url(result)
    if not url:
        print("Richiesta completata ma senza URL video nella risposta.", file=sys.stderr)
        print(f"Campi ricevuti: {sorted(result)}", file=sys.stderr)
        return 1

    print(f"Video: {url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
