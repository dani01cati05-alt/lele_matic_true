/* =========================================================================
   MAGLIETTA E DESIGN
   Per aggiungere altri design in futuro, basta aggiungere una riga qui sotto:
   { name: "Nome design", image: "tee_web/nomefile.png" }
   (il file va messo nella cartella tee_web/)
   ========================================================================= */
const DESIGNS = [
  { name: "Orso",              image: "tee_web/tee_bear.png" },
  { name: "Teschio",           image: "tee_web/tee_skull.png" },
  { name: "Swans",             image: "tee_web/tee_swans.png" },
  { name: "Tartaruga",         image: "tee_web/tee_turtle.png" },
  { name: "Dawg",              image: "tee_web/tee_dawg.png" },
  { name: "Muscle",            image: "tee_web/tee_muscle.png" },
  { name: "Maschera",          image: "tee_web/tee_mask.png" },
  { name: "Snitch",            image: "tee_web/tee_snitch.png" },
  { name: "EU",                image: "tee_web/tee_EU.png" },
  { name: "AK",                image: "tee_web/tee_AK.png" },
  { name: "Gun Free",          image: "tee_web/tee_gun_free.png" },
  { name: "Motion",            image: "tee_web/tee_motion.png" },
  { name: "Hate",              image: "tee_web/tee_hate.png" },
  { name: "Maschera Bianca",   image: "tee_web/tee_maskW.png" },
  { name: "Unicorn",           image: "tee_web/unicorn_tee.png" },
  { name: "Flame",             image: "tee_web/flame_matic_nobg.png" },
  { name: "Jaws",              image: "tee_web/jaws_matic.png" },
  { name: "Matic Sex",         image: "tee_web/matic_sex_nobg.png" },
  { name: "Twin Tower",        image: "tee_web/twin_tower.png" },
];

/* =========================================================================
   MECCANISMO A SCATTI (come le lancette di un orologio)
   Solo 3 slot visibili: sinistra / centro (sopra la maglietta) / destra, con
   due posizioni extra oltre i bordi reali dello schermo per l'ingresso/uscita:
   quando un design esce a destra scompare oltre il bordo destro, e rientra
   da oltre il bordo sinistro. Ogni scroll fa avanzare o retrocedere di UNA
   sola posizione: il design si blocca sempre esattamente al centro, sopra
   la maglietta — nessuno scrubbing libero da gestire.
   ========================================================================= */
const N = DESIGNS.length;
// Il primo design mostrato al centro è "Motion" (invece del primo dell'elenco).
const START_DESIGN = "tee_web/tee_motion.png";
let currentIndex = Math.max(0, DESIGNS.findIndex(d => d.image === START_DESIGN));
let isAnimating = false;
const ANIM_MS = 750; // deve combaciare con la transition CSS di .slot-card

// offset orizzontale (px), scala e opacità per ciascuna posizione relativa al centro.
// le posizioni -2/2 vengono ricalcolate dinamicamente ben oltre il bordo reale
// dello schermo (vedi computeSlots) e sono trasparenti: il design sfuma prima
// di raggiungere quel punto, così non si vede mai "attraversare" lo schermo
// o ricomparire dall'altra parte. Anche le posizioni -1/1 vengono ricalcolate
// in base alla larghezza schermo, così su mobile i design laterali restano
// visibili invece di finire fuori dai bordi (o sovrapposti al centro).
const SLOTS = {
  "-2": { x: -1200, scale: 0.55, opacity: 0 },
  "-1": { x: -560,  scale: 0.78, opacity: 1 },
  "0":  { x: 0,      scale: 1.35, opacity: 1 },
  "1":  { x: 560,    scale: 0.78, opacity: 1 },
  "2":  { x: 1200,   scale: 0.55, opacity: 0 },
};

