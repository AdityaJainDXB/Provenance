// =====================================================================
// PROVENANCE — redeem-admin-code
// Verifies a studio access code and, if it matches, promotes the
// calling user to role = 'admin'.
//
// Deploy:  supabase functions deploy redeem-admin-code
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//          are injected automatically by the platform.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return json({ ok: false, error: "Not signed in" }, 401);

  let code = "";
  try {
    code = (await req.json()).code ?? "";
  } catch {
    return json({ ok: false, error: "Malformed request" }, 400);
  }
  if (!code.trim()) return json({ ok: false, error: "No code supplied" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1. Identify the caller from their JWT.
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userRes.user) return json({ ok: false, error: "Session invalid" }, 401);
  const userId = userRes.user.id;

  // 2. Check the code against the hash table (service role: bypasses RLS).
  const admin = createClient(url, serviceKey);
  const hash = await sha256Hex(code.trim());
  const { data: match } = await admin
    .from("admin_access_codes")
    .select("id")
    .eq("code_hash", hash)
    .eq("active", true)
    .maybeSingle();

  if (!match) {
    // constant-ish response; don't reveal which part failed
    return json({ ok: false, error: "That access code was not recognised." });
  }

  // 3. Promote.
  const { error: upErr } = await admin
    .from("profiles")
    .update({ role: "admin", onboarded: true })
    .eq("id", userId);

  if (upErr) return json({ ok: false, error: "Could not update your account." }, 500);

  return json({ ok: true, role: "admin" });
});
