// Scultura di punti: sei figure fatte delle stesse particelle, che si
// trasformano una nell'altra seguendo lo scorrimento della pagina.
// WebGL2 puro, nessuna libreria.

const TAU = Math.PI * 2;

/** Generatore pseudo-casuale con seme: le figure sono identiche a ogni visita. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LUCE = normalizza([0.45, 0.8, 0.55]);

function normalizza(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Ombreggiatura 0..1 da una normale: 1 = in piena luce, 0 = in ombra. */
function lambert(nx, ny, nz) {
  const d = nx * LUCE[0] + ny * LUCE[1] + nz * LUCE[2];
  return Math.min(1, Math.max(0, 0.5 + 0.5 * d));
}

/**
 * Riempie una figura a partire da una lista di emettitori pesati.
 * Ogni emettitore restituisce [x, y, z, ombra].
 */
function daEmettitori(n, seed, emettitori) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n * 4);
  let totale = 0;
  for (const e of emettitori) totale += e.peso;
  const soglie = [];
  let acc = 0;
  for (const e of emettitori) {
    acc += e.peso / totale;
    soglie.push(acc);
  }
  for (let i = 0; i < n; i++) {
    // Campionamento stratificato: ogni emettitore riceve la sua quota esatta.
    const u = (i + rnd()) / n;
    let k = 0;
    while (k < soglie.length - 1 && u > soglie[k]) k++;
    const p = emettitori[k].punto(rnd);
    out[i * 4] = p[0];
    out[i * 4 + 1] = p[1];
    out[i * 4 + 2] = p[2];
    out[i * 4 + 3] = p[3];
  }
  return mescola(out, n, seed ^ 0x9e3779b9);
}

/** Rimescola i punti: senza, la trasformazione sposterebbe blocchi interi. */
function mescola(buf, n, seed) {
  const rnd = mulberry32(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    for (let c = 0; c < 4; c++) {
      const t = buf[i * 4 + c];
      buf[i * 4 + c] = buf[j * 4 + c];
      buf[j * 4 + c] = t;
    }
  }
  return buf;
}

// ——— mattoni geometrici ————————————————————————————————————————————————
// I punti seguono sequenze a bassa discrepanza: la puntinatura risulta
// regolare come in un'incisione, invece che a chiazze come col caso puro.

const AUREO = 0.6180339887498949;
const R2A = 0.7548776662466927;
const R2B = 0.5698402909980532;
const fraz = (x) => x - Math.floor(x);

/** Porta la somma dei pesi di un gruppo di emettitori alla quota data (0..1). */
function gruppo(quota, emettitori) {
  let somma = 0;
  for (const e of emettitori) somma += e.peso;
  for (const e of emettitori) e.peso = (e.peso / somma) * quota;
  return emettitori;
}

/** Faccia rettangolare: origine o, lati u e v, normale nrm. */
function faccia(o, u, v, nrm, ombra, densita = 1) {
  const area = Math.hypot(u[0], u[1], u[2]) * Math.hypot(v[0], v[1], v[2]);
  const s = ombra === undefined ? lambert(nrm[0], nrm[1], nrm[2]) : ombra;
  let k = 0;
  return {
    peso: area * densita,
    punto: () => {
      k++;
      const a = fraz(0.5 + k * R2A);
      const b = fraz(0.5 + k * R2B);
      return [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b, s];
    },
  };
}

/** Le sei facce di un parallelepipedo centrato in c con dimensioni d. */
function scatolaFacce(c, d, densita = 1) {
  const [cx, cy, cz] = c;
  const [w, h, p] = [d[0] / 2, d[1] / 2, d[2] / 2];
  return [
    faccia([cx - w, cy + h, cz - p], [2 * w, 0, 0], [0, 0, 2 * p], [0, 1, 0], undefined, densita),
    faccia([cx - w, cy - h, cz - p], [2 * w, 0, 0], [0, 0, 2 * p], [0, -1, 0], undefined, densita),
    faccia([cx - w, cy - h, cz + p], [2 * w, 0, 0], [0, 2 * h, 0], [0, 0, 1], undefined, densita),
    faccia([cx - w, cy - h, cz - p], [2 * w, 0, 0], [0, 2 * h, 0], [0, 0, -1], undefined, densita),
    faccia([cx + w, cy - h, cz - p], [0, 0, 2 * p], [0, 2 * h, 0], [1, 0, 0], undefined, densita),
    faccia([cx - w, cy - h, cz - p], [0, 0, 2 * p], [0, 2 * h, 0], [-1, 0, 0], undefined, densita),
  ];
}

