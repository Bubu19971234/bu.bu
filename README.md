# bu.bu: AI som

Prototipo per pubblicare **AI som** (menu digitale e sommelier AI per ristoranti) su App Store e Google Play.

| Cartella | Contenuto |
|---|---|
| `backend/` | Servizio TypeScript che **clona il menu** da un link (QR), da un PDF o da foto e lo restituisce come JSON strutturato, usando l'API Claude. Condiviso tra iOS e Android. |
| `ios/AISom/` | App SwiftUI: scanner QR, caricamento PDF/foto, revisione obbligatoria (prezzi e allergeni), layout personalizzato del menu con temi. |
| `docs/COSTI.md` | Stima dei costi: store, infrastruttura, API AI. |
| `docs/NORME-E-STORE.md` | Policy Apple e Google, AI Act, GDPR, allergeni, alcol, termini Anthropic, con fonti. |

## Architettura

```
iPhone (SwiftUI) ──┐                      ┌── pagina web del QR ─┐
                   ├─► backend /v1/menu/import ─► PDF / foto ──────┼─► Claude ─► JSON menu
Android (futuro) ──┘   (la chiave AI resta qui)                    ┘
```

Swift compila nativamente solo per iOS. Per Android le strade sono due:
- un'app Kotlin/Compose che chiama lo stesso backend;
- [Skip](https://skip.tools), oggi gratuito e open source, che converte SwiftUI in Compose.

## Backend: avvio locale

```bash
cd backend
npm install
export ANTHROPIC_API_KEY=...       # chiave API Anthropic
export APP_API_TOKEN=$(openssl rand -hex 24)
npm test                           # test senza chiamate AI
npm start                          # http://localhost:8787
```

Prova da terminale (chiama davvero l'API e consuma credito):

```bash
npm run import -- https://ristorante.example/menu
npm run import -- ./menu.pdf
```

Variabili opzionali:
- `MENU_MODEL`: modello, predefinito `claude-opus-5-5`;
- `MENU_EFFORT`: `low`, `medium` o `high`; predefinito `medium`.

### Come funziona la clonazione

1. **Link dal QR.** Il backend scarica la risorsa con un controllo anti-SSRF: niente IP interni, ricontrollo a ogni redirect, massimo 20 MB. Il tipo si riconosce dai primi byte del file.
   - **PDF o immagine:** viene passato direttamente al modello.
   - **Pagina HTML:** viene convertita in testo. Se la pagina è un contenitore vuoto con un link a un PDF, il backend segue il PDF.
   - **Pagina generata da JavaScript:** non è leggibile e il backend chiede all'utente il PDF o una foto.
2. **Estrazione.** Claude restituisce un JSON validato con uno schema Zod: sezioni, voci, prezzi in centesimi, varianti calice/bottiglia, dati dei vini, allergeni **solo se dichiarati**, dubbi di lettura.
3. **Revisione nell'app.** Il ristoratore deve confermare prezzi e allergeni prima di pubblicare. Le voci incerte sono evidenziate.

## App iOS: setup

1. In Xcode 26 o successivo: nuovo progetto *App*, interfaccia SwiftUI, iOS 17 o successivo. Trascina dentro i file di `ios/AISom/`.
2. In Info.plist aggiungi `NSCameraUsageDescription`, per esempio "Serve per leggere il QR code del menu".
3. Per collegarti al backend locale su `http://` serve un'eccezione ATS, solo in sviluppo.
4. Lo scanner QR funziona solo su iPhone fisico.

## Limiti noti

- Il codice Swift **non è stato compilato**: è stato scritto in un ambiente Linux senza Xcode.
- L'estrazione non è stata provata con l'API reale: mancava una chiave. Sono stati verificati solo i test offline, cioè download sicuro, conversione HTML e handler HTTP.
- `APP_API_TOKEN` è un segreto condiviso adatto solo allo sviluppo. In produzione serve l'autenticazione per utente (Sign in with Apple / Supabase Auth) verificata dal backend.
- La chat sommelier non è ancora implementata. Vedi `docs/NORME-E-STORE.md` (consenso e dichiarazione di AI) e `docs/COSTI.md` (è la voce di costo principale).
