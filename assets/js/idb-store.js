/* =====================================================================
   PROVENANCE — tiny IndexedDB blob store (demo mode only)
   ---------------------------------------------------------------------
   In demo mode there is no server, so uploaded video and poster files
   are kept as Blobs in IndexedDB. Object URLs can't cross a full page
   load, so every page that plays a clip reads the Blob back and makes
   its own fresh URL. In live mode this file is unused — Supabase
   Storage returns real public URLs instead.
   ===================================================================== */
(function () {
  "use strict";

  var DB_NAME = "provenance-media";
  var STORE = "blobs";
  var VERSION = 1;
  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) { reject(new Error("IndexedDB unavailable")); return; }
      var req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var store = t.objectStore(STORE);
        var out = fn(store);
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : undefined); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  window.ProvenanceIDB = {
    /** Store a Blob under `key`. */
    put: function (key, blob) {
      return tx("readwrite", function (s) { return s.put(blob, key); });
    },
    /** Return the Blob for `key`, or null. */
    get: function (key) {
      return tx("readonly", function (s) { return s.get(key); }).then(function (v) { return v || null; });
    },
    /** Delete the Blob for `key`. */
    remove: function (key) {
      return tx("readwrite", function (s) { return s.delete(key); });
    },
    /** Resolve a Blob to a fresh object URL (or null). */
    url: function (key) {
      return window.ProvenanceIDB.get(key).then(function (blob) {
        return blob ? URL.createObjectURL(blob) : null;
      });
    }
  };
})();
