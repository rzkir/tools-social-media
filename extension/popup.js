const statusEl = document.getElementById("status");
const extIdEl = document.getElementById("extId");

extIdEl.textContent = "ID: " + chrome.runtime.id;

function modeLabel(mode) {
  if (mode === "like" || mode === "liked") return "like";
  if (mode === "favorite") return "favorite";
  if (mode === "repost") return "repost";
  return "—";
}

chrome.runtime.sendMessage({ type: "PING" }, (res) => {
  const err = chrome.runtime.lastError;
  if (err) {
    statusEl.innerHTML =
      '<span class="bad">Background error</span><br/>' + err.message;
    return;
  }
  if (res?.ok) {
    const st = res.state || {};
    const mode = modeLabel(st.mode);
    statusEl.innerHTML =
      '<span class="ok">Ekstensi aktif</span><br/>Status: ' +
      (st.status || "idle") +
      "<br/>Mode: " +
      mode;
  } else {
    statusEl.innerHTML = '<span class="bad">Tidak merespons</span>';
  }
});

document.getElementById("openDash").onclick = () => {
  chrome.tabs.create({ url: `${PUBLIC_URL}/dashboard/tiktok` });
};

document.getElementById("openTt").onclick = () => {
  chrome.tabs.create({ url: "https://www.tiktok.com" });
};
