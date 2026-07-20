const CS_VERSION = 25;

/**
 * Unlike — must be fully self-contained (chrome.scripting.executeScript
 * only serializes this function body; no outer helpers).
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

  function cookieValue(name) {
    const m = document.cookie.match(
      new RegExp(
        "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)",
      ),
    );
    if (!m?.[1]) return "";
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }

  let csrf =
    (ctx && ctx.csrfToken) || cookieValue("tt_csrf_token") || "";
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

  const nav = typeof navigator !== "undefined" ? navigator : null;
  const userAgent = String(
    (ctx && ctx.userAgent) || (nav && nav.userAgent) || "",
  ).trim();
  const browserLanguage = String(
    (ctx && (ctx.language || ctx.appLanguage)) ||
      (nav && (nav.language || (nav.languages && nav.languages[0]))) ||
      "",
  ).trim();
  const langShort = (
    browserLanguage.split("-")[0] ||
    browserLanguage ||
    "en"
  ).trim();
  const region = String(
    (ctx && (ctx.region || ctx.storeRegion || ctx.priorityRegion)) || "",
  )
    .trim()
    .toUpperCase();
  const priorityRegion = String(
    (ctx && (ctx.priorityRegion || ctx.region)) || region || "",
  )
    .trim()
    .toUpperCase();
  const platform = String((nav && nav.platform) || "").trim();
  const platformLower = platform.toLowerCase();
  let os = "windows";
  if (/mac/i.test(platformLower) || /mac/i.test(userAgent)) os = "mac";
  else if (/linux/i.test(platformLower) || /linux/i.test(userAgent)) os = "linux";
  else if (/win/i.test(platformLower) || /windows/i.test(userAgent)) os = "windows";

  const deviceId = String(
    (ctx && (ctx.wid || ctx.deviceId)) ||
      cookieValue("tt_webid_v2") ||
      cookieValue("tt_webid") ||
      cookieValue("s_v_web_id") ||
      "",
  ).trim();
  const odinId = String((ctx && ctx.odinId) || "").trim();
  const msToken = cookieValue("msToken");
  const verifyFp = cookieValue("s_v_web_id") || cookieValue("verifyFp") || "";
  const screenW =
    typeof screen !== "undefined" && screen.width ? screen.width : 0;
  const screenH =
    typeof screen !== "undefined" && screen.height ? screen.height : 0;
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    tz = "";
  }

  const paramsObj = {
    aid: "1988",
    app_language: langShort,
    app_name: "tiktok_web",
    aweme_id: id,
    browser_language: browserLanguage || langShort,
    browser_name: "Mozilla",
    browser_online: nav && nav.onLine === false ? "false" : "true",
    browser_platform: platform || "Win32",
    browser_version: userAgent,
    channel: "tiktok_web",
    cookie_enabled: "true",
    data_collection_enabled: "true",
    device_platform: "web_pc",
    focus_state: "true",
    from_page: "video",
    history_len: String(
      typeof history !== "undefined" && history.length ? history.length : 1,
    ),
    is_fullscreen: "false",
    is_page_visible: "true",
    language: langShort,
    os,
    referer: typeof document !== "undefined" ? document.referrer || "" : "",
    screen_height: String(screenH || ""),
    screen_width: String(screenW || ""),
    type: "0",
    tz_name: tz,
    user_is_login: "true",
    webcast_language: langShort,
  };
  if (deviceId) paramsObj.device_id = deviceId;
  if (odinId) paramsObj.odinId = odinId;
  if (region) paramsObj.region = region;
  if (priorityRegion) paramsObj.priority_region = priorityRegion;
  if (msToken) paramsObj.msToken = msToken;
  if (verifyFp) paramsObj.verifyFp = verifyFp;

  const params = new URLSearchParams(paramsObj);

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

const state = {
  running: false,
  status: "idle",
  mode: null,
  platform: null,
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

async function findInstagramTab(uniqueId) {
  const tabs = await chrome.tabs.query({
    url: ["https://www.instagram.com/*", "https://*.instagram.com/*"],
  });
  if (uniqueId) {
    const needle = `/${String(uniqueId).replace(/^@/, "").toLowerCase()}`;
    const match = tabs.find((t) => {
      const path = (t.url || "").toLowerCase();
      return (
        path.includes(needle + "/") ||
        path.endsWith(needle) ||
        path.includes(needle + "?")
      );
    });
    if (match?.id) return match.id;
  }
  if (tabs[0]?.id) return tabs[0].id;
  return null;
}

/** Normalize TikTok avatar field (string path, full URL, or {url_list}). */
function pickAvatarFromUser(user) {
  if (!user || typeof user !== "object") return "";
  const candidates = [
    user.avatarMedium,
    user.avatarThumb,
    user.avatarLarger,
    Array.isArray(user.avatarUri) ? user.avatarUri[0] : "",
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    if (typeof raw === "object" && Array.isArray(raw.url_list) && raw.url_list[0]) {
      const u = String(raw.url_list[0]).trim();
      if (u) return u.startsWith("//") ? `https:${u}` : u;
      continue;
    }
    if (typeof raw !== "string") continue;
    let u = raw.trim().replace(/\\u002[fF]/g, "/").replace(/\\\//g, "/");
    if (!u) continue;
    if (u.startsWith("//")) u = `https:${u}`;
    if (/^https?:\/\//i.test(u)) return u;
    const path = u.replace(/^\//, "");
    if (/^(tos-|musically-|tiktok-obj)/i.test(path) || /~c5_|\.jpe?g|\.webp/i.test(path)) {
      return `https://p16-sign.tiktokcdn-us.com/${path}`;
    }
  }
  return "";
}

/** Extract logged-in uniqueId/secUid/avatar from TikTok rehydration scope. */
function pickUserFromScope(scope) {
  if (!scope || typeof scope !== "object") return null;
  const ctxUser = scope["webapp.app-context"]?.user;
  if (ctxUser && typeof ctxUser === "object") {
    const username = String(ctxUser.uniqueId || ctxUser.unique_id || "").trim();
    const secUid = String(ctxUser.secUid || ctxUser.sec_uid || "").trim();
    if (username) {
      return {
        username,
        secUid,
        avatarUrl: pickAvatarFromUser(ctxUser),
      };
    }
  }
  const detailUser = scope["webapp.user-detail"]?.userInfo?.user;
  if (detailUser?.uniqueId) {
    return {
      username: String(detailUser.uniqueId),
      secUid: String(detailUser.secUid || ""),
      avatarUrl: pickAvatarFromUser(detailUser),
    };
  }
  return null;
}

function pickAvatarFromHtml(html) {
  if (!html || typeof html !== "string") return "";
  const patterns = [
    /"avatarThumb"\s*:\s*"(https?:[^"]+)"/i,
    /"avatarMedium"\s*:\s*"(https?:[^"]+)"/i,
    /"avatarUri"\s*:\s*\[\s*"(https?:[^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) return m[1].replace(/\\u002[fF]/g, "/").replace(/\\\//g, "/");
  }
  const rel = html.match(
    /"avatarUri"\s*:\s*\[\s*"((?:tos-|musically-|tiktok-obj)[^"]+)"/i,
  );
  if (rel?.[1]) {
    return `https://p16-sign.tiktokcdn-us.com/${rel[1].replace(/^\//, "")}`;
  }
  return "";
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
  const avatarUrl = pickAvatarFromHtml(html);
  const windowMatch = html.match(
    /"uniqueId"\s*:\s*"([^"]{2,64})"[\s\S]{0,240}?"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/,
  );
  if (windowMatch) {
    return { username: windowMatch[1], secUid: windowMatch[2], avatarUrl };
  }
  const alt = html.match(
    /"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"[\s\S]{0,240}?"uniqueId"\s*:\s*"([^"]{2,64})"/,
  );
  if (alt) {
    return { username: alt[2], secUid: alt[1], avatarUrl };
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
        function pickAvatar(user) {
          if (!user || typeof user !== "object") return "";
          const candidates = [
            user.avatarMedium,
            user.avatarThumb,
            user.avatarLarger,
            Array.isArray(user.avatarUri) ? user.avatarUri[0] : "",
          ];
          for (const raw of candidates) {
            if (!raw) continue;
            if (
              typeof raw === "object" &&
              Array.isArray(raw.url_list) &&
              raw.url_list[0]
            ) {
              const u = String(raw.url_list[0]).trim();
              if (u) return u.startsWith("//") ? `https:${u}` : u;
              continue;
            }
            if (typeof raw !== "string") continue;
            let u = raw.trim();
            if (!u) continue;
            if (u.startsWith("//")) u = `https:${u}`;
            if (/^https?:\/\//i.test(u)) return u;
            const path = u.replace(/^\//, "");
            if (
              /^(tos-|musically-|tiktok-obj)/i.test(path) ||
              /~c5_|\.jpe?g|\.webp/i.test(path)
            ) {
              return `https://p16-sign.tiktokcdn-us.com/${path}`;
            }
          }
          return "";
        }

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
            if (username) {
              return {
                username,
                secUid,
                avatarUrl: pickAvatar(ctxUser),
              };
            }
          }
          const detailUser = scope["webapp.user-detail"]?.userInfo?.user;
          if (detailUser?.uniqueId || detailUser?.secUid) {
            return {
              username: String(detailUser.uniqueId || ""),
              secUid: String(detailUser.secUid || ""),
              avatarUrl: pickAvatar(detailUser),
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
                  avatarUrl: fromDom.avatarUrl || best?.avatarUrl || "",
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (!best?.username) {
          const nav = fromNav();
          if (nav) {
            best = {
              ...(best || {}),
              ...nav,
              secUid: best?.secUid || "",
              avatarUrl: best?.avatarUrl || "",
            };
          }
        }

        const username = String(hint || best?.username || "")
          .replace(/^@/, "")
          .trim();

        // Fetch own profile HTML in this tab's session → reliable secUid + avatar
        if (username && (!best?.secUid || !best?.avatarUrl)) {
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
              if (parsed?.secUid || parsed?.username || parsed?.avatarUrl) {
                best = {
                  username: parsed.username || username,
                  secUid: parsed.secUid || best?.secUid || "",
                  avatarUrl: parsed.avatarUrl || best?.avatarUrl || "",
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (!best?.username && username) {
          best = {
            username,
            secUid: best?.secUid || "",
            avatarUrl: best?.avatarUrl || "",
          };
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
  return `https://www.tiktok.com/@${uniqueId}`;
}

function normalizeMode(mode) {
  if (mode === "like" || mode === "liked") return "like";
  return "repost";
}

function normalizePlatform(platform) {
  return platform === "instagram" ? "instagram" : "tiktok";
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

async function ensureInstagramTab(uniqueId) {
  const handle = String(uniqueId || "")
    .replace(/^@/, "")
    .trim();
  const url = handle
    ? `https://www.instagram.com/${handle}/`
    : "https://www.instagram.com/";
  let tabId = await findInstagramTab(handle);

  if (!tabId) {
    const tab = await chrome.tabs.create({ url, active: false });
    tabId = tab.id;
    await waitTabComplete(tabId);
    return tabId;
  }

  await chrome.tabs.update(tabId, { url, active: false });
  await waitTabComplete(tabId);
  return tabId;
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

function isCurrentContentScript(res, platform = "tiktok") {
  if (!res?.ok) return false;
  if (platform === "instagram") {
    return Number(res.version) === IG_CS_VERSION;
  }
  return Number(res.version) === CS_VERSION;
}

const IG_CS_VERSION = 1;

async function ensureTikTokContentScript(tabId) {
  let sawStale = false;
  for (let i = 0; i < 16; i++) {
    const res = await sendPing(tabId);
    if (isCurrentContentScript(res, "tiktok")) return { ok: true };
    if (res?.ok && !isCurrentContentScript(res, "tiktok")) {
      sawStale = true;
      // Stale CS from before extension reload — force reinject, don't bail
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content-tiktok.js"],
        });
      } catch {
        // page may still be loading
      }
      await sleep(700);
      continue;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-tiktok.js"],
      });
    } catch {
      // page may still be loading / restricted
    }
    await sleep(i < 4 ? 400 : 800);
  }
  return { ok: false, stale: sawStale };
}

async function ensureInstagramContentScript(tabId) {
  let sawStale = false;
  for (let i = 0; i < 16; i++) {
    const res = await sendPing(tabId);
    if (isCurrentContentScript(res, "instagram")) return { ok: true };
    if (res?.ok && !isCurrentContentScript(res, "instagram")) {
      sawStale = true;
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content-instagram.js"],
        });
      } catch {
        // page may still be loading
      }
      await sleep(700);
      continue;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-instagram.js"],
      });
    } catch {
      // page may still be loading / restricted
    }
    await sleep(i < 4 ? 400 : 800);
  }
  return { ok: false, stale: sawStale };
}

