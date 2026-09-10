/* =====================================================================
   PROVENANCE — taste onboarding
   Three quick steps. Skippable. Feeds the ranking algorithm.
   ===================================================================== */
(function () {
  "use strict";

  var B = window.ProvenanceBackend;
  var qs = new URLSearchParams(location.search);
  var editing = qs.get("edit") === "1";

  var steps = Array.prototype.slice.call(document.querySelectorAll(".quiz-step"));
  var bars = Array.prototype.slice.call(document.querySelectorAll(".quiz-progress i"));
  var backBtn = document.querySelector("[data-back]");
  var skipBtn = document.querySelector("[data-skip]");
  var nextBtn = document.querySelector("[data-next]");
  var errEl = document.querySelector("[data-quiz-error]");
  var at = 0;

  function go(url) { location.href = url; }
  function values(group) {
    return Array.prototype.slice.call(
      document.querySelectorAll('[data-group="' + group + '"] input:checked')
    ).map(function (i) { return i.value; });
  }

  /* guard: must be signed in; skip if already onboarded */
  B.ready().then(function () { return B.getSession(); }).then(function (session) {
    if (!session) { go("auth.html"); return; }
    if (session.role === "admin") { go("admin.html"); return; }
    return B.getProfile().then(function (profile) {
      if (profile && profile.onboarded && !editing) { go("feed.html"); return; }
      if (profile && profile.stylePrefs && editing) prefill(profile.stylePrefs);
      render();
    });
  }).catch(function () { render(); });

  function prefill(p) {
    function check(group, list) {
      (list || []).forEach(function (v) {
        var el = document.querySelector('[data-group="' + group + '"] input[value="' + v + '"]');
        if (el) el.checked = true;
      });
    }
    check("crafts", p.crafts);
    check("aesthetics", p.aesthetics);
    check("regions", p.regions);
    if (p.pace) {
      var pace = document.querySelector('input[name="pace"][value="' + p.pace + '"]');
      if (pace) pace.checked = true;
    }
    if (p.priceMax) document.getElementById("price-max").value = p.priceMax;
  }

  function render() {
    steps.forEach(function (s, i) { s.hidden = i !== at; });
    bars.forEach(function (b, i) { b.classList.toggle("is-done", i <= at); });
    backBtn.hidden = at === 0;
    nextBtn.textContent = at === steps.length - 1 ? "Show my feed" : "Continue";
    errEl.classList.remove("is-shown");
    var focusable = steps[at].querySelector("input, button");
    if (focusable) focusable.focus();
  }

  backBtn.addEventListener("click", function () { if (at > 0) { at--; render(); } });

  nextBtn.addEventListener("click", function () {
    if (at === 0 && values("crafts").length === 0) {
      errEl.textContent = "Pick at least one craft so we have somewhere to start.";
      errEl.classList.add("is-shown");
      return;
    }
    if (at < steps.length - 1) { at++; render(); return; }
    finish(collect());
  });

  skipBtn.addEventListener("click", function () { finish({ crafts: [], aesthetics: [], regions: [], pace: "calm", priceMax: null }); });

  function collect() {
    var priceRaw = parseInt(document.getElementById("price-max").value, 10);
    var pace = document.querySelector('input[name="pace"]:checked');
    return {
      crafts: values("crafts"),
      aesthetics: values("aesthetics"),
      regions: values("regions"),
      pace: pace ? pace.value : "calm",
      priceMax: isNaN(priceRaw) ? null : priceRaw
    };
  }

  function finish(prefs) {
    nextBtn.disabled = true; skipBtn.disabled = true;
    B.saveStylePreferences(prefs).then(function () {
      go("feed.html");
    }).catch(function (err) {
      nextBtn.disabled = false; skipBtn.disabled = false;
      errEl.textContent = (err && err.message) || "Could not save your choices. Try again.";
      errEl.classList.add("is-shown");
    });
  }
})();
