const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d', { alpha: true });

const SAFE = { x: 80, y: 0, w: 640, h: window.innerHeight, r: 18 };
const CRT = {
  scanlinesAlpha: 0.01,
  spacing: 5,
  thickness: 4,
  vignetteAlpha: 0.25,
  shimmerStrength: 0.22,
  // contrôle spatial du shimmer :
  // shimmerWavelength = largeur (en px) d'un cycle sombre+clair (augmenter => zones plus larges)
  shimmerWavelength: 250,
  // vitesse de phase (déjà utilisé t*... avant), modifier pour accélérer/ralentir la descente
  shimmerSpeed: 5,
  // nouveau : duty cycle 0..1 (fraction sombre du cycle)
  shimmerDuty: 1,        // 0.5 => 50% sombre / 50% clair ; 0.8 => 80% sombre
  // douceur en px, séparée pour chaque front (start = 0->1, end = 1->0)
  shimmerSoftnessStart: 20, // douceur du front clair -> sombre (en px)
  shimmerSoftnessEnd:   0, // douceur du front sombre -> clair (en px)
  scrollSpeed: -0.01,
  scrollAmplitude: 1.5,
  fpsCap: 45
};

function fit() {
  const dpr = window.devicePixelRatio || 1;
  // taille “physique” du canvas = px * DPR
  canvas.width  = Math.floor(window.innerWidth  * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  // repasse en coordonnées CSS (1 unité = 1 px logique)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', fit); fit();


function roundRectPath(x, y, w, h, r) {
  const rr = Math.max(0, r || 0);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}

let t = 0, last = 0;
const frameInterval = 1000 / CRT.fpsCap;

function draw(now = 0) {
  requestAnimationFrame(draw);
  if (now - last < frameInterval) return;
  last = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { x, y, w, h, r } = SAFE;
  ctx.save(); roundRectPath(x, y, w, h, r); ctx.clip();

  // scanlines animées + shimmer
  t += CRT.scrollSpeed;
  const offset = Math.sin(t) * CRT.scrollAmplitude;
  ctx.globalCompositeOperation = 'multiply';
  const step = Math.max(1, CRT.spacing | 0);

  for (let yy = y + offset; yy < y + h; yy += CRT.spacing) {
    // position normalisée dans un cycle [0..1)
    const phase = (yy / CRT.shimmerWavelength) * Math.PI * 2;
    const cyclePos = (((phase + t * CRT.shimmerSpeed) / (Math.PI * 2)) % 1 + 1) % 1;

    // duty cycle + douceur (convertir douceur px -> fraction de période)
    const duty = Math.max(0, Math.min(1, CRT.shimmerDuty));
    const softFracStart = Math.max(0, Math.min(0.5, CRT.shimmerSoftnessStart / CRT.shimmerWavelength));
    const softFracEnd   = Math.max(0, Math.min(0.5, CRT.shimmerSoftnessEnd   / CRT.shimmerWavelength));

    // smoothstep helper
    const smoothstep = (a, b, x) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    // waveform: +1 in "sombre" region, -1 in "clair", blend on both edges with wrap
    let wave;
    // fast path : pas de douceur
    if (softFracStart <= 0 && softFracEnd <= 0) {
      wave = cyclePos < duty ? 1 : -1;
    } else {
      // position relative au début de la zone sombre (on considère la zone sombre [0, duty) )
      const rel = cyclePos; // déjà dans [0,1)

      // cas où les deux softenings se chevauchent la zone sombre => on fait une seule montée jusqu'au pic
      if (softFracStart + softFracEnd >= duty) {
        if (rel < duty) {
          const u = rel / Math.max(1e-6, duty);
          const s = smoothstep(0, 1, u);
          wave = -1 + 2 * s; // -1 -> 1 sur toute la portion sombre
        } else {
          wave = -1;
        }
      } else {
        const riseEnd = softFracStart;               // fin transition claire->sombre (0->1)
        const fallStart = Math.max(0, duty - softFracEnd); // début transition sombre->claire (1->0)

        if (rel < riseEnd) {
          // transition claire -> sombre
          const u = rel / Math.max(1e-6, riseEnd);
          const s = smoothstep(0, 1, u);
          wave = -1 + 2 * s; // -1 -> 1
        } else if (rel < fallStart) {
          // coeur sombre
          wave = 1;
        } else if (rel < duty) {
          // transition sombre -> claire
          const u = (rel - fallStart) / Math.max(1e-6, softFracEnd);
          const s = smoothstep(0, 1, u);
          wave = 1 - 2 * s; // 1 -> -1
        } else {
          // totalement claire
          wave = -1;
        }
      }
    }

    const flicker = CRT.shimmerStrength * wave;
    const alphaMid = Math.max(0, CRT.scanlinesAlpha + flicker);   // cœur de la ligne
    const alphaEdge = alphaMid * 0.3;                            // bords adoucis

    const grad = ctx.createLinearGradient(0, yy, 0, yy + CRT.thickness);
    grad.addColorStop(0.00, `rgba(0,0,0,${alphaEdge})`);
    grad.addColorStop(0.50, `rgba(0,0,0,${alphaMid})`);
    grad.addColorStop(1.00, `rgba(0,0,0,${alphaEdge})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, yy, w, CRT.thickness);
  }

  ctx.globalCompositeOperation = 'source-over';

  // vignette
  const g = ctx.createRadialGradient(
    x + w/2, y + h/2, Math.min(w,h)/3,
    x + w/2, y + h/2, Math.max(w,h)/1.05
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${CRT.vignetteAlpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.restore();
}
requestAnimationFrame(draw);