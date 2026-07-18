/**
 * Relays dashboard ↔ TikTok tab messages.
 */

const state = {
  running: false,
  status: "idle",
  progress: { done: 0, failed: 0, total: 0, listed: 0, page: 0 },
  lastError: null,
};

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
  const tabs = await chrome.tabs.query({ url: ["https://www.tiktok.com/*", "https://*.tiktok.com/*"] });
  if (uniqueId) {
    const needle = `/@${uniqueId}`.toLowerCase();
    const match = tabs.find((t) => (t.url || "").toLowerCase().includes(needle));
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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PING") {
      sendResponse({ ok: true, extension: true, state });
      return;
    }

    if (msg?.type === "GET_STATE") {
      sendResponse({ ok: true, state });
      return;
    }

    if (msg?.type === "STOP") {
      state.running = false;
      state.status = "stopped";
      await broadcast({ type: "RR_STOP" });
      await broadcast({ type: "RR_STATE", state });
      sendResponse({ ok: true, state });
      return;
    }

    if (msg?.type === "START") {
      const uniqueId = String(msg.uniqueId || "").replace(/^@/, "").trim();
      const secUid = String(msg.secUid || "").trim();
      const delayMs = Math.max(500, Number(msg.delayMs) || 1500);

      if (!uniqueId) {
        sendResponse({ ok: false, error: "Username wajib diisi." });
        return;
      }

      state.running = true;
      state.status = "starting";
      state.lastError = null;
      state.progress = { done: 0, failed: 0, total: 0, listed: 0, page: 0 };
      await broadcast({ type: "RR_STATE", state });

      try {
        const tabId = await ensureTikTokTab(uniqueId);
        // Give content script a moment after navigation
        await new Promise((r) => setTimeout(r, 1200));
        await chrome.tabs.sendMessage(tabId, {
          type: "RR_RUN",
          uniqueId,
          secUid,
          delayMs,
        });
        sendResponse({ ok: true, state });
      } catch (err) {
        state.running = false;
        state.status = "error";
        state.lastError =
          err instanceof Error ? err.message : "Gagal memulai di tab TikTok.";
        await broadcast({ type: "RR_STATE", state });
        sendResponse({ ok: false, error: state.lastError, state });
      }
      return;
    }

    if (msg?.type === "PROGRESS") {
      state.status = msg.status || state.status;
      if (msg.progress) state.progress = { ...state.progress, ...msg.progress };
      if (msg.error) state.lastError = msg.error;
      if (msg.status === "done" || msg.status === "error" || msg.status === "stopped") {
        state.running = false;
      }
      await broadcast({ type: "RR_STATE", state });
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: "Unknown message" });
  })();

  return true;
});
