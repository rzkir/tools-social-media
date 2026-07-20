/**
 * Build a one-shot console script that runs on https://www.tiktok.com
 * (same-origin fetch — bypasses server anti-bot empty responses).
 */
export function buildTikTokBrowserScript(options: {
	secUid?: string;
	uniqueId?: string;
	delayMs: number;
}): string {
	const secUid = JSON.stringify(options.secUid?.trim() || "");
	const uniqueId = JSON.stringify(
		options.uniqueId?.trim().replace(/^@/, "") || "",
	);
	const delayMs = Math.max(500, Math.floor(options.delayMs));

	return `(() => {
  const CONFIG = {
    secUid: ${secUid},
    uniqueId: ${uniqueId},
    delayMs: ${delayMs},
    maxPages: 200,
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
    if (res.status === 429 || /ratelimit/i.test(text)) {
      throw new Error(
        "TikTok rate-limit. Tunggu 1–2 menit, turunkan kecepatan, lalu coba lagi.",
      );
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Respons bukan JSON: " + text.slice(0, 80));
    }
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
    if (res.status === 429 || /ratelimit/i.test(text)) {
      throw new Error("TikTok rate-limit saat hapus. Tunggu sebentar lalu lanjut.");
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Respons bukan JSON: " + text.slice(0, 80));
    }
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
      '<div id="rr-status" style="font:12px/1.4 system-ui;color:#eee;min-height:48px">Menyiapkan…</div>' +
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
      alert("Buka tab https://www.tiktok.com/@username dulu (harus login), baru paste script di Console.");
      return;
    }

    if (CONFIG.uniqueId) {
      const path = "/@" + CONFIG.uniqueId;
      if (!location.pathname.toLowerCase().includes(path.toLowerCase())) {
        alert(
          "Kamu belum di halaman profil @" + CONFIG.uniqueId + ".\\n\\n" +
          "1) Buka https://www.tiktok.com/@" + CONFIG.uniqueId + "\\n" +
          "2) Pastikan login\\n" +
          "3) Paste script lagi di Console"
        );
        return;
      }
    }

    const panel = ensurePanel();
    const set = (t) => {
      const el = panel.querySelector("#rr-status");
      if (el) el.textContent = t;
    };
    let stopped = false;
    panel.querySelector("#rr-stop").onclick = () => { stopped = true; set("Dihentikan."); };
    panel.querySelector("#rr-close").onclick = () => panel.remove();

    set("Mencari secUid…");
    await sleep(600);
    const secUid = pickSecUidFromPage();
    if (!secUid) {
      set("secUid tidak ditemukan. Pastikan kamu login & di halaman profil sendiri, lalu paste ulang.");
      return;
    }

    set("Memuat daftar repost…");
    const all = [];
    let cursor = "0";
    for (let page = 1; page <= CONFIG.maxPages; page++) {
      if (stopped) return;
      const pageData = await listPage(secUid, cursor);
      all.push(...pageData.items);
      set("Memuat " + page + " · total " + all.length + " repost");
      if (!pageData.hasMore || !pageData.cursor) break;
      cursor = pageData.cursor;
      await sleep(Math.min(CONFIG.delayMs, 1200));
    }

    if (!all.length) {
      set("Tidak ada repost. Cek tab Repost di profil TikTok.");
      return;
    }

    set("Siap hapus " + all.length + " repost. Mulai…");
    await sleep(800);

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < all.length; i++) {
      if (stopped) {
        set("Stop. OK " + ok + " · gagal " + fail + " · sisa " + (all.length - i));
        return;
      }
      const item = all[i];
      try {
        await removeOne(item.id);
        ok++;
        set("Hapus " + (i + 1) + "/" + all.length + " · " + item.author + " · OK " + ok);
      } catch (e) {
        fail++;
        set("Gagal " + (i + 1) + "/" + all.length + ": " + (e && e.message ? e.message : e));
      }
      await sleep(CONFIG.delayMs);
    }
    set("Selesai. Berhasil " + ok + ", gagal " + fail + ".");
  }

  run().catch((e) => alert(String(e && e.message ? e.message : e)));
})();`;
}

