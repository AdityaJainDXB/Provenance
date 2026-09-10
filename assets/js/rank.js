/* =====================================================================
   PROVENANCE — feed ranking
   ---------------------------------------------------------------------
   Scores each candidate clip for one viewer and returns them best-first.
   This is the surface that "pushes designs of artists based on
   interests": the strongest signal is how well a clip's style tags
   match what the viewer chose during onboarding.

   The same logic is re-implemented in TypeScript in
   supabase/functions/rank-feed/index.ts for live mode. Keep the two in
   sync when you change the weights.

   Signal            Weight  Meaning
   ----------------   ------  ---------------------------------------------
   style match         0.42   overlap of clip.styleTags + craft with the
                              viewer's onboarding preferences (Jaccard)
   region affinity     0.10   clip.region is one the viewer follows
   engagement          0.20   log-scaled likes + saves*2 + shares*3
   freshness           0.13   linear decay over 14 days
   new-maker guarantee 0.10   flat boost while a maker is under 1,000
                              lifetime impressions (fair-visibility rule)
   exploration jitter  0.05   small random term so the feed isn't static
   seen penalty          —    clips already completed this session sink
   ===================================================================== */
(function () {
  "use strict";

  var W = { style: 0.42, region: 0.10, engagement: 0.20, fresh: 0.13, newMaker: 0.10, jitter: 0.05 };
  var NEW_MAKER_IMPRESSION_GRANT = 1000;
  var FRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

  function norm(s) { return String(s || "").trim().toLowerCase(); }

  function toSet(arr) {
    var s = Object.create(null);
    (arr || []).forEach(function (v) { v = norm(v); if (v) s[v] = true; });
    return s;
  }

  function jaccard(aSet, bList) {
    var keys = Object.keys(aSet);
    if (!keys.length || !bList || !bList.length) return 0;
    var b = toSet(bList);
    var inter = 0, union = Object.create(null);
    keys.forEach(function (k) { union[k] = true; if (b[k]) inter++; });
    Object.keys(b).forEach(function (k) { union[k] = true; });
    var u = Object.keys(union).length;
    return u ? inter / u : 0;
  }

  function engagementScore(stats) {
    stats = stats || {};
    var raw = (stats.likes || 0) + (stats.saves || 0) * 2 + (stats.shares || 0) * 3;
    return Math.min(1, Math.log10(raw + 1) / 3); // ~1000 weighted actions ≈ 1.0
  }

  function freshness(createdAt) {
    var age = Date.now() - new Date(createdAt || 0).getTime();
    if (isNaN(age) || age < 0) return 1;
    return Math.max(0, 1 - age / FRESH_WINDOW_MS);
  }

  /**
   * @param {Object} video   {styleTags[], craftTag, region, createdAt, uploaderId, stats}
   * @param {Object} prefs    {crafts[], aesthetics[], regions[], pace}
   * @param {Object} ctx      {seen:Set, makerImpressions:{[id]:n}}
   * @returns {number} score, higher is better
   */
  function scoreVideo(video, prefs, ctx) {
    prefs = prefs || {};
    ctx = ctx || {};
    var wanted = [].concat(prefs.crafts || [], prefs.aesthetics || []);
    var clipTags = [].concat(video.styleTags || [], video.craftTag ? [video.craftTag] : []);

    var style = jaccard(toSet(wanted), clipTags);
    // pace ("calm" / "energetic") counts as one more style tag if it matches
    if (prefs.pace && clipTags.map(norm).indexOf(norm(prefs.pace)) !== -1) style = Math.min(1, style + 0.15);

    var region = (prefs.regions || []).map(norm).indexOf(norm(video.region)) !== -1 ? 1 : 0;
    var eng = engagementScore(video.stats);
    var fresh = freshness(video.createdAt);

    var impressions = (ctx.makerImpressions || {})[video.uploaderId] || 0;
    var newMaker = impressions < NEW_MAKER_IMPRESSION_GRANT ? 1 : 0;

    var jitter = Math.random();

    var score =
      W.style * style +
      W.region * region +
      W.engagement * eng +
      W.fresh * fresh +
      W.newMaker * newMaker +
      W.jitter * jitter;

    if (ctx.seen && ctx.seen.has && ctx.seen.has(video.id)) score -= 0.6;
    return score;
  }

  /** Rank a candidate array. `cursor`/`pageSize` page the result. */
  function rankFeed(videos, prefs, ctx, cursor, pageSize) {
    cursor = cursor || 0;
    pageSize = pageSize || 6;
    var scored = (videos || []).map(function (v) {
      return { video: v, score: scoreVideo(v, prefs, ctx) };
    }).sort(function (a, b) { return b.score - a.score; });
    var page = scored.slice(cursor, cursor + pageSize).map(function (x) { return x.video; });
    return { items: page, nextCursor: cursor + pageSize, exhausted: cursor + pageSize >= scored.length };
  }

  window.ProvenanceRank = { scoreVideo: scoreVideo, rankFeed: rankFeed, WEIGHTS: W };
})();
