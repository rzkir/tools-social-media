/**
 * Relays dashboard ↔ TikTok tab messages.
 * Accepts messages from content scripts AND from the web page
 * (via externally_connectable + chrome.runtime.sendMessage).
 */

/** Keep in sync with extension/content-tiktok.js CS_VERSION */
const CS_VERSION = 8;

/**
 * Unlike (Disukai) — proven /api/commit/item/digg/ type=0.
 * Must run in page MAIN world (csrf from __$UNIVERSAL_DATA$).
 */
async function undiggInMainWorld(awemeId) {
  const id = String(awemeId);
  let ctx = null;
  try {
    const u1 = window.__$UNIVERSAL_DATA$__;
    const u2 = window.__UNIVERSAL_DATA_FOR_REHYDRATION__;
    ctx =
      u1?.__DEFAULT_SCOPE__?.["webapp.app-context"] ||
      u2?.__DEFAULT_SCOPE__?.["webapp.app-context"] ||
      null;
  } catch {
    ctx = null;
  }

  let csrf =
    (ctx && ctx.csrfToken) ||
    (document.cookie.match(/(?:^|; )tt_csrf_token=([^;]*)/) || [])[1] ||
    "";
  try {
    csrf = decodeURIComponent(csrf);
  } catch {
    // keep raw
  }
  if (!csrf) {
    return {
      ok: false,
      error: "csrfToken tidak ada — refresh tiktok.com & login ulang",
    };
  }

  const userAgent =
    (ctx && ctx.userAgent) ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "") ||
    "";
  const odinId = (ctx && ctx.odinId) || "";
  const screenW =
    typeof screen !== "undefined" && screen.width ? screen.width : 1536;
  const screenH =
    typeof screen !== "undefined" && screen.height ? screen.height : 864;
  let tz = "UTC";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    // ignore
  }

  const params = new URLSearchParams({
    aid: "1988",
    app_language: "en",
    app_name: "tiktok_web",
    aweme_id: id,
    browser_language: "en",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "Win32",
    browser_version: userAgent,
    channel: "tiktok_web",
    cookie_enabled: "true",
    data_collection_enabled: "true",
    device_id: "7469968254971495954",
    device_platform: "web_pc",
    focus_state: "true",
    from_page: "video",
    history_len: "4",
    is_fullscreen: "false",
    is_page_visible: "true",
    odinId: String(odinId),
    os: "windows",
    priority_region: "",
    referer: "",
    region: "US",
    screen_height: String(screenH),
    screen_width: String(screenW),
    type: "0",
    tz_name: tz,
    user_is_login: "true",
    webcast_language: "en",
  });

  try {
    const res = await fetch(
      "https://www.tiktok.com/api/commit/item/digg/?" + params.toString(),
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded",
          "tt-csrf-token": csrf,
        },
        body: "",
        credentials: "include",
      },
    );
    const raw = await res.text();
    if (!raw || !raw.trim()) {
      if (res.ok || res.status === 200) return { ok: true };
      return { ok: false, error: "empty HTTP " + res.status };
    }
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return { ok: false, error: "invalid JSON" };
    }
    const code = json.status_code ?? json.statusCode;
    if (code === 0 || code === "0") return { ok: true };
    return {
      ok: false,
      error:
        json.status_msg || json.statusMsg || "status_code " + String(code),
    };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

/**
 * Runs entirely in the page MAIN world — same pattern as TikTok's own UI
 * and the working "unlike" flow (csrf from __$UNIVERSAL_DATA$, full query).
 */
