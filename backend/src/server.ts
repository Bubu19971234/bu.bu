import { createServer } from "node:http";
import { handle } from "./handler.ts";

/** Server Node per sviluppo locale: adatta http.IncomingMessage al Request standard. */
const port = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = Buffer.concat(chunks);
  const request = new Request(`http://localhost${req.url ?? "/"}`, {
    method: req.method,
    headers: Object.entries(req.headers).flatMap(([k, v]) =>
      v === undefined ? [] : (Array.isArray(v) ? v : [v]).map((x) => [k, x] as [string, string]),
    ),
    body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
  });
  const response = await handle(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`AI som menu import su http://localhost:${port}`));
