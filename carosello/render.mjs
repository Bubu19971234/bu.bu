// Esporta ogni card di cards.html in PNG 1080x1080 dentro carosello/png/
// Uso: node carosello/render.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'png');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.goto(pathToFileURL(join(here, 'cards.html')).href, { waitUntil: 'networkidle' });

const cards = await page.$$('section.card');
for (const [i, card] of cards.entries()) {
  await card.screenshot({ path: join(out, `card-${i + 1}.png`) });
}
await browser.close();
console.log(`${cards.length} card esportate in ${out}`);