async function reloadTabForFreshScript(tabId) {
  await chrome.tabs.reload(tabId);
  await waitTabComplete(tabId);
  // document_idle CS injects after "complete" — give it time
  await sleep(1500);
}

async function startOnTikTokTab(tabId, payload) {
  const mode = normalizeMode(payload.mode);
  const runPayload = { ...payload, mode, platform: "tiktok" };

  // Persist so a fresh content-script load can auto-resume with correct mode
  await chrome.storage.session.set({ rrPendingRun: runPayload });

  // Reload in background to flush stale CS — does not steal dashboard focus
  await reloadTabForFreshScript(tabId);

  let ready = await ensureTikTokContentScript(tabId);
  if (!ready.ok) {
    // One more full reload before giving up
    await reloadTabForFreshScript(tabId);
    ready = await ensureTikTokContentScript(tabId);
  }
  if (!ready.ok) {
    throw new Error(
      ready.stale
        ? "Ekstensi perlu di-reload. Buka chrome://extensions → Reload Remove TikTok, refresh tab TikTok, lalu Start lagi."
        : "Tab TikTok belum siap. Buka/refresh tab tiktok.com (login), reload ekstensi di chrome://extensions, lalu Start lagi.",
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

async function startOnInstagramTab(tabId, payload) {
  const runPayload = {
    ...payload,
    mode: "repost",
    platform: "instagram",
  };

  await chrome.storage.session.set({ rrPendingIgRun: runPayload });
  await reloadTabForFreshScript(tabId);

  let ready = await ensureInstagramContentScript(tabId);
  if (!ready.ok) {
    await reloadTabForFreshScript(tabId);
    ready = await ensureInstagramContentScript(tabId);
  }
  if (!ready.ok) {
    throw new Error(
      ready.stale
        ? "Ekstensi perlu di-reload. Buka chrome://extensions → Reload, refresh tab Instagram, lalu Start lagi."
        : "Tab Instagram belum siap. Buka/refresh tab instagram.com (login), reload ekstensi, lalu Start lagi.",
    );
  }

  const { rrPendingIgRun } = await chrome.storage.session.get([
    "rrPendingIgRun",
  ]);
  if (!rrPendingIgRun) return;

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "RR_RUN",
      uniqueId: runPayload.uniqueId,
      secUid: runPayload.secUid,
      delayMs: runPayload.delayMs,
      mode: "repost",
      platform: "instagram",
    });
    await chrome.storage.session.remove("rrPendingIgRun");
  } catch {
    // leave rrPendingIgRun for a later CS load
  }
}

