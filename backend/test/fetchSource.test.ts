import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPublicUrl, isPrivateAddress, sniffType, SourceError } from "../src/fetchSource.ts";

test("blocca IP privati, loopback, metadata cloud", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "151.101.1.69", "2a00:1450:4002:80b::200e"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("rifiuta protocolli e host non ammessi", async () => {
  for (const url of ["file:///etc/passwd", "ftp://x.it/menu.pdf", "http://127.0.0.1/", "http://[::1]/", "https://user:pw@example.com/", "non un url"]) {
    await assert.rejects(assertPublicUrl(url), SourceError, url);
  }
});

test("riconosce il tipo dai magic bytes, non dal content-type", () => {
  assert.equal(sniffType(Buffer.from("%PDF-1.7 ..."), "text/html"), "pdf");
  assert.equal(sniffType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "application/octet-stream"), "image/jpeg");
  assert.equal(sniffType(Buffer.from("<!DOCTYPE html><html>"), ""), "html");
  assert.throws(() => sniffType(Buffer.from("PK\u0003\u0004"), "application/zip"), SourceError);
});
