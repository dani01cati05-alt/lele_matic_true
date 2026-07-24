(function () {
  "use strict";

  var IMG_W = 2400;
  var IMG_H = 1680;

  // Kept in sync with the transition duration in saracinesca.css.
  var RISE_MS = 3600;
  var RISE_MS_REDUCED = 400;

  var loader = document.getElementById("shutter-loader");
  if (!loader) return;
  var curtainImg = loader.querySelector(".shutter-img");

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function layoutShutter() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scale = Math.max(vw / IMG_W, vh / IMG_H);
    var dispW = IMG_W * scale;
    var dispH = IMG_H * scale;
    var left = (vw - dispW) / 2;

    curtainImg.style.width = dispW + "px";
    curtainImg.style.height = dispH + "px";
    curtainImg.style.left = left + "px";
  }

  function preload(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = img.onerror = function () {
        resolve();
      };
      img.src = url;
    });
  }

  function openShutter() {
    document.body.classList.remove("is-loading");
    curtainImg.classList.add("is-open");

    var riseMs = prefersReducedMotion ? RISE_MS_REDUCED : RISE_MS;
    setTimeout(function () {
      loader.remove();
    }, riseMs);
  }

  layoutShutter();
  window.addEventListener("resize", layoutShutter);

  document.body.classList.add("is-loading");

  var startTime = performance.now();
  var minDisplayMs = prefersReducedMotion ? 200 : 900;

  Promise.all([preload(curtainImg.getAttribute("src"))])
    .then(function () {
      return new Promise(function (resolve) {
        window.addEventListener("load", resolve, { once: true });
        if (document.readyState === "complete") resolve();
      });
    })
    .then(function () {
      var elapsed = performance.now() - startTime;
      var remaining = Math.max(0, minDisplayMs - elapsed);
      setTimeout(openShutter, remaining);
    });
})();
