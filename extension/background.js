/**
 * Relays dashboard ↔ TikTok tab messages.
 * Accepts messages from content scripts AND from the web page
 * (via externally_connectable + chrome.runtime.sendMessage).
 */

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

async function ensureTikTokTab(uniqueId) {
  let tabId = await findTikTokTab(uniqueId);
  const url = uniqueId
    ? `https://www.tiktok.com/@${uniqueId}`
    : "https://www.tiktok.com";

  if (!tabId) {
    const tab = await chrome.tabs.create({ url, active: true });
    tabId = tab.id;
    await waitTabComplete(tabId);
  } else {
    const tab = await chrome.tabs.get(tabId);
    const needNav =
      uniqueId &&
      !(tab.url || "").toLowerCase().includes(`/@${uniqueId}`.toLowerCase());
    if (needNav) {
      await chrome.tabs.update(tabId, { url, active: true });
      await waitTabComplete(tabId);
    } else {
      await chrome.tabs.update(tabId, { active: true });
    }
  }
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

/** Ping / inject content-tiktok.js until the tab can receive messages. */
async function ensureTikTokContentScript(tabId) {
  for (let i = 0; i < 10; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: "RR_PING_CS" });
      return true;
    } catch {
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
  }
  return false;
}

async function startOnTikTokTab(tabId, payload) {
  // Persist so a fresh content-script load can auto-resume
  await chrome.storage.session.set({ rrPendingRun: payload });

  const ready = await ensureTikTokContentScript(tabId);
  if (!ready) {
    // Last resort: reload so declared content_scripts inject + pick up pending
    await chrome.tabs.reload(tabId);
    await waitTabComplete(tabId);
    await sleep(800);
    const ok = await ensureTikTokContentScript(tabId);
    if (!ok) {
      throw new Error(
        "Tab TikTok belum siap. Buka tiktok.com, login, refresh tab itu, lalu Start lagi.",
      );
    }
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "RR_RUN",
      uniqueId: payload.uniqueId,
      secUid: payload.secUid,
      delayMs: payload.delayMs,
      mode: payload.mode || "repost",
    });
    await chrome.storage.session.remove("rrPendingRun");
  } catch {
    // Injected script should pick up rrPendingRun on load; leave it set
  }
}

async function handleMessage(msg) {
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
    const mode = msg.mode === "favorite" ? "favorite" : "repost";

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
      const tabId = await ensureTikTokTab(uniqueId);
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

  return { ok: false, error: "Unknown message" };
}

function attachListener(api) {
  api.addListener((msg, _sender, sendResponse) => {
    handleMessage(msg)
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
