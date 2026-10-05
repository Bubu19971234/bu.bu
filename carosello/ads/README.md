# Caroselli ADS Scart Up

Cinque caroselli costruiti per convertire, uno per servizio, nello stile B di `scartapp-social` (stesso motore `genera_grafiche.py`, stessi tipi di slide).

Differenze rispetto ai caroselli organici da 10 slide:

- **5-6 slide**, non 10: negli annunci quasi nessuno arriva in fondo, quindi gancio e offerta stanno nelle prime.
- **CTA al modulo contatti**, non «DM o link in bio»: chi clicca lascia nome e telefono senza uscire da Instagram/Facebook/LinkedIn.
- **Offerta concreta e gratuita** (analisi, controllo, demo), mai il prezzo: quello si dice alla chiamata.
- **Nessun numero inventato**: le prove sono solo quelle verificate (ricerca su amazon.it, caso del ritorno dimezzato).

## File

- `contenuti/*.json` — stesso formato di `scartapp-social/contenuti/`, più un blocco `ads` (testo annuncio, modulo, pubblico) che il motore ignora. Si possono copiare lì così come sono.
- `png/4x5/` — 1080×1350, per Instagram/Facebook e Meta Ads
- `png/1x1/` — 1080×1080, per LinkedIn Ads (accetta solo quadrato)
- `genera_ads.py` — rigenera tutto: `python3 carosello/ads/genera_ads.py --motore ../scartapp-social`

## Ordine consigliato

| Priorità | Carosello | Servizio | A chi |
|---|---|---|---|
| 1 | `ads-amazon-marchio` | Gestione Amazon + ads + social (pacchetto 700 €/mese) | LinkedIn: elenco aziende produttori (Pistoia, Prato, Empolese), ruoli titolare/marketing/e-commerce |
| 2 | `ads-ospitalita` | Check-in ospiti + risposte WhatsApp (hotel, B&B, affitti) | Meta: 15 km da Montecatini Terme (Montecatini, Monsummano, Pescia, Pieve a Nievole), interessi Booking/Airbnb host, gestione alberghiera |
| 2 | `ads-vendite-vere` | Gestione campagne Meta/Google contando solo le vendite | Meta: 30 km da Monsummano + Empoli e Prato, titolari di piccole imprese, interesse e-commerce/pubblicità online |
| 3 | `ads-social-autopilota` | Social gestiti / auto-poster | Meta: 30 km da Monsummano, titolari di piccole imprese e negozi |
| 3 | `ads-ecommerce-automatico` | Automazioni e-commerce (foto, scorte, spedizioni, dati) | Meta: 30 km da Monsummano + Empoli e Prato, interessi Shopify/WooCommerce/Amazon Seller, titolari di piccole imprese |

Il 1 è il pacchetto da 700 €/mese e ha la scadenza di Natale: parte subito. Il 2 (ospitalità) apre un pubblico nuovo e vicinissimo, Montecatini. Il resto dopo, se il budget lo permette.

## ads-amazon-marchio

*Gestione Amazon + ads + social (pacchetto 700 €/mese)*

**Slide:**

1. Il tuo marchio su Amazon forse lo vende **un altro**.
2. Prezzo, foto, descrizione: **decide lui**.
3. Succede anche a marchi toscani noti.
4. Il tuo negozio Amazon, gestito.
5. Cerca il tuo marchio su amazon.it.
6. Schede online entro il **15 novembre**?

**Testo principale:**

> Produci in Toscana e hai un marchio tuo? Cerca il tuo prodotto su amazon.it e guarda «Venduto da»: spesso non sei tu.
>
> Con Scart Up apri il negozio Amazon a nome tuo e gestisco schede, pubblicità e social. Per vendere a Natale le schede devono essere online entro metà novembre.
>
> Compila il modulo: ti mando l'analisi gratuita di chi vende oggi il tuo marchio e a che prezzo.

**Titolo:** Analisi gratuita del tuo marchio su Amazon  
**Pulsante:** Richiedi informazioni

**Modulo contatti:**

- Nome e cognome
- Email di lavoro
- Telefono
- Azienda
- Il tuo marchio è su Amazon? (Sì, lo vendiamo noi / Sì, lo vendono altri / No / Non lo so)
- Sito o nome del prodotto principale

**Pubblico:** LinkedIn: elenco aziende produttori (Pistoia, Prato, Empolese), ruoli titolare/marketing/e-commerce. Meta: 30 km da Monsummano + Empoli e Prato.

## ads-ospitalita

*Check-in ospiti + risposte WhatsApp (hotel, B&B, affitti)*

**Slide:**

1. Rispondi ancora a mano a «a che ora è il **check‑in**?»
2. Le stesse dieci domande, ogni giorno.
3. L'ospite fa da **solo**.
4. Tu gestisci solo le eccezioni.
5. Vuoi un check-in che si fa da **solo**?

**Testo principale:**

