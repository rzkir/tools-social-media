(() => {
  const CS_VERSION = 1;
  const IG_APP_ID = "936619673304451";

  let stopped = false;
  let panel = null;
  let runGeneration = 0;
  /** @type {null | ((value: { limit: number, cancelled?: boolean }) => void)} */
  let confirmResolve = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function waitForConfirmLimit() {
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function resolveConfirm(payload) {
    if (!confirmResolve) return false;
    const fn = confirmResolve;
    confirmResolve = null;
    fn(payload);
    return true;
  }

  function report(payload) {
    try {
      chrome.runtime.sendMessage(
        { type: "PROGRESS", mode: "repost", platform: "instagram", ...payload },
        () => void chrome.runtime.lastError,
      );
    } catch {
      // ignore
    }
  }

  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  function igHeaders(extra) {
    const csrftoken = getCookie("csrftoken");
    if (!csrftoken) {
      throw new Error(
        "csrftoken tidak ditemukan. Login dulu di instagram.com.",
      );
    }
    return {
      accept: "*/*",
      "x-csrftoken": csrftoken,
      "x-ig-app-id": IG_APP_ID,
      "x-requested-with": "XMLHttpRequest",
      "content-type": "application/x-www-form-urlencoded",
      ...(extra || {}),
    };
  }

  async function readJson(res, label) {
    const text = await res.text();
    if (!text.trim()) throw new Error("Respons kosong dari " + label);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        label + " bukan JSON (HTTP " + res.status + "): " + text.slice(0, 120),
      );
    }
  }

  function ensurePanel() {
    if (panel && document.body.contains(panel)) return panel;
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
    panel.querySelector("#rr-ig-stop").onclick = () => {
      stopped = true;
      setStatus("Dihentikan…");
      resolveConfirm({ limit: 0, cancelled: true });
    };
    panel.querySelector("#rr-ig-close").onclick = () => closePanel(0);
    return panel;
  }

  function setStatus(text) {
    ensurePanel();
    const el = panel?.querySelector("#rr-ig-status");
    if (el) el.textContent = text;
  }

  function closePanel(delayMs) {
    const run = () => {
      if (panel) {
        panel.remove();
        panel = null;
      }
    };
    if (delayMs && delayMs > 0) setTimeout(run, delayMs);
    else run();
  }

  async function getCurrentUser() {
    const res = await fetch("/api/v1/accounts/current_user/?edit=true", {
      headers: igHeaders(),
      credentials: "include",
    });
    const json = await readJson(res, "current_user");
    const user = json.user;
    if (!user) throw new Error("Session tidak valid. Login ulang di Instagram.");
    return user;
  }

  function mediaPk(item) {
    return String(
      item?.pk ||
        item?.id ||
        item?.media?.pk ||
        item?.media?.id ||
        item?.media_id ||
        "",
    ).trim();
  }

  function mapItem(item) {
    const media = item?.media && typeof item.media === "object" ? item.media : item;
    const pk = mediaPk(item);
    const authorUser = media?.user || item?.user || {};
    const author = authorUser.username
      ? "@" + authorUser.username
      : "@unknown";
    const nickname = authorUser.full_name || authorUser.username || author;
    const caption =
      media?.caption?.text ||
      (typeof media?.caption === "string" ? media.caption : "") ||
      "";
    const cover =
      media?.image_versions2?.candidates?.[0]?.url ||
      media?.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
      null;
    return {
      id: pk,
      author,
      nickname,
      desc: caption,
      cover,
      code: media?.code || item?.code || "",
    };
  }

  async function listRepostsPage(userPk, maxId) {
    const params = new URLSearchParams();
    if (maxId) params.set("max_id", String(maxId));
    const qs = params.toString();
    const paths = [
      "/api/v1/users/" + userPk + "/reposts/" + (qs ? "?" + qs : ""),
      "/api/v1/clips/user/reposts/?target_user_id=" +
        encodeURIComponent(userPk) +
        (maxId ? "&max_id=" + encodeURIComponent(maxId) : ""),
      "/api/v1/feed/user/" +
        userPk +
        "/reposts/" +
        (qs ? "?" + qs : ""),
    ];
    let lastErr = null;
    for (const path of paths) {
      try {
        const res = await fetch(path, {
          headers: igHeaders(),
          credentials: "include",
        });
        if (!res.ok && res.status !== 200) {
          lastErr = new Error("HTTP " + res.status + " dari " + path);
          continue;
        }
        const json = await readJson(res, path);
        const items =
          json.items ||
          json.medias ||
          json.reposts ||
          json.data?.items ||
          json.data?.medias ||
          [];
        if (!Array.isArray(items)) {
          lastErr = new Error("Format daftar repost tidak dikenali");
          continue;
        }
        const next =
          json.next_max_id ||
          json.paging_info?.max_id ||
          json.max_id ||
          null;
        return {
          items: items.map(mapItem).filter((x) => x.id),
          nextMaxId: next || null,
          hasMore: Boolean(json.more_available ?? next),
        };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Tidak bisa memuat daftar repost Instagram.");
  }

  async function unrepostOne(mediaPkValue) {
    const pk = String(mediaPkValue || "").trim();
    if (!pk) throw new Error("media pk kosong");
    const attempts = [
      { url: "/api/v1/media/" + pk + "/delete_repost/", method: "POST", body: "" },
      { url: "/api/v1/media/" + pk + "/unrepost/", method: "POST", body: "" },
      { url: "/api/v1/media/" + pk + "/repost/", method: "DELETE", body: null },
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

  function profileUrl(uniqueId) {
    return "https://www.instagram.com/" + uniqueId + "/";
  }

  async function run({ uniqueId, secUid: userIdHint, delayMs }) {
    const myGen = ++runGeneration;
    stopped = false;
    ensurePanel();
    setStatus("Menyiapkan… (repost Instagram)");

    if (uniqueId) {
      const pathname = (location.pathname || "").toLowerCase();
      const needle = "/" + uniqueId.toLowerCase();
      const onProfile =
        pathname === needle ||
        pathname === needle + "/" ||
        pathname.startsWith(needle + "/");
      if (!onProfile) {
        setStatus("Membuka profil @" + uniqueId + "…");
        report({ status: "navigating" });
        chrome.storage.session.set({
          rrPendingIgRun: {
            uniqueId,
            secUid: userIdHint,
            delayMs,
            mode: "repost",
            platform: "instagram",
          },
        });
        location.href = profileUrl(uniqueId);
        return;
      }
    }

    if (myGen !== runGeneration) return;

    setStatus("Memverifikasi session…");
    report({ status: "listing", progress: { page: 0, listed: 0 } });
    await sleep(600);
    if (myGen !== runGeneration) return;

    const me = await getCurrentUser();
    const userPk = String(userIdHint || me.pk || me.id || "").trim();
    const handle = String(me.username || uniqueId || "").trim();
    if (
      uniqueId &&
      handle &&
      handle.toLowerCase() !== String(uniqueId).toLowerCase()
    ) {
      const err =
        "Login sebagai @" + handle + ", bukan @" + uniqueId + ".";
      setStatus(err);
      report({ status: "error", error: err });
      closePanel();
      return;
    }
    if (!userPk) {
      const err = "User ID tidak ditemukan dari session Instagram.";
      setStatus(err);
      report({ status: "error", error: err });
      closePanel();
      return;
    }

    const all = [];
    const seen = new Set();
    let maxId = null;
    for (let page = 1; page <= 80; page++) {
      if (stopped) {
        report({ status: "stopped", progress: { listed: all.length, page } });
        closePanel(2500);
        return;
      }
      const pageData = await listRepostsPage(userPk, maxId);
      let added = 0;
      for (const item of pageData.items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        all.push(item);
        added++;
      }
      setStatus("Memuat " + page + " · total " + all.length + " repost");
      report({
        status: "listing",
        progress: { page, listed: all.length, total: all.length },
      });
      if (!added) break;
      if (!pageData.hasMore || !pageData.nextMaxId) break;
      if (pageData.nextMaxId === maxId) break;
      maxId = pageData.nextMaxId;
      await sleep(Math.min(delayMs, 1200));
    }

    if (!all.length) {
      setStatus("Tidak ada repost.");
      report({
        status: "done",
        progress: { total: 0, done: 0, failed: 0, listed: 0 },
      });
      closePanel();
      return;
    }

    setStatus(
      "Siap hapus. Ditemukan " +
        all.length +
        " repost. Atur jumlah di dashboard, lalu konfirmasi.",
    );
    report({
      status: "ready",
      progress: {
        listed: all.length,
        total: 0,
        done: 0,
        failed: 0,
        page: 0,
      },
    });

    const confirm = await waitForConfirmLimit();
    if (stopped || confirm?.cancelled) {
      setStatus("Dihentikan sebelum hapus.");
      report({
        status: "stopped",
        progress: {
          listed: all.length,
          total: all.length,
          done: 0,
          failed: 0,
        },
      });
      closePanel(2500);
      return;
    }

    const limit = Math.max(
      1,
      Math.min(Number(confirm?.limit) || all.length, all.length),
    );
    const queue = all.slice(0, limit);

    let ok = 0;
    let fail = 0;
    report({
      status: "removing",
      progress: {
        total: queue.length,
        done: 0,
        failed: 0,
        listed: all.length,
      },
    });

    for (let i = 0; i < queue.length; i++) {
      if (stopped) {
        setStatus(
          "Stop. OK " + ok + " · gagal " + fail + " · sisa " + (queue.length - i),
        );
        report({
          status: "stopped",
          progress: {
            total: queue.length,
            done: ok,
            failed: fail,
            listed: all.length,
          },
        });
        closePanel(2500);
        return;
      }
      const item = queue[i];
      report({
        status: "removing",
        progress: {
          total: queue.length,
          done: ok,
          failed: fail,
          listed: all.length,
          current: {
            id: item.id,
            author: item.author,
            nickname: item.nickname || item.author,
            desc: item.desc || "",
            cover: item.cover || null,
            index: i + 1,
          },
        },
      });
      try {
        await unrepostOne(item.id);
        ok++;
        setStatus(
          "Hapus " +
            (i + 1) +
            "/" +
            queue.length +
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
            queue.length +
            ": " +
            (e && e.message ? e.message : e),
        );
      }
      report({
        status: "removing",
        progress: {
          total: queue.length,
          done: ok,
          failed: fail,
          listed: all.length,
          current: {
            id: item.id,
            author: item.author,
            nickname: item.nickname || item.author,
            desc: item.desc || "",
            cover: item.cover || null,
            index: i + 1,
          },
        },
      });
      await sleep(delayMs);
    }

    setStatus(
      "Selesai. Berhasil " +
        ok +
        ", gagal " +
        fail +
        " (dari " +
        queue.length +
        "/" +
        all.length +
        ").",
    );
    report({
      status: "done",
      progress: {
        total: queue.length,
        done: ok,
        failed: fail,
        listed: all.length,
        current: null,
      },
    });
    closePanel(4000);
  }

  function handleMessage(msg, _sender, sendResponse) {
    if (msg?.type === "RR_PING_CS") {
      sendResponse({ ok: true, version: CS_VERSION, platform: "instagram" });
      return true;
    }
    if (msg?.type === "RR_STOP") {
      stopped = true;
      setStatus("Dihentikan.");
      resolveConfirm({ limit: 0, cancelled: true });
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "RR_CONFIRM_REMOVE") {
      const limit = Math.max(1, Number(msg.limit) || 1);
      const ok = resolveConfirm({ limit, cancelled: false });
      sendResponse({
        ok,
        error: ok ? undefined : "Tidak ada sesi siap hapus.",
      });
      return true;
    }
    if (msg?.type === "RR_RUN") {
      run({
        uniqueId: msg.uniqueId,
        secUid: msg.secUid,
        delayMs: msg.delayMs || 1500,
      }).catch((e) => {
        const err = e instanceof Error ? e.message : String(e);
        setStatus("Error: " + err);
        report({ status: "error", error: err });
      });
      sendResponse({ ok: true, mode: "repost", platform: "instagram" });
      return true;
    }
    if (msg?.type === "RR_STATE") {
      sendResponse({ ok: true });
      return true;
    }
    return false;
  }

  window.__rrIgApi = {
    version: CS_VERSION,
    handleMessage,
  };
  window.__rrIgVersion = CS_VERSION;
  window.__rrIgLoaded = true;

  const firstLoad = !window.__rrIgListening;
  if (firstLoad) {
    window.__rrIgListening = true;
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      const api = window.__rrIgApi;
      if (!api?.handleMessage) return false;
      return api.handleMessage(msg, sender, sendResponse);
    });

    chrome.storage.session.get(["rrPendingIgRun"]).then((data) => {
      const pending = data.rrPendingIgRun;
      if (!pending) return;
      if (window.__rrIgApi?.version !== CS_VERSION) return;
      chrome.storage.session.remove("rrPendingIgRun");
      run(pending).catch((e) => {
        const err = e instanceof Error ? e.message : String(e);
        report({ status: "error", error: err });
      });
    });
  }
})();