async function uncollectInMainWorld(awemeId) {
  const id = String(awemeId);
  let ctx = null;
  try {
    const u1 = window.__$UNIVERSAL_DATA$__;
    const u2 = window.__UNIVERSAL_DATA_FOR_REHYDRATION__;
    ctx =
      u1?.__DEFAULT_SCOPE__?.["webapp.app-context"] ||
      u2?.__DEFAULT_SCOPE__?.["webapp.app-context"] ||
      null;
  } catch {
    ctx = null;
  }

  let csrf =
    (ctx && ctx.csrfToken) ||
    (document.cookie.match(/(?:^|; )tt_csrf_token=([^;]*)/) || [])[1] ||
    "";
  try {
    csrf = decodeURIComponent(csrf);
  } catch {
    // keep raw
  }
  if (!csrf) {
    return {
      ok: false,
      error: "csrfToken tidak ada — refresh tiktok.com & login ulang",
    };
  }

  const userAgent =
    (ctx && ctx.userAgent) ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "") ||
    "";
  const odinId = (ctx && ctx.odinId) || "";
  const screenW =
    typeof screen !== "undefined" && screen.width ? screen.width : 1536;
  const screenH =
    typeof screen !== "undefined" && screen.height ? screen.height : 864;
  let tz = "UTC";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    // ignore
  }

  const base = {
    aid: "1988",
    app_language: "en",
    app_name: "tiktok_web",
    browser_language: "en",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "Win32",
    browser_version: userAgent,
    channel: "tiktok_web",
    cookie_enabled: "true",
    data_collection_enabled: "true",
    device_id: "7469968254971495954",
    device_platform: "web_pc",
    focus_state: "true",
    from_page: "user",
    history_len: "4",
    is_fullscreen: "false",
    is_page_visible: "true",
    odinId: String(odinId),
    os: "windows",
    priority_region: "",
    referer: "",
    region: "US",
    screen_height: String(screenH),
    screen_width: String(screenW),
    tz_name: tz,
    user_is_login: "true",
    webcast_language: "en",
  };

  // Mirrors working /api/commit/item/digg/ unlike: aweme_id + type=0 + csrf
  const attempts = [
    {
      path: "/api/commit/item/collect/",
      extra: { aweme_id: id, type: "0" },
    },
    {
      path: "/api/commit/item/collect/",
      extra: { itemId: id, type: "0" },
    },
    {
      path: "/api/commit/item/collect/",
      extra: { itemId: id, actionType: "0" },
    },
    {
      path: "/api/commit/item/collect/",
      extra: { aweme_id: id, actionType: "0" },
    },
    {
      path: "/api/commit/item/collect/",
      extra: { item_id: id, action_type: "0" },
    },
  ];

  let lastErr = "gagal uncollect " + id;
  for (const attempt of attempts) {
    const params = new URLSearchParams({ ...base, ...attempt.extra });
    const url =
      "https://www.tiktok.com" + attempt.path + "?" + params.toString();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded",
          "tt-csrf-token": csrf,
        },
        body: "",
        credentials: "include",
      });
      const raw = await res.text();
      if (!raw || !raw.trim()) {
        if (res.ok || res.status === 200) return { ok: true };
        lastErr = "empty HTTP " + res.status;
        continue;
      }
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        lastErr = "invalid JSON";
        continue;
      }
      const code = json.status_code ?? json.statusCode;
      if (code === 0 || code === "0") return { ok: true };
      lastErr =
        json.status_msg || json.statusMsg || "status_code " + String(code);
    } catch (e) {
      lastErr = e && e.message ? e.message : String(e);
    }
  }
  return { ok: false, error: lastErr };
}

const state = {
  running: false,
  status: "idle",
  mode: null,
  progress: { done: 0, failed: 0, total: 0, listed: 0, page: 0 },
  lastError: null,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function broadcast(message) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      // tab without content script
    }
  }
}

async function findTikTokTab(uniqueId) {
  const tabs = await chrome.tabs.query({
    url: ["https://www.tiktok.com/*", "https://*.tiktok.com/*"],
  });
  if (uniqueId) {
    const needle = `/@${uniqueId}`.toLowerCase();
    const match = tabs.find((t) =>
      (t.url || "").toLowerCase().includes(needle),
    );
    if (match?.id) return match.id;
  }
  if (tabs[0]?.id) return tabs[0].id;
  return null;
}

function profileUrlForMode(uniqueId, mode) {
  if (!uniqueId) return "https://www.tiktok.com";
  // Like + repost: open profile root. `/liked` often redirects to /foryou
  // when the Liked tab is private — listing still uses the API + secUid.
  if (mode === "favorite") {
    return `https://www.tiktok.com/@${uniqueId}?lang=en`;
  }
  return `https://www.tiktok.com/@${uniqueId}`;
}

function normalizeMode(mode) {
  if (mode === "favorite") return "favorite";
  if (mode === "like" || mode === "liked") return "like";
  return "repost";
}

async function ensureTikTokTab(uniqueId, mode) {
  let tabId = await findTikTokTab(uniqueId);
  const url = profileUrlForMode(uniqueId, mode);

  if (!tabId) {
    const tab = await chrome.tabs.create({ url, active: true });
    tabId = tab.id;
    await waitTabComplete(tabId);
    return tabId;
  }

  // Always open the profile URL (never stay on /foryou or /liked).
  await chrome.tabs.update(tabId, { url, active: true });
  await waitTabComplete(tabId);
  return tabId;
}

function waitTabComplete(tabId) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 20000);

    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function sendPing(tabId) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: "RR_PING_CS" }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(res || null);
      });
    } catch {
      resolve(null);
    }
  });
}

function isCurrentContentScript(res) {
  return Boolean(res?.ok && res.version === CS_VERSION);
}

/**
 * Ping / inject content-tiktok.js until a CURRENT version answers.
 * Stale scripts (pre-favorite) still answer ping but ignore `mode` → always
 * list reposts; those must be flushed via tab reload.
 */
async function ensureTikTokContentScript(tabId) {
  for (let i = 0; i < 10; i++) {
    const res = await sendPing(tabId);
    if (isCurrentContentScript(res)) return { ok: true };
    if (res?.ok && !isCurrentContentScript(res)) {
      return { ok: false, stale: true };
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-tiktok.js"],
      });
    } catch {
      // page may still be loading / restricted
    }
    await sleep(500);
  }
  return { ok: false };
}

async function reloadTabForFreshScript(tabId) {
  await chrome.tabs.reload(tabId);
  await waitTabComplete(tabId);
  await sleep(800);
}

