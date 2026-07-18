/**
 * Bridge: dashboard page ↔ extension background via window.postMessage.
 * Marks the page with data-rr-extension so React can detect sync.
 * Also re-stamps the marker (React hydration can wipe <html> attrs).
 */
(() => {
  const SOURCE_PAGE = "rr-dashboard";
  const SOURCE_EXT = "rr-extension";

  function stamp() {
    try {
      document.documentElement.setAttribute("data-rr-extension", "1");
      document.documentElement.setAttribute(
        "data-rr-extension-id",
        chrome.runtime.id,
      );
    } catch {
      // ignore
    }
  }

  stamp();
  setInterval(stamp, 1000);

  function isDashboardHost() {
    const path = location.pathname || "";
    return (
      document.documentElement.dataset.rrApp === "1" ||
      path.includes("/dashboard")
    );
  }

  function announce() {
    stamp();
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

    if (payload.type === "PING") {
      stamp();
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

    if (!isDashboardHost()) return;

    chrome.runtime.sendMessage(payload, (response) => {
      const err = chrome.runtime.lastError;
      const message = err?.message || "";
      const friendly =
        message.includes("Receiving end") ||
        message.includes("Could not establish")
          ? "Background ekstensi belum siap. Refresh halaman ini, lalu coba lagi."
          : message;
      window.postMessage(
        {
          source: SOURCE_EXT,
          type: "RESPONSE",
          requestId: data.requestId,
          response: err
            ? { ok: false, error: friendly }
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