/** I dodici spigoli dello stesso parallelepipedo: disegnano il contorno. */
function scatolaSpigoli(c, d, ombra = 0.3) {
  const [cx, cy, cz] = c;
  const [w, h, p] = [d[0] / 2, d[1] / 2, d[2] / 2];
  const sp = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) sp.push(segmento([cx + sx * w, cy + sy * h, cz - p], [cx + sx * w, cy + sy * h, cz + p], ombra));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sp.push(segmento([cx + sx * w, cy - h, cz + sz * p], [cx + sx * w, cy + h, cz + sz * p], ombra));
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) sp.push(segmento([cx - w, cy + sy * h, cz + sz * p], [cx + w, cy + sy * h, cz + sz * p], ombra));
  return sp;
}

/** Segmento fra a e b: il peso è la lunghezza, i punti sono equidistanti. */
function segmento(a, b, ombra = 0.3, spessore = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  let k = 0;
  return {
    peso: len,
    punto: (r) => {
      k++;
      const t = fraz(0.5 + k * AUREO);
      const j = spessore > 0 ? spessore : 0;
      return [
        a[0] + (b[0] - a[0]) * t + (j ? (r() - 0.5) * j : 0),
        a[1] + (b[1] - a[1]) * t + (j ? (r() - 0.5) * j : 0),
        a[2] + (b[2] - a[2]) * t + (j ? (r() - 0.5) * j : 0),
        ombra,
      ];
    },
  };
}

function sfera(c, raggio, densita = 1) {
  let k = 0;
  return {
    peso: 4 * Math.PI * raggio * raggio * densita,
    punto: () => {
      k++;
      const z = 2 * fraz(0.5 + k * R2A) - 1;
      const a = fraz(0.5 + k * R2B) * TAU;
      const q = Math.sqrt(1 - z * z);
      const n = [q * Math.cos(a), z, q * Math.sin(a)];
      return [c[0] + n[0] * raggio, c[1] + n[1] * raggio, c[2] + n[2] * raggio, lambert(n[0], n[1], n[2])];
    },
  };
}

/** Cilindro verticale: mantello e coperchio superiore. */
function cilindroFacce(c, raggio, altezza) {
  const [cx, cy, cz] = c;
  let k = 0;
  let m = 0;
  return [
    {
      peso: TAU * raggio * altezza,
      punto: () => {
        k++;
        const a = fraz(0.5 + k * R2A) * TAU;
        return [cx + Math.cos(a) * raggio, cy + (fraz(0.5 + k * R2B) - 0.5) * altezza, cz + Math.sin(a) * raggio, lambert(Math.cos(a), 0, Math.sin(a))];
      },
    },
    {
      peso: Math.PI * raggio * raggio,
      punto: () => {
        m++;
        const a = fraz(0.5 + m * R2A) * TAU;
        const q = Math.sqrt(fraz(0.5 + m * R2B)) * raggio;
        return [cx + Math.cos(a) * q, cy + altezza / 2, cz + Math.sin(a) * q, lambert(0, 1, 0)];
      },
    },
  ];
}

/** Circonferenza orizzontale: il bordo di un disco. */
function anello(c, raggio, ombra = 0.3) {
  let k = 0;
  return {
    peso: TAU * raggio,
    punto: () => {
      k++;
      const a = fraz(0.5 + k * AUREO) * TAU;
      return [c[0] + Math.cos(a) * raggio, c[1], c[2] + Math.sin(a) * raggio, ombra];
    },
  };
}

// ——— le sei figure ————————————————————————————————————————————————————

