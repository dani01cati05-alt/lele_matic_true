const wheel = document.getElementById('wheel');
const items = document.querySelectorAll('.wheel-item');
const centerDisplay = document.getElementById('center-display');
const activeBgImage = document.getElementById('active-bg-image');
const activeBgModel = document.getElementById('active-bg-model');
const dynamicTitle = document.getElementById('dynamic-title');
const toggleBtn = document.getElementById('toggle-colors');
const datetimeHeader = document.getElementById('datetime-header');
const infoBtn = document.getElementById('toggle-info');
const infoOverlay = document.getElementById('info-overlay');

// === RAGGIO DINAMICO DELLA RUOTA ===
let radius = window.innerWidth < 768 ? 200 : 380;

function arrangeItems() {
    items.forEach((item, index) => {
        const angle = (360 / items.length) * index;
        item.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
}

arrangeItems();

window.addEventListener('resize', () => {
    const newRadius = window.innerWidth < 768 ? 200 : 380;
    if (newRadius !== radius) {
        radius = newRadius;
        arrangeItems();
    }
});

// === VARIABILI DI ROTAZIONE ===
let currentRotation = 0;
let targetRotation = 0;

// === INCLINAZIONE MOUSE (PARALLASSE) ===
let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
const tiltIntensity = 5;

window.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    targetMouseX = mouseX * tiltIntensity;
    targetMouseY = mouseY * tiltIntensity;
});

// === SCROLL E DRAG (CON SNAPPING) ===
let isInteracting = false;
let isMouseDown = false;
let isDragging = false;
let startX = 0;
let startRotation = 0;
let scrollTimeout;
const dragThreshold = 5;

// Scroll mouse (resta attivo anche con l'overlay info aperto: l'overlay
// blend non ha contenuto scrollabile proprio, quindi non c'è conflitto)
window.addEventListener('wheel', (e) => {
    isInteracting = true;
    targetRotation -= e.deltaY * 0.08;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isInteracting = false;
    }, 150);
});

// Inizio drag
function handleStart(clientX) {
    isMouseDown = true;
    isInteracting = true;
    startX = clientX;
    startRotation = targetRotation;
    isDragging = false;
}

// Spostamento drag
function handleMove(clientX) {
    if (!isMouseDown) return;
    const deltaX = clientX - startX;
    if (Math.abs(deltaX) > dragThreshold) {
        isDragging = true;
    }
    targetRotation = startRotation + deltaX * 0.25;
}

// Fine drag
function handleEnd() {
    if (!isMouseDown) return;
    isMouseDown = false;
    setTimeout(() => {
        isInteracting = false;
    }, 50);
}

// Eventi mouse
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.toggle-btn') || e.target.closest('.info-btn') || e.target.closest('.info-overlay') || e.target.closest('.comments-btn')) return;
    handleStart(e.clientX);
});
window.addEventListener('mousemove', (e) => { handleMove(e.clientX); });
window.addEventListener('mouseup', handleEnd);

// Eventi touch
window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.toggle-btn') || e.target.closest('.info-btn') || e.target.closest('.info-overlay') || e.target.closest('.comments-btn')) return;
    handleStart(e.touches[0].clientX);
}, { passive: true });
window.addEventListener('touchmove', (e) => {
    handleMove(e.touches[0].clientX);
}, { passive: true });
window.addEventListener('touchend', handleEnd);

// Previene click se si sta trascinando
document.querySelectorAll('.wheel-content').forEach(link => {
    link.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
});

