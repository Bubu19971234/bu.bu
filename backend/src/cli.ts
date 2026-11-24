import { readFileSync } from "node:fs";
import { extractMenu, type MenuSource } from "./extractMenu.ts";

/**
 * Prova rapida da terminale (richiede ANTHROPIC_API_KEY):
 *   npm run import -- https://ristorante.example/menu
 *   npm run import -- ./menu.pdf
 *   npm run import -- ./foto1.jpg ./foto2.jpg
 */
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Uso: npm run import -- <url | file.pdf | foto.jpg ...>");
  process.exit(1);
}

const mediaType = (f: string) =>
  f.toLowerCase().endsWith(".png") ? "image/png" : f.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg";

const first = args[0]!;
const source: MenuSource = /^https?:\/\//i.test(first)
  ? { kind: "url", url: first }
  : first.toLowerCase().endsWith(".pdf")
    ? { kind: "pdf", base64: readFileSync(first).toString("base64") }
    : {
        kind: "images",
        images: args.map((f) => ({ base64: readFileSync(f).toString("base64"), mediaType: mediaType(f) })),
      };

const result = await extractMenu(source);
console.log(JSON.stringify(result, null, 2));
const items = result.menu.sections.reduce((n, s) => n + s.items.length, 0);
console.error(
  `\n${items} voci in ${result.menu.sections.length} sezioni | modello ${result.model} | ` +
    `token in ${result.usage.input_tokens} / out ${result.usage.output_tokens}`,
);
