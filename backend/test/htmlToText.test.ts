import { test } from "node:test";
import assert from "node:assert/strict";
import { findPdfLinks, htmlToText, pageTitle } from "../src/htmlToText.ts";

const page = `<!doctype html><html><head><title>Trattoria da Gino &ndash; Menu</title>
<style>.x{color:red}</style><script>alert("ignorami")</script></head><body>
<h2>Primi</h2><ul><li>Tagliatelle al rag&ugrave; <span>12,00&nbsp;&euro;</span></li>
<li>Risotto ai funghi<br>14 &#8364;</li></ul>
<table><tr><td>Barolo DOCG 2019</td><td>calice 9</td><td>bottiglia 55</td></tr></table>
<a href="/files/carta-vini.pdf?v=2">Carta dei vini</a></body></html>`;

test("estrae testo pulito con separatori di riga", () => {
  const text = htmlToText(page);
  assert.match(text, /Tagliatelle al ragù 12,00 €/);
  assert.match(text, /Risotto ai funghi\n14 €/);
  assert.match(text, /Barolo DOCG 2019 \| calice 9 \| bottiglia 55/);
  assert.doesNotMatch(text, /alert|color:red/);
});

test("trova i link ai PDF e risolve gli URL relativi", () => {
  assert.deepEqual(findPdfLinks(page, "https://dagino.example/menu/"), ["https://dagino.example/files/carta-vini.pdf?v=2"]);
});

test("legge il titolo", () => {
  assert.equal(pageTitle(page), "Trattoria da Gino – Menu");
});