/** 0 · Giroide: una superficie minima periodica ritagliata in una sfera. */
function giroide(n, seed) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n * 4);
  const R = 1.18;
  const K = 5.4;
  const g = (x, y, z) => Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x);
  let i = 0;
  while (i < n) {
    let x = (rnd() * 2 - 1) * R;
    let y = (rnd() * 2 - 1) * R;
    let z = (rnd() * 2 - 1) * R;
    if (x * x + y * y + z * z > R * R) continue;
    let gx = 0;
    let gy = 0;
    let gz = 0;
    // Tre passi di Newton portano il punto sulla superficie g = 0.
    for (let k = 0; k < 3; k++) {
      const X = x * K;
      const Y = y * K;
      const Z = z * K;
      const f = g(X, Y, Z);
      gx = Math.cos(X) * Math.cos(Y) - Math.sin(Z) * Math.sin(X);
      gy = -Math.sin(X) * Math.sin(Y) + Math.cos(Y) * Math.cos(Z);
      gz = -Math.sin(Y) * Math.sin(Z) + Math.cos(Z) * Math.cos(X);
      const g2 = gx * gx + gy * gy + gz * gz + 1e-6;
      x -= (f * gx) / g2 / K;
      y -= (f * gy) / g2 / K;
      z -= (f * gz) / g2 / K;
    }
    if (x * x + y * y + z * z > R * R) continue;
    const nrm = normalizza([gx, gy, gz]);
    // Superficie a due facce: conta l'inclinazione, non il verso.
    const d = Math.abs(nrm[0] * LUCE[0] + nrm[1] * LUCE[1] + nrm[2] * LUCE[2]);
    out[i * 4] = x;
    out[i * 4 + 1] = y;
    out[i * 4 + 2] = z;
    out[i * 4 + 3] = 0.1 + 0.9 * Math.pow(d, 0.8);
    i++;
  }
  return out;
}

/** 1 · Pila a tre strati: dati (dischi), logica (lastra a celle), interfaccia (lastra con blocchi). */
function pila(n, seed) {
  const facce = [];
  const spigoli = [];
  const dischi = [];
  // Strato dati: tre dischi impilati, il simbolo del database.
  for (let k = 0; k < 3; k++) {
    const c = [0, -0.86 + k * 0.19, 0];
    dischi.push(...cilindroFacce(c, 0.62, 0.14));
    spigoli.push(anello([0, c[1] + 0.07, 0], 0.62, 0.2), anello([0, c[1] - 0.07, 0], 0.62, 0.35));
  }
  // Strato logica e strato interfaccia, con i blocchi di una pagina sopra.
  const scatole = [
    [[0, -0.02, 0], [1.75, 0.1, 1.15], 1],
    [[0, 0.66, 0], [1.75, 0.06, 1.15], 1],
    [[-0.48, 0.75, -0.2], [0.62, 0.12, 0.5], 0.9],
    [[0.42, 0.72, -0.3], [0.72, 0.06, 0.3], 0.9],
    [[0.22, 0.72, 0.28], [0.32, 0.06, 0.36], 0.9],
    [[0.64, 0.72, 0.28], [0.32, 0.06, 0.36], 0.9],
    [[-0.48, 0.71, 0.36], [0.62, 0.04, 0.2], 0.9],
  ];
  for (const [c, d, dens] of scatole) {
    facce.push(...scatolaFacce(c, d, dens));
    spigoli.push(...scatolaSpigoli(c, d, 0.25));
  }
  // Celle sulla lastra della logica.
  const celle = [];
  for (let ix = -2; ix <= 2; ix++) celle.push(segmento([ix * 0.29, 0.034, -0.575], [ix * 0.29, 0.034, 0.575], 0.55));
  for (let iz = -1; iz <= 1; iz++) celle.push(segmento([-0.875, 0.034, iz * 0.29], [0.875, 0.034, iz * 0.29], 0.55));
  // Condotti verticali fra uno strato e l'altro.
  const condotti = [];
  for (const [x, z] of [[-0.6, -0.38], [0.6, -0.38], [-0.6, 0.38], [0.6, 0.38]]) condotti.push(segmento([x, 0.04, z], [x, 0.63, z], 0.4, 0.014));
  for (const [x, z] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]]) condotti.push(segmento([x, -0.4, z], [x, -0.07, z], 0.4, 0.014));
  return daEmettitori(n, seed, [
    ...gruppo(0.22, dischi),
    ...gruppo(0.53, facce),
    ...gruppo(0.15, spigoli),
    ...gruppo(0.045, celle),
    ...gruppo(0.055, condotti),
  ]);
}

