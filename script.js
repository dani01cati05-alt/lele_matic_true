const wheel = document.getElementById('wheel');
const items = document.querySelectorAll('.wheel-item');
const centerDisplay = document.getElementById('center-display');
const activeBgImage = document.getElementById('active-bg-image');
const activeBgModel = document.getElementById('active-bg-model');
const dynamicTitle = document.getElementById('dynamic-title');

// === CALCOLO DINAMICO DEL DIAMETRO DELLA RUOTA ===
let radius = window.innerWidth < 768 ? 200 : 380;

function arrangeItems() {
    items.forEach((item, index) => {
        const angle = (360 / items.length) * index;
        item.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
}

// 1. DISPOSIZIONE A CILINDRO INIZIALE
arrangeItems();

// Aggiorna il diametro al ridimensionamento della finestra
window.addEventListener('resize', () => {
    const newRadius = window.innerWidth < 768 ? 200 : 380;
    if (newRadius !== radius) {
        radius = newRadius;
        arrangeItems();
    }
});
// ==================================================

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

// Gestione Scroll Mouse
window.addEventListener('wheel', (e) => {
    if (isDropdownOpen) return;
    isInteracting = true;
    targetRotation -= e.deltaY * 0.08;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isInteracting = false;
    }, 150);
});

// Inizio Drag
function handleStart(clientX) {
    isMouseDown = true;
    isInteracting = true;
    startX = clientX;
    startRotation = targetRotation;
    isDragging = false;
}

// Spostamento Drag
function handleMove(clientX) {
    if (!isMouseDown) return;
    const deltaX = clientX - startX;
    if (Math.abs(deltaX) > dragThreshold) {
        isDragging = true;
    }
    targetRotation = startRotation + deltaX * 0.25; // Sensibilità drag
}

// Fine Drag
function handleEnd() {
    if (!isMouseDown) return;
    isMouseDown = false;
    setTimeout(() => {
        isInteracting = false;
    }, 50);
}

// Eventi Mouse
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.toggle-btn') || e.target.closest('.info-btn') || e.target.closest('.info-dropdown')) return;
    handleStart(e.clientX);
});
window.addEventListener('mousemove', (e) => {
    handleMove(e.clientX);
});
window.addEventListener('mouseup', handleEnd);

// Eventi Touch (Dispositivi Mobili)
window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.toggle-btn') || e.target.closest('.info-btn') || e.target.closest('.info-dropdown')) return;
    handleStart(e.touches[0].clientX);
});
window.addEventListener('touchmove', (e) => {
    handleMove(e.touches[0].clientX);
});
window.addEventListener('touchend', handleEnd);

// Previene il click sui link se si sta trascinando la ruota
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
    // Inerzia della ruota
    currentRotation += (targetRotation - currentRotation) * 0.08;

    // Inerzia fluida del movimento del mouse
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;

    // Rotazione del cilindro + inclinazione mouse
    wheel.style.transform = `rotateX(${-5 - currentMouseY}deg) rotateY(${currentRotation + currentMouseX}deg)`;

    // Applica rotazione contraria al display centrale per tenerlo allineato alla camera (statico)
    if (centerDisplay) {
        centerDisplay.style.transform = `translate3d(-50%, -50%, 0px) rotateY(${- (currentRotation + currentMouseX)}deg) rotateX(${5 + currentMouseY}deg)`;
    }

    let normalizedRotation = currentRotation % 360;
    if (normalizedRotation < 0) normalizedRotation += 360;
    let targetAngle = (360 - normalizedRotation) % 360;

    let closestIndex = 0;
    let minDiff = Infinity;

    // Calcolo elemento centrale
    items.forEach((item, index) => {
        const itemAngle = (360 / items.length) * index;
        let diff = Math.abs(itemAngle - targetAngle);
        if (diff > 180) diff = 360 - diff;

        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
        }
    });

    // Gestione opacità e visibilità sulla ruota + aggiornamento display centrale
    items.forEach((item, index) => {
        const itemAngle = (360 / items.length) * index;
        let diff = Math.abs(itemAngle - targetAngle);
        if (diff > 180) diff = 360 - diff;

        let opacity = 0.35; // Default per inattivi
        let isVisible = true;

        if (index === closestIndex) {
            opacity = 1.0; // Attivo sulla ruota
            isVisible = true;

            if (!item.classList.contains('active')) {
                item.classList.add('active');

                const imgElement = item.querySelector('.wheel-content img');
                const modelElement = item.querySelector('.wheel-content model-viewer');
                const itemTitleText = item.querySelector('h3').textContent;

                // Aggiorna il titolo in basso
                if (dynamicTitle.textContent !== itemTitleText) {
                    dynamicTitle.style.opacity = 0;
                    setTimeout(() => {
                        dynamicTitle.textContent = itemTitleText;
                        dynamicTitle.style.opacity = 1;
                    }, 150);
                }

                // Aggiorna lo sfondo centrale (modello o immagine)
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
        item.style.visibility = isVisible ? 'visible' : 'hidden';
    });

    requestAnimationFrame(animate);
}

animate();

// === INVERSIONE COLORI (DARK/LIGHT MODE) ===
const toggleBtn = document.getElementById('toggle-colors');
const dropdownToggleBtn = document.getElementById('dropdown-toggle-colors');

function toggleColors() {
    document.body.classList.toggle('light-mode');
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleColors);
}
if (dropdownToggleBtn) {
    dropdownToggleBtn.addEventListener('click', toggleColors);
}

// Salvaguardia per bottone indietro (se presente su altre pagine)
const backBtn = document.getElementById('back-btn');
if (backBtn) {
    backBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
    });
}

// === GESTIONE DATA E ORA SUL SOFFITTO ===
const datetimeHeader = document.getElementById('datetime-header');
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-US');
    datetimeHeader.textContent = `${dateStr} | ${timeStr}`;
}
if (datetimeHeader) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// === GESTIONE DROPDOWN INFO & ANIMAZIONE DISTORSIONE CENTRO-SCHERMO ===
const infoBtn = document.getElementById('toggle-info');
const infoDropdown = document.getElementById('info-dropdown');

let isDropdownOpen = false;

if (infoBtn && infoDropdown) {
    infoBtn.addEventListener('click', () => {
        isDropdownOpen = !isDropdownOpen;
        infoBtn.classList.toggle('active');
        infoDropdown.classList.toggle('active');
        
        if (isDropdownOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            infoDropdown.scrollTop = 0;
            // Ripristina lo stato iniziale dei testi
            const stretchTexts = document.querySelectorAll('.stretch-text');
            stretchTexts.forEach(el => {
                el.style.transform = 'scaleY(1)';
            });
        }
    });
}

function animateTextDistortion() {
    if (isDropdownOpen) {
        const centerY = window.innerHeight / 2;
        const stretchTexts = document.querySelectorAll('.stretch-text');
        const maxDistance = 220;

        stretchTexts.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elCenter = rect.top + rect.height / 2;
            const dist = Math.abs(elCenter - centerY);

            if (dist < maxDistance) {
                const ratio = dist / maxDistance;
                const factor = 0.5 + 0.5 * Math.cos(ratio * Math.PI);
                const scaleY = 1 + factor * 1.3;
                el.style.transform = `scaleY(${scaleY})`;
            } else {
                el.style.transform = 'scaleY(1)';
            }
        });
    }
    requestAnimationFrame(animateTextDistortion);
}

// Avvia il loop di distorsione
animateTextDistortion();
