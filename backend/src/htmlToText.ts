/**
 * Conversione HTML -> testo leggibile per l'estrazione del menu.
 * Volutamente senza dipendenze: i menu da QR sono pagine semplici
 * (piattaforme tipo menu digitale, siti WordPress, Google Drive).
 */

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  euro: "€",
  egrave: "è",
  eacute: "é",
  agrave: "à",
  igrave: "ì",
  ograve: "ò",
  ugrave: "ù",
  Egrave: "È",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  middot: "·",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

export function htmlToText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer|table|ul|ol|dt|dd)\s*>/gi, "\n")
    .replace(/<(td|th)\b[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v ]+/g, " ").trim())
    .filter((line) => line.length > 0 && line !== "|")
    .join("\n");
}

/** Link a PDF presenti nella pagina (molti QR puntano a una pagina che contiene il PDF del menu). */
export function findPdfLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const re = /\b(?:href|src|data)\s*=\s*["']([^"']+?\.pdf(?:[?#][^"']*)?)["']/gi;
  for (const m of html.matchAll(re)) {
    try {
      out.add(new URL(decodeEntities(m[1]!), baseUrl).toString());
    } catch {
      /* link malformato: ignorato */
    }
  }
  return [...out];
}

/** Titolo della pagina, utile come suggerimento per il nome del locale. */
export function pageTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? decodeEntities(m[1]!).replace(/\s+/g, " ").trim() : "";
}
