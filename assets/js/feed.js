/* =====================================================================
   PROVENANCE — Shorts feed
   Vertical, scroll-snapped, infinite. Ordered by the ranking algorithm
   in assets/js/rank.js (live mode: the rank-feed Edge Function).
   Shorts-style action rail, kept in the muted Provenance palette.
   ===================================================================== */
(function () {
  "use strict";

  var B = window.ProvenanceBackend;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var track = document.querySelector(".shorts-track");
  var toastEl = document.querySelector("[data-toast]");
  if (!track) return;

  var state = {
    cursor: 0,
    exhausted: false,
    loading: false,
    muted: true,
    likes: new Set(),
    saves: new Set(),
    viewed: new Set(),
    shorts: [],
    active: -1
  };
  try { state.muted = sessionStorage.getItem("shorts_sound") !== "on"; } catch (e) {}

  function toast(msg, isError) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", !!isError);
    toastEl.classList.add("is-shown");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("is-shown"); }, 2600);
  }

  function abbrev(n) {
    n = n || 0;
    if (n < 1000) return String(n);
    if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "") + "k";
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var ICON = {
    like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7-4.35-9.33-8.5C1 8 2.8 4.5 6.2 4.5c2 0 3.3 1.1 3.8 2 .5-.9 1.8-2 3.8-2 3.4 0 5.2 3.5 3.53 7C19 15.65 12 20 12 20z"/></svg>',
    likeFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.35-9.33-8.5C1 8 2.8 4.5 6.2 4.5c2 0 3.3 1.1 3.8 2 .5-.9 1.8-2 3.8-2 3.4 0 5.2 3.5 3.53 7C19 15.65 12 20 12 20z"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
    saveFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>'
  };

  function shortHtml(v, index) {
    var liked = state.likes.has(v.id);
    var saved = state.saves.has(v.id);
    var initials = (v.makerName || "•").split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
    return '' +
      '<section class="short" data-id="' + esc(v.id) + '" data-index="' + index + '" aria-roledescription="maker film" aria-label="' + esc(v.title) + ' by ' + esc(v.makerName) + '">' +
        '<div class="short-progress" aria-hidden="true"><i></i></div>' +
        '<div class="short-media" data-media></div>' +
        '<button class="short-tap" data-tap aria-label="Play or pause, tap and hold to mute"></button>' +
        (v.isSample || !v.hasVideo ? '<span class="sample-chip">Sample film</span>' : '') +
        '<div class="short-rail">' +
          '<a class="rail-btn" href="artisan.html" aria-label="View ' + esc(v.makerName) + '">' +
            '<span class="maker-portrait">' + (v.makerAvatar ? '<img src="' + esc(v.makerAvatar) + '" alt="">' : '<span class="ico" style="border:0;background:none">' + esc(initials) + '</span>') + '</span>' +
          '</a>' +
          '<button class="rail-btn" data-act="like" aria-pressed="' + liked + '" aria-label="Appreciate this film">' +
            '<span class="ico" data-ico>' + (liked ? ICON.likeFill : ICON.like) + '</span>' +
            '<span data-count="like">' + abbrev(v.stats.likes) + '</span>' +
          '</button>' +
          '<button class="rail-btn" data-act="save" aria-pressed="' + saved + '" aria-label="Save this piece">' +
            '<span class="ico" data-ico>' + (saved ? ICON.saveFill : ICON.save) + '</span>' +
            '<span data-count="save">' + abbrev(v.stats.saves) + '</span>' +
          '</button>' +
          '<button class="rail-btn" data-act="share" aria-label="Share this film">' +
            '<span class="ico">' + ICON.share + '</span>' +
            '<span>Share</span>' +
          '</button>' +
          '<button class="rail-btn" data-act="sound" aria-pressed="' + !state.muted + '" aria-label="Toggle sound">' +
            '<span class="ico" data-ico>' + (state.muted ? ICON.mute : ICON.sound) + '</span>' +
            '<span data-sound-label>' + (state.muted ? "Muted" : "Sound") + '</span>' +
          '</button>' +
        '</div>' +
        '<div class="short-card">' +
          '<div class="who"><span>' + esc(v.makerName) + '</span><span class="dot"></span><span>' + esc(v.region || "") + '</span></div>' +
          '<h2>' + esc(v.title) + '</h2>' +
          '<div class="tech">' + esc(v.technique || "") + '</div>' +
          '<div class="row">' +
            '<span class="price">' + esc(v.price || "") + '</span>' +
            '<button class="acquire-piece" data-acquire data-maker="' + esc(v.makerName) + '">Acquire Piece</button>' +
          '</div>' +
        '</div>' +
        (index === 0 ? '<div class="short-hint"><span>Scroll</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div>' : '') +
      '</section>';
  }

  function endHtml() {
    return '<div class="short-end">' +
      '<span class="eyebrow" style="color:rgba(244,241,233,.55)">Provenance Shorts</span>' +
      '<h2>You\'re caught up for now</h2>' +
      '<p>New maker films are added through the day. Come back later, or browse the full gallery.</p>' +
      '<a class="btn" href="gallery.html">Back to the gallery</a>' +
    '</div>';
  }

  function emptyHtml() {
    return '<div class="short-empty">' +
      '<span class="eyebrow" style="color:rgba(244,241,233,.55)">Provenance Shorts</span>' +
      '<h2>No films are live yet</h2>' +
      '<p>A curator hasn\'t published anything to the feed yet. Check back soon.</p>' +
      '<a class="btn" href="gallery.html">Browse the gallery</a>' +
    '</div>';
  }

  /* ---- media wiring (video element or poster still) ---- */
  function mountMedia(shortEl, v) {
    var host = shortEl.querySelector("[data-media]");
    B.getMediaUrl(v).then(function (m) {
      if (m.src) {
        var vid = document.createElement("video");
        vid.src = m.src;
        if (m.poster) vid.poster = m.poster;
        vid.loop = true; vid.muted = state.muted; vid.playsInline = true;
        vid.setAttribute("playsinline", "");
        vid.preload = "metadata";
        host.appendChild(vid);
        shortEl._video = vid;
        vid.addEventListener("timeupdate", function () {
          if (!vid.duration) return;
          var bar = shortEl.querySelector(".short-progress i");
          if (bar) bar.style.width = (vid.currentTime / vid.duration * 100) + "%";
        });
        vid.addEventListener("ended", function () { markComplete(v.id); });
        if (parseInt(shortEl.getAttribute("data-index"), 10) === state.active) playShort(shortEl);
      } else {
        host.classList.add("is-poster");
        var img = document.createElement("img");
        img.src = m.poster || "assets/img/video-poster.svg";
        img.alt = (v.makerName || "") + " at work";
        host.appendChild(img);
        // synthetic progress for a still
        var bar = shortEl.querySelector(".short-progress i");
        if (bar) { bar.style.transition = "width " + (v.durationSeconds || 20) + "s linear"; }
      }
    });
  }

  function playShort(shortEl) {
    var vid = shortEl._video;
    if (!vid) {
      var bar = shortEl.querySelector(".short-progress i");
      if (bar && !reduceMotion) { bar.style.width = "0%"; requestAnimationFrame(function () { bar.style.width = "100%"; }); }
      return;
    }
    vid.muted = state.muted;
    var p = vid.play();
    if (p && p.catch) p.catch(function () {});
  }
  function pauseShort(shortEl) {
    if (shortEl._video) { try { shortEl._video.pause(); } catch (e) {} }
  }

  function setActive(index) {
    if (index === state.active) return;
    state.shorts.forEach(function (el) {
      var i = parseInt(el.getAttribute("data-index"), 10);
      if (i === index) { playShort(el); recordView(el.getAttribute("data-id")); }
      else pauseShort(el);
    });
    state.active = index;
  }

  function recordView(id) {
    if (!id || state.viewed.has(id)) return;
    state.viewed.add(id);
    B.recordEvent(id, "view").catch(function () {});
  }
  function markComplete(id) {
    B.recordEvent(id, "complete").catch(function () {});
  }

  /* ---- infinite loading ---- */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        setActive(parseInt(e.target.getAttribute("data-index"), 10));
      }
    });
  }, { threshold: [0.6] }) : null;

  var sentinelIO = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) loadMore();
  }, { rootMargin: "800px 0px" }) : null;

  function loadMore() {
    if (state.loading || state.exhausted) return;
    state.loading = true;
    B.fetchFeedPage({ cursor: state.cursor }).then(function (page) {
      state.loading = false;
      state.cursor = page.nextCursor;
      state.exhausted = page.exhausted;

      var boot = track.querySelector("[data-boot]");
      if (boot) boot.remove();

      if (!page.items.length && !state.shorts.length) {
        track.insertAdjacentHTML("beforeend", emptyHtml());
        return;
      }

      var startIndex = state.shorts.length;
      page.items.forEach(function (v, k) {
        v.hasVideo = !!(v.storagePath || v.videoKey);
        track.insertAdjacentHTML("beforeend", shortHtml(v, startIndex + k));
        var el = track.lastElementChild;
        state.shorts.push(el);
        wireShort(el, v);
        if (io) io.observe(el);
      });

      if (state.active === -1) setActive(0);

      if (state.exhausted) {
        track.insertAdjacentHTML("beforeend", endHtml());
      } else if (sentinelIO) {
        sentinelIO.disconnect();
        sentinelIO.observe(state.shorts[state.shorts.length - 1]);
      }
    }).catch(function (err) {
      state.loading = false;
      var boot = track.querySelector("[data-boot]");
      if (boot) boot.innerHTML = '<p>Could not load the feed.</p><a class="btn" href="gallery.html">Back to the gallery</a>';
      toast((err && err.message) || "Feed failed to load", true);
    });
  }

  /* ---- per-short interactions ---- */
  function wireShort(el, v) {
    mountMedia(el, v);

    el.querySelector("[data-tap]").addEventListener("click", function () {
      var vid = el._video;
      if (!vid) return;
      if (vid.paused) vid.play().catch(function () {}); else vid.pause();
    });

    el.querySelectorAll(".rail-btn[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.getAttribute("data-act");
        if (act === "like") toggleEngage(btn, v, "like", "unlike", state.likes, ICON.likeFill, ICON.like);
        else if (act === "save") toggleEngage(btn, v, "save", "unsave", state.saves, ICON.saveFill, ICON.save);
        else if (act === "share") shareShort(v);
        else if (act === "sound") toggleSound();
      });
    });

    var acq = el.querySelector("[data-acquire]");
    acq.addEventListener("click", function () {
      var n = 0;
      try { n = parseInt(sessionStorage.getItem("prov_acq") || "0", 10) || 0; } catch (e) {}
      n++;
      try { sessionStorage.setItem("prov_acq", String(n)); } catch (e) {}
      acq.textContent = "Reserved — note sent to " + v.makerName;
      acq.disabled = true;
      setTimeout(function () { acq.textContent = "Acquire Piece"; acq.disabled = false; }, 3200);
    });
  }

  function toggleEngage(btn, v, onType, offType, set, fillIcon, lineIcon) {
    var on = !set.has(v.id);
    if (on) set.add(v.id); else set.delete(v.id);
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector("[data-ico]").innerHTML = on ? fillIcon : lineIcon;
    var countEl = btn.querySelector("[data-count]");
    if (countEl) {
      var base = v.stats[onType === "like" ? "likes" : "saves"] || 0;
      countEl.textContent = abbrev(base + (on ? 1 : 0));
    }
    B.recordEvent(v.id, on ? onType : offType).catch(function () {});
  }

  function shareShort(v) {
    var url = location.origin + (window.PROVENANCE_CONFIG.BASE_PATH || "") + "/feed.html#" + v.id;
    B.recordEvent(v.id, "share").catch(function () {});
    if (navigator.share) {
      navigator.share({ title: v.title + " — Provenance", text: "A film by " + v.makerName, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast("Could not copy link", true); });
    } else {
      toast(url);
    }
  }

  function toggleSound() {
    state.muted = !state.muted;
    try { sessionStorage.setItem("shorts_sound", state.muted ? "off" : "on"); } catch (e) {}
    state.shorts.forEach(function (el) {
      if (el._video) el._video.muted = state.muted;
      var b = el.querySelector('.rail-btn[data-act="sound"]');
      if (b) {
        b.setAttribute("aria-pressed", String(!state.muted));
        b.querySelector("[data-ico]").innerHTML = state.muted ? ICON.mute : ICON.sound;
        var lbl = b.querySelector("[data-sound-label]");
        if (lbl) lbl.textContent = state.muted ? "Muted" : "Sound";
      }
    });
  }

  /* ---- keyboard ---- */
  function scrollToIndex(i) {
    var el = state.shorts[i];
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); scrollToIndex(state.active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); scrollToIndex(state.active - 1); }
    else if (e.key === " ") {
      var el = state.shorts[state.active];
      if (el && el._video) { e.preventDefault(); el._video.paused ? el._video.play().catch(function () {}) : el._video.pause(); }
    } else if (e.key.toLowerCase() === "m") { toggleSound(); }
  });

  /* ---- boot: guard then load ---- */
  B.ready().then(function () { return B.getSession(); }).then(function (session) {
    if (!session) { location.href = "auth.html"; return Promise.reject("noauth"); }
    return B.getProfile().then(function (profile) {
      if (session.role !== "admin" && !(profile && profile.onboarded)) {
        location.href = "onboarding.html";
        return Promise.reject("onboard");
      }
      return B.getMyEngagement();
    });
  }).then(function (eng) {
    if (eng) { state.likes = eng.likes || new Set(); state.saves = eng.saves || new Set(); }
    loadMore();
  }).catch(function (reason) {
    if (reason === "noauth" || reason === "onboard") return;
    loadMore();
  });
})();
