/* =====================================================================
   AURA STUDIOS — the short-form vertical feed
   Bounded (never infinite), calm by default. No view counts, no likes,
   no comments, no followers anywhere in this UI.
   ===================================================================== */
(function () {
  "use strict";

  var track = document.querySelector(".reel-track");
  if (!track) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DAILY = 12; // the feed is a bounded daily set, never an endless scroll
  var pieces = (window.PROVENANCE_PIECES || []).slice(0, DAILY);

  var KIND = {
    "Short-form video": "Process clip",
    "Live selling session": "Live studio",
    "Static · process video": "Video-backed listing"
  };
  var FILTERS = {
    all: function () { return true; },
    clip: function (d) { return d.fmt === "Short-form video"; },
    live: function (d) { return d.fmt === "Live selling session"; },
    backed: function (d) { return d.fmt === "Static · process video"; }
  };

  var PROCESS_BG = [
    "assets/img/process-1.svg", "assets/img/process-2.svg",
    "assets/img/process-3.svg", "assets/img/process-4.svg",
    "assets/img/editorial-1.svg", "assets/img/editorial-2.svg", "assets/img/video-poster.svg"
  ];

  var dotsEl = document.querySelector(".reel-dots");
  var filterEl = document.querySelector(".reel-filter");
  var audioBtn = document.querySelector(".audio-toggle");
  var current = "all";

  function reelHtml(d, i) {
    var bg = PROCESS_BG[i % PROCESS_BG.length];
    var kind = KIND[d.fmt] || "Process clip";
    return (
      '<section class="reel" data-fmt="' + d.fmt + '" aria-roledescription="studio film" aria-label="' + d.t + " by " + d.m + '">' +
        '<div class="reel-progress" aria-hidden="true"><i></i></div>' +
        '<div class="reel-media"><img src="' + bg + '" alt="' + d.m + ' at work — ' + d.tech.toLowerCase() + '" loading="lazy"></div>' +
        '<div class="reel-focus"><span class="kind">' + kind + '</span><span>Technique in focus</span></div>' +
        '<div class="glass-card">' +
          '<div class="who">' +
            '<span class="mark" role="img" aria-label="Process video verified" title="Process video verified"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>' +
            '<span>' + d.m + '</span><span class="dot"></span><span>' + d.p + '</span>' +
          '</div>' +
          '<h2>' + d.t + '</h2>' +
          '<div class="tech">' + d.tech + ' · ' + d.yrs + ' years in practice</div>' +
          '<div class="row">' +
            '<span class="price">' + d.price + '</span>' +
            '<button class="acquire-piece" data-acquire-piece data-maker="' + d.m + '">Acquire Piece</button>' +
          '</div>' +
        '</div>' +
        (i === 0 ? '<div class="reel-scroll-hint"><span>Scroll</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div>' : '') +
      '</section>'
    );
  }

  function endHtml() {
    return (
      '<section class="reel reel--end" aria-label="End of today’s studio films">' +
        '<span class="eyebrow" style="color:rgba(244,241,233,.55)">AURA Studios</span>' +
        '<h2>That’s every studio film on view today</h2>' +
        '<p>The feed doesn’t loop. New process films are added each morning.</p>' +
        '<a class="btn" href="gallery.html">Back to the gallery</a>' +
      '</section>'
    );
  }

  function render() {
    var set = pieces.filter(FILTERS[current]);
    track.innerHTML = set.map(reelHtml).join("") + endHtml();
    wireAcquire();
    buildDots(set.length);
    observeReels();
    track.scrollTo({ top: 0 });
  }

  function wireAcquire() {
    var count = 0;
    try { count = parseInt(sessionStorage.getItem("prov_acq") || "0", 10) || 0; } catch (e) {}
    track.querySelectorAll("[data-acquire-piece]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        count += 1;
        try { sessionStorage.setItem("prov_acq", String(count)); } catch (e) {}
        btn.textContent = "Reserved — note sent to " + btn.getAttribute("data-maker");
        btn.disabled = true;
        setTimeout(function () { btn.textContent = "Acquire Piece"; btn.disabled = false; }, 3200);
      });
    });
  }

  var reels = [];
  var activeIndex = 0;

  function buildDots(n) {
    if (!dotsEl) return;
    dotsEl.innerHTML = "";
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var b = document.createElement("button");
        b.setAttribute("aria-label", "Go to film " + (idx + 1));
        if (idx === 0) b.setAttribute("aria-current", "true");
        b.addEventListener("click", function () {
          if (reels[idx]) reels[idx].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        });
        dotsEl.appendChild(b);
      })(i);
    }
  }

  function setActive(idx) {
    activeIndex = idx;
    reels.forEach(function (r, i) { r.classList.toggle("is-active", i === idx); });
    if (dotsEl) {
      Array.prototype.forEach.call(dotsEl.children, function (d, i) {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      });
    }
  }

  var io;
  function observeReels() {
    reels = Array.prototype.slice.call(track.querySelectorAll(".reel"));
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) { setActive(0); return; }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          var idx = reels.indexOf(e.target);
          if (idx !== -1) setActive(idx);
        }
      });
    }, { threshold: [0.6] });
    reels.forEach(function (r) { io.observe(r); });
    setActive(0);
  }

  /* filter pills */
  if (filterEl) {
    filterEl.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterEl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        current = btn.getAttribute("data-reel-filter") || "all";
        render();
      });
    });
  }

  /* ambient audio toggle — ambient studio room tone only, never music.
     No real audio file ships; this reflects the setting and persists it. */
  if (audioBtn) {
    var on = true;
    try { on = sessionStorage.getItem("aura_audio") !== "off"; } catch (e) {}
    var paint = function () {
      audioBtn.setAttribute("aria-pressed", String(on));
      audioBtn.querySelector(".label").textContent = on ? "Ambient studio audio" : "Muted";
    };
    paint();
    audioBtn.addEventListener("click", function () {
      on = !on;
      try { sessionStorage.setItem("aura_audio", on ? "on" : "off"); } catch (e) {}
      paint();
    });
  }

  /* keyboard: arrow up/down between reels */
  window.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    var next = activeIndex + (e.key === "ArrowDown" ? 1 : -1);
    if (reels[next]) {
      e.preventDefault();
      reels[next].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  });

  render();
})();
