const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d', { alpha: true });

const SAFE = { x: 80, y: 0, w: 640, h: window.innerHeight, r: 18 };
const CRT = {
  scanlinesAlpha: 0.01,
  spacing: 3,
  thickness: 2,
  vignetteAlpha: 0.25,
  shimmerStrength: 0.22,
  // contrôle spatial du shimmer :
  // shimmerWavelength = largeur (en px) d'un cycle sombre+clair (augmenter => zones plus larges)
  shimmerWavelength: 250,
  // vitesse de phase (déjà utilisé t*... avant), modifier pour accélérer/ralentir la descente
  shimmerSpeed: 0.1,
  // nouveau : duty cycle 0..1 (fraction sombre du cycle)
  shimmerDuty: 1,        // 0.5 => 50% sombre / 50% clair ; 0.8 => 80% sombre
  // douceur en px, séparée pour chaque front (start = 0->1, end = 1->0)
  shimmerSoftnessStart: 20, // douceur du front clair -> sombre (en px)
  shimmerSoftnessEnd:   0, // douceur du front sombre -> clair (en px)
  scrollSpeed: -0.06,
  scrollAmplitude: 0.5,
  fpsCap: 45
};

// --- setup (remplace ton tile 1px x spacing) ---
let tileH, tile, tctx;
function rebuildTile(){
  tileH = Math.max(1, Math.max(CRT.spacing|0, CRT.shimmerWavelength|0));
  tile = tile || document.createElement('canvas');
  tile.width = 1; tile.height = tileH;
  tctx = tile.getContext('2d');
}
rebuildTile();

// dessine une colonne de hauteur tileH avec les lignes + la bande sombre
function redrawTile(phase) {
  tctx.clearRect(0,0,1,tileH);
  const thickness = Math.min(CRT.thickness|0, CRT.spacing|0);
  tctx.clearRect(0,0,1,tileH);
  for (let y=0; y<tileH; y+=CRT.spacing) {
    const rel = (((y + phase) % tileH) + tileH) % tileH / tileH;
    const duty = Math.max(0, Math.min(1, CRT.shimmerDuty));
    const softStart = CRT.shimmerSoftnessStart / tileH;
    const softEnd   = CRT.shimmerSoftnessEnd   / tileH;
    const smooth = (a,b,x)=>{ const u=Math.max(0,Math.min(1,(x-a)/(b-a))); return u*u*(3-2*u); };

    let dark = 0.0;
    if (softStart<=0 && softEnd<=0) dark = rel < duty ? 1 : 0;
    else {
      const riseEnd  = softStart;
      const fallStart= Math.max(0, duty - softEnd);
      if (rel < riseEnd)        dark = smooth(0,riseEnd,rel);
      else if (rel < fallStart) dark = 1.0;
      else if (rel < duty)      dark = 1.0 - smooth(fallStart,duty,rel);
      else                      dark = 0.0;
    }

    const alphaMid  = Math.max(0, CRT.scanlinesAlpha + CRT.shimmerStrength*(dark*2-1));
    const alphaEdge = alphaMid*0.3;

    const g = tctx.createLinearGradient(0,y,0,y+thickness);
    g.addColorStop(0,   `rgba(0,0,0,${alphaEdge})`);
    g.addColorStop(0.5, `rgba(0,0,0,${alphaMid})`);
    g.addColorStop(1,   `rgba(0,0,0,${alphaEdge})`);
    tctx.fillStyle = g;
    tctx.fillRect(0,y,1,thickness);
  }
}
let pattern = ctx.createPattern(tile,'repeat');


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

function draw(now=0) {
  const dt = (now - last) / 1000;
  if (dt < 1/CRT.fpsCap) {
    requestAnimationFrame(draw);
    return;
  }
  last = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { x, y, w, h, r } = SAFE;
  ctx.save(); roundRectPath(x, y, w, h, r); ctx.clip();

  // update animation time
  t += CRT.scrollSpeed * dt * 60;
  const offset = Math.sin(t) * CRT.scrollAmplitude;

  // -- draw vignette / background first if needed --
  // (scanlines come from pattern below)

  // redraw tile pattern according to phase (animate shimmer)
  // phase in px : avance proportionnellement à t
  const phasePx = ((t * CRT.shimmerSpeed) * CRT.shimmerWavelength) % tileH;
  redrawTile(phasePx < 0 ? phasePx + tileH : phasePx);
  pattern = ctx.createPattern(tile, 'repeat');

  ctx.globalCompositeOperation = 'multiply';
  ctx.save();
  ctx.translate(0, (Math.sin(t) * CRT.scrollAmplitude) % CRT.spacing);
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
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

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);