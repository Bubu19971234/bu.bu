// Collega la pagina alla scena: scorrimento, puntatore, indice delle tavole, schede.
import { creaScena } from './scene.js';

const html = document.documentElement;
html.classList.add('js');

const movimentoRidotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const puntatoreFine = window.matchMedia('(pointer: fine)').matches;
const tavole = [...document.querySelectorAll('[data-tavola]')];
const canvas = document.getElementById('scena');
const didascalia = document.getElementById('didascalia');
const vociIndice = [...document.querySelectorAll('.indice a')];

const stile = getComputedStyle(html);
const colore = (nome) => stile.getPropertyValue(nome).trim();
const telefono = Math.min(window.innerWidth, window.innerHeight) < 700;

let scena = null;
try {
  scena = creaScena(canvas, {
    punti: telefono ? 17000 : 34000,
    carta: colore('--carta'),
    inchiostro: colore('--inchiostro'),
    accento: colore('--accento'),
    fermo: movimentoRidotto,
  });
} catch (errore) {
  console.warn('Scena 3D non disponibile:', errore);
}
html.classList.add(scena ? 'con-scena' : 'senza-scena');

// ——— scorrimento → indice continuo della figura ————————————————————————

let cime = [];
function misura() {
  const y = window.scrollY;
  cime = tavole.map((t) => t.getBoundingClientRect().top + y);
}

let figuraAttiva = -1;
function aggiorna() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  let s = 0;
  // La trasformazione verso la tavola i comincia quando entra dal basso
  // e finisce quando il suo titolo è a un terzo dello schermo.
  for (let i = 1; i < cime.length; i++) {
    const f = (y + vh * 0.92 - cime[i]) / (vh * 0.62);
    s += Math.min(1, Math.max(0, f));
  }
  if (scena) scena.scorri(s);

  const attiva = Math.round(s);
  if (attiva !== figuraAttiva) {
    figuraAttiva = attiva;
    vociIndice.forEach((a, i) => a.classList.toggle('attiva', i === attiva));
    const t = tavole[attiva];
    if (didascalia && t) {
      didascalia.classList.remove('visibile');
      window.setTimeout(() => {
        didascalia.querySelector('b').textContent = `Fig. ${String(attiva + 1).padStart(2, '0')}`;
        didascalia.querySelector('span').textContent = t.dataset.figura || '';
        didascalia.dataset.lato = attiva % 2 === 0 ? 'destra' : 'sinistra';
        didascalia.classList.add('visibile');
      }, 180);
    }
  }
  html.classList.toggle('scorsa', y > 24);
}

let inAttesa = false;
function alloScorrere() {
  if (inAttesa) return;
  inAttesa = true;
  requestAnimationFrame(() => {
    inAttesa = false;
    aggiorna();
  });
}

function alRidimensionare() {
  if (scena) scena.ridimensiona();
  misura();
  aggiorna();
}

window.addEventListener('scroll', alloScorrere, { passive: true });
window.addEventListener('resize', alRidimensionare);
window.addEventListener('load', alRidimensionare);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(alRidimensionare);
if ('ResizeObserver' in window) new ResizeObserver(() => { misura(); aggiorna(); }).observe(document.body);

// ——— puntatore ————————————————————————————————————————————————————————

if (scena && puntatoreFine && !movimentoRidotto) {
  window.addEventListener('pointermove', (e) => {
    scena.puntatore((e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2, true);
  }, { passive: true });
  document.addEventListener('pointerleave', () => scena.puntatore(0, 0, false));
}

if (scena) {
  document.addEventListener('visibilitychange', () => (document.hidden ? scena.ferma() : scena.avvia()));
  scena.avvia();
  // Esposta per i collaudi automatici.
  window.__scena = scena;
}

misura();
aggiorna();

// ——— comparsa degli elementi ——————————————————————————————————————————

const daMostrare = [...document.querySelectorAll('[data-entra]')];
if ('IntersectionObserver' in window && !movimentoRidotto) {
  const oss = new IntersectionObserver((voci) => {
    for (const v of voci) {
      if (!v.isIntersecting) continue;
      v.target.classList.add('dentro');
      oss.unobserve(v.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  daMostrare.forEach((el, i) => {
    el.style.setProperty('--ritardo', `${(i % 4) * 70}ms`);
    oss.observe(el);
  });
} else {
  daMostrare.forEach((el) => el.classList.add('dentro'));
}

// ——— schede che si inclinano sotto il puntatore ————————————————————————

if (puntatoreFine && !movimentoRidotto) {
  for (const scheda of document.querySelectorAll('.scheda')) {
    scheda.addEventListener('pointermove', (e) => {
      const r = scheda.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      scheda.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
      scheda.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
      scheda.style.setProperty('--mx', `${x * 100}%`);
      scheda.style.setProperty('--my', `${y * 100}%`);
    });
    scheda.addEventListener('pointerleave', () => {
      scheda.style.setProperty('--rx', '0deg');
      scheda.style.setProperty('--ry', '0deg');
    });
  }
}

// ——— menu su telefono ————————————————————————————————————————————————

const bottoneMenu = document.querySelector('.apri-menu');
const menu = document.getElementById('menu');
if (bottoneMenu && menu) {
  const chiudi = () => {
    bottoneMenu.setAttribute('aria-expanded', 'false');
    menu.classList.remove('aperto');
  };
  bottoneMenu.addEventListener('click', () => {
    const aperto = bottoneMenu.getAttribute('aria-expanded') === 'true';
    bottoneMenu.setAttribute('aria-expanded', String(!aperto));
    menu.classList.toggle('aperto', !aperto);
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) chiudi();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudi();
  });
}