/** Build a console script for removing Instagram reposts on instagram.com. */
export function buildInstagramRepostScript(options: {
	username?: string;
	userId?: string;
	delayMs: number;
}): string {
	const username = JSON.stringify(
		options.username?.trim().replace(/^@/, "") || "",
	);
	const userId = JSON.stringify(options.userId?.trim() || "");
	const delayMs = Math.max(500, Math.floor(options.delayMs));

	return `(() => {
  const CONFIG = {
    username: ${username},
    userId: ${userId},
    delayMs: ${delayMs},
    maxPages: 50,
    igAppId: "936619673304451",
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  function igHeaders() {
    const csrftoken = getCookie("csrftoken");
    if (!csrftoken) throw new Error("csrftoken tidak ditemukan. Login dulu di instagram.com.");
    return {
      accept: "*/*",
      "x-csrftoken": csrftoken,
      "x-ig-app-id": CONFIG.igAppId,
      "x-requested-with": "XMLHttpRequest",
      "content-type": "application/x-www-form-urlencoded",
    };
  }

  async function readJson(res, label) {
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong dari " + label);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(label + " bukan JSON (HTTP " + res.status + "): " + text.slice(0, 120));
    }
  }

  async function getCurrentUser() {
    const res = await fetch("/api/v1/accounts/current_user/?edit=true", {
      headers: igHeaders(),
      credentials: "include",
    });
    const json = await readJson(res, "current_user");
    const user = json.user;
    if (!user) throw new Error("Session tidak valid. Login ulang di instagram.com.");
    return user;
  }

  async function listRepostsPage(userPk, maxId) {
    const params = new URLSearchParams();
    if (maxId) params.set("max_id", String(maxId));
    const paths = [
      "/api/v1/users/" + userPk + "/reposts/?" + params.toString(),
      "/api/v1/clips/user/reposts/?target_user_id=" + userPk + (maxId ? "&max_id=" + encodeURIComponent(maxId) : ""),
    ];
    let lastErr = null;
    for (const path of paths) {
      try {
        const res = await fetch(path, {
          headers: igHeaders(),
          credentials: "include",
        });
        const json = await readJson(res, path);
        const items =
          json.items ||
          json.medias ||
          json.data?.items ||
          json.data?.medias ||
          [];
        const next =
          json.next_max_id ||
          json.paging_info?.max_id ||
          json.more_available && json.next_max_id
            ? json.next_max_id
            : null;
        if (Array.isArray(items)) {
          return { items, nextMaxId: next || null };
        }
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Tidak bisa memuat daftar repost.");
  }

  function mediaPk(item) {
    return String(
      item.pk ||
        item.id ||
        item.media?.pk ||
        item.media?.id ||
        item.media_id ||
        "",
    ).trim();
  }

  async function unrepostOne(mediaPkValue) {
    const pk = String(mediaPkValue || "").trim();
    if (!pk) throw new Error("media pk kosong");
    const attempts = [
      {
        url: "/api/v1/media/" + pk + "/delete_repost/",
        method: "POST",
        body: "",
      },
      {
        url: "/api/v1/media/" + pk + "/unrepost/",
        method: "POST",
        body: "",
      },
      {
        url: "/api/v1/media/" + pk + "/repost/",
        method: "DELETE",
        body: null,
      },
    ];
    let lastErr = null;
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: igHeaders(),
          credentials: "include",
          body: attempt.body,
        });
        const json = await readJson(res, attempt.url);
        if (json.status === "ok" || res.ok) return true;
        lastErr = new Error(json.message || "gagal unrepost " + pk);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("gagal unrepost " + pk);
  }

  function ensurePanel() {
    let panel = document.getElementById("rr-ig-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "rr-ig-panel";
    panel.innerHTML =
      '<div style="font:600 13px system-ui;color:#f472b6;margin-bottom:8px">Remove IG Repost</div>' +
      '<div id="rr-ig-status" style="font:12px/1.4 system-ui;color:#eee;min-height:48px">Menyiapkan…</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
      '<button id="rr-ig-stop" style="flex:1;padding:8px;border:0;border-radius:8px;background:#db2777;color:#fff;font-weight:600;cursor:pointer">Stop</button>' +
      '<button id="rr-ig-close" style="padding:8px 10px;border:1px solid #333;border-radius:8px;background:#111;color:#aaa;cursor:pointer">✕</button>' +
      "</div>";
    Object.assign(panel.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      width: "320px",
      zIndex: "2147483647",
      background: "#0d0d0d",
      border: "1px solid #2a2a2a",
      borderLeft: "3px solid #f472b6",
      borderRadius: "12px",
      padding: "12px 14px",
      boxShadow: "0 12px 40px rgba(0,0,0,.5)",
    });
    document.documentElement.appendChild(panel);
    return panel;
  }

  async function run() {
    if (!location.hostname.includes("instagram.com")) {
      alert("Buka tab https://www.instagram.com dulu (harus login), baru paste script di Console.");
      return;
    }

    if (CONFIG.username) {
      const path = "/" + CONFIG.username + "/";
      if (!location.pathname.toLowerCase().includes("/" + CONFIG.username.toLowerCase())) {
        alert(
          "Kamu belum di halaman profil @" + CONFIG.username + ".\\n\\n" +
          "1) Buka https://www.instagram.com/" + CONFIG.username + "/\\n" +
          "2) Pastikan login\\n" +
          "3) Paste script lagi di Console"
        );
        return;
      }
    }

    const panel = ensurePanel();
    const set = (t) => {
      const el = panel.querySelector("#rr-ig-status");
      if (el) el.textContent = t;
    };
    let stopped = false;
    panel.querySelector("#rr-ig-stop").onclick = () => { stopped = true; set("Dihentikan."); };
    panel.querySelector("#rr-ig-close").onclick = () => panel.remove();

    set("Memverifikasi session…");
    const me = await getCurrentUser();
    const userPk = String(CONFIG.userId || me.pk || me.id || "").trim();
    const handle = String(me.username || CONFIG.username || "").trim();
    if (CONFIG.username && handle && handle.toLowerCase() !== CONFIG.username.toLowerCase()) {
      throw new Error("Login sebagai @" + handle + ", bukan @" + CONFIG.username + ".");
    }
    if (!userPk) throw new Error("User ID tidak ditemukan dari session.");

    const all = [];
    let maxId = null;
    for (let page = 1; page <= CONFIG.maxPages; page++) {
      if (stopped) return;
      set("Memuat repost halaman " + page + "…");
      const pageData = await listRepostsPage(userPk, maxId);
      const batch = (pageData.items || []).map((item) => ({
        pk: mediaPk(item),
        code: item.code || item.media?.code || "",
      })).filter((item) => item.pk);
      all.push(...batch);
      set("Memuat " + page + " · total " + all.length + " repost");
      if (!pageData.nextMaxId || !batch.length) break;
      maxId = pageData.nextMaxId;
      await sleep(Math.min(CONFIG.delayMs, 1200));
    }

    const unique = [];
    const seen = new Set();
    for (const item of all) {
      if (!item.pk || seen.has(item.pk)) continue;
      seen.add(item.pk);
      unique.push(item);
    }

    if (!unique.length) {
      set("Tidak ada repost ditemukan. Buka tab Repost di profil Instagram lalu coba lagi.");
      return;
    }

    set("Siap hapus " + unique.length + " repost. Mulai…");
    await sleep(800);

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < unique.length; i++) {
      if (stopped) {
        set("Stop. OK " + ok + " · gagal " + fail + " · sisa " + (unique.length - i));
        return;
      }
      const item = unique[i];
      try {
        await unrepostOne(item.pk);
        ok++;
        set("Hapus " + (i + 1) + "/" + unique.length + " · " + (item.code || item.pk) + " · OK " + ok);
      } catch (e) {
        fail++;
        set("Gagal " + (i + 1) + "/" + unique.length + ": " + (e && e.message ? e.message : e));
      }
      await sleep(CONFIG.delayMs);
    }
    set("Selesai. Berhasil " + ok + ", gagal " + fail + ".");
  }

  run().catch((e) => alert(String(e && e.message ? e.message : e)));
})();`;
}
