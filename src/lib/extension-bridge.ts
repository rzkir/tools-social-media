/**
 * Dashboard ↔ Chrome extension bridge (via content-bridge.js postMessage).
 */

export type ExtensionProgress = {
	done: number;
	failed: number;
	total: number;
	listed: number;
	page: number;
};

export type ExtensionState = {
	running: boolean;
	status: string;
	progress: ExtensionProgress;
	lastError: string | null;
};

type Pending = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
	timer: number;
};

const SOURCE_PAGE = "rr-dashboard";
const SOURCE_EXT = "rr-extension";

let requestSeq = 0;
const pending = new Map<number, Pending>();
const stateListeners = new Set<(state: ExtensionState) => void>();
let extensionReady = false;
let lastState: ExtensionState | null = null;

function onWindowMessage(event: MessageEvent) {
	if (event.source !== window) return;
	const data = event.data;
	if (!data || data.source !== SOURCE_EXT) return;

	if (data.type === "READY") {
		extensionReady = true;
		return;
	}

	if (data.type === "STATE" && data.state) {
		lastState = data.state as ExtensionState;
		for (const cb of stateListeners) cb(lastState);
		return;
	}

	if (data.type === "RESPONSE" && typeof data.requestId === "number") {
		const entry = pending.get(data.requestId);
		if (!entry) return;
		pending.delete(data.requestId);
		window.clearTimeout(entry.timer);
		entry.resolve(data.response);
	}
}

let listening = false;
function ensureListen() {
	if (listening || typeof window === "undefined") return;
	listening = true;
	window.addEventListener("message", onWindowMessage);
}

function sendToExtension(
	payload: Record<string, unknown>,
	timeoutMs = 15000,
): Promise<unknown> {
	ensureListen();
	return new Promise((resolve, reject) => {
		const requestId = ++requestSeq;
		const timer = window.setTimeout(() => {
			pending.delete(requestId);
			reject(
				new Error(
					"Extension tidak merespons. Pastikan ekstensi terpasang & aktif.",
				),
			);
		}, timeoutMs);
		pending.set(requestId, { resolve, reject, timer });
		window.postMessage({ source: SOURCE_PAGE, requestId, payload }, "*");
	});
}

/** Sync check: content script sets data-rr-extension on <html>. */
export function hasExtensionMarker(): boolean {
	if (typeof document === "undefined") return false;
	return document.documentElement.getAttribute("data-rr-extension") === "1";
}

/** Call once on the TikTok tool page so the content script activates. */
export function markExtensionHost() {
	if (typeof document === "undefined") return;
	document.documentElement.dataset.rrApp = "1";
	ensureListen();
}

export function unmarkExtensionHost() {
	if (typeof document === "undefined") return;
	delete document.documentElement.dataset.rrApp;
}

export async function pingExtension(): Promise<boolean> {
	ensureListen();

	// Fast path — content script already stamped the page
	if (hasExtensionMarker()) {
		extensionReady = true;
		return true;
	}

	try {
		const res = (await sendToExtension({ type: "PING" }, 2000)) as {
			ok?: boolean;
		};
		extensionReady = Boolean(res?.ok) || hasExtensionMarker();
		return extensionReady;
	} catch {
		extensionReady = hasExtensionMarker();
		return extensionReady;
	}
}

export function isExtensionReady() {
	return extensionReady;
}

export function getLastExtensionState() {
	return lastState;
}

export function subscribeExtensionState(
	cb: (state: ExtensionState) => void,
): () => void {
	ensureListen();
	stateListeners.add(cb);
	if (lastState) cb(lastState);
	return () => {
		stateListeners.delete(cb);
	};
}

export async function startExtensionJob(options: {
	uniqueId: string;
	secUid?: string;
	delayMs: number;
}): Promise<{ ok: boolean; error?: string }> {
	const res = (await sendToExtension({
		type: "START",
		uniqueId: options.uniqueId,
		secUid: options.secUid || "",
		delayMs: options.delayMs,
	})) as { ok?: boolean; error?: string };
	return { ok: Boolean(res?.ok), error: res?.error };
}

export async function stopExtensionJob(): Promise<void> {
	await sendToExtension({ type: "STOP" });
}

export async function fetchExtensionState(): Promise<ExtensionState | null> {
	try {
		const res = (await sendToExtension({ type: "GET_STATE" }, 3000)) as {
			ok?: boolean;
			state?: ExtensionState;
		};
		if (res?.state) {
			lastState = res.state;
			return res.state;
		}
	} catch {
		// ignore
	}
	return lastState;
}
