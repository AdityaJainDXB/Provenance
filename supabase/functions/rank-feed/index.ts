// =====================================================================
// PROVENANCE — rank-feed
// Returns the next page of the Shorts feed for the calling user,
// ordered by how well each clip matches their onboarding taste, plus
// engagement, freshness and a new-maker visibility guarantee.
//
// This mirrors assets/js/rank.js — keep the weights in sync.
//
// Deploy:  supabase functions deploy rank-feed
// Body:    { "cursor": 0, "pageSize": 6 }
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const W = { style: 0.42, region: 0.10, engagement: 0.20, fresh: 0.13, newMaker: 0.10, jitter: 0.05 };
const NEW_MAKER_IMPRESSION_GRANT = 1000;
const FRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map(norm).filter(Boolean));
  const B = new Set(b.map(norm).filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const k of A) if (B.has(k)) inter++;
  return inter / new Set([...A, ...B]).size;
}

function engagementScore(s: { likes?: number; saves?: number; shares?: number } | null): number {
  const raw = (s?.likes ?? 0) + (s?.saves ?? 0) * 2 + (s?.shares ?? 0) * 3;
  return Math.min(1, Math.log10(raw + 1) / 3);
}

function freshness(createdAt: string): number {
  const age = Date.now() - new Date(createdAt).getTime();
  if (isNaN(age) || age < 0) return 1;
  return Math.max(0, 1 - age / FRESH_WINDOW_MS);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!jwt) return json({ error: "Not signed in" }, 401);

  let cursor = 0, pageSize = 6;
  try {
    const body = await req.json();
    cursor = Math.max(0, body.cursor | 0);
    pageSize = Math.min(20, Math.max(1, body.pageSize | 0 || 6));
  } catch { /* defaults */ }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const asUser = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: userRes } = await asUser.auth.getUser();
  if (!userRes?.user) return json({ error: "Session invalid" }, 401);
  const userId = userRes.user.id;

  const admin = createClient(url, serviceKey);

  const [{ data: prefs }, { data: videos }, { data: stats }, { data: seenRows }] = await Promise.all([
    admin.from("style_preferences").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("videos").select("*").eq("status", "published"),
    admin.from("video_stats").select("*"),
    admin.from("video_events").select("video_id").eq("user_id", userId).in("type", ["view", "complete"]),
  ]);

  const statMap = new Map((stats ?? []).map((s: any) => [s.video_id, s]));
  const seen = new Set((seenRows ?? []).map((r: any) => r.video_id));

  // lifetime impressions per maker (for the new-maker guarantee)
  const makerImpressions = new Map<string, number>();
  for (const v of videos ?? []) {
    const views = statMap.get(v.id)?.views ?? 0;
    makerImpressions.set(v.uploader_id, (makerImpressions.get(v.uploader_id) ?? 0) + views);
  }

  const wanted = [...(prefs?.crafts ?? []), ...(prefs?.aesthetics ?? [])];
  const wantedRegions = (prefs?.regions ?? []).map(norm);

  const scored = (videos ?? []).map((v: any) => {
    const clipTags = [...(v.style_tags ?? []), v.craft_tag].filter(Boolean);
    let style = jaccard(wanted, clipTags);
    if (prefs?.pace && clipTags.map(norm).includes(norm(prefs.pace))) style = Math.min(1, style + 0.15);

    const region = wantedRegions.includes(norm(v.region)) ? 1 : 0;
    const eng = engagementScore(statMap.get(v.id) ?? null);
    const fresh = freshness(v.created_at);
    const newMaker = (makerImpressions.get(v.uploader_id) ?? 0) < NEW_MAKER_IMPRESSION_GRANT ? 1 : 0;

    let score =
      W.style * style + W.region * region + W.engagement * eng +
      W.fresh * fresh + W.newMaker * newMaker + W.jitter * Math.random();
    if (seen.has(v.id)) score -= 0.6;

    return { v, score };
  }).sort((a, b) => b.score - a.score);

  const page = scored.slice(cursor, cursor + pageSize).map(({ v }) => ({
    ...v,
    video_stats: statMap.get(v.id) ?? { views: 0, likes: 0, saves: 0, shares: 0 },
  }));

  return json({
    items: page,
    nextCursor: cursor + pageSize,
    exhausted: cursor + pageSize >= scored.length,
  });
});
