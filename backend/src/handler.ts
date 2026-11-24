import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { extractMenu, ExtractionError, type MenuSource } from "./extractMenu.ts";
import { SourceError } from "./fetchSource.ts";

/**
 * Handler HTTP in formato Web standard (Request -> Response): gira identico su
 * Vercel Functions, Supabase Edge/Deno, Cloudflare o il server Node locale.
 *
 * POST /v1/menu/import
 *   { "url": "https://..." }                                   link letto dal QR
 *   { "pdf_base64": "..." }                                    PDF caricato
 *   { "images": [{ "base64": "...", "media_type": "image/jpeg" }] }   foto del menu
 */

const ImportBody = z.union([
  z.object({ url: z.string().url() }),
  z.object({ pdf_base64: z.string().min(1) }),
  z.object({
    images: z
      .array(
        z.object({
          base64: z.string().min(1),
          media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
        }),
      )
      .min(1),
  }),
]);

const MAX_BODY_BYTES = 30 * 1024 * 1024;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function authorized(req: Request): boolean {
  const expected = process.env.APP_API_TOKEN;
  if (!expected) return false; // senza token configurato il servizio resta chiuso
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function toSource(body: z.infer<typeof ImportBody>): MenuSource {
  if ("url" in body) return { kind: "url", url: body.url };
  if ("pdf_base64" in body) return { kind: "pdf", base64: body.pdf_base64 };
  return {
    kind: "images",
    images: body.images.map((i) => ({ base64: i.base64, mediaType: i.media_type })),
  };
}

export async function handle(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (req.method === "GET" && pathname === "/health") return json(200, { ok: true });

  if (pathname !== "/v1/menu/import") return json(404, { error: "not_found" });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!authorized(req)) return json(401, { error: "unauthorized" });

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return json(413, { error: "payload_too_large" });

  let parsed: z.infer<typeof ImportBody>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: "payload_too_large" });
    const result = ImportBody.safeParse(JSON.parse(raw));
    if (!result.success) return json(400, { error: "invalid_body", details: result.error.issues });
    parsed = result.data;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  try {
    const result = await extractMenu(toSource(parsed));
    // needs_review: l'app deve far confermare il menu al ristoratore prima di pubblicarlo
    // (prezzi e allergeni sono informazioni obbligatorie verso il cliente).
    return json(200, { ...result, needs_review: true });
  } catch (err) {
    if (err instanceof SourceError) return json(422, { error: err.code, message: err.message });
    if (err instanceof ExtractionError) return json(422, { error: err.code, message: err.message });
    if (err instanceof Anthropic.RateLimitError) return json(503, { error: "busy", message: "Riprova tra poco" });
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return json(502, { error: "ai_unavailable" });
    }
    console.error(err);
    return json(500, { error: "internal" });
  }
}
