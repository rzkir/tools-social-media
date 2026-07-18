/**
 * Runs on tiktok.com — list + remove reposts OR favorites (same-origin fetch).
 * Modes: "repost" | "favorite"
 */
(() => {
  if (window.__rrTikTokLoaded) return;
  window.__rrTikTokLoaded = true;

  let stopped = false;
  let panel = null;
  let activeMode = "repost";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const LABELS = {
    repost: {
      title: "Remove Repost",
      noun: "repost",
      listing: "repost",
      empty: "Tidak ada repost.",
    },
    favorite: {
      title: "Remove Favorite",
      noun: "favorite",
      listing: "favorite",
      empty: "Tidak ada favorite.",
    },
  };

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

  async function listPage(secUid, cursor) {
    const path =
      activeMode === "favorite"
        ? "/api/user/collect/item_list/"
        : "/api/repost/item_list/";

    const params = new URLSearchParams({
      aid: "1988",
      count: "30",
      coverFormat: "2",
      cursor: String(cursor),
      secUid,
    });

    if (activeMode === "repost") {
      params.set("needPinnedItemIds", "true");
      params.set("post_item_list_request_type", "0");
    }

    const res = await fetch(path + "?" + params.toString(), {
      method: "GET",
      headers: { accept: "*/*" },
      credentials: "include",
    });
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong dari " + path);
    const json = JSON.parse(text);
    if (json.status_code != null && json.status_code !== 0) {
      throw new Error(
        "status_code " + json.status_code + ": " + (json.status_msg || ""),
      );
    }
    const items = (json.itemList || []).map((e) => ({
      id: String(e.id),
      author: e.author?.uniqueId ? "@" + e.author.uniqueId : "@unknown",
    }));
    return {
      items,
      hasMore: !!json.hasMore,
      cursor: json.cursor != null ? String(json.cursor) : null,
    };
  }

  async function removeRepost(itemId) {
    const params = new URLSearchParams({
      aid: "1988",
      item_id: String(itemId),
    });
    const res = await fetch("/tiktok/v1/upvote/delete?" + params.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "*/*",
      },
      body: "",
      credentials: "include",
    });
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong saat hapus " + itemId);
    const json = JSON.parse(text);
    if (json.status_code != null && json.status_code !== 0) {
      throw new Error(json.status_msg || "gagal hapus " + itemId);
    }
  }

  /** Uncollect / remove from Favorites. */
  async function removeFavorite(itemId) {
    const attempts = [
      {
        url: "/api/commit/item/collect/",
        params: { aid: "1988", itemId: String(itemId), type: "0" },
      },
      {
        url: "/api/commit/item/collect/",
        params: { aid: "1988", itemId: String(itemId), actionType: "0" },
      },
      {
        url: "/tiktok/v1/item/collect/",
        params: { aid: "1988", item_id: String(itemId), action_type: "0" },
      },
    ];

    let lastErr = "gagal hapus favorite " + itemId;
    for (const attempt of attempts) {
      const qs = new URLSearchParams(attempt.params);
      const res = await fetch(attempt.url + "?" + qs.toString(), {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          accept: "*/*",
        },
        body: "",
        credentials: "include",
      });
      const text = await res.text();
      if (!text.trim()) {
        lastErr = "Respons kosong dari " + attempt.url;
        continue;
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        lastErr = "JSON invalid dari " + attempt.url;
        continue;
      }
      if (json.status_code == null || json.status_code === 0) return;
      lastErr = json.status_msg || "status_code " + json.status_code;
    }
    throw new Error(lastErr);
  }

  async function removeOne(itemId) {
    if (activeMode === "favorite") return removeFavorite(itemId);
    return removeRepost(itemId);
  }

  function profileUrl(uniqueId) {
    if (activeMode === "favorite") {
      return "https://www.tiktok.com/@" + uniqueId + "?lang=en";
    }
    return "https://www.tiktok.com/@" + uniqueId;
  }

  async function run({ uniqueId, secUid: secUidHint, delayMs, mode }) {
    stopped = false;
    activeMode = mode === "favorite" ? "favorite" : "repost";
    ensurePanel();
    setStatus("Menyiapkan…");

    if (uniqueId) {
      const path = "/@" + uniqueId;
      if (!location.pathname.toLowerCase().includes(path.toLowerCase())) {
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

    setStatus("Mencari secUid…");
    report({ status: "listing", progress: { page: 0, listed: 0 } });
    await sleep(800);
    const secUid = pickSecUid(secUidHint);
    if (!secUid) {
      const err = "secUid tidak ditemukan. Login & buka profil sendiri.";
      setStatus(err);
      report({ status: "error", error: err });
      return;
    }

    const noun = labels().listing;
    const all = [];
    let cursor = "0";
    for (let page = 1; page <= 200; page++) {
      if (stopped) {
        report({ status: "stopped", progress: { listed: all.length, page } });
        closePanel(2500);
        return;
      }
      const pageData = await listPage(secUid, cursor);
      all.push(...pageData.items);
      setStatus("Memuat " + page + " · total " + all.length + " " + noun);
      report({
        status: "listing",
        progress: { page, listed: all.length, total: all.length },
      });
      if (!pageData.hasMore || !pageData.cursor) break;
      cursor = pageData.cursor;
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

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "RR_PING_CS") {
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "RR_STOP") {
      stopped = true;
      setStatus("Dihentikan.");
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "RR_RUN") {
      run({
        uniqueId: msg.uniqueId,
        secUid: msg.secUid,
        delayMs: msg.delayMs || 1500,
        mode: msg.mode || "repost",
      }).catch((e) => {
        const err = e instanceof Error ? e.message : String(e);
        setStatus("Error: " + err);
        report({ status: "error", error: err });
      });
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "RR_STATE") {
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });

  chrome.storage.session.get(["rrPendingRun"]).then((data) => {
    const pending = data.rrPendingRun;
    if (!pending) return;
    chrome.storage.session.remove("rrPendingRun");
    run(pending).catch((e) => {
      const err = e instanceof Error ? e.message : String(e);
      report({ status: "error", error: err });
    });
  });
})();
