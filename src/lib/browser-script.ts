/**
 * Build a one-shot console script that runs on https://www.tiktok.com
 * (same-origin fetch — bypasses server anti-bot empty responses).
 */
export function buildTikTokBrowserScript(options: {
  secUid?: string
  uniqueId?: string
  delayMs: number
}): string {
  const secUid = JSON.stringify(options.secUid?.trim() || '')
  const uniqueId = JSON.stringify(options.uniqueId?.trim().replace(/^@/, '') || '')
  const delayMs = Math.max(500, Math.floor(options.delayMs))

  return `(() => {
  const CONFIG = {
    secUid: ${secUid},
    uniqueId: ${uniqueId},
    delayMs: ${delayMs},
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function pickSecUidFromPage() {
    if (CONFIG.secUid && CONFIG.secUid.startsWith("MS4wLjABAAAA")) return CONFIG.secUid;
    const html = document.documentElement.innerHTML;
    const m =
      html.match(/"secUid"\\s*:\\s*"(MS4wLjABAAAA[^"]+)"/) ||
      html.match(/secUid=(MS4wLjABAAAA[A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }

  async function listPage(secUid, cursor) {
    const params = new URLSearchParams({
      aid: "1988",
      count: "30",
      coverFormat: "2",
      cursor: String(cursor),
      needPinnedItemIds: "true",
      post_item_list_request_type: "0",
      secUid,
    });
    const res = await fetch("/api/repost/item_list/?" + params.toString(), {
      method: "GET",
      headers: { accept: "*/*" },
      credentials: "include",
    });
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong dari /api/repost/item_list/");
    const json = JSON.parse(text);
    if (json.status_code != null && json.status_code !== 0) {
      throw new Error("status_code " + json.status_code + ": " + (json.status_msg || ""));
    }
    const items = (json.itemList || []).map((e) => ({
      id: String(e.id),
      author: e.author && e.author.uniqueId ? "@" + e.author.uniqueId : "@unknown",
      desc: e.desc || "",
    }));
    return {
      items,
      hasMore: !!json.hasMore,
      cursor: json.cursor != null ? String(json.cursor) : null,
    };
  }

  async function removeOne(itemId) {
    const params = new URLSearchParams({ aid: "1988", item_id: String(itemId) });
    const res = await fetch("/tiktok/v1/upvote/delete?" + params.toString(), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "*/*" },
      body: "",
      credentials: "include",
    });
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong saat hapus " + itemId);
    const json = JSON.parse(text);
    if (json.status_code != null && json.status_code !== 0) {
      throw new Error(json.status_msg || ("gagal hapus " + itemId));
    }
  }

  function ensurePanel() {
    let panel = document.getElementById("rr-tiktok-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "rr-tiktok-panel";
    panel.innerHTML =
      '<div style="font:600 13px system-ui;color:#00f2ea;margin-bottom:8px">Remove Repost</div>' +
      '<div id="rr-status" style="font:12px/1.4 system-ui;color:#eee;min-height:40px">Menyiapkan…</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button id="rr-stop" style="flex:1;padding:8px;border:0;border-radius:8px;background:#ff0050;color:#fff;font-weight:600;cursor:pointer">Stop</button>' +
      '<button id="rr-close" style="padding:8px 10px;border:1px solid #333;border-radius:8px;background:#111;color:#aaa;cursor:pointer">✕</button>' +
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
    return panel;
  }

  async function run() {
    if (!location.hostname.includes("tiktok.com")) {
      alert("Jalankan script ini di tab https://www.tiktok.com (buka profilmu dulu).");
      return;
    }

    const panel = ensurePanel();
    const status = () => panel.querySelector("#rr-status");
    const set = (t) => { const el = status(); if (el) el.textContent = t; };
    let stopped = false;
    panel.querySelector("#rr-stop").onclick = () => { stopped = true; set("Dihentikan."); };
    panel.querySelector("#rr-close").onclick = () => panel.remove();

    if (CONFIG.uniqueId) {
      const path = "/@" + CONFIG.uniqueId;
      if (!location.pathname.includes(path)) {
        set("Membuka profil @" + CONFIG.uniqueId + "…");
        location.href = "https://www.tiktok.com/@" + CONFIG.uniqueId;
        return;
      }
    }

    set("Mencari secUid…");
    await sleep(800);
    const secUid = pickSecUidFromPage();
    if (!secUid) {
      set("secUid tidak ditemukan. Buka profilmu, lalu jalankan script lagi.");
      return;
    }

    set("Mengambil daftar repost…");
    const all = [];
    let cursor = "0";
    for (let page = 1; page <= 80; page++) {
      if (stopped) return;
      const pageData = await listPage(secUid, cursor);
      all.push(...pageData.items);
      set("Halaman " + page + " · total " + all.length + " repost");
      if (!pageData.hasMore || !pageData.cursor) break;
      cursor = pageData.cursor;
      await sleep(CONFIG.delayMs);
    }

    if (!all.length) {
      set("Tidak ada repost ditemukan.");
      return;
    }

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < all.length; i++) {
      if (stopped) {
        set("Stop. Berhasil " + ok + " / gagal " + fail + " / sisa " + (all.length - i));
        return;
      }
      const item = all[i];
      try {
        await removeOne(item.id);
        ok++;
        set("Hapus " + (i + 1) + "/" + all.length + " · " + item.author + " · OK " + ok);
      } catch (e) {
        fail++;
        set("Gagal " + item.id + ": " + (e && e.message ? e.message : e));
      }
      await sleep(CONFIG.delayMs);
    }
    set("Selesai. Berhasil " + ok + ", gagal " + fail + ".");
  }

  run().catch((e) => alert(String(e && e.message ? e.message : e)));
})();`
}