/** 2 · Finestra del browser, con i blocchi della pagina a profondità diverse. */
function finestra(n, seed) {
  const linee = [];
  const campi = [];
  const pallini = [];
  const W = 1.22;
  const H = 0.84;
  const rett = (x0, y0, x1, y1, z, ombra, pieno = 0, ombraPieno = 0.8) => {
    linee.push(
      segmento([x0, y0, z], [x1, y0, z], ombra),
      segmento([x1, y0, z], [x1, y1, z], ombra),
      segmento([x1, y1, z], [x0, y1, z], ombra),
      segmento([x0, y1, z], [x0, y0, z], ombra),
    );
    if (pieno > 0) campi.push(faccia([x0, y0, z], [x1 - x0, 0, 0], [0, y1 - y0, 0], [0, 0, 1], ombraPieno, pieno));
  };
  const disco = (cx, cy, z, raggio, ombra) => {
    let k = 0;
    pallini.push({
      peso: 1,
      punto: () => {
        k++;
        const a = fraz(0.5 + k * R2A) * TAU;
        const q = Math.sqrt(fraz(0.5 + k * R2B)) * raggio;
        return [cx + Math.cos(a) * q, cy + Math.sin(a) * q, z, ombra];
      },
    });
  };

  // Cornice e barra del titolo.
  rett(-W, -H, W, H, 0, 0.15, 0.22, 0.97);
  linee.push(segmento([-W, H - 0.2, 0], [W, H - 0.2, 0], 0.3));
  disco(-W + 0.13, H - 0.1, 0, 0.034, 0.2);
  disco(-W + 0.25, H - 0.1, 0, 0.034, 0.45);
  disco(-W + 0.37, H - 0.1, 0, 0.034, 0.7);
  rett(-W + 0.55, H - 0.155, W - 0.3, H - 0.05, 0, 0.6);
  // Blocco principale e righe di testo.
  rett(-W + 0.14, 0.02, 0.05, H - 0.34, 0.14, 0.3, 2.0, 0.55);
  for (let k = 0; k < 4; k++) {
    const y = -0.1 - k * 0.085;
    linee.push(segmento([-W + 0.14, y, 0.07], [-W + 0.14 + (k === 3 ? 0.55 : 1.05 - k * 0.08), y, 0.07], 0.45, 0.014));
  }
  // Immagine a destra, con le diagonali del segnaposto.
  rett(0.22, -0.02, W - 0.14, H - 0.34, 0.26, 0.3, 1.0, 0.85);
  linee.push(segmento([0.22, -0.02, 0.26], [W - 0.14, H - 0.34, 0.26], 0.65));
  linee.push(segmento([0.22, H - 0.34, 0.26], [W - 0.14, -0.02, 0.26], 0.65));
  // Tre schede in basso, ognuna un po' più avanti della precedente.
  for (let k = 0; k < 3; k++) {
    const x0 = -W + 0.14 + k * 0.76;
    rett(x0, -H + 0.12, x0 + 0.64, -H + 0.44, 0.18 + k * 0.06, 0.3, 1.5, 0.7 - k * 0.12);
  }
  // Il simbolo </> sospeso davanti alla pagina.
  const z = 0.62;
  const s = 0.2;
  const simbolo = [
    [[-0.36, 0, z], [-0.18, s, z]],
    [[-0.36, 0, z], [-0.18, -s, z]],
    [[0.36, 0, z], [0.18, s, z]],
    [[0.36, 0, z], [0.18, -s, z]],
    [[-0.07, -s * 1.15, z], [0.07, s * 1.15, z]],
  ].map(([a, b]) => segmento(a, b, 0.0, 0.03));
  return daEmettitori(n, seed, [
    ...gruppo(0.2, linee),
    ...gruppo(0.72, campi),
    ...gruppo(0.03, pallini),
    ...gruppo(0.05, simbolo),
  ]);
}

