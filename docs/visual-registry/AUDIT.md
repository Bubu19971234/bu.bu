# Visual Design Registry — FASE 0: Audit

Data: 2026-10-26 · Branch: `claude/magical-faraday-zur5qh` · Nessuna modifica al codice applicativo.

## Esito principale

La specifica presuppone "un'applicazione già funzionante con dashboard analitiche poco rifinite".
Nel repository **questo non è vero**:

1. `main` (base di questo branch) contiene solo `README.md`. Nessuna app.
2. L'app reale (Football Talent Network) vive sul branch **non mergiato**
   `claude/football-talent-network-build-n7gen9` (PR #1, commit `7e299be`, 155 file).
3. Il branch `claude/trusting-rubin-uj4xde` contiene caroselli social (PNG/HTML/Python) e skill Higgsfield: nessuna UI applicativa.
4. In nessun branch esiste una dashboard KPI/analytics. Nessuna API espone metriche aggregate.

## Stack rilevato (branch football-talent-network)

| Area | Rilevato dal codice |
|---|---|
| Monorepo | pnpm 10 workspaces, Node ≥ 22, TypeScript ~6.0 |
| Web | Next.js 16.3.6, React 19.2.3, App Router, Server Actions |
| Mobile | Expo SDK 57, React Native 0.86, expo-router |
| Backend | Supabase (migrazioni SQL, RLS, RPC `is_platform_staff`), servizi in `packages/supabase` |
| Validazione | Zod 4 (`packages/validation`) |
| Styling web | Un solo `globals.css` con variabili CSS (`--bg`, `--surface`, `--accent #19d38a`, …), tema **solo dark**. Nessun Tailwind, nessuna component library, nessuna libreria di grafici/tabelle |
| Styling mobile | `apps/mobile/src/lib/theme.ts` — stessi colori duplicati a mano |
| Test | Vitest (unit + test DB/RLS), ESLint, CI GitHub Actions |

## UI esistente rilevante

| Schermata | Natura | Dati |
|---|---|---|
| `/admin` | Coda di moderazione (media, segnalazioni, cancellazioni) | 3 query `limit 50`, solo staff |
| `/p/[slug]` | Pagina pubblica giocatore (card, clip, report AI) | profilo + clip |
| `/guardian` | Area tutore | richieste consenso |
| `/`, `/competizioni`, legali | Pagine statiche | — |

L'unico candidato per un pilota "dashboard" è `/admin` (pattern `dash-operations`: code di lavoro e azioni).

## Debolezze visive verificate

- Token duplicati fra web (CSS) e mobile (TS), senza sorgente unica.
- `/admin`: stili inline (`style={{ width: 280 }}`), conteggi nei titoli invece di KPI di coda, nessun empty/error state (una query fallita appare come lista vuota: `media.data ?? []`), tabella senza gestione mobile, date senza timezone esplicita.
- Nessuna scala tipografica o di spaziatura formalizzata; `--muted #8b9bb0` su `--surface #121923` da verificare per contrasto.
- Nessun tema light; nessun `prefers-reduced-motion`.

## Cosa NON si può fare senza decisione

- **Dashboard pilota con KPI**: vietato inventare metriche (vincolo 4). Il backend non ne espone.
- **Lavorare sull'app**: richiede basare questo branch su un PR non mergiato (rischio di conflitti/stack su codice non approvato).
- **Migrazione `visual_library` su Supabase**: possibile solo nel branch dell'app.
