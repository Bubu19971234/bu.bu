import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Scarica in sicurezza la risorsa puntata da un QR code.
 *
 * Il QR arriva dall'utente, quindi l'URL è input non fidato: blocchiamo
 * protocolli diversi da http(s), IP privati/loopback/link-local (SSRF verso
 * la rete interna del server), redirect infiniti e file troppo grandi.
 */

export const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

export type FetchedSource =
  | { kind: "pdf"; data: Buffer; finalUrl: string }
  | { kind: "image"; data: Buffer; mediaType: ImageMediaType; finalUrl: string }
  | { kind: "html"; html: string; finalUrl: string };

export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export class SourceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid_url"
      | "blocked_host"
      | "too_large"
      | "unsupported_type"
      | "http_error"
      | "timeout",
  ) {
    super(message);
  }
}

/** true se l'indirizzo IP non deve essere raggiungibile dal server. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a = 0, b = 0] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local / metadata cloud
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast + riservati
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    if (s === "::" || s === "::1") return true;
    if (s.startsWith("::ffff:")) return isPrivateAddress(s.slice(7));
    return (
      s.startsWith("fc") ||
      s.startsWith("fd") || // unique local
      s.startsWith("fe8") ||
      s.startsWith("fe9") ||
      s.startsWith("fea") ||
      s.startsWith("feb") || // link-local
      s.startsWith("ff") // multicast
    );
  }
  return true; // non è un IP valido: trattalo come bloccato
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new SourceError("URL non valido", "invalid_url");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SourceError(`Protocollo non ammesso: ${url.protocol}`, "invalid_url");
  }
  if (url.username || url.password) {
    throw new SourceError("URL con credenziali non ammesso", "invalid_url");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (addresses.length === 0) {
    throw new SourceError(`Host non risolvibile: ${host}`, "invalid_url");
  }
  if (addresses.some(isPrivateAddress)) {
    throw new SourceError(`Host non pubblico: ${host}`, "blocked_host");
  }
  return url;
}

async function readCapped(res: Response): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) throw new SourceError("File troppo grande", "too_large");
  if (!res.body) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength;
    if (total > MAX_BYTES) throw new SourceError("File troppo grande", "too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Riconosce il tipo dai primi byte: i server dei menu spesso sbagliano il Content-Type. */
export function sniffType(buf: Buffer, contentType: string): "pdf" | "html" | ImageMediaType {
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "GIF8") return "image/gif";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP")
    return "image/webp";
  if (/text\/html|application\/xhtml/i.test(contentType)) return "html";
  const head = buf.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  throw new SourceError(`Tipo di contenuto non supportato: ${contentType || "sconosciuto"}`, "unsupported_type");
}

export async function fetchSource(rawUrl: string): Promise<FetchedSource> {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Ri-verifica a ogni redirect: un sito pubblico può rimandare a un IP interno.
    // Limite noto: fetch() risolve di nuovo il DNS (DNS rebinding). In produzione
    // eseguire il download da una funzione serverless senza accesso alla rete interna.
    const url = await assertPublicUrl(current);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": "AISomMenuImporter/0.1",
          accept: "text/html,application/pdf,image/*;q=0.9,*/*;q=0.5",
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new SourceError("Timeout nel download", "timeout");
      }
      throw new SourceError(`Download fallito: ${(err as Error).message}`, "http_error");
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new SourceError("Redirect senza destinazione", "http_error");
      current = new URL(location, url).toString();
      continue;
    }
    if (!res.ok) throw new SourceError(`HTTP ${res.status}`, "http_error");

    const data = await readCapped(res);
    const type = sniffType(data, res.headers.get("content-type") ?? "");
    const finalUrl = url.toString();
    if (type === "pdf") return { kind: "pdf", data, finalUrl };
    if (type === "html") return { kind: "html", html: data.toString("utf8"), finalUrl };
    return { kind: "image", data, mediaType: type, finalUrl };
  }
  throw new SourceError("Troppi redirect", "http_error");
}
