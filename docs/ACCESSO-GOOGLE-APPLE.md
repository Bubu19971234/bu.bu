# Accesso con Google e con Apple: cosa creare e dove (26/11/2026)

## Stato al 26/11/2026 (verificato su Supabase)
- Google: **spento**, nessuna chiave. Apple: **spento**, nessuna chiave. Attivo solo email e password.
- Corretto l'indirizzo del sito in Supabase: era `http://localhost:3000`, ora `https://ai-som-saas.vercel.app`.
- Il codice è pronto e pubblicato, ma i pulsanti restano nascosti finché su Vercel non si imposta `NEXT_PUBLIC_ACCESSO_GOOGLE=1` / `NEXT_PUBLIC_ACCESSO_APPLE=1`:
  - pulsanti «Continua con Apple / Google» in accesso e registrazione;
  - ritorno su `/auth/fine`;
  - completamento del locale su `/benvenuto`, con il consenso a termini e privacy registrato con data e versione.

**Dati che servono in entrambe le console:**
- indirizzo di ritorno (callback): `https://jkggjbnwpofnuqwriqzv.supabase.co/auth/v1/callback`;
- sito: `https://ai-som-saas.vercel.app`.

> Le chiavi segrete non vanno mai incollate in chat o in email: si inseriscono direttamente nel pannello di Supabase.

---

## A. Google (gratuito, circa 15 minuti)

1. Vai su <https://console.cloud.google.com> e crea il progetto **AI Som**. Se ne esiste già uno con un client OAuth «AI Som», riusalo: in Supabase non è collegato a nulla.
2. **Google Auth Platform → Branding** (schermata di consenso):
   - nome app **AI Som** ed email di assistenza;
   - home page, link a privacy e termini (quelli pubblicati dopo l'avvocato);
   - **domini autorizzati**: `ai-som-saas.vercel.app` e `jkggjbnwpofnuqwriqzv.supabase.co` (più `ai-som.it` quando sarà il dominio dell'app);
   - senza logo non serve la verifica del marchio da parte di Google [Probabile].
3. **Audience**: tipo **Esterno**, poi **Pubblica l'app**. Con i soli dati di base (nome, email) non serve la revisione di Google [Probabile].
4. **Clients → Crea client → Applicazione web**, nome «AI Som web»:
   - origini JavaScript autorizzate: `https://ai-som-saas.vercel.app`;
   - URI di reindirizzamento autorizzati: `https://jkggjbnwpofnuqwriqzv.supabase.co/auth/v1/callback`.

   Annota **ID client** e **segreto client**.
5. **Supabase** → Authentication → Sign In / Providers → **Google** → attiva, incolla ID e segreto → Salva.
6. **Vercel** → progetto ai-som-saas → Settings → Environment Variables: `NEXT_PUBLIC_ACCESSO_GOOGLE` = `1` (Production), poi ridistribuisci.

*Per l'app Android e iOS, più avanti:* due client in più (Android con l'impronta SHA-1 della firma, iOS con il bundle ID), da aggiungere in Supabase come «client ID aggiuntivi».

---

## B. Apple (serve l'Apple Developer Program, 99 $/anno, che servirà comunque per pubblicare l'app)

**Prima di tutto:**
- **Iscrizione come organizzazione o come persona.**
  - Come organizzazione nello store compare il nome dell'azienda, ma Apple chiede il numero D-U-N-S.
  - Come persona compare il tuo nome e cognome [Probabile].
  - Va deciso prima, perché cambiarlo dopo è laborioso.
- **Identificativi proposti** (non si cambiano dopo la pubblicazione):
  - app: `it.aisom.app`;
  - accesso dal sito: `it.aisom.web`.

1. <https://developer.apple.com/account> → Certificates, Identifiers & Profiles → **Identifiers → + → App IDs → App**.
   - Bundle ID esplicito `it.aisom.app`, descrizione «AI Som».
   - Spunta **Sign In with Apple** → Register.
2. **Identifiers → + → Services IDs**: descrizione «AI Som web», identificativo `it.aisom.web` → Register.
   - Apri il Services ID → spunta **Sign In with Apple** → Configure:
     - Primary App ID `it.aisom.app`;
     - Domains: `jkggjbnwpofnuqwriqzv.supabase.co`;
     - Return URLs: `https://jkggjbnwpofnuqwriqzv.supabase.co/auth/v1/callback`.
   - Save → Continue → Save.
3. **Keys → +**: nome «AI Som accesso Apple», spunta **Sign In with Apple** → Configure (Primary App ID `it.aisom.app`) → Register.
   - **Scarica il file .p8: si scarica una sola volta.** Conservalo in un posto sicuro, mai in chat o in email.
   - Annota il **Key ID** e il **Team ID** (in alto a destra, o in Membership).
4. **Supabase** → Providers → **Apple** → attiva:
   - Client IDs: `it.aisom.web` (più avanti anche `it.aisom.app` per l'app);
   - Secret Key: va generata dal file .p8 con il generatore della guida di Supabase «Login with Apple».
   - **Questa chiave dura al massimo 6 mesi** [Certo, regola Apple]: va rigenerata prima della scadenza, altrimenti l'accesso con Apple smette di funzionare. Posso impostarti un promemoria.
5. **Email nascoste da Apple.** Chi sceglie «Nascondi la mia email» ci dà un indirizzo `…@privaterelay.appleid.com`. Perché le nostre email arrivino:
   - Certificates, Identifiers & Profiles → Services → **Sign in with Apple for Email Communication**;
   - aggiungi il dominio `ai-som.it` e il mittente `noreply@ai-som.it`, che devono essere già autenticati con SPF e DKIM nel servizio di invio (Resend).
6. **Vercel**: `NEXT_PUBLIC_ACCESSO_APPLE` = `1`, poi ridistribuisci.

---

## C. Dopo aver acceso
- Prova: accesso con Google e con Apple da `/login`. Un account nuovo passa da «Ultimo passo», poi va alla configurazione; uno esistente va al pannello.
- Il ristoratore registrato con email e password che entra con Google usando la **stessa email**: Supabase collega i due accessi allo stesso account [Probabile, da verificare alla prima prova].
- Con Apple e l'email nascosta invece nasce un account nuovo.
- Da fare con l'app Capacitor:
  - accesso nativo (Apple su iOS, Google con Credential Manager su Android): Google blocca l'accesso dentro le pagine web incorporate nelle app;
  - **revoca del token Apple** dentro «Cancella account», richiesta da Apple.
