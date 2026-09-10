/* =====================================================================
   PROVENANCE — backend abstraction (demo + live)
   ---------------------------------------------------------------------
   One API, two implementations. Every page talks to
   `window.ProvenanceBackend`; it never needs to know whether a server
   is present.

     mode === "demo"  → localStorage + IndexedDB + client-side ranking
     mode === "live"  → Supabase (Auth, Postgres, Storage, Edge Fns)

   Switching modes is done entirely in assets/js/config.js.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.PROVENANCE_CONFIG || {};
  var LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  var SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

  var listeners = [];
  function emitAuth(session) { listeners.forEach(function (fn) { try { fn(session); } catch (e) {} }); }

  function uid() {
    return (crypto && crypto.randomUUID) ? crypto.randomUUID()
      : "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function readJSON(k, fallback) {
    try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (e) { return fallback; }
  }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* =================================================================
     DEMO BACKEND
     ================================================================= */
  var Demo = (function () {
    var K = {
      session: "prov_demo_session",
      profiles: "prov_demo_profiles",
      videos: "prov_demo_videos",
      events: "prov_demo_events",
      seeded: "prov_demo_seeded_v1"
    };

    function session() { return readJSON(K.session, null); }
    function setSession(s) { s ? writeJSON(K.session, s) : localStorage.removeItem(K.session); emitAuth(s); }
    function profiles() { return readJSON(K.profiles, {}); }
    function saveProfiles(p) { writeJSON(K.profiles, p); }
    function videos() { return readJSON(K.videos, []); }
    function saveVideos(v) { writeJSON(K.videos, v); }
    function events() { return readJSON(K.events, []); }
    function saveEvents(e) { writeJSON(K.events, e); }

    function currentProfile() {
      var s = session(); if (!s) return null;
      var all = profiles();
      if (!all[s.user.id]) {
        all[s.user.id] = { role: s.role || "consumer", displayName: s.user.name, onboarded: false, stylePrefs: null };
        saveProfiles(all);
      }
      return all[s.user.id];
    }

    function seedIfNeeded() {
      if (localStorage.getItem(K.seeded)) return;
      var pieces = (window.PROVENANCE_PIECES || []).slice(0, 8);
      var POSTERS = ["assets/img/process-1.svg", "assets/img/process-2.svg", "assets/img/process-3.svg",
        "assets/img/process-4.svg", "assets/img/editorial-1.svg", "assets/img/editorial-2.svg", "assets/img/video-poster.svg"];
      var PACE = ["calm", "calm", "energetic"];
      var now = Date.now();
      var seeded = pieces.map(function (p, i) {
        return {
          id: uid(),
          uploaderId: "seed-maker-" + (i % 6),
          makerName: p.m, title: p.t, technique: p.tech, region: p.p, price: p.price,
          craftTag: p.tags,
          styleTags: [p.tags, PACE[i % 3], (p.marks || []).indexOf("pv") !== -1 ? "process-led" : "material-led"],
          posterUrl: POSTERS[i % POSTERS.length],
          videoKey: null, posterKey: null,
          durationSeconds: 18 + (i % 5) * 7,
          status: "published",
          createdAt: new Date(now - i * 26 * 3600 * 1000).toISOString(),
          seedStats: { views: 40 + i * 55, likes: 8 + i * 17, saves: 3 + i * 6, shares: i },
          isSample: true
        };
      });
      saveVideos(seeded.concat(videos()));
      localStorage.setItem(K.seeded, "1");
    }

    function statsFor(id, seedStats) {
      var s = { views: 0, likes: 0, saves: 0, shares: 0 };
      if (seedStats) { s.views = seedStats.views; s.likes = seedStats.likes; s.saves = seedStats.saves; s.shares = seedStats.shares; }
      events().forEach(function (e) {
        if (e.videoId !== id) return;
        if (e.type === "view") s.views++;
        else if (e.type === "like") s.likes++;
        else if (e.type === "unlike") s.likes--;
        else if (e.type === "save") s.saves++;
        else if (e.type === "unsave") s.saves--;
        else if (e.type === "share") s.shares++;
      });
      return s;
    }

    return {
      mode: "demo",
      ready: function () { return Promise.resolve(); },

      getSession: function () { return Promise.resolve(session()); },
      onAuthChange: function (cb) { listeners.push(cb); },

      signIn: function (provider, opts) {
        opts = opts || {};
        var name = opts.displayName || (provider === "apple" ? "Apple guest" : "Google guest");
        var s = {
          user: { id: uid(), email: name.toLowerCase().replace(/\s+/g, ".") + "@demo.provenance", name: name, avatarUrl: "" },
          role: "consumer",
          provider: provider
        };
        var all = profiles();
        all[s.user.id] = { role: "consumer", displayName: name, onboarded: false, stylePrefs: null };
        saveProfiles(all);
        setSession(s);
        return Promise.resolve(s);
      },
      signInWithGoogle: function (opts) { return this.signIn("google", opts); },
      signInWithApple: function (opts) { return this.signIn("apple", opts); },
      signOut: function () { setSession(null); return Promise.resolve(); },

      getProfile: function () { return Promise.resolve(currentProfile()); },

      saveStylePreferences: function (prefs) {
        var s = session(); if (!s) return Promise.reject(new Error("Not signed in"));
        var all = profiles();
        var p = all[s.user.id] || { role: "consumer" };
        p.stylePrefs = prefs; p.onboarded = true;
        all[s.user.id] = p; saveProfiles(all);
        return Promise.resolve(p);
      },

      redeemAdminCode: function (code) {
        var s = session(); if (!s) return Promise.reject(new Error("Not signed in"));
        var expected = CFG.DEMO_ADMIN_CODE || "PROVENANCE-STUDIO";
        if (String(code || "").trim() !== expected) {
          return Promise.resolve({ ok: false, error: "That access code was not recognised." });
        }
        s.role = "admin"; setSession(s);
        var all = profiles();
        all[s.user.id] = all[s.user.id] || { displayName: s.user.name, onboarded: true, stylePrefs: null };
        all[s.user.id].role = "admin";
        saveProfiles(all);
        return Promise.resolve({ ok: true, role: "admin" });
      },

      uploadVideo: function (args) {
        var s = session(); if (!s) return Promise.reject(new Error("Not signed in"));
        var id = uid();
        var meta = args.meta || {};
        var record = {
          id: id, uploaderId: s.user.id,
          makerName: meta.makerName, title: meta.title, technique: meta.technique,
          region: meta.region, price: meta.price, craftTag: meta.craftTag,
          styleTags: meta.styleTags || [],
          posterUrl: "", videoKey: id + ":video", posterKey: null,
          durationSeconds: meta.durationSeconds || null,
          status: meta.status || "published",
          createdAt: new Date().toISOString(),
          seedStats: null, isSample: false
        };
        var chain = window.ProvenanceIDB.put(record.videoKey, args.file);
        if (args.poster) { record.posterKey = id + ":poster"; chain = chain.then(function () { return window.ProvenanceIDB.put(record.posterKey, args.poster); }); }
        return chain.then(function () {
          var list = videos(); list.unshift(record); saveVideos(list);
          if (args.onProgress) args.onProgress(1);
          return record;
        });
      },

      listVideos: function (opts) {
        opts = opts || {};
        var s = session();
        var list = videos();
        if (opts.mine && s) list = list.filter(function (v) { return v.uploaderId === s.user.id; });
        list = list.map(function (v) { return Object.assign({}, v, { stats: statsFor(v.id, v.seedStats) }); });
        return Promise.resolve(list);
      },

      updateVideoStatus: function (id, status) {
        var list = videos();
        list.forEach(function (v) { if (v.id === id) v.status = status; });
        saveVideos(list);
        return Promise.resolve();
      },

      deleteVideo: function (id) {
        var list = videos();
        var v = list.filter(function (x) { return x.id === id; })[0];
        list = list.filter(function (x) { return x.id !== id; });
        saveVideos(list);
        var jobs = [];
        if (v && v.videoKey) jobs.push(window.ProvenanceIDB.remove(v.videoKey));
        if (v && v.posterKey) jobs.push(window.ProvenanceIDB.remove(v.posterKey));
        return Promise.all(jobs).catch(function () {}).then(function () {});
      },

      fetchFeedPage: function (opts) {
        opts = opts || {};
        seedIfNeeded();
        var s = session();
        var prof = currentProfile();
        var prefs = prof && prof.stylePrefs ? prof.stylePrefs : {};
        var pub = videos().filter(function (v) { return v.status === "published"; })
          .map(function (v) { return Object.assign({}, v, { stats: statsFor(v.id, v.seedStats) }); });

        var seen = new Set();
        var makerImpressions = {};
        events().forEach(function (e) {
          if (s && e.userId === s.user.id && (e.type === "complete" || e.type === "view")) seen.add(e.videoId);
        });
        pub.forEach(function (v) {
          makerImpressions[v.uploaderId] = (makerImpressions[v.uploaderId] || 0) + v.stats.views;
        });

        var ranked = window.ProvenanceRank.rankFeed(
          pub, prefs, { seen: seen, makerImpressions: makerImpressions },
          opts.cursor || 0, CFG.FEED_PAGE_SIZE || 6
        );
        return Promise.resolve(ranked);
      },

      getMediaUrl: function (video) {
        var out = { src: "", poster: video.posterUrl || "" };
        var jobs = [];
        if (video.videoKey) jobs.push(window.ProvenanceIDB.url(video.videoKey).then(function (u) { if (u) out.src = u; }));
        if (video.posterKey) jobs.push(window.ProvenanceIDB.url(video.posterKey).then(function (u) { if (u) out.poster = u; }));
        return Promise.all(jobs).then(function () { return out; });
      },

      recordEvent: function (videoId, type) {
        var s = session();
        var e = events();
        e.push({ userId: s ? s.user.id : null, videoId: videoId, type: type, ts: Date.now() });
        saveEvents(e.slice(-4000));
        return Promise.resolve();
      },

      getMyEngagement: function () {
        var s = session();
        var likes = new Set(), saves = new Set();
        events().forEach(function (e) {
          if (!s || e.userId !== s.user.id) return;
          if (e.type === "like") likes.add(e.videoId);
          if (e.type === "unlike") likes.delete(e.videoId);
          if (e.type === "save") saves.add(e.videoId);
          if (e.type === "unsave") saves.delete(e.videoId);
        });
        return Promise.resolve({ likes: likes, saves: saves });
      }
    };
  })();

  /* =================================================================
     LIVE BACKEND (Supabase)
     ================================================================= */
  var Live = (function () {
    var sb = null;
    var initPromise = null;

    function init() {
      if (initPromise) return initPromise;
      initPromise = import(SUPABASE_CDN).then(function (mod) {
        sb = mod.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        sb.auth.onAuthStateChange(function () { shape().then(emitAuth); });
        return sb;
      });
      return initPromise;
    }

    function shape() {
      return sb.auth.getSession().then(function (res) {
        var s = res.data.session;
        if (!s) return null;
        var u = s.user;
        return ensureProfile(u).then(function (profile) {
          return {
            user: {
              id: u.id, email: u.email,
              name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || u.email,
              avatarUrl: (u.user_metadata && u.user_metadata.avatar_url) || ""
            },
            role: profile ? profile.role : "consumer"
          };
        });
      });
    }

    function ensureProfile(u) {
      return sb.from("profiles").select("*").eq("id", u.id).maybeSingle().then(function (res) {
        if (res.data) return res.data;
        var row = {
          id: u.id, role: "consumer",
          display_name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || u.email,
          avatar_url: (u.user_metadata && u.user_metadata.avatar_url) || null
        };
        return sb.from("profiles").insert(row).select().single().then(function (r) { return r.data || row; });
      });
    }

    function redirectTo() { return location.origin + (CFG.BASE_PATH || "") + "/auth.html"; }

    return {
      mode: "live",
      ready: function () { return init(); },
      getSession: function () { return init().then(shape); },
      onAuthChange: function (cb) { listeners.push(cb); },

      signInWithGoogle: function (opts) {
        opts = opts || {};
        return init().then(function () {
          return sb.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirectTo() + (opts.intent ? "?intent=" + opts.intent : "") }
          });
        });
      },
      signInWithApple: function (opts) {
        opts = opts || {};
        return init().then(function () {
          return sb.auth.signInWithOAuth({
            provider: "apple",
            options: { redirectTo: redirectTo() + (opts.intent ? "?intent=" + opts.intent : "") }
          });
        });
      },
      signOut: function () { return init().then(function () { return sb.auth.signOut(); }).then(function () { emitAuth(null); }); },

      getProfile: function () {
        return init().then(function () { return sb.auth.getUser(); }).then(function (res) {
          if (!res.data.user) return null;
          return sb.from("profiles").select("*, style_preferences(*)").eq("id", res.data.user.id).maybeSingle().then(function (r) {
            var d = r.data; if (!d) return null;
            var sp = Array.isArray(d.style_preferences) ? d.style_preferences[0] : d.style_preferences;
            return {
              role: d.role, displayName: d.display_name, onboarded: !!d.onboarded,
              stylePrefs: sp ? {
                crafts: sp.crafts || [], aesthetics: sp.aesthetics || [],
                regions: sp.regions || [], priceMax: sp.price_max, pace: sp.pace
              } : null
            };
          });
        });
      },

      saveStylePreferences: function (prefs) {
        return init().then(function () { return sb.auth.getUser(); }).then(function (res) {
          var id = res.data.user.id;
          return sb.from("style_preferences").upsert({
            user_id: id, crafts: prefs.crafts || [], aesthetics: prefs.aesthetics || [],
            regions: prefs.regions || [], price_max: prefs.priceMax || null, pace: prefs.pace || null,
            updated_at: new Date().toISOString()
          }).then(function () {
            return sb.from("profiles").update({ onboarded: true }).eq("id", id);
          });
        });
      },

      redeemAdminCode: function (code) {
        return init().then(function () { return sb.functions.invoke("redeem-admin-code", { body: { code: code } }); })
          .then(function (res) {
            if (res.error) return { ok: false, error: res.error.message || "Verification failed." };
            return res.data;
          });
      },

      uploadVideo: function (args) {
        var meta = args.meta || {};
        var id = uid();
        var ext = (args.file.name.split(".").pop() || "mp4").toLowerCase();
        var videoPath = id + "." + ext;
        return init().then(function () {
          return sb.storage.from(CFG.VIDEO_BUCKET).upload(videoPath, args.file, { contentType: args.file.type, upsert: false });
        }).then(function (up) {
          if (up.error) throw up.error;
          if (args.onProgress) args.onProgress(0.7);
          var posterJob = Promise.resolve(null);
          if (args.poster) {
            var posterPath = id + ".jpg";
            posterJob = sb.storage.from(CFG.POSTER_BUCKET).upload(posterPath, args.poster, { contentType: "image/jpeg", upsert: false })
              .then(function (p) { return p.error ? null : posterPath; });
          }
          return posterJob.then(function (posterPath) {
            return sb.auth.getUser().then(function (u) {
              return sb.from("videos").insert({
                uploader_id: u.data.user.id,
                maker_name: meta.makerName, title: meta.title, technique: meta.technique,
                region: meta.region, price: meta.price, craft_tag: meta.craftTag,
                style_tags: meta.styleTags || [],
                storage_path: videoPath, poster_path: posterPath,
                duration_seconds: meta.durationSeconds || null,
                status: meta.status || "published"
              }).select().single();
            });
          });
        }).then(function (r) {
          if (r.error) throw r.error;
          if (args.onProgress) args.onProgress(1);
          return mapVideo(r.data);
        });
      },

      listVideos: function (opts) {
        opts = opts || {};
        return init().then(function () {
          var q = sb.from("videos").select("*, video_stats(*)").order("created_at", { ascending: false });
          return q;
        }).then(function (r) {
          if (r.error) throw r.error;
          return (r.data || []).map(mapVideo);
        });
      },

      updateVideoStatus: function (id, status) {
        return init().then(function () { return sb.from("videos").update({ status: status }).eq("id", id); });
      },

      deleteVideo: function (id) {
        return init().then(function () { return sb.from("videos").select("storage_path,poster_path").eq("id", id).single(); })
          .then(function (r) {
            var jobs = [sb.from("videos").delete().eq("id", id)];
            if (r.data && r.data.storage_path) jobs.push(sb.storage.from(CFG.VIDEO_BUCKET).remove([r.data.storage_path]));
            if (r.data && r.data.poster_path) jobs.push(sb.storage.from(CFG.POSTER_BUCKET).remove([r.data.poster_path]));
            return Promise.all(jobs);
          }).then(function () {});
      },

      fetchFeedPage: function (opts) {
        opts = opts || {};
        return init().then(function () {
          return sb.functions.invoke("rank-feed", { body: { cursor: opts.cursor || 0, pageSize: CFG.FEED_PAGE_SIZE || 6 } });
        }).then(function (res) {
          if (res.error) throw res.error;
          return { items: (res.data.items || []).map(mapVideo), nextCursor: res.data.nextCursor, exhausted: !!res.data.exhausted };
        });
      },

      getMediaUrl: function (video) {
        return init().then(function () {
          var src = video.storagePath ? sb.storage.from(CFG.VIDEO_BUCKET).getPublicUrl(video.storagePath).data.publicUrl : "";
          var poster = video.posterPath ? sb.storage.from(CFG.POSTER_BUCKET).getPublicUrl(video.posterPath).data.publicUrl : (video.posterUrl || "");
          return { src: src, poster: poster };
        });
      },

      recordEvent: function (videoId, type, extra) {
        return init().then(function () { return sb.auth.getUser(); }).then(function (u) {
          return sb.from("video_events").insert({
            user_id: u.data.user ? u.data.user.id : null,
            video_id: videoId, type: type, watch_ms: extra && extra.watchMs || null
          });
        });
      },

      getMyEngagement: function () {
        return init().then(function () { return sb.auth.getUser(); }).then(function (u) {
          if (!u.data.user) return { likes: new Set(), saves: new Set() };
          return sb.from("video_events").select("video_id,type").eq("user_id", u.data.user.id)
            .in("type", ["like", "unlike", "save", "unsave"]).order("created_at", { ascending: true })
            .then(function (r) {
              var likes = new Set(), saves = new Set();
              (r.data || []).forEach(function (e) {
                if (e.type === "like") likes.add(e.video_id);
                if (e.type === "unlike") likes.delete(e.video_id);
                if (e.type === "save") saves.add(e.video_id);
                if (e.type === "unsave") saves.delete(e.video_id);
              });
              return { likes: likes, saves: saves };
            });
        });
      }
    };

    function mapVideo(d) {
      var st = Array.isArray(d.video_stats) ? d.video_stats[0] : d.video_stats;
      return {
        id: d.id, uploaderId: d.uploader_id,
        makerName: d.maker_name, title: d.title, technique: d.technique,
        region: d.region, price: d.price, craftTag: d.craft_tag,
        styleTags: d.style_tags || [],
        storagePath: d.storage_path, posterPath: d.poster_path, posterUrl: "",
        durationSeconds: d.duration_seconds, status: d.status, createdAt: d.created_at,
        isSample: false,
        stats: st ? { views: st.views || 0, likes: st.likes || 0, saves: st.saves || 0, shares: st.shares || 0 }
                  : { views: 0, likes: 0, saves: 0, shares: 0 }
      };
    }
  })();

  /* =================================================================
     EXPORT
     ================================================================= */
  var impl = LIVE ? Live : Demo;
  impl.isLive = LIVE;
  impl.config = CFG;
  window.ProvenanceBackend = impl;
})();
