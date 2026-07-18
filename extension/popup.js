const statusEl = document.getElementById("status");
const extIdEl = document.getElementById("extId");

extIdEl.textContent = "ID: " + chrome.runtime.id;

chrome.runtime.sendMessage({ type: "PING" }, (res) => {
  const err = chrome.runtime.lastError;
  if (err) {
    statusEl.innerHTML =
      '<span class="bad">Background error</span><br/>' + err.message;
    return;
  }
  if (res?.ok) {
    statusEl.innerHTML =
      '<span class="ok">Ekstensi aktif</span><br/>Status: ' +
      (res.state?.status || "idle");
  } else {
    statusEl.innerHTML = '<span class="bad">Tidak merespons</span>';
  }
});

document.getElementById("openDash").onclick = () => {
  chrome.tabs.create({ url: "http://localhost:3000/dashboard/tiktok/repost" });
};

document.getElementById("openTt").onclick = () => {
  chrome.tabs.create({ url: "https://www.tiktok.com" });
};
