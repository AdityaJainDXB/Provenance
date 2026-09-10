/* =====================================================================
   PROVENANCE — runtime configuration
   ---------------------------------------------------------------------
   The site runs in two modes:

   1. DEMO MODE (default, no setup)
      Leave SUPABASE_URL / SUPABASE_ANON_KEY blank. Authentication is
      simulated locally, uploaded videos are stored in this browser
      (IndexedDB) and the feed algorithm runs client-side. Everything
      works end to end on GitHub Pages with no server.

   2. LIVE MODE (production)
      Fill in the two Supabase values below. The site then uses real
      Google / Apple sign-in, stores video in Supabase Storage, and
      calls the `rank-feed` Edge Function for the feed. Nothing else in
      the codebase changes. See supabase/README.md for the full setup.

   The anon key is safe to publish — it only permits what Row Level
   Security allows. The admin access code is NEVER stored here; it is
   verified server-side by the `redeem-admin-code` Edge Function.
   ===================================================================== */

window.PROVENANCE_CONFIG = {
  // --- Live mode (leave blank for demo mode) ------------------------
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // --- Storage bucket names (must match supabase/README.md) --------
  VIDEO_BUCKET: "videos",
  POSTER_BUCKET: "posters",

  // --- Demo mode only --------------------------------------------------
  // The access code an admin types on the sign-in page to reach the
  // admin panel while running without a server. In live mode this value
  // is ignored and the real code is checked by the Edge Function.
  DEMO_ADMIN_CODE: "PROVENANCE-STUDIO",

  // Feed page size (used by both modes).
  FEED_PAGE_SIZE: 6,

  // Base path the app is served from, used for post-login redirects.
  // "" for a user/organisation site, "/provenance" for a project site.
  BASE_PATH: location.pathname.replace(/\/[^/]*$/, "").replace(/\/$/, "")
};