async function collectCookieJar(queries) {
  const jar = {};
  const seen = new Set();
  for (const query of queries) {
    let list = [];
    try {
      list = await chrome.cookies.getAll(query);
    } catch {
      continue;
    }
    for (const c of list) {
      if (!c?.name) continue;
      const key = `${c.name}\0${c.domain || ""}\0${c.path || "/"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const prev = jar[c.name];
      if (!prev || String(c.value || "").length > String(prev).length) {
        jar[c.name] = c.value || "";
      }
    }
  }
  return jar;
}

const IG_ORIGIN = "https://www.instagram.com";
const IG_APP_ID = "936619673304451";
const IG_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function decodeCookieValue(raw) {
  const value = String(raw || "").trim();
  if (!value || !/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseInstagramCookieHeader(cookieHeader) {
  const jar = {};
  for (const part of String(cookieHeader || "").split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = decodeCookieValue(part.slice(eq + 1).trim());
    if (key && value) jar[key] = value;
  }
  return jar;
}

function buildInstagramCookieHeaderFromJar(jar) {
  return ["sessionid", "ds_user_id", "csrftoken", "mid", "ig_did", "datr", "rur"]
    .filter((key) => jar[key])
    .map((key) => `${key}=${jar[key]}`)
    .join("; ");
}

function normalizeInstagramCookieHeader(cookieHeader) {
  return buildInstagramCookieHeaderFromJar(
    parseInstagramCookieHeader(cookieHeader),
  );
}

function mapInstagramUser(user, fallbackId) {
  if (!user || typeof user !== "object") return null;
  const username = String(user.username || "")
    .trim()
    .replace(/^@/, "");
  const pk = String(user.pk || user.id || fallbackId || "").trim();
  const nickname =
    typeof user.full_name === "string" && user.full_name.trim()
      ? user.full_name.trim()
      : username;
  const avatarUrl =
    (typeof user.profile_pic_url_hd === "string" && user.profile_pic_url_hd) ||
    (typeof user.profile_pic_url === "string" && user.profile_pic_url) ||
    "";
  if (!username) return null;
  return { uniqueId: username, secUid: pk, nickname, avatarUrl };
}

async function fetchInstagramJson(path, options = {}) {
  const {
    cookieHeader = "",
    csrftoken = "",
    referer = `${IG_ORIGIN}/`,
    useBrowserCookies = false,
  } = options;

  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    origin: IG_ORIGIN,
    referer,
    "user-agent": IG_USER_AGENT,
    "x-csrftoken": csrftoken,
    "x-ig-app-id": IG_APP_ID,
    "x-requested-with": "XMLHttpRequest",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };
  if (!useBrowserCookies && cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const res = await fetch(`${IG_ORIGIN}${path}`, {
    headers,
    credentials: useBrowserCookies ? "include" : "omit",
  });
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, status: res.status, error: "empty" };
  }
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status, error: "auth" };
    }
    return { ok: false, status: res.status, error: "not_json" };
  }
}

function pickUserFromInstagramHtml(html, hint, dsUserId) {
  const text = String(html || "");
  if (!text) return null;

  const usernameMatch =
    text.match(/"username":"([^"]+)"/) ||
    text.match(/"user_name":"([^"]+)"/);
  const idMatch =
    text.match(/"profile_page_id":"(\d+)"/) ||
    text.match(/"id":"(\d+)","username"/) ||
    text.match(/"pk":"(\d+)"/);
  const nameMatch = text.match(/"full_name":"([^"]*)"/);
  const avatarMatch =
    text.match(/"profile_pic_url_hd":"([^"]+)"/) ||
    text.match(/"profile_pic_url":"([^"]+)"/);

  const username = String(usernameMatch?.[1] || hint || "")
    .trim()
    .replace(/^@/, "");
  const pk = String(idMatch?.[1] || dsUserId || "").trim();
  if (!username) return null;

  let avatarUrl = avatarMatch?.[1] || "";
  if (avatarUrl) {
    avatarUrl = avatarUrl.replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  }

  return {
    uniqueId: username,
    secUid: pk,
    nickname: nameMatch?.[1] || username,
    avatarUrl,
  };
}

async function fetchInstagramProfileHtml(username, options = {}) {
  const handle = String(username || "")
    .replace(/^@/, "")
    .trim();
  if (!handle) return null;

  const { cookieHeader = "", useBrowserCookies = false } = options;
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": IG_USER_AGENT,
    referer: `${IG_ORIGIN}/`,
  };
  if (!useBrowserCookies && cookieHeader) {
    headers.cookie = cookieHeader;
  }

  try {
    const res = await fetch(`${IG_ORIGIN}/${encodeURIComponent(handle)}/`, {
      headers,
      credentials: useBrowserCookies ? "include" : "omit",
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function verifyInstagramSession(cookies, usernameHint, avatarHint) {
  const hint = String(usernameHint || "")
    .replace(/^@/, "")
    .trim();

  const browserJar = await collectCookieJar([
    { domain: "instagram.com" },
    { url: "https://www.instagram.com" },
    { url: "https://instagram.com" },
  ]);
  const manualJar = parseInstagramCookieHeader(cookies || "");
  const jar = { ...manualJar, ...browserJar };
  const cookieHeader = buildInstagramCookieHeaderFromJar(jar);
  const sessionid = jar.sessionid || jar.sessionId || "";
  const csrftoken = jar.csrftoken || "";
  const dsUserId = jar.ds_user_id || "";

  if (!sessionid) {
    return { ok: false, error: "Cookie sessionid wajib diisi." };
  }
  if (!csrftoken) {
    return {
      ok: false,
      error:
        "Cookie csrftoken wajib diisi. Ambil ulang cookie dari browser setelah login Instagram.",
    };
  }

  const finish = (user) => {
    if (!user?.uniqueId) return null;
    if (hint && user.uniqueId.toLowerCase() !== hint.toLowerCase()) {
      return {
        ok: false,
        error: `Cookie milik @${user.uniqueId}, bukan @${hint}. Perbarui cookie atau username.`,
      };
    }
    if (!user.avatarUrl && avatarHint) user.avatarUrl = avatarHint;
    return { ok: true, user };
  };

  const attempts = [
    { useBrowserCookies: true, cookieHeader: "" },
    { useBrowserCookies: false, cookieHeader },
  ];

  for (const attempt of attempts) {
    try {
      const current = await fetchInstagramJson(
        "/api/v1/accounts/current_user/?edit=true",
        {
          ...attempt,
          csrftoken,
        },
      );
      const currentUser = current.json?.user;
      if (currentUser) {
        const user = mapInstagramUser(currentUser, dsUserId);
        const result = finish(user);
        if (result) return result;
      }
    } catch {
      // try next
    }
  }

  if (hint) {
    for (const attempt of attempts) {
      try {
        const profile = await fetchInstagramJson(
          `/api/v1/users/web_profile_info/?username=${encodeURIComponent(hint)}`,
          {
            ...attempt,
            csrftoken,
            referer: `${IG_ORIGIN}/${encodeURIComponent(hint)}/`,
          },
        );
        const profileUser = profile.json?.data?.user;
        if (profileUser) {
          const user = mapInstagramUser(profileUser, dsUserId);
          if (user) {
            const profileId = String(profileUser.id || profileUser.pk || "").trim();
            if (dsUserId && profileId && dsUserId !== profileId) {
              return {
                ok: false,
                error: `Cookie ds_user_id (${dsUserId}) tidak cocok dengan profil @${hint} (${profileId}). Pastikan cookie dari akun yang sama.`,
              };
            }
            const result = finish(user);
            if (result) return result;
          }
        }
      } catch {
        // try next
      }
    }

    for (const attempt of attempts) {
      const html = await fetchInstagramProfileHtml(hint, attempt);
      const user = pickUserFromInstagramHtml(html, hint, dsUserId);
      const result = finish(user);
      if (result) return result;
    }
  }

  return {
    ok: false,
    error:
      "Gagal verifikasi cookie Instagram. Pastikan sessionid, ds_user_id, dan csrftoken masih valid — login ulang di instagram.com lalu export cookie baru.",
  };
}

async function handleMessage(msg, sender) {
  if (msg?.type === "PING") {
    return { ok: true, extension: true, state };
  }

  if (msg?.type === "GET_STATE") {
    return { ok: true, state };
  }

  if (msg?.type === "SYNC_POPUP_DATA") {
    const data =
      msg.data && typeof msg.data === "object"
        ? msg.data
        : { metrics: null, session: null, syncedAt: Date.now() };
    await chrome.storage.local.set({ rrPopupData: data });
    return { ok: true };
  }

  if (msg?.type === "GET_POPUP_DATA") {
    const { rrPopupData } = await chrome.storage.local.get(["rrPopupData"]);
    return { ok: true, data: rrPopupData || null, state };
  }

  if (msg?.type === "GET_INSTAGRAM_COOKIES") {
    try {
      const jar = await collectCookieJar([
        { domain: "instagram.com" },
        { url: "https://www.instagram.com" },
        { url: "https://instagram.com" },
      ]);
      const sessionid = jar.sessionid || jar.sessionId || "";
      const ds_user_id = jar.ds_user_id || "";
      const csrftoken = jar.csrftoken || "";
      if (!sessionid) {
        return {
          ok: false,
          error:
            "Cookie sessionid tidak ditemukan. Login dulu di tab instagram.com, lalu coba lagi.",
          cookies: jar,
        };
      }

      let username = String(msg.username || "")
        .replace(/^@/, "")
        .trim();
      if (!username) {
        try {
          const tabs = await chrome.tabs.query({
            url: ["*://*.instagram.com/*", "*://instagram.com/*"],
          });
          const reserved = new Set([
            "p",
            "reel",
            "reels",
            "stories",
            "explore",
            "accounts",
            "direct",
            "tv",
            "about",
            "legal",
          ]);
          for (const tab of tabs || []) {
            const url = String(tab?.url || "");
            const match = url.match(
              /instagram\.com\/([A-Za-z0-9._]+)\/?(?:\?|$|#)/,
            );
            const handle = match?.[1] || "";
            if (handle && !reserved.has(handle.toLowerCase())) {
              username = handle;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      let warning = "";
      if (!ds_user_id || !csrftoken) {
        warning =
          "Cookie terisi sebagian. Pastikan ds_user_id dan csrftoken ikut ter-export dari DevTools.";
      } else if (!username) {
        warning =
          "Cookie terisi. Isi username Instagram lalu klik Verifikasi & Connect.";
      }

      let avatarUrl = "";
      if (sessionid && ds_user_id && csrftoken) {
        try {
          const verified = await verifyInstagramSession(
            buildInstagramCookieHeaderFromJar(jar),
            username,
            "",
          );
          if (verified.ok && verified.user) {
            username = verified.user.uniqueId || username;
            avatarUrl = verified.user.avatarUrl || "";
            if (!ds_user_id && verified.user.secUid) {
              jar.ds_user_id = verified.user.secUid;
            }
            warning = "";
          }
        } catch {
          // cookies still usable for manual verify
        }
      }

      return {
        ok: true,
        cookies: jar,
        warning: warning || undefined,
        values: {
          sessionid: decodeCookieValue(sessionid),
          ds_user_id: decodeCookieValue(jar.ds_user_id || ds_user_id),
          csrftoken: decodeCookieValue(csrftoken),
          mid: decodeCookieValue(jar.mid || ""),
          ig_did: decodeCookieValue(jar.ig_did || ""),
          datr: decodeCookieValue(jar.datr || ""),
          username,
          avatarUrl,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal membaca cookie Instagram dari browser.",
      };
    }
  }

  if (msg?.type === "VERIFY_INSTAGRAM_SESSION") {
    try {
      return await verifyInstagramSession(
        msg.cookies,
        msg.username,
        msg.avatarHint,
      );
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal verifikasi cookie Instagram dari browser.",
      };
    }
  }

  if (msg?.type === "GET_TIKTOK_COOKIES") {
    try {
      const jar = await collectCookieJar([
        { domain: "tiktok.com" },
        { url: "https://www.tiktok.com" },
      ]);
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

      // Resolve username/secUid/avatar from open TikTok viewport (+ in-tab profile fetch)
      let username = "";
      let secUid = "";
      let avatarUrl = "";
      let userWarning = "";
      const uniqueIdHint = String(msg.uniqueId || "")
        .replace(/^@/, "")
        .trim();
      try {
        const user = await resolveLoggedInUser(uniqueIdHint);
        if (user?.username) {
          username = user.username;
          secUid = user.secUid || "";
          avatarUrl = user.avatarUrl || "";
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
          avatarUrl,
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
    const platform = normalizePlatform(msg.platform);

    if (!uniqueId) {
      return { ok: false, error: "Username wajib diisi." };
    }

    state.running = true;
    state.status = "starting";
    state.mode = mode;
    state.platform = platform;
    state.lastError = null;
    // Delete timer starts only on CONFIRM_REMOVE
    state.startedAt = null;
    state.endedAt = null;
    state.progress = { done: 0, failed: 0, total: 0, listed: 0, page: 0 };
    await broadcast({ type: "RR_STATE", state });

    try {
      if (platform === "instagram") {
        const tabId = await ensureInstagramTab(uniqueId);
        await sleep(400);
        await startOnInstagramTab(tabId, { uniqueId, secUid, delayMs, mode });
      } else {
        const tabId = await ensureTikTokTab(uniqueId, mode);
        await sleep(400);
        await startOnTikTokTab(tabId, { uniqueId, secUid, delayMs, mode });
      }
      return { ok: true, state };
    } catch (err) {
      state.running = false;
      state.status = "error";
      state.endedAt = Date.now();
      const raw = err instanceof Error ? err.message : String(err);
      const site = platform === "instagram" ? "Instagram" : "TikTok";
      state.lastError =
        raw.includes("Receiving end") || raw.includes("Could not establish")
          ? `Tab ${site} belum siap. Refresh tab, pastikan login, lalu Start lagi.`
          : raw;
      await broadcast({ type: "RR_STATE", state });
      return { ok: false, error: state.lastError, state };
    }
  }

  if (msg?.type === "PROGRESS") {
    if (msg.mode) state.mode = msg.mode;
    if (msg.platform) state.platform = normalizePlatform(msg.platform);
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
    const platform = normalizePlatform(msg.platform || state.platform);
    const urlPatterns =
      platform === "instagram"
        ? ["https://www.instagram.com/*", "https://*.instagram.com/*"]
        : ["https://www.tiktok.com/*", "https://*.tiktok.com/*"];
    const tabs = await chrome.tabs.query({ url: urlPatterns });
    let sent = false;
    let lastError =
      platform === "instagram"
        ? "Tab Instagram tidak ditemukan."
        : "Tab TikTok tidak ditemukan.";
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
          state.platform = platform;
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
