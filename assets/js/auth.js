/* =====================================================================
   PROVENANCE — sign in / sign up
   One page for collectors and makers. Route on role after auth.
   ===================================================================== */
(function () {
  "use strict";

  var B = window.ProvenanceBackend;
  var CFG = window.PROVENANCE_CONFIG || {};
  var qs = new URLSearchParams(location.search);

  var consumerError = document.querySelector("[data-consumer-error]");
  var adminStep = document.querySelector("[data-admin-step]");
  var adminError = document.querySelector("[data-admin-error]");
  var disclosure = document.querySelector(".admin-disclosure");

  function go(url) { location.href = url; }
  function showError(el, msg) { if (!el) return; el.textContent = msg; el.classList.add("is-shown"); }
  function clearError(el) { if (!el) return; el.textContent = ""; el.classList.remove("is-shown"); }
  function demoName() {
    var f = document.getElementById("demo-name");
    return f && f.value.trim() ? f.value.trim() : "";
  }
  function routeFor(session, profile) {
    if (!session) return null;
    if (session.role === "admin") return "admin.html";
    return (profile && profile.onboarded) ? "feed.html" : "onboarding.html";
  }

  /* demo-mode affordances */
  if (!B.isLive) {
    document.querySelectorAll("[data-demo-only]").forEach(function (el) { el.hidden = false; });
    var dc = document.querySelector("[data-demo-code]");
    if (dc) dc.textContent = CFG.DEMO_ADMIN_CODE || "PROVENANCE-STUDIO";
  }

  /* if a session already exists, leave the page */
  B.ready().then(function () { return B.getSession(); }).then(function (session) {
    if (!session) {
      if (qs.get("intent") === "admin" && disclosure) disclosure.open = true;
      return;
    }
    if (qs.get("intent") === "admin" && session.role !== "admin") {
      if (disclosure) disclosure.open = true;
      if (adminStep) adminStep.hidden = false;
      return;
    }
    return B.getProfile().then(function (profile) {
      var dest = routeFor(session, profile);
      if (dest) go(dest);
    });
  }).catch(function () { /* stay on the page and let the user try */ });

  /* Apple / Google buttons (consumer + studio intent) */
  document.querySelectorAll("[data-provider]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      clearError(consumerError);
      var provider = btn.getAttribute("data-provider");
      var intent = btn.getAttribute("data-intent") || "consumer";
      btn.disabled = true;
      var opts = {
        intent: intent,
        displayName: demoName() || (intent === "admin" ? "Studio guest" : "Guest collector")
      };
      var call = provider === "apple" ? B.signInWithApple(opts) : B.signInWithGoogle(opts);
      call.then(function () {
        if (B.isLive) return; // OAuth redirect takes over
        if (intent === "admin") {
          if (adminStep) adminStep.hidden = false;
          if (disclosure) disclosure.open = true;
          btn.disabled = false;
          var ci = document.getElementById("admin-code");
          if (ci) ci.focus();
        } else {
          go("onboarding.html");
        }
      }).catch(function (err) {
        btn.disabled = false;
        showError(consumerError, (err && err.message) || "Sign-in could not start.");
      });
    });
  });

  /* studio access code */
  var adminSubmit = document.querySelector("[data-admin-submit]");
  if (adminSubmit) {
    var submit = function () {
      clearError(adminError);
      var input = document.getElementById("admin-code");
      var code = input ? input.value : "";
      if (!code.trim()) { showError(adminError, "Enter your access code."); return; }
      adminSubmit.disabled = true;
      B.redeemAdminCode(code).then(function (res) {
        adminSubmit.disabled = false;
        if (res && res.ok) go("admin.html");
        else showError(adminError, (res && res.error) || "That access code was not recognised.");
      }).catch(function (err) {
        adminSubmit.disabled = false;
        showError(adminError, (err && err.message) || "Verification failed.");
      });
    };
    adminSubmit.addEventListener("click", submit);
    var codeInput = document.getElementById("admin-code");
    if (codeInput) codeInput.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  }
})();
