// Apre le pagine del cliente del SaaS (next dev su :3005) con dati di esempio intercettati.
const { chromium } = require('playwright')
const SP = __dirname
const LOC = { id: 'L1', slug: 'demo', nome: 'Trattoria da Prova', attivo: true, menu_attivo: true, ai_attivo: true, comande_attivo: false }
const CAT = [{ id: 'C1', nome: 'Antipasti', ordine: 0, nome_t: {} }, { id: 'C2', nome: 'Primi', ordine: 1, nome_t: {} }, { id: 'C3', nome: 'Secondi', ordine: 2, nome_t: {} }]
const P = (id, c, nome, descr, prezzo, all) => ({ id, categoria_id: c, nome, descrizione: descr, prezzo, allergeni: all, allergeni_ok: true, nome_t: { en: nome }, descrizione_t: {}, ordine: 0, disponibile: true })
const PIATTI = [
  P('p1', 'C1', 'Bruschetta al pomodoro', 'Pane toscano, pomodoro, basilico', 6, ['1']),
  P('p2', 'C1', 'Tagliere di salumi toscani', 'Finocchiona, prosciutto, pecorino', 14, ['1', '7']),
  P('p3', 'C2', "Pici all'aglione", 'Pasta fresca, pomodoro e aglione', 12, ['1']),
  P('p4', 'C2', 'Carbonara', 'Guanciale, uovo, pecorino', 13, ['1', '3', '7']),
  P('p5', 'C3', 'Tagliata di manzo', 'Rucola e grana', 22, ['7']),
]
const V = (id, nome, cantina, colore, vitigno, regione, prezzo) => ({ id, nome, cantina, colore, vitigno, regione, prezzo, tipo: 'vino', arricchito: true, profilo: { struttura: 4, freschezza: 4, acidita: 4, sapidita: 4, tannino: 4, grassezza: 2, succulenza: 4, persistenza: 4, aromaticita: 4, equilibrio: 5 } })
const VINI = [V('v1', 'Chianti Classico Riserva', 'Castello di Ama', 'ROSSO', 'Sangiovese', 'Toscana', 38), V('v2', 'Vermentino di Bolgheri', 'Guado al Tasso', 'BIANCO', 'Vermentino', 'Toscana', 26), V('v3', 'Rosso di Montalcino', 'Col d’Orcia', 'ROSSO', 'Sangiovese', 'Toscana', 30)]
const RIS = {
  mood_message: "Una bruschetta al pomodoro e una carbonara: piatti del repertorio centro-italiano, uno fresco e acidulo, l'altro grasso e saporito. La scelta privilegia vini con buona acidità.",
  risultati: [
    { vino: VINI[0], score: 68, why: "Il Sangiovese in versione Riserva lavora su entrambi i piatti: la sua acidità taglia la grassezza dell'uovo e del guanciale, mentre la componente fresca regge l'acidità del pomodoro.", sensory: 'Trama tannica fine, acidità viva, note di amarena e viola.', tip: 'Servire a 16-18°C, in calice ampio.' },
    { vino: VINI[2], score: 66, why: 'Frutto rosso croccante e tannino morbido: accompagna la carbonara senza appesantire.', sensory: 'Ciliegia, viola, spezie dolci.', tip: 'Servire a 16°C.' },
  ],
}
async function prepara(p) {
  await p.route('http://localhost:9999/**', async route => {
    const url = new URL(route.request().url())
    const t = url.pathname.split('/').pop()
    const single = /object/.test(route.request().headers()['accept'] || '')
    const dati = { locali: LOC, menus: [{ id: 'M1', attivo: true, created_at: '2026-10-01' }], menu_categorie: CAT, menu_piatti: PIATTI, vini: VINI }[t] ?? []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single && Array.isArray(dati) ? dati[0] : (single ? dati : (Array.isArray(dati) ? dati : [dati]))) })
  })
  await p.route('**/api/consiglia', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RIS) }))
  await p.route('**/menu-clones/**', r => r.fulfill({ status: 404, body: '' }))
}
;(async () => {
  const b = await chromium.launch()
  for (const [nome, path, azione] of [
    ['menu-top', '/locale/demo/menu', async p => { const a = p.locator('button', { hasText: 'Aggiungi' }); await a.nth(0).click(); await a.nth(3).click(); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300) }],
    ['menu-consiglio', '/locale/demo/menu', async p => { const a = p.locator('button', { hasText: 'Aggiungi' }); await a.nth(0).click(); await a.nth(3).click(); const btns = await p.$$eval('button', bs => bs.map(b => b.textContent.trim()).filter(t => t)); console.log('bottoni:', btns.slice(-6).join(' / ')); await p.locator('.fixed button').last().click(); await p.waitForTimeout(1500) }],
  ]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const err = []; p.on('pageerror', e => err.push(e.message))
    await prepara(p)
    await p.goto('http://localhost:3005' + path, { waitUntil: 'networkidle', timeout: 120000 })
    await p.waitForTimeout(1500)
    if (azione) { try { await azione(p) } catch (e) { err.push('azione: ' + e.message.split('\n')[0]) } }
    await p.screenshot({ path: `${SP}/cliente-${nome}.png`, fullPage: false })
    console.log(nome, p.url(), err.join(' | '))
    await p.close()
  }
  await b.close()
})()
