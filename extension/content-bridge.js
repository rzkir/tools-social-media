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

  function reply(requestId, response) {
    window.postMessage(
      {
        source: SOURCE_EXT,
        type: "RESPONSE",
        requestId,
        response,
      },
      "*",
    );
  }

  function friendlyRuntimeError(message) {
    const msg = String(message || "");
    if (
      msg.includes("Extension context invalidated") ||
      msg.includes("context invalidated")
    ) {
      return "Ekstensi baru di-reload. Hard refresh halaman ini (Ctrl+Shift+R), lalu coba lagi.";
    }
    if (
      msg.includes("Receiving end") ||
      msg.includes("Could not establish") ||
      msg.includes("message port closed")
    ) {
      return "Background ekstensi belum siap / timeout. Reload ekstensi di chrome://extensions, hard refresh halaman, pastikan tab tiktok.com terbuka, lalu coba lagi.";
    }
    return msg || "Extension error";
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
    const requestId = data.requestId;

    if (payload.type === "PING") {
      stamp();
      reply(requestId, {
        ok: true,
        extension: true,
        extensionId: chrome.runtime.id,
      });
      return;
    }

    if (!isDashboardHost()) return;

    try {
      chrome.runtime.sendMessage(payload, (response) => {
        try {
          const err = chrome.runtime.lastError;
          if (err) {
            reply(requestId, {
              ok: false,
              error: friendlyRuntimeError(err.message),
            });
            return;
          }
          reply(
            requestId,
            response || { ok: false, error: "No response from extension" },
          );
        } catch {
          reply(requestId, {
            ok: false,
            error:
              "Ekstensi terputus. Hard refresh (Ctrl+Shift+R) lalu coba lagi.",
          });
        }
      });
    } catch (err) {
      reply(requestId, {
        ok: false,
        error: friendlyRuntimeError(
          err instanceof Error ? err.message : String(err),
        ),
      });
    }
  });

  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (!isDashboardHost()) return;
      if (msg?.type === "RR_STATE") {
        window.postMessage(
          { source: SOURCE_EXT, type: "STATE", state: msg.state },
          "*",
        );
      }
    });
  } catch {
    // context may be invalidated after reload
  }
})();
