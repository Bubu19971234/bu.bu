import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/handler.ts";

process.env.APP_API_TOKEN = "test-token";
const post = (body: unknown, token = "test-token") =>
  handle(new Request("http://x/v1/menu/import", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  }));

test("health", async () => {
  assert.equal((await handle(new Request("http://x/health"))).status, 200);
});
test("senza token corretto -> 401", async () => {
  assert.equal((await post({ url: "https://example.com" }, "sbagliato")).status, 401);
});
test("body non valido -> 400", async () => {
  assert.equal((await post({ foo: 1 })).status, 400);
});
test("URL verso rete interna -> 422 blocked_host, nessuna chiamata AI", async () => {
  const res = await post({ url: "http://169.254.169.254/latest/meta-data" });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error, "blocked_host");
});
