/**
 * Dashboard ↔ Chrome extension bridge.
 * Uses content-script postMessage first; chrome.runtime only with discovered ID.
 */

import type { TikTokUser } from "#/types/tiktok";

export type ExtensionProgressItem = {
	id: string;
	author: string;
	nickname?: string;
	desc?: string;
	cover?: string | null;
	index?: number;
};

export type ExtensionProgress = {
	done: number;
	failed: number;
	total: number;
	listed: number;
	page: number;
	/** Item currently being removed (TikTok-style preview) */
	current?: ExtensionProgressItem | null;
};

export type ExtensionState = {
	running: boolean;
	status: string;
	mode?: string | null;
	platform?: "tiktok" | "instagram" | null;
	progress: ExtensionProgress;
	lastError: string | null;
	/** Unix ms when job started */
	startedAt?: number | null;
	/** Unix ms when job finished (done / stopped / error) */
	endedAt?: number | null;
};

type Pending = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
	timer: number;
};

/** Fallback ID from extension/manifest.json "key" (if content script belum inject). */
export const EXTENSION_ID = "pjpnmdefhndngihneippmchmialbibbf";

const SOURCE_PAGE = "rr-dashboard";
const SOURCE_EXT = "rr-extension";

let requestSeq = 0;
const pending = new Map<number, Pending>();
const stateListeners = new Set<(state: ExtensionState) => void>();
let extensionReady = false;
let lastState: ExtensionState | null = null;

type ChromeRuntime = {
	sendMessage: (
		extensionId: string,
		message: unknown,
		responseCallback?: (response: unknown) => void,
	) => void;
	lastError?: { message?: string };
};

function getPageChromeRuntime(): ChromeRuntime | null {
	if (typeof window === "undefined") return null;
	const chromeApi = (
		window as unknown as { chrome?: { runtime?: ChromeRuntime } }
	).chrome;
	return chromeApi?.runtime ?? null;
}

function discoveredExtensionId(): string | null {
	if (typeof document === "undefined") return null;
	return document.documentElement.getAttribute("data-rr-extension-id") || null;
}

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

function sendViaPostMessage(
	payload: Record<string, unknown>,
	timeoutMs: number,
): Promise<unknown> {
	ensureListen();
	return new Promise((resolve, reject) => {
		const requestId = ++requestSeq;
		const timer = window.setTimeout(() => {
			pending.delete(requestId);
			reject(
				new Error(
					"Extension tidak merespons. Pastikan ekstensi terpasang & aktif, lalu hard refresh (Ctrl+Shift+R).",
				),
			);
		}, timeoutMs);
		pending.set(requestId, { resolve, reject, timer });
		window.postMessage({ source: SOURCE_PAGE, requestId, payload }, "*");
	});
}

function sendViaChromeRuntime(
	payload: Record<string, unknown>,
	timeoutMs: number,
): Promise<unknown> {
	const runtime = getPageChromeRuntime();
	if (!runtime?.sendMessage) {
		return Promise.reject(new Error("chrome.runtime unavailable"));
	}

	const extensionId = discoveredExtensionId() || EXTENSION_ID;

	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			reject(new Error("Extension timeout (chrome.runtime)"));
		}, timeoutMs);

		try {
			runtime.sendMessage(extensionId, payload, (response) => {
				window.clearTimeout(timer);
				const err = runtime.lastError;
				if (err) {
					reject(new Error(err.message || "Extension error"));
					return;
				}
				resolve(response);
			});
		} catch (err) {
			window.clearTimeout(timer);
			reject(err);
		}
	});
}

async function sendToExtension(
	payload: Record<string, unknown>,
	timeoutMs = 15000,
): Promise<unknown> {
	ensureListen();

	// Prefer content-script bridge (no extension-id mismatch)
	if (hasExtensionMarker()) {
		try {
			return await sendViaPostMessage(payload, timeoutMs);
		} catch {
			// fall through
		}
	}

	try {
		return await sendViaChromeRuntime(payload, Math.min(timeoutMs, 2500));
	} catch {
		// fall through
	}

	return sendViaPostMessage(payload, timeoutMs);
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
	mode?: "repost" | "like";
	platform?: "tiktok" | "instagram";
}): Promise<{ ok: boolean; error?: string }> {
	const platform = options.platform === "instagram" ? "instagram" : "tiktok";
	// Clear stale progress so UI never flashes a previous run
	lastState = {
		running: true,
		status: "starting",
		mode: options.mode || "repost",
		platform,
		progress: { done: 0, failed: 0, total: 0, listed: 0, page: 0 },
		lastError: null,
		startedAt: null,
		endedAt: null,
	};
	for (const cb of stateListeners) cb(lastState);

	const res = (await sendToExtension({
		type: "START",
		uniqueId: options.uniqueId,
		secUid: options.secUid || "",
		delayMs: options.delayMs,
		mode: options.mode || "repost",
		platform,
	})) as { ok?: boolean; error?: string };
	return { ok: Boolean(res?.ok), error: res?.error };
}

