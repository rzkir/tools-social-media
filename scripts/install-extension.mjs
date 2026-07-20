/**
 * Local shortcut: copy extension folder path + open chrome://extensions.
 * Usage: pnpm extension:install
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "extension");

if (!fs.existsSync(path.join(extDir, "manifest.json"))) {
	console.error("Folder extension/ tidak ditemukan.");
	process.exit(1);
}

const isWin = process.platform === "win32";

function copyPath(value) {
	if (isWin) {
		const encoded = value.replace(/'/g, "''");
		execFileSync(
			"powershell",
			["-NoProfile", "-Command", `Set-Clipboard -Value '${encoded}'`],
			{ stdio: "ignore" },
		);
		return;
	}
	try {
		execFileSync("pbcopy", { input: value, stdio: ["pipe", "ignore", "ignore"] });
	} catch {
		try {
			execFileSync("xclip", ["-selection", "clipboard"], {
				input: value,
				stdio: ["pipe", "ignore", "ignore"],
			});
		} catch {
			console.warn("Clipboard tidak tersedia — salin path manual.");
		}
	}
}

function openExtensionsPage() {
	if (isWin) {
		const candidates = [
			path.join(
				process.env["ProgramFiles"] || "C:\\Program Files",
				"Google",
				"Chrome",
				"Application",
				"chrome.exe",
			),
			path.join(
				process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
				"Google",
				"Chrome",
				"Application",
				"chrome.exe",
			),
			path.join(
				process.env["ProgramFiles"] || "C:\\Program Files",
				"Microsoft",
				"Edge",
				"Application",
				"msedge.exe",
			),
			path.join(
				process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
				"Microsoft",
				"Edge",
				"Application",
				"msedge.exe",
			),
		];
		for (const exe of candidates) {
			if (!fs.existsSync(exe)) continue;
			const url = exe.toLowerCase().includes("msedge")
				? "edge://extensions"
				: "chrome://extensions";
			execFileSync(exe, [url], { stdio: "ignore", detached: true });
			return;
		}
		execSync(`cmd /c start "" "chrome://extensions"`, { stdio: "ignore" });
		return;
	}

	if (process.platform === "darwin") {
		try {
			execFileSync("open", ["-a", "Google Chrome", "chrome://extensions"]);
			return;
		} catch {
			execFileSync("open", ["-a", "Microsoft Edge", "edge://extensions"]);
			return;
		}
	}

	try {
		execFileSync("google-chrome", ["chrome://extensions"], {
			stdio: "ignore",
			detached: true,
		});
	} catch {
		execFileSync("chromium", ["chrome://extensions"], {
			stdio: "ignore",
			detached: true,
		});
	}
}

copyPath(extDir);
try {
	if (isWin) execFileSync("explorer", [extDir], { stdio: "ignore" });
	else if (process.platform === "darwin")
		execFileSync("open", [extDir], { stdio: "ignore" });
	else execFileSync("xdg-open", [extDir], { stdio: "ignore" });
} catch {
	/* ignore */
}

openExtensionsPage();

console.log(`
Path ekstensi sudah di-clipboard:
  ${extDir}

Lanjut di browser:
  1. Aktifkan Developer mode
  2. Load unpacked
  3. Ctrl+V (atau Cmd+V) → Enter
  4. Hard refresh dashboard
`);
