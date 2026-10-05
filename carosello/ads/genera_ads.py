#!/usr/bin/env python3
"""Rende i caroselli ADS con il motore grafico di scartapp-social (genera_grafiche.py).

Usa lo stesso stile B, ma esporta due formati:
  4x5  1080×1350  → Instagram/Facebook (organico e Meta Ads)
  1x1  1080×1080  → LinkedIn Ads (accetta solo quadrato)

Uso:
    python3 genera_ads.py --motore ../scartapp-social [slug]
"""
import argparse
import importlib.util
import json
import re
import pathlib
import shutil
import subprocess
import sys

QUI = pathlib.Path(__file__).resolve().parent
FONT_DIR = QUI.parent / "fonts"
# Poppins in locale: non dipende da Google Fonts (che in alcuni ambienti non si carica)
FONT_FACE = "".join(
    f"@font-face{{font-family:'Poppins';font-weight:{w};src:url('{(FONT_DIR / f'poppins-latin-{w}-normal.woff2').as_uri()}') format('woff2')}}"
    for w in (500, 600, 700, 800))
FORMATI = {"4x5": (1080, 1350), "1x1": (1080, 1080)}
CHROME = ["chromium", "google-chrome", "chrome",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"]


def carica_motore(cartella):
    spec = importlib.util.spec_from_file_location("motore", pathlib.Path(cartella) / "genera_grafiche.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def trova_chrome():
    for c in CHROME:
        p = shutil.which(c) or (c if pathlib.Path(c).exists() else None)
        if p:
            return p
    sys.exit("Nessun Chrome/Chromium trovato.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--motore", required=True, help="cartella del repo scartapp-social")
    ap.add_argument("filtro", nargs="?", default="")
    a = ap.parse_args()

    motore, chrome = carica_motore(a.motore), trova_chrome()
    for p in sorted(p for p in (QUI / "contenuti").glob("*.json") if a.filtro in p.name):
        post = json.loads(p.read_text(encoding="utf-8"))
        for nome_fmt, (w, h) in FORMATI.items():
            motore.W, motore.H = w, h
            out = QUI / "png" / nome_fmt
            out.mkdir(parents=True, exist_ok=True)
            for i, slide in enumerate(post["slides"], 1):
                doc = motore.documento(slide, post.get("stile", "B"))
                doc = re.sub(r"@import url\([^)]*\);", FONT_FACE, doc)
                if h == 1080:  # nel quadrato i titoli vanno un filo più piccoli
                    doc = doc.replace("font-size:96px", "font-size:84px").replace("font-size:70px", "font-size:62px")
                htmlp = out / f"{post['slug']}_{i:02d}.html"
                pngp = htmlp.with_suffix(".png")
                htmlp.write_text(doc, encoding="utf-8")
                subprocess.run([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                                "--force-device-scale-factor=1", "--virtual-time-budget=4000",
                                f"--window-size={w},{h}", f"--screenshot={pngp}", htmlp.as_uri()],
                               capture_output=True, timeout=90)
                htmlp.unlink()
                print(("OK  " if pngp.exists() else "ERR ") + f"{nome_fmt}/{pngp.name}")


if __name__ == "__main__":
    main()
