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

        // Cursore su PC / tocco su mobile: l'intera immagine torna normale.
        wrap.addEventListener("pointerenter", function () {
            wrap.classList.add("is-revealed");
        });
        wrap.addEventListener("pointerdown", function () {
            wrap.classList.add("is-revealed");
        });
        wrap.addEventListener("pointerleave", function () {
            wrap.classList.remove("is-revealed");
        });
        wrap.addEventListener("pointerup", function () {
            wrap.classList.remove("is-revealed");
        });
        wrap.addEventListener("pointercancel", function () {
            wrap.classList.remove("is-revealed");
        });
    });

    // === INVERSIONE COLORI (stessa logica di index.html/commenti.js) ===
    var toggleBtn = document.getElementById("toggle-colors");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            document.documentElement.classList.toggle("light-mode");
        });
    }
})();
