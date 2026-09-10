# Provenance — backend (Supabase)

The site runs with **no backend at all** in demo mode (see the repo README).
Follow this guide to switch on real Apple / Google sign-in, cloud video
storage, and the server-side feed algorithm.

Everything the frontend needs lives in `assets/js/config.js` — two values.
Nothing else in the frontend changes between demo and live mode.

---

## 0. What you're building

| Piece | Supabase feature |
|---|---|
| Sign in with Apple & Google | Auth (OAuth providers) |
| One sign-in page, admin vs consumer routing | `profiles.role` + RLS |
| Studio access code → admin | `redeem-admin-code` Edge Function |
| Video + poster upload / storage | Storage buckets `videos`, `posters` |
| Metadata, engagement events | Postgres tables |
| "Push artists by interest" feed | `rank-feed` Edge Function |
| Taste onboarding quiz | `style_preferences` table |

Cost: comfortably inside the Supabase **Free** plan for launch
(500 MB database, 1 GB file storage, 2 GB egress, 50k monthly active
users). Upgrade to Pro ($25/mo) when storage or egress grows.

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard>, **New project**.
2. Note the **Project URL** (`https://xxxx.supabase.co`) and the
   **anon public** key from *Project Settings → API*.

## 2. Schema

Open *SQL Editor*, paste all of [`schema.sql`](./schema.sql), **Run**.
This creates the tables, the `video_stats` view, every RLS policy, the
storage policies, and a trigger that makes a `profiles` row on signup.

## 3. Storage buckets

*Storage → New bucket*, twice:

| Name | Public | Notes |
|---|---|---|
| `videos` | ✅ public | the clip files |
| `posters` | ✅ public | auto-captured thumbnails |

The upload/delete policies for these were already installed by
`schema.sql` (admins only write; anyone reads).

## 4. Auth providers

*Authentication → Providers*.

### Google
1. In [Google Cloud Console](https://console.cloud.google.com/) →
   *APIs & Services → Credentials* → **Create OAuth client ID** → *Web
   application*.
2. Authorised redirect URI:
   `https://xxxx.supabase.co/auth/v1/callback`
3. Paste the Client ID + secret into Supabase's Google provider, enable.

### Apple
1. [Apple Developer](https://developer.apple.com/account/resources) →
   *Identifiers* → register an **App ID** with *Sign in with Apple*, then
   a **Services ID** (this is your client id).
2. Configure the Services ID's *Return URL*:
   `https://xxxx.supabase.co/auth/v1/callback`
3. Create a *Sign in with Apple* **Key**, download the `.p8`.
4. In Supabase's Apple provider, fill Services ID, Team ID, Key ID and
   the key contents, enable.

### Redirect URLs
*Authentication → URL Configuration*:
- **Site URL**: `https://<your-user>.github.io/Provenance/`
- **Redirect URLs**: add
  `https://<your-user>.github.io/Provenance/auth.html`
  (and `http://localhost:8000/auth.html` for local testing).

## 5. Studio access code

Pick a code, store only its SHA-256 hash:

```bash
# prints: <hash>  -
printf '%s' 'YOUR-STUDIO-CODE' | shasum -a 256
```

*SQL Editor*:

```sql
insert into public.admin_access_codes (label, code_hash)
values ('Founder', '<paste the hash here>');
```

Give the plain code to trusted makers/curators out of band. Rotate by
inserting a new row and setting `active = false` on the old one. A user
who redeems a valid code is flipped to `role = 'admin'` and lands on
`admin.html` from then on.

## 6. Edge Functions

Install the [CLI](https://supabase.com/docs/guides/cli), then:

```bash
supabase login
supabase link --project-ref xxxx
supabase functions deploy redeem-admin-code
supabase functions deploy rank-feed
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically — no secrets to set. Both functions verify the
caller's JWT before doing anything privileged.

## 7. Point the frontend at it

`assets/js/config.js`:

```js
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGci...your anon key...",
```

Commit, push, done. The frontend detects the keys and switches from demo
mode to live mode automatically:

- OAuth buttons start a real Google/Apple flow and redirect back to
  `auth.html`, which then routes by role.
- `admin.html` uploads to Storage and inserts a `videos` row.
- `feed.html` calls `rank-feed` instead of ranking in the browser.

## 8. Verify

1. Visit `auth.html`, sign in with Google — you should land on
   `onboarding.html`, then `feed.html` (empty until something is
   published).
2. Redeem your studio code from the *"I have studio access"* panel →
   land on `admin.html`.
3. Publish a short clip → it appears in `feed.html`, ranked.
4. Check *Table Editor → video_events* fills as you watch / like.

---

## Files

| Path | Purpose |
|---|---|
| `schema.sql` | tables, view, RLS, storage policies, signup trigger |
| `functions/redeem-admin-code/index.ts` | verify code → promote to admin |
| `functions/rank-feed/index.ts` | server-side feed ranking (mirrors `assets/js/rank.js`) |
| `config.toml` | CLI project config |

## Keeping the two rankers in sync

`assets/js/rank.js` (demo mode, in-browser) and
`functions/rank-feed/index.ts` (live mode) implement the **same**
scoring. The weight table is duplicated at the top of each file. If you
tune one, tune the other.
