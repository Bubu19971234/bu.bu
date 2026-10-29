// Reel con gancio immediato: il telefono è già sul risultato dal primo fotogramma.
// Uso: node registra2.js margini|sommelier
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const DIR = __dirname
const reel = process.argv[2] || 'margini'
const pausa = ms => new Promise(r => setTimeout(r, ms))

// dati di esempio per l'app del cliente (stessa trattoria inventata delle prove)
const LOC = { id: 'L1', slug: 'demo', nome: 'Trattoria da Prova', attivo: true, menu_attivo: true, ai_attivo: true, comande_attivo: false }
const CAT = [{ id: 'C1', nome: 'Antipasti', ordine: 0, nome_t: { en: 'Starters' } }, { id: 'C2', nome: 'Primi', ordine: 1, nome_t: { en: 'First courses' } }, { id: 'C3', nome: 'Secondi', ordine: 2, nome_t: { en: 'Main courses' } }]
const P = (id, c, nome, en, descr, descrEn, prezzo, all) => ({ id, categoria_id: c, nome, descrizione: descr, prezzo, allergeni: all, allergeni_ok: true, nome_t: { en }, descrizione_t: { en: descrEn }, ordine: 0, disponibile: true })
const PIATTI = [
  P('p1', 'C1', 'Bruschetta al pomodoro', 'Tomato bruschetta', 'Pane toscano, pomodoro, basilico', 'Tuscan bread, tomato, basil', 6, ['1']),
  P('p2', 'C1', 'Tagliere di salumi toscani', 'Tuscan cured meats board', 'Finocchiona, prosciutto, pecorino', 'Finocchiona, prosciutto, pecorino', 14, ['1', '7']),
  P('p3', 'C2', "Pici all'aglione", 'Pici with garlic tomato sauce', 'Pasta fresca, pomodoro e aglione', 'Fresh pasta, tomato and garlic', 12, ['1']),
  P('p4', 'C2', 'Carbonara', 'Carbonara', 'Guanciale, uovo, pecorino', 'Guanciale, egg, pecorino', 13, ['1', '3', '7']),
  P('p5', 'C3', 'Tagliata di manzo', 'Sliced beef steak', 'Rucola e grana', 'Rocket and parmesan', 22, ['7']),
]
const V = (id, nome, cantina, colore, vitigno, regione, prezzo) => ({ id, nome, cantina, colore, vitigno, regione, prezzo, tipo: 'vino', arricchito: true, profilo: { struttura: 4, freschezza: 4, acidita: 4, sapidita: 4, tannino: 4, grassezza: 2, succulenza: 4, persistenza: 4, aromaticita: 4, equilibrio: 5 } })
const VINI = [V('v1', 'Chianti Classico Riserva', 'Castello di Ama', 'ROSSO', 'Sangiovese', 'Toscana', 38), V('v2', 'Vermentino di Bolgheri', 'Guado al Tasso', 'BIANCO', 'Vermentino', 'Toscana', 26), V('v3', 'Rosso di Montalcino', "Col d'Orcia", 'ROSSO', 'Sangiovese', 'Toscana', 30)]
const RIS = {
  it: { mood_message: 'Una bruschetta e una carbonara: un piatto fresco e acidulo, uno grasso e saporito. Servono vini con buona acidità.', risultati: [
    { vino: VINI[0], score: 68, why: "L'acidità del Sangiovese taglia la grassezza della carbonara e regge il pomodoro della bruschetta.", sensory: 'Amarena, viola, tannino fine.', tip: 'Servire a 16-18°C.' },
    { vino: VINI[2], score: 66, why: 'Frutto rosso croccante e tannino morbido: accompagna la carbonara senza appesantire.', sensory: 'Ciliegia, viola, spezie dolci.', tip: 'Servire a 16°C.' }] },
  en: { mood_message: 'A bruschetta and a carbonara: one fresh and tangy, one rich and savoury. You need wines with good acidity.', risultati: [
    { vino: VINI[0], score: 68, why: "Sangiovese's acidity cuts through the richness of the carbonara and stands up to the bruschetta's tomato.", sensory: 'Sour cherry, violet, fine tannins.', tip: 'Serve at 16-18°C.' },
    { vino: VINI[2], score: 66, why: 'Crisp red fruit and soft tannins: it matches the carbonara without weighing it down.', sensory: 'Cherry, violet, sweet spice.', tip: 'Serve at 16°C.' }] },
}

