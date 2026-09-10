/* =====================================================================
   PROVENANCE — interactions
   Deliberate, quiet. Nothing here rushes the visitor.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MARK_LABEL = {
    pv: "Process video verified",
    ce: "Endorsed by the maker's cooperative",
    vr: "Region of origin verified"
  };
  var MARK_SVG = {
    pv: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    ce: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a3 3 0 0 0 4.24 0l3-3a3 3 0 0 0-4.24-4.24l-1 1"/><path d="M14 11a3 3 0 0 0-4.24 0l-3 3a3 3 0 0 0 4.24 4.24l1-1"/></svg>',
    vr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>'
  };

  function marksHtml(marks) {
    return (marks || []).map(function (k) {
      return '<span class="mark" role="img" aria-label="' + MARK_LABEL[k] + '" title="' + MARK_LABEL[k] + '">' + MARK_SVG[k] + "</span>";
    }).join("");
  }

  function pieceHtml(d) {
    return (
      '<article class="piece reveal" data-tags="' + d.tags + '">' +
        '<a href="product.html">' +
          '<div class="piece-media">' +
            '<img src="' + d.img + '" alt="' + d.t + " by " + d.m + '" loading="lazy" width="800" height="1000">' +
            '<div class="marks">' + marksHtml(d.marks) + "</div>" +
          "</div>" +
          '<div class="piece-body">' +
            '<div class="piece-maker"><span>' + d.m + '</span><span class="dot"></span><span>' + d.p + "</span></div>" +
            '<h3 class="piece-title">' + d.t + "</h3>" +
            '<div class="piece-meta"><span class="piece-price">' + d.price + '</span><span class="piece-format">' + d.fmt + "</span></div>" +
          "</div>" +
        "</a>" +
      "</article>"
    );
  }

  /* ---------- Header: hairline on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      document.body.style.overflow = !open ? "hidden" : "";
    });
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Render piece grids from the catalogue ---------- */
  document.querySelectorAll("[data-pieces]").forEach(function (grid) {
    var all = (window.PROVENANCE_PIECES || []).slice();
    var limit = parseInt(grid.getAttribute("data-limit") || "0", 10);
    var offset = parseInt(grid.getAttribute("data-offset") || "0", 10);
    if (grid.getAttribute("data-shuffle") === "true") {
      for (var i = all.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = all[i]; all[i] = all[j]; all[j] = tmp;
      }
    }
    var set = all.slice(offset);
    if (limit > 0) set = set.slice(0, limit);
    grid.innerHTML = set.map(pieceHtml).join("");
  });

  /* ---------- Reveal on scroll ---------- */
  function observeReveals(scope) {
    var revealables = (scope || document).querySelectorAll(".reveal:not(.is-in)");
    if (!revealables.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }
  observeReveals(document);

  /* ---------- "Newly Discovered Artisans" — a quiet rotation ---------- */
  var discover = document.querySelector("[data-discover]");
  if (discover) {
    var makers = window.PROVENANCE_MAKERS || [];
    var SHOW = parseInt(discover.getAttribute("data-show") || "5", 10);
    var mOffset = Math.floor(Math.random() * Math.max(makers.length, 1));

    var renderMakers = function () {
      if (!makers.length) return;
      var out = "";
      for (var i = 0; i < SHOW; i++) {
        var m = makers[(mOffset + i) % makers.length];
        out +=
          '<article class="maker-card reveal is-in"><a href="artisan.html">' +
          '<div class="maker-portrait"><img src="' + m.img + '" alt="Portrait of ' + m.name + '" loading="lazy" width="400" height="400"></div>' +
          "<h4>" + m.name + "</h4>" +
          '<div class="place">' + m.place + "</div>" +
          '<div class="craft">' + m.craft + "</div>" +
          "</a></article>";
      }
      discover.innerHTML = out;
    };
    renderMakers();

    if (!reduceMotion && makers.length > SHOW) {
      setInterval(function () {
        mOffset = (mOffset + SHOW) % makers.length;
        discover.style.transition = "opacity .5s ease";
        discover.style.opacity = "0";
        setTimeout(function () { renderMakers(); discover.style.opacity = "1"; }, 500);
      }, 12000);
    }
  }

  /* ---------- Gallery: filtering + pagination (never infinite scroll) ---------- */
  var gallery = document.querySelector("[data-paginate]");
  if (gallery) {
    var PER_PAGE = parseInt(gallery.getAttribute("data-per-page") || "6", 10);
    var pager = document.querySelector("[data-pager]");
    var filterBar = document.querySelector("[data-filters]");
    var countEl = document.querySelector("[data-count]");
    var page = 1;
    var activeFilter = "all";

    function pieces() { return Array.prototype.slice.call(gallery.querySelectorAll(".piece")); }
    function matching() {
      return pieces().filter(function (el) {
        return activeFilter === "all" || (el.getAttribute("data-tags") || "").split(" ").indexOf(activeFilter) !== -1;
      });
    }

    function draw(goto) {
      var visibleSet = matching();
      var pages = Math.max(1, Math.ceil(visibleSet.length / PER_PAGE));
      page = Math.min(Math.max(1, goto), pages);

      pieces().forEach(function (el) { el.hidden = true; });
      var start = (page - 1) * PER_PAGE;
      visibleSet.slice(start, start + PER_PAGE).forEach(function (el) { el.hidden = false; });

      if (countEl) {
        countEl.textContent = visibleSet.length + (visibleSet.length === 1 ? " piece" : " pieces");
      }
      buildPager(pages);

      var anchor = document.querySelector("[data-gallery-top]");
      if (anchor && goto !== page - 0 + 0 && !window.__firstDraw) {
        anchor.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    }

    function mkBtn(label, target, opts) {
      opts = opts || {};
      var b = document.createElement("button");
      b.textContent = label;
      if (opts.edge) b.className = "edge";
      if (opts.current) b.setAttribute("aria-current", "true");
      if (opts.disabled) b.disabled = true;
      if (opts.label) b.setAttribute("aria-label", opts.label);
      b.addEventListener("click", function () { window.__firstDraw = false; draw(target); });
      return b;
    }

    function buildPager(pages) {
      if (!pager) return;
      pager.innerHTML = "";
      if (pages <= 1) return;
      pager.appendChild(mkBtn("Previous", page - 1, { edge: true, disabled: page === 1, label: "Previous page" }));
      var nums = [];
      for (var p = 1; p <= pages; p++) {
        if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
        else if (nums[nums.length - 1] !== "…") nums.push("…");
      }
      nums.forEach(function (n) {
        if (n === "…") {
          var s = document.createElement("span");
          s.className = "ellipsis"; s.textContent = "…";
          pager.appendChild(s);
        } else {
          pager.appendChild(mkBtn(String(n), n, { current: n === page, label: "Page " + n }));
        }
      });
      pager.appendChild(mkBtn("Next", page + 1, { edge: true, disabled: page === pages, label: "Next page" }));
    }

    if (filterBar) {
      var chips = Array.prototype.slice.call(filterBar.querySelectorAll(".chip"));
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
          chip.setAttribute("aria-pressed", "true");
          activeFilter = chip.getAttribute("data-filter") || "all";
          window.__firstDraw = false;
          draw(1);
        });
      });
    }

    window.__firstDraw = true;
    draw(1);
    window.__firstDraw = false;
    observeReveals(gallery);
  }

  /* ---------- Product gallery: thumbnail swap ---------- */
  var pgallery = document.querySelector(".product-gallery");
  if (pgallery) {
    var frameImg = pgallery.querySelector(".frame img");
    var thumbs = pgallery.querySelectorAll(".thumbs button");
    if (frameImg) frameImg.style.transition = "opacity .3s ease";
    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-full");
        if (frameImg && src) {
          frameImg.style.opacity = "0";
          setTimeout(function () { frameImg.src = src; frameImg.style.opacity = "1"; }, reduceMotion ? 0 : 180);
        }
        thumbs.forEach(function (t) { t.setAttribute("aria-current", "false"); });
        btn.setAttribute("aria-current", "true");
      });
    });
  }

  /* ---------- Acquisitions counter (local, quiet) ---------- */
  var bagCount = document.querySelector(".nav-bag .count");
  var acquireBtn = document.querySelector("[data-acquire]");
  var stored = 0;
  try { stored = parseInt(sessionStorage.getItem("prov_acq") || "0", 10) || 0; } catch (e) {}
  if (bagCount) bagCount.textContent = String(stored);
  if (acquireBtn) {
    var original = acquireBtn.textContent;
    acquireBtn.addEventListener("click", function () {
      stored += 1;
      try { sessionStorage.setItem("prov_acq", String(stored)); } catch (e) {}
      if (bagCount) bagCount.textContent = String(stored);
      acquireBtn.textContent = "Reserved — a note is on its way to " + (acquireBtn.getAttribute("data-maker") || "the maker");
      acquireBtn.disabled = true;
      setTimeout(function () { acquireBtn.textContent = original; acquireBtn.disabled = false; }, 3200);
    });
  }

  /* ---------- Year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (y) {
    y.textContent = String(new Date().getFullYear());
  });
})();

/* =====================================================================
   PROVENANCE — account state in the nav
   Adds a "Shorts" link and a sign-in / account pill to every page that
   carries the standard header. Depends on assets/js/backend.js.
   ===================================================================== */
