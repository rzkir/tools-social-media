    const CS_VERSION = 16;

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
    if (res.status === 429 || /ratelimit/i.test(raw)) {
      return {
        ok: false,
        error:
          "TikTok rate-limit. Tunggu 1–2 menit, pakai kecepatan Aman, lalu coba lagi.",
      };
    }
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        error: "Respons bukan JSON: " + raw.slice(0, 60),
      };
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
      if (res.status === 429 || /ratelimit/i.test(raw)) {
        lastErr =
          "TikTok rate-limit. Tunggu 1–2 menit, pakai kecepatan Aman, lalu coba lagi.";
        continue;
      }
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        lastErr = "Respons bukan JSON: " + raw.slice(0, 60);
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
  startedAt: null,
  endedAt: null,
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

/** Extract logged-in uniqueId/secUid from TikTok rehydration scope. */
function pickUserFromScope(scope) {
  if (!scope || typeof scope !== "object") return null;
  const ctxUser = scope["webapp.app-context"]?.user;
  if (ctxUser && typeof ctxUser === "object") {
    const username = String(ctxUser.uniqueId || ctxUser.unique_id || "").trim();
    const secUid = String(ctxUser.secUid || ctxUser.sec_uid || "").trim();
    if (username) return { username, secUid };
  }
  const detailUser = scope["webapp.user-detail"]?.userInfo?.user;
  if (detailUser?.uniqueId) {
    return {
      username: String(detailUser.uniqueId),
      secUid: String(detailUser.secUid || ""),
    };
  }
  return null;
}

function pickUserFromHtml(html) {
  if (!html || typeof html !== "string") return null;
  const scriptMatch = html.match(
    /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (scriptMatch?.[1]) {
    try {
      const data = JSON.parse(scriptMatch[1]);
      const fromScope = pickUserFromScope(data?.__DEFAULT_SCOPE__);
      if (fromScope?.username) return fromScope;
    } catch {
      // continue
    }
  }
  const windowMatch = html.match(
    /"uniqueId"\s*:\s*"([^"]{2,64})"[\s\S]{0,240}?"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/,
  );
  if (windowMatch) {
    return { username: windowMatch[1], secUid: windowMatch[2] };
  }
  const alt = html.match(
    /"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"[\s\S]{0,240}?"uniqueId"\s*:\s*"([^"]{2,64})"/,
  );
  if (alt) {
    return { username: alt[2], secUid: alt[1] };
  }
  return null;
}

/**
 * Poll inside TikTok page (MAIN world) until logged-in user appears.
 * Async executeScript waits for the returned Promise.
 */
async function readUserFromTikTokTab(tabId, waitMs = 12000) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      args: [waitMs],
      func: async (maxWait) => {
        function pick(scope) {
          if (!scope || typeof scope !== "object") return null;
          const ctxUser = scope["webapp.app-context"]?.user;
          if (ctxUser && typeof ctxUser === "object") {
            const username = String(
              ctxUser.uniqueId || ctxUser.unique_id || "",
            ).trim();
            const secUid = String(
              ctxUser.secUid || ctxUser.sec_uid || "",
            ).trim();
            if (username) return { username, secUid };
          }
          const detailUser = scope["webapp.user-detail"]?.userInfo?.user;
          if (detailUser?.uniqueId) {
            return {
              username: String(detailUser.uniqueId),
              secUid: String(detailUser.secUid || ""),
            };
          }
          return null;
        }

        function fromNavProfile() {
          const selectors = [
            'a[data-e2e="nav-profile"]',
            'a[data-e2e="bottom-nav-profile"]',
            'a[href^="/@"][data-e2e*="profile"]',
          ];
          for (const sel of selectors) {
            const a = document.querySelector(sel);
            const href = a?.getAttribute?.("href") || "";
            const m = href.match(/\/@([^/?#]+)/);
            if (m?.[1] && m[1].toLowerCase() !== "undefined") {
              return { username: decodeURIComponent(m[1]), secUid: "" };
            }
          }
          return null;
        }

        function tryOnce() {
          try {
            const u1 = window.__$UNIVERSAL_DATA$__;
            const u2 = window.__UNIVERSAL_DATA_FOR_REHYDRATION__;
            const fromWin =
              pick(u1?.__DEFAULT_SCOPE__) || pick(u2?.__DEFAULT_SCOPE__);
            if (fromWin?.username) return fromWin;
          } catch {
            // ignore
          }

          try {
            const el = document.getElementById(
              "__UNIVERSAL_DATA_FOR_REHYDRATION__",
            );
            if (el?.textContent) {
              const data = JSON.parse(el.textContent);
              const fromDom = pick(data?.__DEFAULT_SCOPE__);
              if (fromDom?.username) return fromDom;
            }
          } catch {
            // ignore
          }

          try {
            const html = document.documentElement?.innerHTML || "";
            const m = html.match(
              /"uniqueId"\s*:\s*"([^"]{2,64})"[\s\S]{0,240}?"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/,
            );
            if (m) return { username: m[1], secUid: m[2] };
          } catch {
            // ignore
          }

          return fromNavProfile();
        }

        const deadline = Date.now() + Math.max(1000, Number(maxWait) || 12000);
        let last = tryOnce();
        if (last?.username) return last;

        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 500));
          last = tryOnce();
          if (last?.username) return last;
        }
        return last;
      },
    });
    if (result?.username) return result;
  } catch {
    // tab restricted / not injectable
  }
  return null;
}