function computeSlots() {
  const isMobile = window.innerWidth <= 767;
  const half = window.innerWidth / 2;
  const side = isMobile ? Math.min(160, half * 0.62) : 560;
  SLOTS["-1"].x = -side;
  SLOTS["1"].x = side;
  // Su mobile si vede solo il design centrale, quello "sulla maglietta":
  // le anteprime laterali restano nel DOM (per lo swipe) ma invisibili.
  SLOTS["-1"].opacity = isMobile ? 0 : 1;
  SLOTS["1"].opacity = isMobile ? 0 : 1;
  const edge = half + (isMobile ? 200 : 420); // ben oltre il bordo visibile
  SLOTS["-2"].x = -edge;
  SLOTS["2"].x = edge;
}
computeSlots();

const slotsEl = document.getElementById("slots");

const cardEls = DESIGNS.map((d, i) => {
  const el = document.createElement("div");
  el.className = "slot-card";
  const img = document.createElement("img");
  img.src = d.image;
  img.alt = d.name;
  el.appendChild(img);
  slotsEl.appendChild(el);
  return el;
});

function wrap(i) { return ((i % N) + N) % N; }

function render() {
  DESIGNS.forEach((d, i) => {
    // distanza circolare più breve dall'indice corrente, tra -2 e +2
    let rel = i - currentIndex;
    rel = ((rel + N/2 + N) % N) - N/2;
    rel = Math.max(-2, Math.min(2, Math.round(rel)));

    const s = SLOTS[String(rel)];
    const el = cardEls[i];
    el.style.transform = `translate(-50%,-50%) translateX(${s.x}px) scale(${s.scale})`;
    el.style.opacity = s.opacity;
    el.style.zIndex = 10 - Math.abs(rel);
    el.classList.toggle("is-center", rel === 0);
  });
}
render();

function step(dir) {
  if (isAnimating) return;
  isAnimating = true;
  currentIndex = wrap(currentIndex + dir);
  render();
  setTimeout(() => { isAnimating = false; }, ANIM_MS);
}

/* ---------------- INTERAZIONE: solo lo scroll muove i design ---------------- */
let wheelAccum = 0;
const WHEEL_THRESHOLD = 45; // quanto scroll serve per far scattare una posizione

window.addEventListener("wheel", (e) => {
  if (window.isInfoOverlayOpen) return;
  e.preventDefault();
  if (isAnimating) return;
  wheelAccum += e.deltaY + e.deltaX;
  if (Math.abs(wheelAccum) > WHEEL_THRESHOLD) {
    step(wheelAccum > 0 ? 1 : -1);
    wheelAccum = 0;
  }
}, { passive:false });

// swipe touch (mobile): stesso meccanismo a scatti
// I tap sui bottoni fissi (inverti colori, info, indietro) e sull'overlay
// info non devono mai far scattare un cambio di design: la grafica al
// centro deve restare esattamente dov'è finché non si fa uno swipe vero.
function isOnChrome(target) {
  return target.closest('.toggle-btn') ||
         target.closest('.info-btn') ||
         target.closest('.back-link') ||
         target.closest('.info-stretch-overlay');
}

let touchStartX = null;
window.addEventListener("touchstart", (e) => {
  if (window.isInfoOverlayOpen || isOnChrome(e.target)) return;
  touchStartX = e.touches[0].clientX;
}, { passive:true });
window.addEventListener("touchend", (e) => {
  if (window.isInfoOverlayOpen || touchStartX === null || isOnChrome(e.target)) {
    touchStartX = null;
    return;
  }
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  touchStartX = null;
}, { passive:true });

window.addEventListener("resize", () => { computeSlots(); render(); });

/* piccola parallasse della maglietta al movimento del mouse, per un tocco vivo */
const shirtWrap = document.getElementById("shirtWrap");
window.addEventListener("pointermove", (e) => {
  if (window.isInfoOverlayOpen) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  shirtWrap.style.transform = `translate(${nx * 8}px, ${ny * 6}px) rotate(${nx * 1.2}deg)`;
});

document.getElementById("loading").style.opacity = "0";
setTimeout(() => document.getElementById("loading").style.display = "none", 400);

/* ---------------- INVERSIONE COLORI (dark/light) ---------------- */
const toggleColorsBtn = document.getElementById("toggle-colors");
if (toggleColorsBtn) {
  toggleColorsBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light-mode");
  });
}