;(async () => {
  const b = await chromium.launch()
  const out = path.join(DIR, 'grezzo2-' + reel)
  fs.rmSync(out, { recursive: true, force: true })
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: out, size: { width: 1080, height: 1920 } } })
  await ctx.addInitScript(() => { try { localStorage.setItem('cdb_consenso_misurazione_v1', 'no'); localStorage.removeItem('aisom_lang') } catch (e) {} })
  await ctx.route('http://localhost:9999/**', async route => {
    const t = new URL(route.request().url()).pathname.split('/').pop()
    const single = /object/.test(route.request().headers()['accept'] || '')
    const dati = { locali: LOC, menus: [{ id: 'M1', attivo: true, created_at: '2026-10-01' }], menu_categorie: CAT, menu_piatti: PIATTI, vini: VINI }[t] ?? []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single ? (Array.isArray(dati) ? dati[0] : dati) : (Array.isArray(dati) ? dati : [dati])) })
  })
  await ctx.route('**/api/consiglia', async r => { const lang = (JSON.parse(r.request().postData() || '{}').lang) === 'en' ? 'en' : 'it'; await pausa(700); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RIS[lang]) }) })
  await ctx.route('**/menu-clones/**', r => r.fulfill({ status: 404, body: '' }))
  const p = await ctx.newPage()
  const t0 = Date.now()
  await p.goto('http://localhost:8770/stage2.html?reel=' + reel, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  const f = p.frames().find(x => /food-cost|locale\/demo/.test(x.url()))
  await f.waitForLoadState('load')
  await f.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
  await pausa(1500)

  const scorri = (sel, offset, ms = 700) => f.evaluate(([sel, offset, ms]) => new Promise(res => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null
    const da = scrollY, a = (el ? el.getBoundingClientRect().top + scrollY : sel) - offset
    const t = performance.now()
    const passo = now => { const k = Math.min(1, (now - t) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      scrollTo(0, da + (a - da) * e); k < 1 ? requestAnimationFrame(passo) : res() }
    requestAnimationFrame(passo)
  }), [sel, offset, ms])
  const box = sel => f.evaluate(sel => { const el = typeof sel === 'string' ? document.querySelector(sel) : null; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)
  const cerchia = async sel => p.evaluate(r => window.cerchia(r ? { x: r.x, y: r.y + 28, w: r.w, h: r.h } : null), sel ? await box(sel) : null)
  const did = i => p.evaluate(i => window.didascalia(i), i)
  const clicTesto = (sel, testo, n = 0) => f.evaluate(([sel, testo, n]) => { const els = [...document.querySelectorAll(sel)].filter(e => e.textContent.includes(testo)); els[n].click() }, [sel, testo, n])

  let inizio
  if (reel === 'margini') {
    await clicTesto('#tool-margini .am-tab', 'Bar')
    await pausa(200)
    await f.evaluate(() => { const el = document.querySelector('#tool-margini tbody tr:nth-child(4)'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 250) })
    await pausa(300)
    inizio = (Date.now() - t0) / 1000
    await p.evaluate(() => window.scena('demo'))
    await did(0); await pausa(1100)
    await did(1); await cerchia('#tool-margini tbody tr:nth-child(4) .am-st'); await pausa(1900)
    await cerchia(null); await did(2)
    await scorri('#tool-margini .am-kpi', 180, 700)
    await cerchia('#tool-margini .am-k.oro'); await pausa(1900)
    await cerchia(null); await did(3)
    await scorri('#tool-margini tbody tr:nth-child(4)', 250, 700)
    await cerchia('#tool-margini tbody tr:nth-child(4) td[data-l="Consigliato"]'); await pausa(1700)
    await cerchia(null)
    const prezzo = '#tool-margini input[data-v="3"][data-f="prezzo"]'
    await f.evaluate(sel => { const i = document.querySelector(sel); i.focus(); i.setSelectionRange(0, i.value.length) }, prezzo)
    await f.type(prezzo, '8,6', { delay: 150 })
    await f.evaluate(() => document.activeElement.blur())
    await did(4); await cerchia('#tool-margini tbody tr:nth-child(4) .am-st'); await pausa(1900)
  } else {
    await clicTesto('button', 'Aggiungi', 0); await pausa(150)
    await clicTesto('button', 'Aggiungi', 2); await pausa(150)
    await f.evaluate(() => scrollTo(0, 0)); await pausa(300)
    inizio = (Date.now() - t0) / 1000
    await p.evaluate(() => window.scena('demo'))
    await did(0); await f.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Consiglia')).pop().setAttribute('data-reel', 'btn')); await cerchia('[data-reel="btn"]'); await pausa(1400)
    await cerchia(null)
    await f.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Consiglia') || x.textContent.includes('Recommend') || x.textContent.includes('wine')).pop().click())
    await did(1); await pausa(1300)
    await f.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.includes('Chianti Classico Riserva')); const c = h.closest('[class*="rounded"]'); c.setAttribute('data-reel', 'vino'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 40) })
    await pausa(250)
    await cerchia('[data-reel="vino"]'); await pausa(1900)
    await cerchia(null); await did(2)
    await scorri(0, 0, 600)
    await f.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('🇬🇧')); b.setAttribute('data-reel', 'en'); b.click() })
    await cerchia('[data-reel="en"]'); await pausa(900); await cerchia(null)
    await f.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Consiglia') || x.textContent.includes('Recommend') || x.textContent.includes('wine')).pop().click())
    await pausa(1300)
    await f.evaluate(() => { const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.includes('Chianti Classico Riserva')); const c = h.closest('[class*="rounded"]'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 40) })
    await pausa(1500)
    await did(3); await pausa(1700)
  }
  await cerchia(null)
  await p.evaluate(() => window.scena('chiusura'))
  await pausa(3000)
  const fine = (Date.now() - t0) / 1000
  await ctx.close(); await b.close()
  const webm = fs.readdirSync(out).find(n => n.endsWith('.webm'))
  fs.writeFileSync(path.join(DIR, 'tempi2-' + reel + '.json'), JSON.stringify({ webm: path.join(out, webm), inizio, fine }))
  console.log(reel, 'registrato', { inizio, durata: (fine - inizio).toFixed(1) })
})()