/** 3 · Rete di agenti: un nodo centrale, satelliti e collegamenti. */
function rete(n, seed) {
  const nodi = [];
  const legami = [];
  const centro = [0, 0, 0];
  const satelliti = [
    [0.95, 0.38, 0.2, 0.19],
    [-0.88, 0.5, -0.3, 0.17],
    [0.3, 0.98, -0.42, 0.15],
    [-0.42, -0.9, 0.36, 0.18],
    [0.72, -0.62, -0.5, 0.16],
    [-0.98, -0.28, 0.44, 0.14],
    [0.1, 0.3, 1.02, 0.17],
    [-0.2, -0.26, -1.05, 0.15],
  ];
  nodi.push(sfera(centro, 0.34));
  for (const s of satelliti) {
    nodi.push(sfera(s, s[3]));
    legami.push(segmento(centro, s, 0.5));
  }
  // Collegamenti fra satelliti: gli agenti si passano il lavoro.
  for (const [a, b] of [[0, 2], [2, 1], [1, 5], [5, 3], [3, 4], [4, 0], [6, 0], [6, 5], [7, 4], [7, 1]]) {
    const l = segmento(satelliti[a], satelliti[b], 0.72);
    l.peso *= 0.55;
    legami.push(l);
  }
  // Foglie: piccoli nodi esterni attaccati ai satelliti.
  const rnd = mulberry32(seed + 7);
  for (const s of satelliti) {
    for (let k = 0; k < 2; k++) {
      const d = normalizza([s[0] + (rnd() - 0.5) * 0.9, s[1] + (rnd() - 0.5) * 0.9, s[2] + (rnd() - 0.5) * 0.9]);
      const f = [s[0] + d[0] * 0.38, s[1] + d[1] * 0.38, s[2] + d[2] * 0.38];
      nodi.push(sfera(f, 0.055, 1.4));
      const l = segmento(s, f, 0.6);
      l.peso *= 0.7;
      legami.push(l);
    }
  }
  return daEmettitori(n, seed, [...gruppo(0.88, nodi), ...gruppo(0.12, legami)]);
}

/** 4 · Istogramma in rilievo: i numeri veri, referenza per referenza. */
function istogramma(n, seed) {
  const facce = [];
  const spigoli = [];
  const piano = [];
  const rnd = mulberry32(seed + 3);
  const G = 5;
  const passo = 0.37;
  const lato = 0.25;
  const base = -0.72;
  for (let i = 0; i < G; i++) {
    for (let j = 0; j < G; j++) {
      const cresc = Math.pow((i + (G - 1 - j)) / (2 * (G - 1)), 1.35);
      const h = 0.1 + 1.3 * cresc * (0.72 + 0.28 * rnd());
      const x = (i - (G - 1) / 2) * passo;
      const z = (j - (G - 1) / 2) * passo;
      facce.push(...scatolaFacce([x, base + h / 2, z], [lato, h, lato]));
      spigoli.push(...scatolaSpigoli([x, base + h / 2, z], [lato, h, lato], 0.25));
    }
  }
  // Piano d'appoggio a reticolo.
  const m = (G * passo) / 2 + 0.06;
  for (let k = 0; k <= G; k++) {
    const q = -m + (k * 2 * m) / G;
    piano.push(segmento([q, base, -m], [q, base, m], 0.6), segmento([-m, base, q], [m, base, q], 0.6));
  }
  return daEmettitori(n, seed, [...gruppo(0.76, facce), ...gruppo(0.19, spigoli), ...gruppo(0.05, piano)]);
}

/** 5 · Monogramma MT in rilievo, con un'orbita attorno. */
function monogramma(n, seed) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(n * 4);
  const dentro = (x, y) => {
    // T
    if (x >= 0.12 && x <= 1.02 && y >= 0.3 && y <= 0.5) return true;
    if (x >= 0.47 && x <= 0.67 && y >= -0.5 && y <= 0.5) return true;
    // M: due aste e due diagonali
    if (y < -0.5 || y > 0.5) return false;
    if (x >= -1.02 && x <= -0.82) return true;
    if (x >= -0.3 && x <= -0.1) return true;
    if (y >= -0.12) {
      const t = (0.5 - y) / 0.62;
      const sx = -0.92 + t * 0.36;
      const dx = -0.2 - t * 0.36;
      if (Math.abs(x - sx) <= 0.11 || Math.abs(x - dx) <= 0.11) return x >= -1.02 && x <= -0.1;
    }
    return false;
  };
  const S = 1.12;
  const D = 0.16;
  const orbita = Math.floor(n * 0.2);
  let i = 0;
  let k = 0;
  while (i < n - orbita) {
    k++;
    const x = fraz(0.5 + k * R2A) * 2.1 - 1.05;
    const y = fraz(0.5 + k * R2B) - 0.5;
    if (!dentro(x, y)) continue;
    const q = rnd();
    let z;
    let s;
    if (q < 0.5) {
      z = D;
      s = 0.86;
    } else if (q < 0.68) {
      z = -D;
      s = 0.45;
    } else {
      z = (rnd() * 2 - 1) * D;
      // Fianchi più scuri verso il retro.
      s = 0.15 + 0.35 * ((z / D) * 0.5 + 0.5);
    }
    out[i * 4] = x * S;
    out[i * 4 + 1] = y * S;
    out[i * 4 + 2] = z;
    out[i * 4 + 3] = s;
    i++;
  }
  // Orbita inclinata: un anello sottile e un alone più rado.
  const ci = Math.cos(0.42);
  const si = Math.sin(0.42);
  let j = 0;
  for (; i < n; i++) {
    j++;
    const sottile = j % 3 === 0;
    const a = (sottile ? fraz(j * AUREO) : rnd()) * TAU;
    const r = sottile ? 1.36 : 1.46 + (rnd() - 0.5) * 0.14;
    const x = Math.cos(a) * r;
    const z0 = Math.sin(a) * r;
    out[i * 4] = x;
    out[i * 4 + 1] = z0 * si;
    out[i * 4 + 2] = z0 * ci;
    out[i * 4 + 3] = sottile ? 0.55 : 0.9;
  }
  return mescola(out, n, seed ^ 0x51ed27);
}

