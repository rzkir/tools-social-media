/**
 * Bridge: dashboard page ↔ extension background via window.postMessage.
 * Marks the page with data-rr-extension so React can detect sync.
 */
(() => {
  const SOURCE_PAGE = "rr-dashboard";
  const SOURCE_EXT = "rr-extension";

  // Sync marker — works even before React mounts
  try {
    document.documentElement.setAttribute("data-rr-extension", "1");
    document.documentElement.setAttribute("data-rr-extension-id", chrome.runtime.id);
  } catch {
    // ignore
  }

  function isDashboardHost() {
    const path = location.pathname || "";
    return (
      document.documentElement.dataset.rrApp === "1" ||
      path.includes("/dashboard")
    );
  }

  function announce() {
    window.postMessage(
      {
        source: SOURCE_EXT,
        type: "READY",
        extension: true,
        extensionId: chrome.runtime.id,
      },
      "*",
    );
  }

  announce();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", announce);
  }
  setTimeout(announce, 300);
  setTimeout(announce, 1000);
  setTimeout(announce, 2500);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== SOURCE_PAGE) return;

    const payload = data.payload;
    if (!payload || typeof payload !== "object") return;

    // PING always answered here (no background needed)
    if (payload.type === "PING") {
      window.postMessage(
        {
          source: SOURCE_EXT,
          type: "RESPONSE",
          requestId: data.requestId,
          response: {
            ok: true,
            extension: true,
            extensionId: chrome.runtime.id,
          },
        },
        "*",
      );
      return;
    }

    // Other commands only on dashboard pages
    if (!isDashboardHost()) return;

    chrome.runtime.sendMessage(payload, (response) => {
      const err = chrome.runtime.lastError;
      window.postMessage(
        {
          source: SOURCE_EXT,
          type: "RESPONSE",
          requestId: data.requestId,
          response: err
            ? { ok: false, error: err.message }
            : response || { ok: false, error: "No response" },
        },
        "*",
      );
    });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (!isDashboardHost()) return;
    if (msg?.type === "RR_STATE") {
      window.postMessage(
        { source: SOURCE_EXT, type: "STATE", state: msg.state },
        "*",
      );
    }
  });
})();
