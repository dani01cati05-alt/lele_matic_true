document.addEventListener('DOMContentLoaded', () => {
    const infoBtn = document.getElementById('toggle-info');
    const infoOverlay = document.getElementById('info-overlay');
    const stretchScroll = document.getElementById('stretch-scroll');
    if (!infoBtn || !infoOverlay || !stretchScroll) return;

    // Esposta su window: le pagine secondarie la leggono per sospendere lo
    // scroll/drag della gallery mentre l'overlay info è aperto.
    window.isInfoOverlayOpen = false;

    let scrollTarget = 0;
    let scrollCurrent = 0;

    function setOverlayOpen(open) {
        window.isInfoOverlayOpen = open;
        infoBtn.classList.toggle('active', open);
        infoOverlay.classList.toggle('active', open);
        infoOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');

        if (open) {
            scrollTarget = 0;
            scrollCurrent = 0;
            stretchScroll.style.transform = 'translateY(0px)';
        }
    }

    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setOverlayOpen(!window.isInfoOverlayOpen);
    });

    infoOverlay.addEventListener('click', () => setOverlayOpen(false));

    window.addEventListener('keydown', (e) => {
        if (window.isInfoOverlayOpen && e.key === 'Escape') setOverlayOpen(false);
    });

    // Scroll virtuale del testo dentro l'overlay: niente scroll nativo del
    // browser (a scatti), ma un target inseguito con inerzia morbida.
    infoOverlay.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollTarget += e.deltaY;
    }, { passive: false });

    let touchStartY = 0;
    let touchStartScroll = 0;

    infoOverlay.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartScroll = scrollTarget;
    }, { passive: true });

    infoOverlay.addEventListener('touchmove', (e) => {
        const deltaY = touchStartY - e.touches[0].clientY;
        scrollTarget = touchStartScroll + deltaY * 1.5;
    }, { passive: true });

    // === EFFETTO TESTO ELASTICO ===
    const MAX_STRETCH = 2.8;
    const INFLUENCE_RATIO = 0.28;
    const FOCAL_RATIO = 0.5;
    const SCROLL_SMOOTHING = 0.08;
    const STRETCH_SMOOTHING = 0.06; // leggermente più lenta dello scroll, per un effetto morbido

    function smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    function splitIntoLines(el) {
        // Costruisce l'elenco di "parole": i nodi di testo vengono spezzati
        // per spazi, gli elementi (es. un link <a>) restano intatti come
        // parola singola, così il testo può contenere link cliccabili senza
        // che l'effetto li distrugga.
        const wordEls = [];
        Array.from(el.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => {
                    const span = document.createElement('span');
                    span.className = 'word';
                    span.textContent = w;
                    wordEls.push(span);
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                node.classList.add('word');
                wordEls.push(node);
            }
        });

        el.innerHTML = '';
        wordEls.forEach((w, i) => {
            el.appendChild(w);
            if (i < wordEls.length - 1) el.appendChild(document.createTextNode(' '));
        });

        const lines = [];
        let currentTop = null;
        let currentLine = [];

        wordEls.forEach(w => {
            const top = w.offsetTop;
            if (currentTop === null || Math.abs(top - currentTop) < 2) {
                currentLine.push(w);
                currentTop = top;
            } else {
                lines.push(currentLine);
                currentLine = [w];
                currentTop = top;
            }
        });
        if (currentLine.length) lines.push(currentLine);

        el.innerHTML = '';
        lines.forEach(lineWords => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'line';
            lineWords.forEach((w, i) => {
                lineDiv.appendChild(w);
                if (i < lineWords.length - 1) lineDiv.appendChild(document.createTextNode(' '));
            });
            el.appendChild(lineDiv);
        });
    }

    let stretchLineEls = [];

    function refreshStretchLines() {
        document.querySelectorAll('.split-lines').forEach(splitIntoLines);
        stretchLineEls = Array.from(document.querySelectorAll('.stretch-bio .line'));
    }

    refreshStretchLines();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(refreshStretchLines, 150);
    });

    function updateStretch() {
        if (window.isInfoOverlayOpen) {
            const maxScroll = Math.max(0, stretchScroll.scrollHeight - window.innerHeight);
            scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));
            scrollCurrent += (scrollTarget - scrollCurrent) * SCROLL_SMOOTHING;
            stretchScroll.style.transform = `translateY(${(-scrollCurrent).toFixed(1)}px)`;

            const focalY = window.innerHeight * FOCAL_RATIO;
            const range = window.innerHeight * INFLUENCE_RATIO;

            // Ogni riga calcola il proprio stiramento in base alla propria
            // distanza dalla linea focale: è continuo, quindi non c'è mai un
            // passaggio di testimone brusco tra una riga e l'altra.
            stretchLineEls.forEach(line => {
                const rect = line.getBoundingClientRect();
                const lineCenter = rect.top + rect.height / 2;
                const dist = Math.abs(lineCenter - focalY);

                const t = Math.max(0, 1 - dist / range);
                const eased = smoothstep(t);
                const targetStretch = 1 + eased * (MAX_STRETCH - 1);

                if (line._currentStretch === undefined) line._currentStretch = 1;
                line._currentStretch += (targetStretch - line._currentStretch) * STRETCH_SMOOTHING;
                const stretch = line._currentStretch;

                // Ancorata in alto (transform-origin: top): la testa della
                // riga resta ferma, la parte bassa si allunga. Il margine è
                // proporzionale allo stiramento attuale, quindi a riposo è 0.
                const naturalHeight = line.offsetHeight;
                const extra = naturalHeight * (stretch - 1);

                line.style.transform = `scaleY(${stretch.toFixed(3)})`;
                line.style.marginBottom = extra.toFixed(1) + 'px';
            });
        }

        requestAnimationFrame(updateStretch);
    }

    updateStretch();
});
