/* =====================================================================
   PROVENANCE — Studio (admin panel)
   Upload maker films, manage what's live. Admin-only; guarded on load.
   ===================================================================== */
(function () {
  "use strict";

  var B = window.ProvenanceBackend;

  var form = document.getElementById("upload-form");
  var dz = document.querySelector("[data-dropzone]");
  var fileInput = document.querySelector("[data-file]");
  var dzTitle = document.querySelector("[data-dz-title]");
  var dzHint = document.querySelector("[data-dz-hint]");
  var dzPreview = document.querySelector("[data-dz-preview]");
  var chipsWrap = document.querySelector("[data-chips]");
  var chipInput = document.getElementById("f-tags-input");
  var errEl = document.querySelector("[data-upload-error]");
  var progress = document.querySelector("[data-progress]");
  var submitBtn = document.querySelector("[data-submit]");
  var listEl = document.querySelector("[data-list]");
  var librarySub = document.querySelector("[data-library-sub]");
  var toastEl = document.querySelector("[data-toast]");
  var scrim = document.querySelector("[data-confirm-scrim]");

  var picked = { file: null, poster: null, duration: null, previewUrl: null };
  var tags = [];

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", !!isError);
    toastEl.classList.add("is-shown");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("is-shown"); }, 2800);
  }
  function showErr(msg) { errEl.textContent = msg; errEl.classList.add("is-shown"); }
  function clearErr() { errEl.textContent = ""; errEl.classList.remove("is-shown"); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function abbrev(n) {
    n = n || 0;
    if (n < 1000) return String(n);
    return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "") + "k";
  }

  /* ---------- guard ---------- */
  B.ready().then(function () { return B.getSession(); }).then(function (session) {
    if (!session) { location.href = "auth.html?intent=admin"; return Promise.reject("noauth"); }
    if (session.role !== "admin") { location.href = "auth.html?intent=admin"; return Promise.reject("notadmin"); }
    document.querySelector("[data-who-name]").textContent = session.user.name || session.user.email || "Signed in";
    return loadLibrary();
  }).catch(function (r) { if (r !== "noauth" && r !== "notadmin") console.error(r); });

  document.querySelector("[data-signout]").addEventListener("click", function () {
    B.signOut().then(function () { location.href = "index.html"; });
  });

  /* ---------- dropzone ---------- */
  dz.addEventListener("click", function () { fileInput.click(); });
  dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  ["dragenter", "dragover"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-drag"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-drag"); });
  });
  dz.addEventListener("drop", function (e) {
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(f) {
    clearErr();
    if (!/^video\//.test(f.type)) { showErr("That doesn't look like a video file."); return; }
    if (picked.previewUrl) URL.revokeObjectURL(picked.previewUrl);
    picked.file = f;
    picked.previewUrl = URL.createObjectURL(f);

    dz.classList.add("has-file");
    dzTitle.textContent = f.name;
    dzHint.textContent = (f.size / 1048576).toFixed(1) + " MB — click to replace";
    dzPreview.hidden = false;
    dzPreview.innerHTML = "";
    var v = document.createElement("video");
    v.src = picked.previewUrl;
    v.controls = true; v.muted = true; v.playsInline = true; v.preload = "metadata";
    dzPreview.appendChild(v);

    v.addEventListener("loadedmetadata", function () {
      picked.duration = Math.round(v.duration) || null;
      capturePoster(v);
    });
  }

  function capturePoster(video) {
    try {
      var target = Math.min(1, (video.duration || 2) / 2);
      var grab = function () {
        try {
          var c = document.createElement("canvas");
          var w = 640, h = Math.round(w * (video.videoHeight / video.videoWidth || 0.5625));
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(video, 0, 0, w, h);
          c.toBlob(function (blob) { if (blob) picked.poster = blob; }, "image/jpeg", 0.72);
        } catch (e) { /* cross-origin or unsupported — poster stays null */ }
        video.removeEventListener("seeked", grab);
      };
      video.addEventListener("seeked", grab);
      video.currentTime = target;
    } catch (e) { /* ignore */ }
  }

  /* ---------- style tag chips ---------- */
  function renderChips() {
    chipsWrap.querySelectorAll(".tag").forEach(function (n) { n.remove(); });
    tags.forEach(function (t) {
      var span = document.createElement("span");
      span.className = "tag";
      span.innerHTML = esc(t) + ' <button type="button" aria-label="Remove ' + esc(t) + '">&times;</button>';
      span.querySelector("button").addEventListener("click", function () {
        tags = tags.filter(function (x) { return x !== t; });
        renderChips();
      });
      chipsWrap.insertBefore(span, chipInput);
    });
  }
  function addTag(raw) {
    var t = raw.trim().toLowerCase().replace(/,$/, "");
    if (t && tags.indexOf(t) === -1 && tags.length < 8) tags.push(t);
    chipInput.value = "";
    renderChips();
  }
  chipInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(chipInput.value); }
    else if (e.key === "Backspace" && !chipInput.value && tags.length) { tags.pop(); renderChips(); }
  });
  chipInput.addEventListener("blur", function () { if (chipInput.value.trim()) addTag(chipInput.value); });

  /* ---------- submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErr();
    var maker = document.getElementById("f-maker").value.trim();
    var title = document.getElementById("f-title").value.trim();
    if (!picked.file) { showErr("Choose a video file first."); return; }
    if (!maker || !title) { showErr("Maker and piece title are both required."); return; }

    var craft = document.getElementById("f-craft").value;
    var meta = {
      makerName: maker,
      title: title,
      technique: document.getElementById("f-technique").value.trim(),
      region: document.getElementById("f-region").value.trim(),
      price: document.getElementById("f-price").value.trim(),
      craftTag: craft,
      styleTags: tags.slice(),
      durationSeconds: picked.duration,
      status: document.getElementById("f-status").value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing…";
    progress.classList.add("is-shown");
    var bar = progress.querySelector("i");
    bar.style.width = "8%";

    B.uploadVideo({
      file: picked.file,
      poster: picked.poster,
      meta: meta,
      onProgress: function (p) { bar.style.width = Math.max(8, Math.round(p * 100)) + "%"; }
    }).then(function () {
      bar.style.width = "100%";
      toast("Film published");
      resetForm();
      return loadLibrary();
    }).catch(function (err) {
      showErr((err && err.message) || "Upload failed. Try again.");
      toast("Upload failed", true);
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish film";
      setTimeout(function () { progress.classList.remove("is-shown"); bar.style.width = "0%"; }, 600);
    });
  });

  function resetForm() {
    form.reset();
    tags = []; renderChips();
    if (picked.previewUrl) URL.revokeObjectURL(picked.previewUrl);
    picked = { file: null, poster: null, duration: null, previewUrl: null };
    dz.classList.remove("has-file");
    dzTitle.textContent = "Drop a video here, or choose a file";
    dzHint.textContent = "MP4 or WebM · up to ~200 MB";
    dzPreview.hidden = true; dzPreview.innerHTML = "";
  }

  /* ---------- library ---------- */
  function loadLibrary() {
    return B.listVideos({ mine: false }).then(function (vids) {
      if (!vids.length) {
        listEl.innerHTML = '<div class="admin-empty">Nothing published yet. Your first film will show here.</div>';
        librarySub.textContent = "Everything published or drafted to the feed.";
        return;
      }
      var live = vids.filter(function (v) { return v.status === "published"; }).length;
      librarySub.textContent = live + " live in the feed · " + vids.length + " total";
      listEl.innerHTML = vids.map(rowHtml).join("");
      vids.forEach(function (v) { wireRow(v); });
    }).catch(function (err) {
      listEl.innerHTML = '<div class="admin-empty">Could not load the library.</div>';
      toast((err && err.message) || "Library failed to load", true);
    });
  }

  function rowHtml(v) {
    var poster = v.posterUrl || "assets/img/video-poster.svg";
    var st = v.stats || { views: 0, likes: 0, saves: 0 };
    return '' +
      '<div class="video-row" data-row="' + esc(v.id) + '">' +
        '<img class="thumb" src="' + esc(poster) + '" alt="" data-thumb>' +
        '<div class="meta">' +
          '<h4>' + esc(v.title) + '</h4>' +
          '<p>' + esc(v.makerName) + (v.region ? ' · ' + esc(v.region) : '') + '</p>' +
          '<p class="stats">' + abbrev(st.views) + ' views · ' + abbrev(st.likes) + ' appreciations · ' + abbrev(st.saves) + ' saves</p>' +
        '</div>' +
        '<div class="ops">' +
          '<span class="status-badge ' + esc(v.status) + '">' + esc(v.status) + '</span>' +
          '<button class="row-op" data-toggle type="button">' + (v.status === "published" ? "Unpublish" : "Publish") + '</button>' +
          '<button class="row-op danger" data-delete type="button">Remove</button>' +
        '</div>' +
      '</div>';
  }

  function wireRow(v) {
    var row = listEl.querySelector('[data-row="' + cssEscape(v.id) + '"]');
    if (!row) return;

    // demo mode: resolve poster / first frame from IndexedDB
    if (!v.posterUrl && (v.posterKey || v.videoKey)) {
      B.getMediaUrl(v).then(function (m) {
        var thumb = row.querySelector("[data-thumb]");
        if (m.poster) thumb.src = m.poster;
      });
    }

    row.querySelector("[data-toggle]").addEventListener("click", function () {
      var next = v.status === "published" ? "draft" : "published";
      B.updateVideoStatus(v.id, next).then(function () {
        toast(next === "published" ? "Now live in the feed" : "Taken out of the feed");
        loadLibrary();
      }).catch(function (err) { toast((err && err.message) || "Could not update", true); });
    });

    row.querySelector("[data-delete]").addEventListener("click", function () {
      confirmModal("Remove \u201c" + v.title + "\u201d?", function () {
        B.deleteVideo(v.id).then(function () {
          toast("Film removed");
          loadLibrary();
        }).catch(function (err) { toast((err && err.message) || "Could not remove", true); });
      });
    });
  }

  function cssEscape(s) {
    return String(s).replace(/["\\]/g, "\\$&");
  }

  /* ---------- confirm modal ---------- */
  var confirmCb = null;
  function confirmModal(body, cb) {
    scrim.querySelector("[data-confirm-body]").textContent = body;
    confirmCb = cb;
    scrim.classList.add("is-shown");
    scrim.querySelector("[data-confirm-ok]").focus();
  }
  function closeConfirm() { scrim.classList.remove("is-shown"); confirmCb = null; }
  scrim.querySelector("[data-confirm-cancel]").addEventListener("click", closeConfirm);
  scrim.querySelector("[data-confirm-ok]").addEventListener("click", function () {
    if (confirmCb) confirmCb();
    closeConfirm();
  });
  scrim.addEventListener("click", function (e) { if (e.target === scrim) closeConfirm(); });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape" && scrim.classList.contains("is-shown")) closeConfirm(); });
})();