> Orari, parcheggio, documenti, colazione: le stesse domande ogni giorno, anche di notte.
>
> Con Scart Up l'ospite fa il check-in online prima di arrivare e riceve su WhatsApp le risposte alle domande di sempre. A te arrivano solo le richieste vere.
>
> Lascia il contatto: ti mostro come funzionerebbe nella tua struttura, in 20 minuti.

**Titolo:** Il check-in che si fa da solo  
**Pulsante:** Richiedi informazioni

**Modulo contatti:**

- Nome e cognome
- Email di lavoro
- Telefono
- Azienda
- Tipo di struttura (Hotel / B&B / Affitti brevi / Altro)
- Quante camere o unità?

**Pubblico:** Meta: 15 km da Montecatini Terme (Montecatini, Monsummano, Pescia, Pieve a Nievole), interessi Booking/Airbnb host, gestione alberghiera.

## ads-vendite-vere

*Gestione campagne Meta/Google contando solo le vendite*

**Slide:**

1. La pubblicità che paghi forse non ha **mai venduto** niente.
2. «Conversioni» ovunque. Sul conto, niente.
3. Il ritorno vero era **la metà**.
4. Le tue campagne passano il test?
5. Vuoi sapere quanto ti rende **davvero**?

**Testo principale:**

> Se il pannello di Meta o Google dice «conversioni», non vuol dire vendite. Spesso conta visite e carrelli.
>
> In un e-commerce reale, contando solo gli acquisti, il ritorno vero era la metà di quello dichiarato.
>
> Ti faccio un controllo gratuito delle tue campagne: ti dico quante vendite portano davvero e su cosa stai buttando budget.

**Titolo:** Controllo gratuito delle tue campagne  
**Pulsante:** Richiedi informazioni

**Modulo contatti:**

- Nome e cognome
- Email di lavoro
- Telefono
- Azienda
- Dove fai pubblicità? (Meta / Google / Amazon / Altro)
- Quanto spendi al mese? (meno di 500 € / 500-2.000 € / oltre 2.000 €)

**Pubblico:** Meta: 30 km da Monsummano + Empoli e Prato, titolari di piccole imprese, interesse e-commerce/pubblicità online. Escludere chi è già cliente.

## ads-social-autopilota

*Social gestiti / auto-poster*

**Slide:**

1. La tua pagina è **ferma** da mesi?
2. Non è pigrizia.
3. Tre agenti in fila.
4. I post di @scartapp escono così.
5. Vuoi che la **tua** pagina si scriva da sola?

**Testo principale:**

> Dodici post buoni al mese sono un lavoro vero. Per questo le pagine delle aziende si fermano.
>
> Con Scart Up tre agenti scrivono, impaginano e pubblicano i tuoi post su Instagram e Facebook, partendo dai tuoi casi veri. Tu approvi.
>
> Lascia il contatto: ti mostro i primi tre post per la tua pagina.

**Titolo:** La tua pagina, attiva senza scriverla tu  
**Pulsante:** Richiedi informazioni

**Modulo contatti:**

- Nome e cognome
- Email di lavoro
- Telefono
- Azienda
- Link alla tua pagina Instagram o Facebook

**Pubblico:** Meta: 30 km da Monsummano, titolari di piccole imprese e negozi.

## ads-ecommerce-automatico

*Automazioni e-commerce (foto, scorte, spedizioni, dati)*

**Slide:**

1. Vendi online. Ma passi la giornata a **copiare dati**.
2. Foto, scorte, etichette, gestionale.
3. Ogni errore è un **ordine perso**.
4. Lo fa un agente, non tu.
5. Qual è il lavoro che ti ruba più **tempo**?

**Testo principale:**

> Foto da rifare per Amazon, scorte da allineare, etichette da compilare, dati da ricopiare nel gestionale. Ogni giorno.
>
> Sono lavori ripetitivi: li può fare un agente al posto tuo, senza errori di copia-incolla.
>
> Dimmi qual è il lavoro che ti ruba più tempo: ti rispondo con come lo automatizzerei e quanto tempo ti libera.

**Titolo:** Il lavoro ripetitivo lo fa un agente  
**Pulsante:** Richiedi informazioni

**Modulo contatti:**

- Nome e cognome
- Email di lavoro
- Telefono
- Azienda
- Cosa ti ruba più tempo? (Foto prodotto / Scorte / Spedizioni / Dati nel gestionale / Altro)
- Dove vendi? (Sito / Amazon / Negozio / Altro)

**Pubblico:** Meta: 30 km da Monsummano + Empoli e Prato, interessi Shopify/WooCommerce/Amazon Seller, titolari di piccole imprese.

## Prima di pubblicare

- [ ] Account pubblicitario intestato a Scart Up (non CDB)
- [ ] URL dell'informativa privacy nel modulo
- [ ] Verificare la slide «I post di @scartapp escono così» (`ads-social-autopilota`): va pubblicata solo se è vero che testo, grafica e pubblicazione partono dal sistema
- [ ] Chiamare ogni contatto entro 48 ore
