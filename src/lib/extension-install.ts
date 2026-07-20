/** Download packed extension + short install hint for the UI. */
export const EXTENSION_ZIP_URL = "/extension.zip";
export const EXTENSION_ZIP_NAME = "remove-tiktok-extension.zip";

export const EXTENSION_INSTALL_HINT =
	"Zip terunduh. Extract → double-klik INSTALL.bat (path otomatis tersalin + buka chrome://extensions). Aktifkan Developer mode → Load unpacked → Ctrl+V → hard refresh dashboard.";

export function downloadExtensionZip() {
	if (typeof document === "undefined") return;
	const a = document.createElement("a");
	a.href = EXTENSION_ZIP_URL;
	a.download = EXTENSION_ZIP_NAME;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
}