(function () {
  "use strict";

  var linksWrap = document.querySelector(".nav-links");
  var rightWrap = document.querySelector(".nav .nav-toggle") ? document.querySelector(".nav .nav-toggle").parentNode : null;
  if (linksWrap && !linksWrap.querySelector('a[href="feed.html"]')) {
    var studios = linksWrap.querySelector('a[href="studios.html"]');
    var shorts = document.createElement("a");
    shorts.href = "feed.html";
    shorts.textContent = "Shorts";
    if (studios && studios.nextSibling) linksWrap.insertBefore(shorts, studios.nextSibling);
    else linksWrap.appendChild(shorts);
  }

  var B = window.ProvenanceBackend;
  if (!B || !rightWrap) return;
  var toggle = rightWrap.querySelector(".nav-toggle");

  function initials(name) {
    return String(name || "•").split(/\s+/).map(function (w) { return w[0] || ""; }).slice(0, 2).join("").toUpperCase();
  }

  function paint(session) {
    var existing = rightWrap.querySelector(".nav-account");
    if (existing) existing.remove();
    var a = document.createElement("a");
    a.className = "nav-account";
    if (!session) {
      a.href = "auth.html";
      a.textContent = "Sign in";
    } else if (session.role === "admin") {
      a.href = "admin.html";
      a.className += " is-admin";
      a.innerHTML = '<span class="avatar">' + initials(session.user.name) + "</span> Studio";
    } else {
      a.href = "feed.html";
      a.innerHTML = '<span class="avatar">' + initials(session.user.name) + "</span> Your feed";
    }
    rightWrap.insertBefore(a, toggle || null);
  }

  B.ready().then(function () { return B.getSession(); }).then(paint).catch(function () { paint(null); });
  B.onAuthChange(function (session) { paint(session); });
})();