async function startOnTikTokTab(tabId, payload) {
  const mode = normalizeMode(payload.mode);
  const runPayload = { ...payload, mode };

  // Persist so a fresh content-script load can auto-resume with correct mode
  await chrome.storage.session.set({ rrPendingRun: runPayload });

  // Always reload: flushes stale CS listeners that ignore `mode` and still
  // navigate to /liked → TikTok redirects that to /foryou.
  await reloadTabForFreshScript(tabId);
  await sleep(600);

  let ready = await ensureTikTokContentScript(tabId);
  if (!ready.ok) {
    throw new Error(
      "Tab TikTok belum siap. Buka tiktok.com, login, refresh tab itu, lalu Start lagi.",
    );
  }

  // Auto-resume may already have consumed pending + started with mode
  const { rrPendingRun } = await chrome.storage.session.get(["rrPendingRun"]);
  if (!rrPendingRun) return;

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "RR_RUN",
      uniqueId: runPayload.uniqueId,
      secUid: runPayload.secUid,
      delayMs: runPayload.delayMs,
      mode,
    });
    await chrome.storage.session.remove("rrPendingRun");
  } catch {
    // leave rrPendingRun for a later CS load
  }
}

async function handleMessage(msg, sender) {
  if (msg?.type === "PING") {
    return { ok: true, extension: true, state };
  }

  if (msg?.type === "GET_STATE") {
    return { ok: true, state };
  }

  if (msg?.type === "STOP") {
    state.running = false;
    state.status = "stopped";
    await broadcast({ type: "RR_STOP" });
    await broadcast({ type: "RR_STATE", state });
    return { ok: true, state };
  }

  if (msg?.type === "START") {
    const uniqueId = String(msg.uniqueId || "")
      .replace(/^@/, "")
      .trim();
    const secUid = String(msg.secUid || "").trim();
    const delayMs = Math.max(500, Number(msg.delayMs) || 1500);
    const mode = normalizeMode(msg.mode);

    if (!uniqueId) {
      return { ok: false, error: "Username wajib diisi." };
    }

    state.running = true;
    state.status = "starting";
    state.mode = mode;
    state.lastError = null;
    state.progress = { done: 0, failed: 0, total: 0, listed: 0, page: 0 };
    await broadcast({ type: "RR_STATE", state });

    try {
      const tabId = await ensureTikTokTab(uniqueId, mode);
      await sleep(400);
      await startOnTikTokTab(tabId, { uniqueId, secUid, delayMs, mode });
      return { ok: true, state };
    } catch (err) {
      state.running = false;
      state.status = "error";
      const raw = err instanceof Error ? err.message : String(err);
      state.lastError =
        raw.includes("Receiving end") || raw.includes("Could not establish")
          ? "Tab TikTok belum siap. Refresh tab tiktok.com, pastikan login, lalu Start lagi."
          : raw;
      await broadcast({ type: "RR_STATE", state });
      return { ok: false, error: state.lastError, state };
    }
  }

  if (msg?.type === "PROGRESS") {
    if (msg.mode) state.mode = msg.mode;
    state.status = msg.status || state.status;
    if (msg.progress) state.progress = { ...state.progress, ...msg.progress };
    if (msg.error) state.lastError = msg.error;
    if (
      msg.status === "done" ||
      msg.status === "error" ||
      msg.status === "stopped"
    ) {
      state.running = false;
    }
    await broadcast({ type: "RR_STATE", state });
    return { ok: true };
  }

  /** Unlike (Disukai) entirely in page MAIN world. */
  if (msg?.type === "UNDIGG") {
    const tabId = sender?.tab?.id;
    if (!tabId) return { ok: false, error: "No tab for UNDIGG" };
    const itemId = String(msg.itemId || "").trim();
    if (!itemId) return { ok: false, error: "itemId wajib" };

    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: undiggInMainWorld,
      args: [itemId],
    });
    if (result?.ok) return { ok: true };
    return { ok: false, error: result?.error || "UNDIGG gagal" };
  }

  /** Uncollect favorite entirely in page MAIN world (csrf + full query). */
  if (msg?.type === "UNCOLLECT") {
    const tabId = sender?.tab?.id;
    if (!tabId) return { ok: false, error: "No tab for UNCOLLECT" };
    const itemId = String(msg.itemId || "").trim();
    if (!itemId) return { ok: false, error: "itemId wajib" };

    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: uncollectInMainWorld,
      args: [itemId],
    });
    if (result?.ok) return { ok: true };
    return {
      ok: false,
      error: result?.error || "UNCOLLECT gagal",
    };
  }

  return { ok: false, error: "Unknown message" };
}

function attachListener(api) {
  api.addListener((msg, sender, sendResponse) => {
    handleMessage(msg, sender)
      .then((response) => sendResponse(response))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : "Handler error",
        }),
      );
    return true;
  });
}

attachListener(chrome.runtime.onMessage);
attachListener(chrome.runtime.onMessageExternal);