const FIGURE = [giroide, pila, finestra, rete, istogramma, monogramma];

// Posa di ogni figura: imbardata, beccheggio, ampiezza dell'oscillazione, lato (+1 a destra).
const POSE = [
  { yaw: 0.35, pitch: 0.22, ampiezza: 0.85, lato: 1, scala: 1.0 },
  { yaw: 0.62, pitch: 0.5, ampiezza: 0.38, lato: -1, scala: 1.02 },
  { yaw: -0.42, pitch: 0.1, ampiezza: 0.3, lato: 1, scala: 0.98 },
  { yaw: 0.0, pitch: 0.2, ampiezza: 0.95, lato: -1, scala: 0.96 },
  { yaw: 0.7, pitch: 0.48, ampiezza: 0.34, lato: 1, scala: 1.0 },
  { yaw: 0.0, pitch: 0.12, ampiezza: 0.4, lato: -1, scala: 0.84 },
];

// ——— shader ————————————————————————————————————————————————————————————

const VERT = `#version 300 es
precision highp float;
in vec4 a0; in vec4 a1; in vec4 a2; in vec4 a3; in vec4 a4; in vec4 a5;
in vec4 aRnd;
uniform mat4 uMVP;
uniform float uS;
uniform float uTime;
uniform float uPx;
uniform float uDist;
uniform float uAspect;
uniform vec3 uMouse;   // xy in coordinate normalizzate, z = intensità
out float vInk;
out float vAccent;

vec4 figura(int i) {
  if (i <= 0) return a0;
  if (i == 1) return a1;
  if (i == 2) return a2;
  if (i == 3) return a3;
  if (i == 4) return a4;
  return a5;
}

void main() {
  float s = clamp(uS, 0.0, 4.9999);
  int i = int(floor(s));
  float f = fract(s);
  // Ogni punto parte con un ritardo suo: la figura si disfa a ondate.
  float d = aRnd.x * 0.36;
  float t = smoothstep(d * 0.6, 0.64 + d, f);
  vec4 A = figura(i);
  vec4 B = figura(i + 1);
  vec3 p = mix(A.xyz, B.xyz, t);

  float meta = sin(t * 3.14159265);
  // A metà strada i punti ruotano attorno all'asse e si allargano.
  float ang = meta * (aRnd.y - 0.5) * 3.2;
  float c = cos(ang), sn = sin(ang);
  p = vec3(c * p.x + sn * p.z, p.y, -sn * p.x + c * p.z);
  vec3 deriva = vec3(
    sin(aRnd.z * 41.0 + uTime * 0.7),
    cos(aRnd.w * 37.0 + uTime * 0.6),
    sin(aRnd.x * 53.0 - uTime * 0.5));
  p += deriva * meta * 0.42 * (0.4 + aRnd.y);
  // Respiro appena percettibile a figura ferma.
  p += 0.0045 * vec3(sin(uTime * 1.3 + aRnd.y * 60.0), cos(uTime * 1.1 + aRnd.z * 60.0), sin(uTime * 0.9 + aRnd.w * 60.0));

  float ombra = mix(A.w, B.w, t);
  vec4 cp = uMVP * vec4(p, 1.0);

  // Il puntatore sposta i punti vicini, in spazio schermo.
  vec2 ndc = cp.xy / cp.w;
  vec2 dm = (ndc - uMouse.xy) * vec2(uAspect, 1.0);
  float dd = dot(dm, dm);
  float spinta = uMouse.z * exp(-dd * 26.0) * 0.11;
  ndc += normalize(dm + vec2(1e-5)) / vec2(uAspect, 1.0) * spinta;
  cp.xy = ndc * cp.w;
  gl_Position = cp;

  vAccent = step(0.945, aRnd.w);
  float grandezza = (0.6 + 1.3 * (1.0 - ombra)) * (1.0 - 0.4 * meta);
  grandezza *= 0.8 + 0.4 * aRnd.z;
  grandezza *= mix(1.0, 1.55 + 0.25 * sin(uTime * 2.0 + aRnd.x * 30.0), vAccent);
  gl_PointSize = max(1.0, uPx * grandezza * uDist / cp.w);

  // Nebbia: i punti lontani scoloriscono verso la carta.
  float nebbia = smoothstep(uDist - 1.25, uDist + 1.55, cp.w);
  vInk = (1.0 - 0.82 * nebbia) * (0.5 + 0.5 * (1.0 - ombra * 0.75)) * (1.0 - 0.5 * meta);
}`;

