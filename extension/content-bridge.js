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
      if (msg?.type === "RR_SYNC_POPUP") {
        syncPopupData();
        return;
      }
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

  const METRICS_KEY = "rr_dashboard_metrics_v1";
  const SESSION_KEY = "tt_repost_cookie_session";

  function readLocalJson(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function readSessionJson(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function normalizeSession(raw) {
    if (!raw || typeof raw !== "object") return null;
    const cookies =
      raw.cookies && typeof raw.cookies === "object" ? raw.cookies : {};
    let user = raw.user && typeof raw.user === "object" ? raw.user : null;
    const username = String(
      user?.uniqueId || cookies.username || "",
    )
      .trim()
      .replace(/^@/, "");
    if (!username) return null;
    if (!user) {
      user = {
        uniqueId: username,
        secUid: String(cookies.secUid || ""),
        nickname: username,
        avatarUrl: undefined,
      };
    }
    return {
      cookies,
      user,
      platform: raw.platform === "instagram" ? "instagram" : "tiktok",
      bridge: raw.bridge === "browser" ? "browser" : "cookie",
    };
  }

  function syncPopupData() {
    try {
      chrome.runtime.sendMessage(
        {
          type: "SYNC_POPUP_DATA",
          data: {
            metrics: readLocalJson(METRICS_KEY),
            // Session akun disimpan di sessionStorage (bukan localStorage)
            session: normalizeSession(readSessionJson(SESSION_KEY)),
            syncedAt: Date.now(),
          },
        },
        () => {
          void chrome.runtime.lastError;
        },
      );
    } catch {
      // ignore
    }
  }

  // document_start: sessionStorage mungkin belum siap — defer sync
  const kickSync = () => syncPopupData();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kickSync);
  } else {
    kickSync();
  }
  setTimeout(kickSync, 500);
  setTimeout(kickSync, 1500);
  setInterval(syncPopupData, 2500);
  window.addEventListener("storage", (e) => {
    if (e.key === METRICS_KEY || e.key === null) syncPopupData();
  });
  window.addEventListener("rr-metrics-updated", syncPopupData);
  window.addEventListener("focus", syncPopupData);
  // Session write di tab yang sama tidak memicu "storage" — poll ringan cukup
})();
