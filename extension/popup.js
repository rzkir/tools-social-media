const liveBadge = document.getElementById("liveBadge");
const extIdEl = document.getElementById("extId");
const ttHint = document.getElementById("ttHint");

extIdEl.textContent = "ID: " + chrome.runtime.id;

const STORAGE_TAB_KEY = "rrPopupTab";

function modeLabel(mode) {
  if (mode === "like" || mode === "liked") return "like";
  if (mode === "repost") return "repost";
  return "—";
}

function setTab(platform) {
  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.platform === platform;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${platform}`);
  });
  chrome.storage.local.set({ [STORAGE_TAB_KEY]: platform });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.platform));
});

function renderAccount(el, session, platform) {
  const matched =
    session &&
    (session.platform || "tiktok") === platform &&
    (session.user || session.cookies?.username);
  if (!matched) {
    el.innerHTML = `
      <div class="avatar ph">?</div>
      <div>
        <strong>Belum terhubung</strong>
        <span>Connect dari dashboard Accounts</span>
      </div>
    `;
    return;
  }
  const user = session.user || {};
  const username = String(user.uniqueId || session.cookies?.username || "")
    .trim()
    .replace(/^@/, "");
  const name = user.nickname || username || "Account";
  const handle = "@" + username;
  const avatar = user.avatarUrl
    ? `<img class="avatar" src="${user.avatarUrl}" alt="" referrerpolicy="no-referrer" />`
    : `<div class="avatar ph">${name.slice(0, 1).toUpperCase()}</div>`;
  el.innerHTML = `
    ${avatar}
    <div>
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(handle)} · ${platform}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function viewFromSnapshot(snap) {
  if (!snap || typeof snap !== "object") {
    return {
      removed: 0,
      failed: 0,
      jobs: 0,
      connects: 0,
      successRate: 0,
      byMode: {
        repost: { removed: 0 },
        like: { removed: 0 },
      },
      updatedAt: 0,
    };
  }
  if (typeof snap.removed === "number") {
    return {
      removed: snap.removed || 0,
      failed: snap.failed || 0,
      jobs: snap.jobs || 0,
      connects: snap.connects || 0,
      successRate: snap.successRate || 0,
      byMode: snap.byMode || {
        repost: { removed: 0 },
        like: { removed: 0 },
      },
      updatedAt: snap.updatedAt || 0,
    };
  }
  const totals = snap.totals || {};
  const removed = totals.removed || 0;
  const failed = totals.failed || 0;
  const jobs =
    (totals.jobsCompleted || 0) +
    (totals.jobsStopped || 0) +
    (totals.jobsErrored || 0);
  const attempts = removed + failed;
  return {
    removed,
    failed,
    jobs,
    connects: totals.connectsSuccess || 0,
    successRate:
      attempts > 0 ? Math.round((removed / attempts) * 1000) / 10 : 0,
    byMode: snap.byMode || {
      repost: { removed: 0 },
      like: { removed: 0 },
    },
    updatedAt: snap.updatedAt || 0,
  };
}

function renderMetrics(data, state) {
  const metrics = viewFromSnapshot(data?.metrics);
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const ttSession =
    data?.tiktokSession ||
    accounts.find((a) => a?.platform === "tiktok") ||
    (data?.session?.platform === "tiktok" ? data.session : null);
  const igSession =
    data?.instagramSession ||
    accounts.find((a) => a?.platform === "instagram") ||
    (data?.session?.platform === "instagram" ? data.session : null);

  renderAccount(document.getElementById("ttAccount"), ttSession, "tiktok");
  renderAccount(document.getElementById("igAccount"), igSession, "instagram");

  document.getElementById("ttRemoved").textContent = String(metrics.removed);
  document.getElementById("ttFailed").textContent = String(metrics.failed);
  document.getElementById("ttJobs").textContent = String(metrics.jobs);
  document.getElementById("ttSuccess").textContent = `${metrics.successRate}%`;
  document.getElementById("ttRepost").textContent = String(
    metrics.byMode?.repost?.removed || 0,
  );
  document.getElementById("ttLike").textContent = String(
    metrics.byMode?.like?.removed || 0,
  );

  document.getElementById("igConnects").textContent = String(metrics.connects);
  document.getElementById("igSession").textContent = igSession?.user
    ? "ON"
    : "OFF";

  const st = state || {};
  const statusEl = document.getElementById("ttStatus");
  if (st.running) {
    statusEl.innerHTML = `<span class="ok">Job berjalan</span><br/>${escapeHtml(
      st.status || "running",
    )} · mode ${modeLabel(st.mode)}`;
  } else if (st.lastError) {
    statusEl.innerHTML = `<span class="bad">Error</span><br/>${escapeHtml(
      st.lastError,
    )}`;
  } else {
    statusEl.innerHTML = `<span class="ok">Idle</span><br/>Status: ${escapeHtml(
      st.status || "idle",
    )} · mode ${modeLabel(st.mode)}`;
  }

  if (!data?.syncedAt) {
    ttHint.hidden = false;
    ttHint.textContent =
      "Buka dashboard sekali agar metrics tersinkron ke popup.";
  } else {
    ttHint.hidden = true;
  }
}

function requestDashboardSync() {
  try {
    const origin = new URL(PUBLIC_URL).origin;
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs || []) {
        if (!tab?.id || !tab.url) continue;
        try {
          if (new URL(tab.url).origin !== origin) continue;
        } catch {
          continue;
        }
        chrome.tabs.sendMessage(tab.id, { type: "RR_SYNC_POPUP" }, () => {
          void chrome.runtime.lastError;
        });
      }
    });
  } catch {
    // ignore
  }
}

function loadPopup() {
  chrome.runtime.sendMessage({ type: "GET_POPUP_DATA" }, (res) => {
    const err = chrome.runtime.lastError;
    if (err) {
      liveBadge.textContent = "Error";
      liveBadge.className = "live bad";
      document.getElementById("ttStatus").innerHTML =
        `<span class="bad">Background error</span><br/>` +
        escapeHtml(err.message || "");
      return;
    }
    if (res?.ok) {
      liveBadge.textContent = "Aktif";
      liveBadge.className = "live ok";
      renderMetrics(res.data, res.state);
    } else {
      liveBadge.textContent = "Down";
      liveBadge.className = "live bad";
      document.getElementById("ttStatus").innerHTML =
        '<span class="bad">Tidak merespons</span>';
    }
  });
  requestDashboardSync();
  // Sync dari tab dashboard butuh jeda singkat lalu refresh lagi
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "GET_POPUP_DATA" }, (res) => {
      if (res?.ok) renderMetrics(res.data, res.state);
    });
  }, 600);
}

chrome.storage.local.get([STORAGE_TAB_KEY], (stored) => {
  const tab =
    stored?.[STORAGE_TAB_KEY] === "instagram" ? "instagram" : "tiktok";
  setTab(tab);
  loadPopup();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.rrPopupData) return;
  chrome.runtime.sendMessage({ type: "GET_POPUP_DATA" }, (res) => {
    if (res?.ok) renderMetrics(res.data, res.state);
  });
});

document.getElementById("openDashTt").onclick = () => {
  chrome.tabs.create({ url: `${PUBLIC_URL}/dashboard` });
};

document.getElementById("openTt").onclick = () => {
  chrome.tabs.create({ url: "https://www.tiktok.com" });
};

document.getElementById("openDashIg").onclick = () => {
  chrome.tabs.create({ url: `${PUBLIC_URL}/dashboard/accounts` });
};

document.getElementById("openIg").onclick = () => {
  chrome.tabs.create({ url: "https://www.instagram.com" });
};
