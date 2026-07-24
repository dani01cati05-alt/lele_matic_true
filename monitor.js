(function () {
    "use strict";

    var WORK_W = 640;

    // === ATKINSON DITHERING ===
    function atkinsonDither(imageData, width, height) {
        var data = imageData.data;
        var gray = new Float32Array(width * height);

        for (var i = 0; i < width * height; i++) {
            var r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
            gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        function addErr(x, y, amount) {
            if (x < 0 || x >= width || y < 0 || y >= height) return;
            gray[y * width + x] += amount;
        }

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var idx = y * width + x;
                var oldVal = gray[idx];
                var newVal = oldVal < 128 ? 0 : 255;
                gray[idx] = newVal;
                var err = (oldVal - newVal) / 8;

                addErr(x + 1, y, err);
                addErr(x + 2, y, err);
                addErr(x - 1, y + 1, err);
                addErr(x, y + 1, err);
                addErr(x + 1, y + 1, err);
                addErr(x, y + 2, err);
            }
        }

        for (var j = 0; j < width * height; j++) {
            var v = gray[j] < 128 ? 0 : 255;
            data[j * 4] = v;
            data[j * 4 + 1] = v;
            data[j * 4 + 2] = v;
            data[j * 4 + 3] = 255;
        }
    }

    function renderDither(img, canvas) {
        var workW = WORK_W;
        var workH = Math.round(workW * (img.naturalHeight / img.naturalWidth));

        var off = document.createElement("canvas");
        off.width = workW;
        off.height = workH;
        var offCtx = off.getContext("2d");
        offCtx.drawImage(img, 0, 0, workW, workH);

        var imageData = offCtx.getImageData(0, 0, workW, workH);
        atkinsonDither(imageData, workW, workH);
        offCtx.putImageData(imageData, 0, 0);

        canvas.width = workW;
        canvas.height = workH;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(off, 0, 0);
    }

    // === REVEAL SPOTLIGHT (mouse / touch) ===
    var REVEAL_R_MOUSE = 140;
    var REVEAL_R_TOUCH = 100;
    var FEATHER = 40; // matches the "+40px" in the CSS mask
    var EASE = 0.18;

    function setupReveal(wrap) {
        var tx = 50, ty = 50; // percent
        var cx = 50, cy = 50;
        var tr = 0;
        var cr = 0;

        function updateFromEvent(e) {
            var rect = wrap.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            tx = Math.max(0, Math.min(100, x));
            ty = Math.max(0, Math.min(100, y));
            tr = e.pointerType === "touch" ? REVEAL_R_TOUCH : REVEAL_R_MOUSE;
        }

        function hide() {
            tr = 0;
        }

        wrap.addEventListener("pointermove", updateFromEvent);
        wrap.addEventListener("pointerdown", updateFromEvent);
        wrap.addEventListener("pointerup", hide);
        wrap.addEventListener("pointerleave", hide);
        wrap.addEventListener("pointercancel", hide);

        function tick() {
            cx += (tx - cx) * EASE;
            cy += (ty - cy) * EASE;
            cr += (tr - cr) * EASE;

            var rClamped = Math.max(0, cr);
            // Feather grows with the radius itself so a resting/near-zero
            // radius collapses to a fully opaque mask instead of leaving a
            // faint halo of the real image bleeding through at rest.
            var outer = rClamped + Math.min(FEATHER, rClamped);

            wrap.style.setProperty("--mx", cx + "%");
            wrap.style.setProperty("--my", cy + "%");
            wrap.style.setProperty("--r", rClamped + "px");
            wrap.style.setProperty("--r-outer", outer + "px");

            requestAnimationFrame(tick);
        }
        tick();
    }

    document.querySelectorAll(".photo-wrap").forEach(function (wrap) {
        var img = wrap.querySelector(".real-img");
        var canvas = wrap.querySelector(".dither-canvas");

        function run() {
            renderDither(img, canvas);
        }

        if (img.complete && img.naturalWidth) {
            run();
        } else {
            img.addEventListener("load", run, { once: true });
        }

        setupReveal(wrap);
    });
})();
