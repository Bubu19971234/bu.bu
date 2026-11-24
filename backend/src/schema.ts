import { z } from "zod";

/**
 * I 14 allergeni dell'Allegato II del Reg. UE 1169/2011.
 * L'estrazione NON deve mai dedurli dagli ingredienti: si riportano solo se
 * il menu sorgente li dichiara esplicitamente (vedi `allergens_declared`).
 */
export const ALLERGENS = [
  "glutine",
  "crostacei",
  "uova",
  "pesce",
  "arachidi",
  "soia",
  "latte",
  "frutta_a_guscio",
  "sedano",
  "senape",
  "sesamo",
  "solfiti",
  "lupini",
  "molluschi",
] as const;

export const ItemKind = z.enum(["piatto", "vino", "bevanda", "altro"]);

export const PriceSchema = z.object({
  /** Prezzo in centesimi, per evitare errori di arrotondamento. */
  amount_cents: z.number().int(),
  /** Etichetta della variante di prezzo, es. "calice", "bottiglia", "0,33 l". Stringa vuota se unica. */
  label: z.string(),
});

export const MenuItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  kind: ItemKind,
  prices: z.array(PriceSchema),
  /** Allergeni SOLO se dichiarati nel menu sorgente. */
  allergens: z.array(z.enum(ALLERGENS)),
  /** true se il menu sorgente riporta esplicitamente gli allergeni per questa voce. */
  allergens_declared: z.boolean(),
  /** Tag dichiarati nel menu (es. "vegano", "piccante", "surgelato"). */
  tags: z.array(z.string()),
  /** Campi specifici dei vini; stringa vuota se non indicati. */
  wine: z.object({
    producer: z.string(),
    vintage: z.string(),
    region: z.string(),
    grapes: z.string(),
    color: z.enum(["rosso", "bianco", "rosato", "bollicine", "dolce", "non_indicato"]),
  }),
  /** Testo così com'è nella sorgente, utile per la revisione umana. */
  source_text: z.string(),
  /** Dubbi di lettura su questa voce (prezzo illeggibile, nome tagliato...). Vuoto se nessuno. */
  uncertainty: z.string(),
});

export const MenuSectionSchema = z.object({
  title: z.string(),
  items: z.array(MenuItemSchema),
});

export const MenuSchema = z.object({
  restaurant_name: z.string(),
  /** Codice ISO 4217, es. "EUR". */
  currency: z.string(),
  /** Lingua principale del menu, ISO 639-1. */
  language: z.string(),
  sections: z.array(MenuSectionSchema),
  /** Note generali (coperto, servizio, "pesce abbattuto", avvisi allergeni). */
  notes: z.array(z.string()),
  /** Problemi globali di estrazione (pagine illeggibili, contenuto mancante...). */
  extraction_warnings: z.array(z.string()),
});

export type Menu = z.infer<typeof MenuSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