/** Fetch TikTok homepage with extension cookies and parse logged-in user. */
async function readUserFromHomepageFetch() {
  try {
    const res = await fetch("https://www.tiktok.com/", {
      method: "GET",
      credentials: "include",
      redirect: "follow",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return pickUserFromHtml(html);
  } catch {
    return null;
  }
}

function waitTabComplete(tabId, timeoutMs = 20000) {
  return new Promise(async (resolve) => {
    try {
      const existing = await chrome.tabs.get(tabId);
      if (existing?.status === "complete") {
        resolve(true);
        return;
      }
    } catch {
      resolve(false);
      return;
    }

    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve(false);
    }, timeoutMs);

    function onUpdated(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve(true);
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

async function readUserViaContentScript(tabId, uniqueIdHint) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, {
      type: "GET_PAGE_USER",
      uniqueId: uniqueIdHint || "",
    });
    if (res?.ok && res.user?.username) return res.user;
  } catch {
    // content script belum inject / tab belum ready
  }
  return null;
}

/**
 * Resolve username + secUid inside an open TikTok tab (viewport session).
 * Fetches /@username with the page's own cookies — avoids Worker rate-limit.
 */
async function resolveUserInTikTokTab(tabId, uniqueIdHint) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      args: [String(uniqueIdHint || "").replace(/^@/, "").trim()],
      func: async (hint) => {
        function pick(scope) {
          if (!scope || typeof scope !== "object") return null;
          const ctxUser = scope["webapp.app-context"]?.user;
          if (ctxUser && typeof ctxUser === "object") {
            const username = String(
              ctxUser.uniqueId || ctxUser.unique_id || "",
            ).trim();
            const secUid = String(
              ctxUser.secUid || ctxUser.sec_uid || "",
            ).trim();
            if (username) return { username, secUid };
          }
          const detailUser = scope["webapp.user-detail"]?.userInfo?.user;
          if (detailUser?.uniqueId || detailUser?.secUid) {
            return {
              username: String(detailUser.uniqueId || ""),
              secUid: String(detailUser.secUid || ""),
            };
          }
          return null;
        }

        function fromHtml(html) {
          if (!html) return null;
          try {
            const m = html.match(
              /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
            );
            if (m?.[1]) {
              const data = JSON.parse(m[1]);
              const u = pick(data?.__DEFAULT_SCOPE__);
              if (u?.username || u?.secUid) return u;
            }
          } catch {
            // ignore
          }
          const pair = html.match(
            /"uniqueId"\s*:\s*"([^"]{2,64})"[\s\S]{0,240}?"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/,
          );
          if (pair) return { username: pair[1], secUid: pair[2] };
          const alt = html.match(
            /"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"[\s\S]{0,240}?"uniqueId"\s*:\s*"([^"]{2,64})"/,
          );
          if (alt) return { username: alt[2], secUid: alt[1] };
          return null;
        }

        function fromNav() {
          const selectors = [
            'a[data-e2e="nav-profile"]',
            'a[data-e2e="bottom-nav-profile"]',
            'a[href^="/@"][data-e2e*="profile"]',
          ];
          for (const sel of selectors) {
            const a = document.querySelector(sel);
            const href = a?.getAttribute?.("href") || "";
            const m = href.match(/\/@([^/?#]+)/);
            if (m?.[1]) {
              return {
                username: decodeURIComponent(m[1]),
                secUid: "",
              };
            }
          }
          return null;
        }

        let best = null;
        try {
          const u1 = window.__$UNIVERSAL_DATA$__;
          const u2 = window.__UNIVERSAL_DATA_FOR_REHYDRATION__;
          best =
            pick(u1?.__DEFAULT_SCOPE__) ||
            pick(u2?.__DEFAULT_SCOPE__) ||
            null;
        } catch {
          // ignore
        }

        if (!best?.secUid) {
          try {
            const el = document.getElementById(
              "__UNIVERSAL_DATA_FOR_REHYDRATION__",
            );
            if (el?.textContent) {
              const data = JSON.parse(el.textContent);
              const fromDom = pick(data?.__DEFAULT_SCOPE__);
              if (fromDom?.username || fromDom?.secUid) {
                best = {
                  username: fromDom.username || best?.username || "",
                  secUid: fromDom.secUid || best?.secUid || "",
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (!best?.username) {
          const nav = fromNav();
          if (nav) best = { ...(best || {}), ...nav, secUid: best?.secUid || "" };
        }

        const username = String(hint || best?.username || "")
          .replace(/^@/, "")
          .trim();

        // Fetch own profile HTML in this tab's session → reliable secUid
        if (username && !best?.secUid) {
          try {
            const res = await fetch(
              `https://www.tiktok.com/@${encodeURIComponent(username)}?lang=en`,
              {
                credentials: "include",
                redirect: "follow",
                headers: {
                  accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
              },
            );
            if (res.ok) {
              const html = await res.text();
              const parsed = fromHtml(html);
              if (parsed?.secUid || parsed?.username) {
                best = {
                  username: parsed.username || username,
                  secUid: parsed.secUid || "",
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (!best?.username && username) {
          best = { username, secUid: best?.secUid || "" };
        }

        return best?.username ? best : null;
      },
    });
    if (result?.username) return result;
  } catch {
    // ignore
  }
  return null;
}

/** Fast user resolve from open TikTok viewport (+ in-tab profile fetch for secUid). */
async function resolveLoggedInUser(uniqueIdHint) {
  const hint = String(uniqueIdHint || "")
    .replace(/^@/, "")
    .trim();
  const existingId = await findTikTokTab(hint);

  if (existingId) {
    // Prefer MAIN-world + in-tab fetch (has secUid)
    const fromMain = await resolveUserInTikTokTab(existingId, hint);
    if (fromMain?.username && fromMain?.secUid) return fromMain;

    const fromCs = await readUserViaContentScript(existingId, hint);
    if (fromCs?.username && fromCs?.secUid) return fromCs;

    // Partial is still useful
    if (fromMain?.username) return fromMain;
    if (fromCs?.username) return fromCs;
  }

  try {
    const fromFetch = await Promise.race([
      readUserFromHomepageFetch(),
      sleep(3500).then(() => null),
    ]);
    if (fromFetch?.username) return fromFetch;
  } catch {
    // ignore
  }

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

/**
 * Open / navigate TikTok profile in a background tab — never steal focus
 * from the dashboard tab the user is on.
 */
async function ensureTikTokTab(uniqueId, mode) {
  let tabId = await findTikTokTab(uniqueId);
  const url = profileUrlForMode(uniqueId, mode);

  if (!tabId) {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;
    await waitTabComplete(tabId);
    return tabId;
  }

  // Navigate existing TikTok tab without focusing it
  await chrome.tabs.update(tabId, { url, active: false });
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

  // Reload in background to flush stale CS — does not steal dashboard focus
  await reloadTabForFreshScript(tabId);
  await sleep(600);

  let ready = await ensureTikTokContentScript(tabId);
  if (!ready.ok) {
    throw new Error(
      "Tab TikTok belum siap. Refresh tab tiktok.com, pastikan login, lalu Start lagi.",
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

  if (msg?.type === "GET_TIKTOK_COOKIES") {
    try {
      const list = await chrome.cookies.getAll({ domain: "tiktok.com" });
      const jar = {};
      for (const c of list) {
        if (!c?.name) continue;
        // Prefer non-empty / longer values if duplicates exist
        const prev = jar[c.name];
        if (!prev || String(c.value || "").length > String(prev).length) {
          jar[c.name] = c.value || "";
        }
      }
      const sessionid = jar.sessionid || jar.sessionid_ss || "";
      const msToken = jar.msToken || "";
      if (!sessionid) {
        return {
          ok: false,
          error:
            "Cookie sessionid tidak ditemukan. Login dulu di tab tiktok.com, lalu coba lagi.",
          cookies: jar,
        };
      }

      // Resolve username/secUid from open TikTok viewport (+ in-tab profile fetch)
      let username = "";
      let secUid = "";
      let userWarning = "";
      const uniqueIdHint = String(msg.uniqueId || "")
        .replace(/^@/, "")
        .trim();
      try {
        const user = await resolveLoggedInUser(uniqueIdHint);
        if (user?.username) {
          username = user.username;
          secUid = user.secUid || "";
        }
        if (!secUid) {
          const hasTab = Boolean(await findTikTokTab(uniqueIdHint || username));
          userWarning = hasTab
            ? "Cookie + username terisi, tapi secUid belum. Buka profil sendiri di tab TikTok (tiktok.com/@username), lalu Ambil lagi."
            : "Cookie terisi. Buka tab tiktok.com/@username (sudah login), biarkan terbuka, lalu Ambil dari Browser lagi.";
        }
      } catch {
        // cookies alone are enough for partial fill
      }

      return {
        ok: true,
        cookies: jar,
        warning: userWarning || undefined,
        values: {
          sessionid,
          tt_csrf_token: jar.tt_csrf_token || jar["tt-csrf-token"] || "",
          msToken,
          ttwid: jar.ttwid || "",
          s_v_web_id: jar.s_v_web_id || jar.verifyFp || "",
          username,
          secUid,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal membaca cookie TikTok dari browser.",
      };
    }
  }

  if (msg?.type === "STOP") {
    state.running = false;
    state.status = "stopped";
    state.endedAt = Date.now();
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
    // Delete timer starts only on CONFIRM_REMOVE
    state.startedAt = null;
    state.endedAt = null;
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
      state.endedAt = Date.now();
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
    if (msg.status === "ready") {
      // Waiting for user to choose how many to delete — keep running
      state.running = true;
      state.endedAt = null;
    } else if (
      msg.status === "done" ||
      msg.status === "error" ||
      msg.status === "stopped"
    ) {
      state.running = false;
      state.endedAt = Date.now();
    }
    await broadcast({ type: "RR_STATE", state });
    return { ok: true };
  }

  if (msg?.type === "CONFIRM_REMOVE") {
    const limit = Math.max(1, Number(msg.limit) || 1);
    const tabs = await chrome.tabs.query({
      url: ["https://www.tiktok.com/*", "https://*.tiktok.com/*"],
    });
    let sent = false;
    let lastError = "Tab TikTok tidak ditemukan.";
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: "RR_CONFIRM_REMOVE",
          limit,
        });
        if (res?.ok) {
          sent = true;
          state.status = "removing";
          state.running = true;
          // Timer starts when user confirms delete, not during listing
          state.startedAt = Date.now();
          state.endedAt = null;
          state.progress = {
            ...state.progress,
            total: Math.min(limit, state.progress.listed || limit),
            done: 0,
            failed: 0,
          };
          await broadcast({ type: "RR_STATE", state });
          break;
        }
        if (res?.error) lastError = res.error;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    if (!sent) {
      return { ok: false, error: lastError, state };
    }
    return { ok: true, state };
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
