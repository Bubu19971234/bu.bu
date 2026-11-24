# bu.bu: AI Som

App iPhone (SwiftUI) e documenti per pubblicare **AI Som** su App Store e Google Play.
Il backend è **[ai-som-saas](https://github.com/Bubu19971234/ai-som-saas)** (Next.js su Vercel): l'app non contiene chiavi AI né logica di estrazione.

| Cartella | Contenuto |
|---|---|
| `ios/AISom/` | App SwiftUI per il ristoratore: scansione del QR code, PDF o foto del menù, revisione obbligatoria (prezzi e allergeni), salvataggio, anteprima con layout personalizzato. |
| `docs/COSTI.md` | Stima dei costi: store, infrastruttura, API AI (architettura attuale). |
| `docs/NORME-E-STORE.md` | Policy Apple e Google, AI Act, GDPR, allergeni, alcol, termini Anthropic, con fonti. |

## Come si collega ad ai-som-saas

L'app chiama `POST /api/onboarding-import`, la stessa route usata dal pannello web, con il token di sessione Supabase del ristoratore.

| Fase | Richiesta | Effetto |
|---|---|---|
| 1. Lettura | `{ locale_id, url }`, oppure `{ locale_id, pdf_base64 }`, oppure `{ locale_id, immagini: [{ base64, media_type }] }` | Anteprima del menù e della carta, **niente salvato** |
| 2. Conferma | `{ locale_id, conferma: { menu, carta } }` | Salva quello che il ristoratore ha controllato |

- La lettura usa Claude Opus 5.5 lato server.
- Il link del QR si scarica con protezione SSRF: niente indirizzi interni, ricontrollo a ogni redirect.
- Dopo il salvataggio, "Ricalcola" nel pannello Abbinamenti calcola il profilo dei piatti (Opus, una volta per piatto). Da lì i consigli sui vini sono scelti dal codice; Haiku 5.5 scrive solo le frasi.

## Setup iOS

1. In Xcode 26 o successivo: nuovo progetto *App*, interfaccia SwiftUI, iOS 17 o successivo. Trascina dentro i file di `ios/AISom/`.
2. Aggiungi il pacchetto `supabase-swift` e collega `Config.sessionToken()` alla sessione del ristoratore.
3. In Info.plist aggiungi `NSCameraUsageDescription`, per esempio "Serve per leggere il QR code del menù".
4. Lo scanner QR funziona solo su iPhone fisico.

## Limiti noti

- Il codice Swift **non è stato compilato**: è stato scritto in un ambiente Linux senza Xcode.
- Login e scelta del locale nell'app non sono ancora implementati: `Config` contiene dei segnaposto.
- Android: serve un'app Kotlin che chiama le stesse route, oppure [Skip](https://skip.tools), gratuito e open source, che converte SwiftUI in Compose.
