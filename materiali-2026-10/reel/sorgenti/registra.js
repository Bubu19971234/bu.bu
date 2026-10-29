// Registra un reel 1080x1920 con lo strumento vero dentro un telefono.
// Uso: node registra.js margini|sommelier
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const DIR = __dirname
const reel = process.argv[2] || 'margini'
const pausa = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const b = await chromium.launch()
  const out = path.join(DIR, 'grezzo-' + reel)
  fs.rmSync(out, { recursive: true, force: true })
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: out, size: { width: 1080, height: 1920 } } })
  await ctx.addInitScript(() => { try { localStorage.setItem('cdb_consenso_misurazione_v1', 'no') } catch (e) {} })
  const p = await ctx.newPage()
  const t0 = Date.now()
  await p.goto('http://localhost:8770/stage.html?reel=' + reel, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  const f = p.frames().find(x => x.url().includes('food-cost'))
  await f.waitForSelector('#prova-strumenti')
  await f.evaluate(() => document.fonts.ready)
  await pausa(600)

  // scorrimento morbido dentro il telefono
  const scorri = (sel, offset, ms = 900) => f.evaluate(([sel, offset, ms]) => new Promise(res => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : null
    const da = scrollY, a = (el ? el.getBoundingClientRect().top + scrollY : sel) - offset
    const t = performance.now()
    const passo = now => { const k = Math.min(1, (now - t) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      scrollTo(0, da + (a - da) * e); k < 1 ? requestAnimationFrame(passo) : res() }
    requestAnimationFrame(passo)
  }), [sel, offset, ms])
  const box = sel => f.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)
  const clic = sel => f.evaluate(sel => document.querySelector(sel).click(), sel)
  const fuoco = sel => f.evaluate(sel => document.querySelector(sel).focus(), sel)
  const cerchia = async sel => p.evaluate(r => window.cerchia(r), sel ? await box(sel) : null)

  // posizione iniziale del telefono: inizio dello strumento
  await f.evaluate(() => { const el = document.querySelector('#prova-strumenti .pa-tool:not([hidden])'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 92) })
  const inizio = (Date.now() - t0) / 1000

  // 1. apertura: il titolo compare parola per parola
  await p.evaluate(() => window.scena('apertura'))
  for (let i = 0; i < 6; i++) { await pausa(330); await p.evaluate(i => window.parola(i), i) }
  await pausa(1500)

  // 2. lo strumento
  await p.evaluate(() => { window.scena('demo'); window.didascalia(0) })
  await pausa(900)

  if (reel === 'margini') {
    await pausa(1400)
    // la tagliata: terza voce della tabella
    await scorri('#tool-margini tbody tr:nth-child(3)', 150, 1100)
    await p.evaluate(() => window.didascalia(1))
    await cerchia('#tool-margini tbody tr:nth-child(3) .am-st')
    await pausa(1700)
    await p.evaluate(() => window.didascalia(2))
    await cerchia('#tool-margini tbody tr:nth-child(3) td[data-l="Consigliato"]')
    await pausa(1700)
    await cerchia(null)
    const prezzo = '#tool-margini input[data-v="2"][data-f="prezzo"]'
    await fuoco(prezzo)
    await f.evaluate(sel => { const i = document.querySelector(sel); i.setSelectionRange(0, i.value.length) }, prezzo)
    await f.type(prezzo, '26,5', { delay: 160 })
    await f.evaluate(() => document.activeElement.blur())
    await p.evaluate(() => window.didascalia(3))
    await cerchia('#tool-margini tbody tr:nth-child(3) .am-st')
    await pausa(2000)
  } else {
    await pausa(300)
    await fuoco('#tool-sommelier .ad-input')
    await f.type('#tool-sommelier .ad-input', 'tagliata di manzo', { delay: 85 })
    await pausa(300)
    await clic('#tool-sommelier .ad-btn')
    await pausa(1600)
    await scorri('#tool-sommelier .ad-card', 110, 900)
    await p.evaluate(() => window.didascalia(1))
    await pausa(2200)
    await scorri('#tool-sommelier .ad-langtrig', 120, 700)
    await p.evaluate(() => window.didascalia(2))
    await clic('#tool-sommelier .ad-langtrig')
    await pausa(500)
    await clic('#tool-sommelier .ad-langmenu button:nth-child(2)')
    await pausa(300)
    await scorri('#tool-sommelier .ad-card', 110, 900)
    await pausa(1700)
    await p.evaluate(() => window.didascalia(3))
    await pausa(1000)
  }
  await cerchia(null)

  await p.evaluate(() => getSelection().removeAllRanges())
  // 3. chiusura
  await p.evaluate(() => window.scena('chiusura'))
  await pausa(3200)
  const fine = (Date.now() - t0) / 1000
  await ctx.close(); await b.close()
  const webm = fs.readdirSync(out).find(n => n.endsWith('.webm'))
  fs.writeFileSync(path.join(DIR, 'tempi-' + reel + '.json'), JSON.stringify({ webm: path.join(out, webm), inizio, fine }))
  console.log(reel, 'registrato', { inizio, durata: (fine - inizio).toFixed(1) })
})()