export async function stopExtensionJob(): Promise<void> {
	await sendToExtension({ type: "STOP" });
}

export async function confirmExtensionRemove(options: {
	limit: number;
	platform?: "tiktok" | "instagram";
}): Promise<{ ok: boolean; error?: string }> {
	const limit = Math.max(1, Math.floor(Number(options.limit) || 1));
	const res = (await sendToExtension({
		type: "CONFIRM_REMOVE",
		limit,
		platform: options.platform,
	})) as { ok?: boolean; error?: string };
	return { ok: Boolean(res?.ok), error: res?.error };
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

export type TikTokCookieAutofill = {
	sessionid: string;
	tt_csrf_token: string;
	msToken: string;
	ttwid: string;
	s_v_web_id: string;
	username?: string;
	secUid?: string;
	avatarUrl?: string;
};

/** Read TikTok session cookies from the browser via the Chrome extension. */
export async function fetchTikTokCookies(options?: {
	uniqueId?: string;
}): Promise<{
	ok: boolean;
	values?: TikTokCookieAutofill;
	error?: string;
	warning?: string;
}> {
	const uniqueId = String(options?.uniqueId || "")
		.replace(/^@/, "")
		.trim();
	const res = (await sendToExtension(
		{
			type: "GET_TIKTOK_COOKIES",
			uniqueId: uniqueId || undefined,
		},
		20000,
	)) as {
		ok?: boolean;
		values?: TikTokCookieAutofill;
		error?: string;
		warning?: string;
	};

	if (!res?.ok || !res.values?.sessionid) {
		return {
			ok: false,
			error:
				res?.error ||
				"Cookie TikTok tidak ditemukan. Login di tab tiktok.com dulu, pastikan ekstensi aktif, lalu coba lagi.",
		};
	}

	return { ok: true, values: res.values, warning: res.warning };
}

export type InstagramCookieAutofill = {
	sessionid: string;
	ds_user_id: string;
	csrftoken: string;
	mid: string;
	ig_did: string;
	datr: string;
	username?: string;
	avatarUrl?: string;
};

/** Read Instagram session cookies from the browser via the Chrome extension. */
export async function fetchInstagramCookies(options?: {
	username?: string;
}): Promise<{
	ok: boolean;
	values?: InstagramCookieAutofill;
	error?: string;
	warning?: string;
}> {
	const username = String(options?.username || "")
		.replace(/^@/, "")
		.trim();
	const res = (await sendToExtension(
		{
			type: "GET_INSTAGRAM_COOKIES",
			username: username || undefined,
		},
		20000,
	)) as {
		ok?: boolean;
		values?: InstagramCookieAutofill;
		error?: string;
		warning?: string;
	};

	if (!res?.ok || !res.values?.sessionid) {
		return {
			ok: false,
			error:
				res?.error ||
				"Cookie Instagram tidak ditemukan. Login di instagram.com dulu, pastikan ekstensi aktif, lalu coba lagi.",
		};
	}

	return { ok: true, values: res.values, warning: res.warning };
}

/** Verify Instagram session cookies via the browser extension (residential IP). */
export async function verifyInstagramSessionViaExtension(options: {
	cookies: string;
	username?: string;
	avatarHint?: string;
}): Promise<
	| { ok: true; user: TikTokUser }
	| { ok: false; error: string }
> {
	const res = (await sendToExtension(
		{
			type: "VERIFY_INSTAGRAM_SESSION",
			cookies: options.cookies,
			username: options.username,
			avatarHint: options.avatarHint,
		},
		25000,
	)) as {
		ok?: boolean;
		user?: TikTokUser;
		error?: string;
	};

	if (res?.ok && res.user?.uniqueId) {
		return { ok: true, user: res.user };
	}

	return {
		ok: false,
		error:
			res?.error ||
			"Gagal verifikasi cookie Instagram via ekstensi. Reload ekstensi lalu coba lagi.",
	};
}