// === LOOP DI ANIMAZIONE PRINCIPALE ===
function animate() {
    currentRotation += (targetRotation - currentRotation) * 0.08;
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;

    wheel.style.transform = `rotateX(${-5 - currentMouseY}deg) rotateY(${currentRotation + currentMouseX}deg)`;

    if (centerDisplay) {
        centerDisplay.style.transform = `translate3d(-50%, -50%, 0px) rotateY(${-(currentRotation + currentMouseX)}deg) rotateX(${5 + currentMouseY}deg)`;
    }

    let normalizedRotation = currentRotation % 360;
    if (normalizedRotation < 0) normalizedRotation += 360;
    let targetAngle = (360 - normalizedRotation) % 360;

    let closestIndex = 0;
    let minDiff = Infinity;

    items.forEach((item, index) => {
        const itemAngle = (360 / items.length) * index;
        let diff = Math.abs(itemAngle - targetAngle);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
        }
    });

    items.forEach((item, index) => {
        const itemAngle = (360 / items.length) * index;
        let diff = Math.abs(itemAngle - targetAngle);
        if (diff > 180) diff = 360 - diff;

        const opacity = index === closestIndex ? 1.0 : 0.35;

        if (index === closestIndex) {
            if (!item.classList.contains('active')) {
                item.classList.add('active');

                const imgElement = item.querySelector('.wheel-content img');
                const modelElement = item.querySelector('.wheel-content model-viewer');
                const itemTitleText = item.querySelector('h3').textContent;

                if (dynamicTitle.textContent !== itemTitleText) {
                    dynamicTitle.style.opacity = 0;
                    setTimeout(() => {
                        dynamicTitle.textContent = itemTitleText;
                        dynamicTitle.style.opacity = 1;
                    }, 150);
                }

                if (imgElement) {
                    if (activeBgImage.src !== imgElement.src || activeBgImage.style.display === 'none') {
                        activeBgImage.style.opacity = 0;
                        activeBgModel.style.opacity = 0;
                        setTimeout(() => {
                            activeBgModel.style.display = 'none';
                            activeBgImage.style.display = 'block';
                            activeBgImage.src = imgElement.src;
                            activeBgImage.style.opacity = 1;
                        }, 150);
                    }
                } else if (modelElement) {
                    if (activeBgModel.src !== modelElement.src || activeBgModel.style.display === 'none') {
                        activeBgImage.style.opacity = 0;
                        activeBgModel.style.opacity = 0;
                        setTimeout(() => {
                            activeBgImage.style.display = 'none';
                            activeBgModel.style.display = 'block';
                            activeBgModel.src = modelElement.src;
                            activeBgModel.style.opacity = 1;
                        }, 150);
                    }
                }
            }
        } else {
            item.classList.remove('active');
        }

        item.style.opacity = opacity;
    });

    requestAnimationFrame(animate);
}

animate();

// === INVERSIONE COLORI (DARK/LIGHT MODE) ===
// .light-mode applica un filter:invert(1) a tutto l'html (vedi style.css):
// inverte davvero ogni cosa in un colpo solo, niente da ricalcolare qui.
// Va su document.documentElement (<html>) e non su body: solo l'elemento
// radice è esente dal creare un containing block per i "position: fixed",
// altrimenti bottoni e barre fisse si muoverebbero con lo scroll.

function toggleColors() {
    document.documentElement.classList.toggle('light-mode');
}

if (toggleBtn) toggleBtn.addEventListener('click', toggleColors);

// === DATA E ORA ===


function updateDateTime() {
    if (!datetimeHeader) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-US');
    datetimeHeader.textContent = `${dateStr} | ${timeStr}`;
}

if (datetimeHeader) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// === GESTIONE OVERLAY INFO (effetto blend) ===

let isInfoOpen = false;

function setInfoOpen(open) {
    isInfoOpen = open;
    infoBtn.classList.toggle('active', open);
    infoOverlay.classList.toggle('active', open);
    infoOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
}

if (infoBtn && infoOverlay) {
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setInfoOpen(!isInfoOpen);
    });

    infoOverlay.addEventListener('click', () => setInfoOpen(false));

    window.addEventListener('keydown', (e) => {
        if (isInfoOpen && e.key === 'Escape') setInfoOpen(false);
    });
}
