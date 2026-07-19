/**
 * Runs on tiktok.com — list + remove reposts, likes, OR favorites.
 * Modes: "repost" | "like" | "favorite"
 *
 * CS_VERSION must stay in sync with background.js — used to detect stale
 * injected scripts after an extension update (old script ignored `mode`).
 *
 * Uses a replaceable window.__rrTikTokApi so re-injects update handlers
 * without stacking duplicate listeners (background still reloads on START).
 */
(() => {
  const CS_VERSION = 9;

  let stopped = false;
  let panel = null;
  let activeMode = "repost";
  let runGeneration = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const LABELS = {
    repost: {
      title: "Remove Repost",
      noun: "repost",
      listing: "repost",
      empty: "Tidak ada repost.",
    },
    like: {
      title: "Remove Likes",
      noun: "like",
      listing: "like",
      empty: "Tidak ada like (Disukai).",
    },
    favorite: {
      title: "Remove Favorite",
      noun: "favorite",
      listing: "favorite",
      empty: "Tidak ada favorite.",
    },
  };

  function normalizeMode(mode) {
    if (mode === "favorite") return "favorite";
    if (mode === "like" || mode === "liked") return "like";
    return "repost";
  }

  function labels() {
    return LABELS[activeMode] || LABELS.repost;
  }

  function report(payload) {
    try {
      chrome.runtime.sendMessage(
        { type: "PROGRESS", mode: activeMode, ...payload },
        () => {
          void chrome.runtime.lastError;
        },
      );
    } catch {
      // ignore
    }
  }

  function ensurePanel() {
    if (panel && document.contains(panel)) return panel;
    panel = document.createElement("div");
    panel.id = "rr-tiktok-panel";
    panel.innerHTML =
      '<div id="rr-title" style="font:600 13px system-ui;color:#00f2ea;margin-bottom:8px">Remove</div>' +
      '<div id="rr-status" style="font:12px/1.4 system-ui;color:#eee;min-height:48px">Menyiapkan…</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button id="rr-stop" style="flex:1;padding:8px;border:0;border-radius:8px;background:#ff0050;color:#fff;font-weight:600;cursor:pointer">Stop</button>' +
      "</div>";
    Object.assign(panel.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      width: "300px",
      zIndex: "2147483647",
      background: "#0d0d0d",
      border: "1px solid #2a2a2a",
      borderLeft: "3px solid #00f2ea",
      borderRadius: "12px",
      padding: "12px 14px",
      boxShadow: "0 12px 40px rgba(0,0,0,.5)",
    });
    document.documentElement.appendChild(panel);
    panel.querySelector("#rr-stop").onclick = () => {
      stopped = true;
      setStatus("Dihentikan.");
      report({ status: "stopped" });
    };
    return panel;
  }

  function setStatus(t) {
    ensurePanel();
    const title = panel.querySelector("#rr-title");
    if (title) title.textContent = labels().title;
    const el = panel.querySelector("#rr-status");
    if (el) el.textContent = t;
  }

  function closePanel(delayMs = 1800) {
    window.setTimeout(() => {
      const el =
        panel && document.contains(panel)
          ? panel
          : document.getElementById("rr-tiktok-panel");
      if (el) el.remove();
      panel = null;
    }, delayMs);
  }

  function pickSecUid(configured) {
    if (configured && configured.startsWith("MS4wLjABAAAA")) return configured;
    const html = document.documentElement.innerHTML;
    const m =
      html.match(/"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/) ||
      html.match(/secUid=(MS4wLjABAAAA[A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }

  function flagOrNull(v) {
    if (v == null) return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "" || s === "0" || s === "false") return false;
      return true;
    }
    return Boolean(v);
  }

  function normalizeCursor(raw) {
    if (raw == null || raw === "") return null;
    const s = String(raw);
    if (s === "-1") return null;
    return s;
  }

  function isRateLimited(text, status) {
    if (status === 429) return true;
    return /ratelimit/i.test(String(text || ""));
  }

  function rateLimitError(path) {
    return new Error(
      "TikTok rate-limit di " +
        path +
        ". Tunggu 1–2 menit, turunkan kecepatan ke Aman, lalu Start lagi.",
    );
  }

  function parseApiJson(text, path, status) {
    const raw = String(text || "").trim();
    if (!raw) throw new Error("Respons kosong dari " + path);
    if (isRateLimited(raw, status)) throw rateLimitError(path);
    try {
      return JSON.parse(raw);
    } catch {
      const preview = raw.slice(0, 80).replace(/\s+/g, " ");
      throw new Error(
        "Respons bukan JSON dari " + path + ": " + preview,
      );
    }
  }

  async function listPageOnce(secUid, cursor) {
    const path =
      activeMode === "favorite"
        ? "/api/user/collect/item_list/"
        : activeMode === "like"
          ? "/api/favorite/item_list/"
          : "/api/repost/item_list/";

    const params = new URLSearchParams({
      aid: "1988",
      count: "30",
      coverFormat: "2",
      cursor: String(cursor),
      secUid,
    });

    if (activeMode === "repost" || activeMode === "like") {
      params.set("needPinnedItemIds", "true");
      params.set("post_item_list_request_type", "0");
    }

    const res = await fetch(path + "?" + params.toString(), {
      method: "GET",
      headers: { accept: "*/*" },
      credentials: "include",
    });
    const text = await res.text();
    const json = parseApiJson(text, path, res.status);
    const code = json.status_code ?? json.statusCode;
    if (code != null && code !== 0) {
      const msg = String(json.status_msg || json.statusMsg || "");
      if (isRateLimited(msg, res.status)) throw rateLimitError(path);
      throw new Error("status_code " + code + ": " + msg);
    }

    const rawItems = json.itemList || json.item_list || [];
    const items = rawItems
      .filter((e) => e && (e.id != null || e.aweme_id != null))
      .map((e) => ({
        id: String(e.id != null ? e.id : e.aweme_id),
        author: e.author?.uniqueId
          ? "@" + e.author.uniqueId
          : e.author?.unique_id
            ? "@" + e.author.unique_id
            : "@unknown",
        createTime:
          e.createTime != null
            ? String(e.createTime)
            : e.create_time != null
              ? String(e.create_time)
              : null,
      }));

    let nextCursor = normalizeCursor(
      json.cursor ?? json.maxCursor ?? json.max_cursor,
    );
    // Some collect responses omit cursor — fall back to last item timestamp
    if (!nextCursor && items.length) {
      const lastTs = items[items.length - 1].createTime;
      if (lastTs && lastTs !== String(cursor)) nextCursor = lastTs;
    }

    const explicitMore = flagOrNull(
      json.hasMore ??
        json.has_more ??
        json.hasMoreOfLoadMore ??
        json.has_more_of_load_more,
    );
    // TikTok sometimes omits hasMore on collect; a full-ish page + new cursor ⇒ more
    const hasMore =
      explicitMore != null
        ? explicitMore
        : Boolean(
            nextCursor &&
              nextCursor !== String(cursor) &&
              items.length >= 15,
          );

    return { items, hasMore, cursor: nextCursor };
  }

  async function listPage(secUid, cursor) {
    const waits = [4000, 8000, 15000];
    let lastErr = null;
    for (let attempt = 0; attempt <= waits.length; attempt++) {
      if (stopped) throw new Error("Dihentikan.");
      try {
        return await listPageOnce(secUid, cursor);
      } catch (e) {
        lastErr = e;
        const msg = e && e.message ? e.message : String(e);
        const retryable = /rate-limit|ratelimit/i.test(msg);
        if (!retryable || attempt >= waits.length) throw e;
        const wait = waits[attempt];
        setStatus(
          "Rate-limit TikTok — menunggu " +
            Math.round(wait / 1000) +
            "s lalu coba lagi…",
        );
        report({
          status: "listing",
        });
        await sleep(wait);
      }
    }
    throw lastErr || new Error("Gagal memuat daftar.");
  }

  function getCookie(name) {
    try {
      const parts = ("; " + (document.cookie || "")).split("; " + name + "=");
      if (parts.length === 2)
        return decodeURIComponent((parts[1].split(";")[0] || "").trim());
    } catch {
      // ignore
    }
    return "";
  }

  function getCsrfToken() {
    return getCookie("tt_csrf_token") || getCookie("tt-csrf-token") || "";
  }

  /** TikTok may send status_code (snake) or statusCode (camel). */
  function apiStatus(json) {
    if (!json || typeof json !== "object")
      return { ok: false, msg: "empty json" };
    const code = json.status_code ?? json.statusCode;
    if (code == null) return { ok: false, msg: "no status_code in response" };
    if (Number(code) === 0) return { ok: true, msg: "" };
    return {
      ok: false,
      msg: json.status_msg || json.statusMsg || "status_code " + code,
    };
  }

  async function removeRepost(itemId) {
    const params = new URLSearchParams({
      aid: "1988",
      item_id: String(itemId),
    });
    const csrf = getCsrfToken();
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      accept: "*/*",
    };
    if (csrf) headers["tt-csrf-token"] = csrf;

    const res = await fetch("/tiktok/v1/upvote/delete?" + params.toString(), {
      method: "POST",
      headers,
      body: "",
      credentials: "include",
    });
    const text = await res.text();
    let json;
    try {
      json = parseApiJson(text, "/tiktok/v1/upvote/delete", res.status);
    } catch (e) {
      throw e;
    }
    const st = apiStatus(json);
    if (!st.ok) {
      if (isRateLimited(st.msg, res.status)) {
        throw rateLimitError("/tiktok/v1/upvote/delete");
      }
      throw new Error(st.msg || "gagal hapus " + itemId);
    }
  }

  /**
   * Unlike via background → MAIN world (proven digg type=0 pattern).
   */
  async function removeLike(itemId) {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "UNDIGG", itemId: String(itemId) },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              ok: false,
              error: chrome.runtime.lastError.message || "extension error",
            });
            return;
          }
          resolve(response || { ok: false, error: "no response" });
        },
      );
    });
    if (!res?.ok) {
      throw new Error(res?.error || "gagal hapus like " + itemId);
    }
  }

  /**
   * Uncollect via background → MAIN world (csrf from __$UNIVERSAL_DATA$,
   * full query params — same pattern as working unlike/digg).
   */
  async function removeFavorite(itemId) {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "UNCOLLECT", itemId: String(itemId) },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              ok: false,
              error: chrome.runtime.lastError.message || "extension error",
            });
            return;
          }
          resolve(response || { ok: false, error: "no response" });
        },
      );
    });
    if (!res?.ok) {
      throw new Error(res?.error || "gagal hapus favorite " + itemId);
    }
  }

  async function removeOne(itemId) {
    if (activeMode === "like") return removeLike(itemId);
    if (activeMode === "favorite") return removeFavorite(itemId);
    return removeRepost(itemId);
  }

  function profileUrl(uniqueId) {
    if (activeMode === "favorite") {
      return "https://www.tiktok.com/@" + uniqueId + "?lang=en";
    }
    // Like + repost: profile root (same as repost). `/liked` redirects to /foryou.
    return "https://www.tiktok.com/@" + uniqueId;
  }

  async function run({ uniqueId, secUid: secUidHint, delayMs, mode }) {
    const myGen = ++runGeneration;
    stopped = false;
    activeMode = normalizeMode(mode);
    ensurePanel();
    setStatus("Menyiapkan… (" + labels().noun + ")");

    if (uniqueId) {
      const path = "/@" + uniqueId;
      const pathname = (location.pathname || "").toLowerCase();
      const onProfile = pathname.includes(path.toLowerCase());
      // Never stay on /liked (TikTok redirects private liked → /foryou)
      // or /foryou — always need the profile root for secUid.
      const onBadRoute =
        /\/foryou/i.test(pathname) ||
        /\/@[^/]+\/liked/i.test(pathname) ||
        (activeMode === "favorite" &&
          /\/@[^/]+\/(repost|reposting|liked)/i.test(pathname));
      if (!onProfile || onBadRoute) {
        setStatus("Membuka profil @" + uniqueId + "…");
        report({ status: "navigating" });
        chrome.storage.session.set({
          rrPendingRun: {
            uniqueId,
            secUid: secUidHint,
            delayMs,
            mode: activeMode,
          },
        });
        location.href = profileUrl(uniqueId);
        return;
      }
    }

    if (myGen !== runGeneration) return;

    setStatus("Mencari secUid…");
    report({ status: "listing", progress: { page: 0, listed: 0 } });
    await sleep(800);
    if (myGen !== runGeneration) return;
    const secUid = pickSecUid(secUidHint);
    if (!secUid) {
      const err = "secUid tidak ditemukan. Login & buka profil sendiri.";
      setStatus(err);
      report({ status: "error", error: err });
      return;
    }

    const noun = labels().listing;
    const all = [];
    const seen = new Set();
    let cursor = "0";
    for (let page = 1; page <= 200; page++) {
      if (stopped) {
        report({ status: "stopped", progress: { listed: all.length, page } });
        closePanel(2500);
        return;
      }
      const pageData = await listPage(secUid, cursor);
      let added = 0;
      for (const item of pageData.items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        all.push(item);
        added++;
      }
      setStatus("Memuat " + page + " · total " + all.length + " " + noun);
      report({
        status: "listing",
        progress: { page, listed: all.length, total: all.length },
      });

      const next = pageData.cursor;
      // Stop: no new items, no more flag, cursor missing/stuck, or cursor == -1
      if (!added) break;
      if (!pageData.hasMore) break;
      if (!next || next === cursor) break;
      cursor = next;
      await sleep(Math.min(delayMs, 1200));
    }

    if (!all.length) {
      setStatus(labels().empty);
      report({
        status: "done",
        progress: { total: 0, done: 0, failed: 0, listed: 0 },
      });
      closePanel();
      return;
    }

    let ok = 0;
    let fail = 0;
    report({
      status: "removing",
      progress: { total: all.length, done: 0, failed: 0, listed: all.length },
    });

    for (let i = 0; i < all.length; i++) {
      if (stopped) {
        setStatus(
          "Stop. OK " + ok + " · gagal " + fail + " · sisa " + (all.length - i),
        );
        report({
          status: "stopped",
          progress: {
            total: all.length,
            done: ok,
            failed: fail,
            listed: all.length,
          },
        });
        closePanel(2500);
        return;
      }
      const item = all[i];
      try {
        await removeOne(item.id);
        ok++;
        setStatus(
          "Hapus " +
            (i + 1) +
            "/" +
            all.length +
            " · " +
            item.author +
            " · OK " +
            ok,
        );
      } catch (e) {
        fail++;
        setStatus(
          "Gagal " +
            (i + 1) +
            "/" +
            all.length +
            ": " +
            (e && e.message ? e.message : e),
        );
      }
      report({
        status: "removing",
        progress: {
          total: all.length,
          done: ok,
          failed: fail,
          listed: all.length,
        },
      });
      await sleep(delayMs);
    }

    setStatus("Selesai. Berhasil " + ok + ", gagal " + fail + ".");
    report({
      status: "done",
      progress: {
        total: all.length,
        done: ok,
        failed: fail,
        listed: all.length,
      },
    });
    closePanel();
  }

  function handleMessage(msg, _sender, sendResponse) {
    if (msg?.type === "RR_PING_CS") {
      sendResponse({
        ok: true,
        version: CS_VERSION,
        modes: ["repost", "like", "favorite"],
        mode: activeMode,
      });
      return true;
    }
    if (msg?.type === "RR_STOP") {
      stopped = true;
      setStatus("Dihentikan.");
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "RR_RUN") {
      const mode = normalizeMode(msg.mode);
      run({
        uniqueId: msg.uniqueId,
        secUid: msg.secUid,
        delayMs: msg.delayMs || 1500,
        mode,
      }).catch((e) => {
        const err = e instanceof Error ? e.message : String(e);
        setStatus("Error: " + err);
        report({ status: "error", error: err });
      });
      sendResponse({ ok: true, mode });
      return true;
    }
    if (msg?.type === "RR_STATE") {
      sendResponse({ ok: true });
      return true;
    }
    return false;
  }

  // Latest inject wins — single listener delegates here.
  window.__rrTikTokApi = {
    version: CS_VERSION,
    handleMessage,
    normalizeMode,
  };
  window.__rrTikTokVersion = CS_VERSION;
  window.__rrTikTokLoaded = true;

  const firstLoad = !window.__rrTikTokListening;
  if (firstLoad) {
    window.__rrTikTokListening = true;
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      const api = window.__rrTikTokApi;
      if (!api?.handleMessage) return false;
      return api.handleMessage(msg, sender, sendResponse);
    });

    chrome.storage.session.get(["rrPendingRun"]).then((data) => {
      const pending = data.rrPendingRun;
      if (!pending) return;
      if (window.__rrTikTokApi?.version !== CS_VERSION) return;
      chrome.storage.session.remove("rrPendingRun");
      const mode = normalizeMode(pending.mode);
      run({ ...pending, mode }).catch((e) => {
        const err = e instanceof Error ? e.message : String(e);
        report({ status: "error", error: err });
      });
    });
  }
})();