const FRAG = `#version 300 es
precision mediump float;
in float vInk;
in float vAccent;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uAlpha;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  float a = 1.0 - smoothstep(0.36, 0.5, r);
  if (a < 0.02) discard;
  vec3 col = mix(uInk, uAccent, vAccent);
  a *= vInk * uAlpha * mix(1.0, 1.25, vAccent);
  // Miscela a moltiplicazione: l'inchiostro si somma come sulla carta.
  o = vec4(mix(vec3(1.0), col, clamp(a, 0.0, 1.0)), 1.0);
}`;

// ——— matrici (colonna-maggiore) ————————————————————————————————————————

function prospettiva(fovy, aspect, vicino, lontano) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (vicino - lontano);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (lontano + vicino) * nf, -1, 0, 0, 2 * lontano * vicino * nf, 0]);
}

function moltiplica(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}

/** Modello: scala, rotazione Y poi X, traslazione. */
function modello(yaw, pitch, scala, tx, ty, tz) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  // R = Rx(pitch) * Ry(yaw)
  return new Float32Array([
    cy * scala, sx * sy * scala, -cx * sy * scala, 0,
    0, cx * scala, sx * scala, 0,
    sy * scala, -sx * cy * scala, cx * cy * scala, 0,
    tx, ty, tz, 1,
  ]);
}

const mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function coloreHex(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/**
 * Crea la scena sul canvas dato. Restituisce null se WebGL2 non è disponibile.
 * @param {HTMLCanvasElement} canvas
 * @param {{ punti?: number, carta: string, inchiostro: string, accento: string, fermo?: boolean }} opzioni
 */
export function creaScena(canvas, opzioni) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const N = opzioni.punti || 30000;
  const carta = coloreHex(opzioni.carta);

  const compila = (tipo, src) => {
    const sh = gl.createShader(tipo);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    return sh;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  } catch (err) {
    console.warn('Scena 3D non disponibile:', err);
    return null;
  }
  gl.useProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attributo = (nome, dati) => {
    const loc = gl.getAttribLocation(prog, nome);
    if (loc < 0) return;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, dati, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
  };
  FIGURE.forEach((fig, k) => attributo(`a${k}`, fig(N, 1009 + k * 7919)));
  const rnd = mulberry32(424242);
  const casuali = new Float32Array(N * 4);
  for (let k = 0; k < casuali.length; k++) casuali[k] = rnd();
  attributo('aRnd', casuali);

  const U = {};
  for (const nome of ['uMVP', 'uS', 'uTime', 'uPx', 'uDist', 'uAspect', 'uMouse', 'uInk', 'uAccent', 'uAlpha']) U[nome] = gl.getUniformLocation(prog, nome);
  gl.uniform3fv(U.uInk, coloreHex(opzioni.inchiostro));
  gl.uniform3fv(U.uAccent, coloreHex(opzioni.accento));

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.DST_COLOR, gl.ZERO);
  gl.clearColor(carta[0], carta[1], carta[2], 1);

  const DIST = 6;
  const FOV = (35 * Math.PI) / 180;
  const stato = {
    sBersaglio: 0,
    s: 0,
    mouse: [0, 0],
    mouseB: [0, 0],
    forza: 0,
    forzaB: 0,
    tempo: 0,
    ultimo: 0,
    attivo: false,
    larghezza: 1,
    altezza: 1,
    sporco: true,
  };

  function ridimensiona() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    stato.larghezza = w;
    stato.altezza = h;
    gl.viewport(0, 0, w, h);
    stato.sporco = true;
  }

  function disegna(adesso) {
    const dt = Math.min(0.05, (adesso - stato.ultimo) / 1000 || 0.016);
    stato.ultimo = adesso;
    if (!opzioni.fermo) stato.tempo += dt;

    const k = 1 - Math.exp(-dt * 5.5);
    stato.s += (stato.sBersaglio - stato.s) * (opzioni.fermo ? 1 : k);
    stato.mouse[0] += (stato.mouseB[0] - stato.mouse[0]) * k * 1.4;
    stato.mouse[1] += (stato.mouseB[1] - stato.mouse[1]) * k * 1.4;
    stato.forza += (stato.forzaB - stato.forza) * k;

    const aspect = stato.larghezza / stato.altezza;
    const mezzaH = Math.tan(FOV / 2) * DIST;
    const mezzaL = mezzaH * aspect;
    const stretto = aspect < 0.95;

    const s = Math.min(4.9999, Math.max(0, stato.s));
    const i = Math.floor(s);
    const t = sstep(0.12, 0.88, s - i);
    const A = POSE[i];
    const B = POSE[i + 1];

    const T = stato.tempo;
    const yaw = mix(A.yaw, B.yaw, t) + mix(A.ampiezza, B.ampiezza, t) * Math.sin(T * 0.33) + stato.mouse[0] * 0.28;
    const pitch = mix(A.pitch, B.pitch, t) + 0.05 * Math.sin(T * 0.47) - stato.mouse[1] * 0.16;
    let scala = mix(A.scala, B.scala, t);
    let tx;
    let ty;
    if (stretto) {
      // Telefono: figura in alto al centro, testo sotto.
      scala *= Math.min(0.78, (mezzaL * 0.86) / 1.25);
      tx = 0;
      ty = mezzaH * 0.47;
    } else {
      scala *= Math.min(1.08, Math.max(0.5, (mezzaL * 0.37) / 1.22));
      tx = mix(A.lato, B.lato, t) * mezzaL * 0.5;
      ty = 0.02 * mezzaH;
    }

    const P = prospettiva(FOV, aspect, 0.1, 40);
    const M = modello(yaw, pitch, scala, tx, ty, -DIST);
    gl.uniformMatrix4fv(U.uMVP, false, moltiplica(P, M));
    gl.uniform1f(U.uS, s);
    gl.uniform1f(U.uTime, T);
    gl.uniform1f(U.uDist, DIST);
    gl.uniform1f(U.uAspect, aspect);
    // La grandezza dei punti segue la figura sullo schermo, non la finestra.
    const pxPerUnita = stato.altezza / (2 * mezzaH);
    gl.uniform1f(U.uPx, Math.max(1.4, pxPerUnita * scala * 0.0108));
    gl.uniform1f(U.uAlpha, stretto ? 0.62 : 0.8);
    gl.uniform3f(U.uMouse, stato.mouse[0], stato.mouse[1], stato.forza);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  let richiesta = 0;
  function ciclo(adesso) {
    richiesta = 0;
    if (!stato.attivo) return;
    const fermo = opzioni.fermo && !stato.sporco;
    if (!fermo) {
      disegna(adesso);
      stato.sporco = false;
    }
    richiesta = requestAnimationFrame(ciclo);
  }

  ridimensiona();

  return {
    punti: N,
    ridimensiona,
    /** s: 0..5, indice continuo della figura. */
    scorri(s) {
      stato.sBersaglio = s;
      stato.sporco = true;
    },
    /** x, y in coordinate normalizzate (-1..1, y verso l'alto). */
    puntatore(x, y, presente) {
      stato.mouseB[0] = x;
      stato.mouseB[1] = y;
      stato.forzaB = presente ? 1 : 0;
    },
    avvia() {
      if (stato.attivo) return;
      stato.attivo = true;
      stato.ultimo = performance.now();
      stato.sporco = true;
      richiesta = requestAnimationFrame(ciclo);
    },
    ferma() {
      stato.attivo = false;
      if (richiesta) cancelAnimationFrame(richiesta);
      richiesta = 0;
    },
    /** Disegna un fotogramma subito (serve ai collaudi). */
    fotogramma(s, tempo = 0) {
      stato.s = s;
      stato.sBersaglio = s;
      stato.tempo = tempo;
      disegna(performance.now());
    },
  };
}
