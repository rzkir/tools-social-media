import { signTikTokUrl, TIKTOK_USER_AGENT } from "#/lib/tiktok-sign/sign";
import type {
	TikTokRepostItem,
	TikTokRepostPage,
	TikTokUser,
} from "#/types/tiktok";

const TIKTOK_ORIGIN = "https://www.tiktok.com";

export class TikTokServiceError extends Error {
	statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = "TikTokServiceError";
		this.statusCode = statusCode;
	}
}

/** Normalize pasted cookies into a Cookie header string. */
export function normalizeCookieHeader(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) {
		throw new TikTokServiceError("Cookie kosong. Tempel cookie TikTok kamu.");
	}

	if (!trimmed.includes("=") && !trimmed.includes(";")) {
		return `sessionid=${trimmed}`;
	}

	const parts = trimmed
		.split(/;\s*/)
		.map((part) => part.trim())
		.filter(Boolean);

	const map = new Map<string, string>();
	for (const part of parts) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key) map.set(key, value);
	}

	if (!map.has("sessionid") && !map.has("sessionid_ss")) {
		throw new TikTokServiceError(
			"Cookie harus berisi sessionid. Export cookie dari browser setelah login ke tiktok.com.",
		);
	}

	return Array.from(map.entries())
		.map(([k, v]) => `${k}=${v}`)
		.join("; ");
}

function getCookieValue(
	cookieHeader: string,
	name: string,
): string | undefined {
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function baseHeaders(cookieHeader: string): HeadersInit {
	const csrf = getCookieValue(cookieHeader, "tt_csrf_token");
	return {
		accept: "application/json, text/plain, */*",
		"accept-language": "en-US,en;q=0.9",
		cookie: cookieHeader,
		origin: TIKTOK_ORIGIN,
		referer: `${TIKTOK_ORIGIN}/`,
		"user-agent": TIKTOK_USER_AGENT,
		"sec-ch-ua":
			'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		...(csrf
			? {
					"tt-csrf-token": csrf,
					"x-secsdk-csrf-token": csrf,
				}
			: {}),
	};
}

function emptyResponseHint(path: string): string {
	return (
		`TikTok mengembalikan respons kosong dari ${path}. ` +
		"Request dari server sering ditolak anti-bot TikTok (bukan hanya msToken kedaluwarsa). " +
		"Perbarui cookie (sessionid + msToken) dari DevTools → Application → Cookies setelah login di tiktok.com, lalu verifikasi ulang."
	);
}

function rateLimitMessage(path: string): string {
	return (
		`TikTok rate-limit (HTTP 429) di ${path}. ` +
		"Jangan spam verifikasi. Tunggu 1–2 menit, isi username (tanpa @) biar verifikasi lewat halaman profil (lebih aman), lalu coba sekali lagi."
	);
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function setCookieInHeader(
	cookieHeader: string,
	name: string,
	value: string,
): string {
	const map = new Map<string, string>();
	for (const part of cookieHeader.split(/;\s*/)) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		map.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
	}
	map.set(name, value);
	return Array.from(map.entries())
		.map(([k, v]) => `${k}=${v}`)
		.join("; ");
}

function extractSetCookieValues(res: Response): Record<string, string> {
	const out: Record<string, string> = {};
	const headers = res.headers as Headers & {
		getSetCookie?: () => string[];
	};
	const lines =
		typeof headers.getSetCookie === "function"
			? headers.getSetCookie()
			: [headers.get("set-cookie")].filter((v): v is string => Boolean(v));

	for (const line of lines) {
		// May contain multiple cookies separated oddly; take first pair per line
		const first = line.split(";")[0] ?? "";
		const eq = first.indexOf("=");
		if (eq === -1) continue;
		const key = first.slice(0, eq).trim();
		const value = first.slice(eq + 1).trim();
		if (key && value) out[key] = value;
	}
	return out;
}

/**
 * Warm TikTok and merge Set-Cookie. By default keeps the caller's msToken
 * (browser-copied tokens are usually better than anonymous warm tokens).
 */
async function refreshSessionTokens(
	cookieHeader: string,
	options?: { replaceMsToken?: boolean },
): Promise<string> {
	let next = cookieHeader;
	const replaceMsToken = options?.replaceMsToken ?? false;
	const hadMsToken = Boolean(getCookieValue(cookieHeader, "msToken"));

	const warmUrls = [
		`${TIKTOK_ORIGIN}/api/recommend/item_list/?aid=1988&count=1&app_name=tiktok_web&device_platform=web_pc`,
		`${TIKTOK_ORIGIN}/`,
	];

	for (const warmUrl of warmUrls) {
		try {
			const res = await fetch(warmUrl, {
				method: "GET",
				headers: {
					...baseHeaders(next),
					accept: warmUrl.endsWith("/")
						? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
						: "*/*",
				},
				redirect: "follow",
			});
			const set = extractSetCookieValues(res);
			if (set.ttwid) next = setCookieInHeader(next, "ttwid", set.ttwid);
			if (set.msToken && (replaceMsToken || !hadMsToken)) {
				next = setCookieInHeader(next, "msToken", set.msToken);
				break;
			}
			if (set.ttwid) break;
		} catch {
			// try next warm URL
		}
	}

	return next;
}

function buildQueryString(params: Record<string, string>): string {
	// Stable key order (browser-ish) — signing is sensitive to the exact query string
	const preferred = [
		"WebIdLastTime",
		"aid",
		"app_language",
		"app_name",
		"browser_language",
		"browser_name",
		"browser_online",
		"browser_platform",
		"browser_version",
		"channel",
		"cookie_enabled",
		"count",
		"coverFormat",
		"cursor",
		"device_id",
		"device_platform",
		"focus_state",
		"from_page",
		"history_len",
		"is_fullscreen",
		"is_page_visible",
		"language",
		"needPinnedItemIds",
		"os",
		"post_item_list_request_type",
		"priority_region",
		"referer",
		"region",
		"screen_height",
		"screen_width",
		"secUid",
		"tz_name",
		"user_is_login",
		"verifyFp",
		"webcast_language",
		"msToken",
	];

	const keys = [
		...preferred.filter((k) => k in params),
		...Object.keys(params)
			.filter((k) => !preferred.includes(k))
			.sort(),
	];

	return keys
		.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
		.join("&");
}

function webCommonParams(cookieHeader: string): Record<string, string> {
	const msToken = getCookieValue(cookieHeader, "msToken") ?? "";
	const verifyFp =
		getCookieValue(cookieHeader, "s_v_web_id") ??
		getCookieValue(cookieHeader, "verifyFp") ??
		"";
	const deviceId =
		getCookieValue(cookieHeader, "tt_webid_v2") ??
		getCookieValue(cookieHeader, "tt_webid") ??
		getCookieValue(cookieHeader, "ttwid") ??
		"";

	return {
		WebIdLastTime: String(Math.floor(Date.now() / 1000)),
		aid: "1988",
		app_language: "en",
		app_name: "tiktok_web",
		browser_language: "en-US",
		browser_name: "Mozilla",
		browser_online: "true",
		browser_platform: "Win32",
		browser_version:
			"5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
		channel: "tiktok_web",
		cookie_enabled: "true",
		device_platform: "web_pc",
		focus_state: "true",
		from_page: "user",
		history_len: "3",
		is_fullscreen: "false",
		is_page_visible: "true",
		language: "en",
		os: "windows",
		priority_region: "",
		referer: "",
		region: "US",
		screen_height: "1080",
		screen_width: "1920",
		tz_name: "Asia/Jakarta",
		user_is_login: "1",
		webcast_language: "en",
		...(deviceId ? { device_id: deviceId } : {}),
		...(verifyFp ? { verifyFp } : {}),
		...(msToken ? { msToken } : {}),
	};
}

function buildSignedUrl(
	path: string,
	params: Record<string, string>,
	body = "",
	options?: { bogusOnly?: boolean; ubcode?: number },
): string {
	const qs = buildQueryString(params);
	const url = `${TIKTOK_ORIGIN}${path}?${qs}`;
	return signTikTokUrl(url, {
		body,
		ubcode: options?.ubcode ?? 4,
		bogusOnly: options?.bogusOnly,
	});
}

async function readJson<T>(res: Response, pathLabel: string): Promise<T> {
	const text = await res.text();

	if (res.status === 429 || /ratelimit/i.test(text)) {
		throw new TikTokServiceError(rateLimitMessage(pathLabel), 429);
	}

	if (!text.trim()) {
		throw new TikTokServiceError(
			res.status === 429
				? rateLimitMessage(pathLabel)
				: emptyResponseHint(pathLabel),
			res.status,
		);
	}

	try {
		return JSON.parse(text) as T;
	} catch {
		if (/ratelimit/i.test(text)) {
			throw new TikTokServiceError(rateLimitMessage(pathLabel), 429);
		}
		const preview = text.replace(/\s+/g, " ").slice(0, 160);
		const looksHtml = /<!doctype html>|<html/i.test(text);
		throw new TikTokServiceError(
			looksHtml
				? `TikTok mengembalikan halaman HTML (bukan API JSON). Cookie/session kemungkinan tidak valid atau terkena challenge.`
				: `Respons TikTok bukan JSON (HTTP ${res.status}): ${preview}`,
			res.status,
		);
	}
}

async function tiktokFetch(
	url: string,
	init: RequestInit,
	pathLabel: string,
	retries = 2,
): Promise<Response> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch(url, init);
			const peek = res.clone();
			const text = await peek.text();

			const isRateLimited =
				res.status === 429 || /ratelimit triggered/i.test(text);

			if (isRateLimited) {
				if (attempt < retries) {
					await sleep(2500 * (attempt + 1));
					continue;
				}
				throw new TikTokServiceError(rateLimitMessage(pathLabel), 429);
			}

			// Rebuild response so callers can still .text()/.json()
			return new Response(text, {
				status: res.status,
				statusText: res.statusText,
				headers: res.headers,
			});
		} catch (err) {
			lastError = err;
			if (err instanceof TikTokServiceError) throw err;
			if (attempt < retries) {
				await sleep(1500 * (attempt + 1));
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new TikTokServiceError(`Gagal request ke ${pathLabel}`);
}

function pickUserFromRehydration(data: unknown): TikTokUser | null {
	if (!data || typeof data !== "object") return null;
	const root = data as Record<string, unknown>;
	const scope = root.__DEFAULT_SCOPE__ as Record<string, unknown> | undefined;
	if (!scope) return null;

	const appContext = scope["webapp.app-context"] as
		| {
				user?: {
					secUid?: string;
					uniqueId?: string;
					nickName?: string;
					avatarUri?: string[];
				};
		  }
		| undefined;
	const user = appContext?.user;
	if (user?.secUid && user.uniqueId) {
		return {
			secUid: user.secUid,
			uniqueId: user.uniqueId,
			nickname: user.nickName || user.uniqueId,
			avatarUrl: user.avatarUri?.[0],
		};
	}

	const userDetail = scope["webapp.user-detail"] as
		| {
				userInfo?: {
					user?: {
						secUid?: string;
						uniqueId?: string;
						nickname?: string;
						avatarThumb?: string;
					};
				};
		  }
		| undefined;
	const detailUser = userDetail?.userInfo?.user;
	if (detailUser?.secUid && detailUser.uniqueId) {
		return {
			secUid: detailUser.secUid,
			uniqueId: detailUser.uniqueId,
			nickname: detailUser.nickname || detailUser.uniqueId,
			avatarUrl: detailUser.avatarThumb,
		};
	}

	return null;
}

function pickUserFromHtmlRegex(html: string): TikTokUser | null {
	// Prefer pair near uniqueId + secUid in the same object-ish window
	const windowMatch = html.match(
		/"uniqueId"\s*:\s*"([^"]{2,64})"[\s\S]{0,240}?"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/,
	);
	if (windowMatch) {
		return {
			uniqueId: windowMatch[1],
			secUid: windowMatch[2],
			nickname: windowMatch[1],
		};
	}

	const alt = html.match(
		/"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"[\s\S]{0,240}?"uniqueId"\s*:\s*"([^"]{2,64})"/,
	);
	if (alt) {
		return {
			secUid: alt[1],
			uniqueId: alt[2],
			nickname: alt[2],
		};
	}

	return null;
}

/** Resolve logged-in user from cookies (optional uniqueId / secUid shortcut). */
export async function getSelfUser(
	cookieInput: string,
	uniqueIdHint?: string,
	secUidHint?: string,
): Promise<TikTokUser> {
	const cookieHeader = normalizeCookieHeader(cookieInput);
	const hint = uniqueIdHint?.trim().replace(/^@/, "");
	const secUid = secUidHint?.trim();

	// Extension/viewport already gave secUid — trust it (avoids Worker rate-limit on HTML/API)
	if (secUid && hint) {
		try {
			const fromProfile = await getUserFromProfileHtml(cookieHeader, hint);
			if (fromProfile?.secUid) return fromProfile;
		} catch {
			// ignore rate-limit / empty HTML
		}
		return {
			secUid,
			uniqueId: hint,
			nickname: hint,
		};
	}

	// Prefer profile HTML when username known — yields real secUid for repost list
	if (hint) {
		const fromProfile = await getUserFromProfileHtml(cookieHeader, hint);
		if (fromProfile) return fromProfile;
	}

	// Homepage HTML
	const fromHome = await getUserFromHomeHtml(cookieHeader);
	if (fromHome) {
		if (!hint || fromHome.uniqueId.toLowerCase() === hint.toLowerCase()) {
			return fromHome;
		}
	}

	if (secUid) {
		return {
			secUid,
			uniqueId: hint || "me",
			nickname: hint || "me",
		};
	}

	// If username known but HTML failed, last resort signed API (with retry)
	if (hint) {
		try {
			return await getUserByUniqueId(cookieHeader, hint);
		} catch (err) {
			if (err instanceof TikTokServiceError && err.statusCode === 429) {
				throw err;
			}
			throw new TikTokServiceError(
				`Tidak bisa membaca profil @${hint}. Buka tab tiktok.com/@${hint}, klik Ambil dari Browser agar secUid terisi, atau isi secUid manual.`,
			);
		}
	}

	throw new TikTokServiceError(
		"Tidak bisa membaca akun dari cookie. Isi username (tanpa @) — lebih baik juga isi secUid — lalu verifikasi sekali. Jangan spam klik.",
	);
}

async function getUserFromHomeHtml(
	cookieHeader: string,
): Promise<TikTokUser | null> {
	const res = await tiktokFetch(
		`${TIKTOK_ORIGIN}/`,
		{
			method: "GET",
			headers: {
				...baseHeaders(cookieHeader),
				accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			},
			redirect: "follow",
		},
		"/",
		1,
	);

	if (!res.ok) return null;
	const html = await res.text();
	if (!html.trim()) return null;

	const universalMatch = html.match(
		/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
	);
	if (universalMatch?.[1]) {
		try {
			const user = pickUserFromRehydration(JSON.parse(universalMatch[1]));
			if (user) return user;
		} catch {
			// fall through
		}
	}

	return pickUserFromHtmlRegex(html);
}

async function getUserFromProfileHtml(
	cookieHeader: string,
	uniqueId: string,
): Promise<TikTokUser | null> {
	const res = await tiktokFetch(
		`${TIKTOK_ORIGIN}/@${encodeURIComponent(uniqueId)}`,
		{
			method: "GET",
			headers: {
				...baseHeaders(cookieHeader),
				accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				referer: `${TIKTOK_ORIGIN}/`,
			},
			redirect: "follow",
		},
		`/@${uniqueId}`,
		1,
	);

	if (!res.ok) return null;
	const html = await res.text();
	if (!html.trim()) return null;

	const universalMatch = html.match(
		/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
	);
	if (universalMatch?.[1]) {
		try {
			const parsed = JSON.parse(universalMatch[1]) as unknown;
			const fromScope = pickUserFromRehydration(parsed);
			if (fromScope) return fromScope;

			// Profile pages often nest user under webapp.user-detail
			const root = parsed as Record<string, unknown>;
			const scope = root.__DEFAULT_SCOPE__ as
				| Record<string, unknown>
				| undefined;
			const detail = scope?.["webapp.user-detail"] as
				| {
						userInfo?: {
							user?: {
								secUid?: string;
								uniqueId?: string;
								nickname?: string;
								avatarThumb?: string;
							};
						};
				  }
				| undefined;
			const user = detail?.userInfo?.user;
			if (user?.secUid && user.uniqueId) {
				return {
					secUid: user.secUid,
					uniqueId: user.uniqueId,
					nickname: user.nickname || user.uniqueId,
					avatarUrl: user.avatarThumb,
				};
			}
		} catch {
			// fall through
		}
	}

	const fromRegex = pickUserFromHtmlRegex(html);
	if (fromRegex) return fromRegex;

	// Looser match for profile pages
	const sec = html.match(/"secUid"\s*:\s*"(MS4wLjABAAAA[^"]+)"/);
	if (sec?.[1]) {
		return {
			secUid: sec[1],
			uniqueId,
			nickname: uniqueId,
		};
	}

	return null;
}

async function getUserByUniqueId(
	cookieHeader: string,
	uniqueId: string,
): Promise<TikTokUser> {
	const url = buildSignedUrl("/api/user/detail/", {
		...webCommonParams(cookieHeader),
		uniqueId,
	});

	const res = await tiktokFetch(
		url,
		{
			method: "GET",
			headers: baseHeaders(cookieHeader),
		},
		"/api/user/detail/",
		2,
	);

	const json = await readJson<{
		statusCode?: number;
		status_code?: number;
		userInfo?: {
			user?: {
				secUid?: string;
				uniqueId?: string;
				nickname?: string;
				avatarThumb?: string;
			};
		};
	}>(res, "/api/user/detail/");

	const code = json.status_code ?? json.statusCode;
	const user = json.userInfo?.user;
	if ((code !== undefined && code !== 0) || !user?.secUid || !user.uniqueId) {
		throw new TikTokServiceError(
			`Gagal mengambil profil @${uniqueId}. Cookie mungkin tidak valid.`,
			code,
		);
	}

	return {
		secUid: user.secUid,
		uniqueId: user.uniqueId,
		nickname: user.nickname || user.uniqueId,
		avatarUrl: user.avatarThumb,
	};
}

type RawRepostList = {
	status_code?: number;
	statusCode?: number;
	status_msg?: string;
	hasMore?: boolean;
	has_more?: boolean;
	cursor?: string | number;
	itemList?: Array<{
		id?: string;
		desc?: string;
		author?: { uniqueId?: string };
		video?: { cover?: string; originCover?: string };
	}>;
	aweme_list?: Array<{
		aweme_id?: string;
		desc?: string;
		author?: { unique_id?: string; uniqueId?: string };
		video?: {
			cover?: { url_list?: string[] };
			origin_cover?: { url_list?: string[] };
		};
	}>;
};

function mapRepostItems(json: RawRepostList): TikTokRepostItem[] {
	const fromItemList = (json.itemList || [])
		.filter((e): e is NonNullable<typeof e> & { id: string } => Boolean(e.id))
		.map((e) => {
			const author = e.author?.uniqueId ?? "";
			return {
				id: e.id,
				authorName: author ? `@${author}` : "@unknown",
				desc: e.desc || "",
				url: author
					? `https://www.tiktok.com/@${author}/video/${e.id}`
					: `https://www.tiktok.com/video/${e.id}`,
				coverUrl: e.video?.cover || e.video?.originCover,
			};
		});

	if (fromItemList.length > 0) return fromItemList;

	return (json.aweme_list || [])
		.filter((e): e is NonNullable<typeof e> & { aweme_id: string } =>
			Boolean(e.aweme_id),
		)
		.map((e) => {
			const author = e.author?.uniqueId || e.author?.unique_id || "";
			return {
				id: e.aweme_id,
				authorName: author ? `@${author}` : "@unknown",
				desc: e.desc || "",
				url: author
					? `https://www.tiktok.com/@${author}/video/${e.aweme_id}`
					: `https://www.tiktok.com/video/${e.aweme_id}`,
				coverUrl:
					e.video?.cover?.url_list?.[0] || e.video?.origin_cover?.url_list?.[0],
			};
		});
}

/** List one page of reposted videos. */
export async function listReposts(
	cookieInput: string,
	secUid: string,
	cursor = "0",
	count = 30,
	options?: { uniqueId?: string },
): Promise<TikTokRepostPage> {
	if (!secUid.trim() || secUid.trim() === "me") {
		throw new TikTokServiceError(
			"secUid tidak valid. Kosongkan field secUid, isi username saja, lalu verifikasi ulang.",
		);
	}

	// Keep pasted msToken first — anonymous warm tokens often cause empty bodies
	let cookieHeader = await refreshSessionTokens(
		normalizeCookieHeader(cookieInput),
		{ replaceMsToken: false },
	);

	if (!getCookieValue(cookieHeader, "msToken")) {
		cookieHeader = await refreshSessionTokens(cookieHeader, {
			replaceMsToken: true,
		});
	}

	if (!getCookieValue(cookieHeader, "msToken")) {
		throw new TikTokServiceError(
			"msToken wajib. Salin nilai terbaru dari DevTools → Application → Cookies → msToken setelah login di tiktok.com.",
		);
	}

	const uniqueId = options?.uniqueId?.trim().replace(/^@/, "");
	const referer = uniqueId
		? `${TIKTOK_ORIGIN}/@${uniqueId}`
		: `${TIKTOK_ORIGIN}/`;

	const buildStrategies = (header: string) => {
		const ms = getCookieValue(header, "msToken");
		return [
			{
				label: "full+gnarly",
				params: {
					...webCommonParams(header),
					count: String(count),
					coverFormat: "2",
					cursor: String(cursor),
					needPinnedItemIds: "true",
					post_item_list_request_type: "0",
					secUid,
				},
				bogusOnly: false as boolean | undefined,
			},
			{
				label: "minimal+gnarly",
				params: {
					aid: "1988",
					count: String(count),
					coverFormat: "2",
					cursor: String(cursor),
					needPinnedItemIds: "true",
					post_item_list_request_type: "0",
					secUid,
					...(ms ? { msToken: ms } : {}),
				},
				bogusOnly: false as boolean | undefined,
			},
			{
				label: "minimal+bogus",
				params: {
					aid: "1988",
					count: String(count),
					coverFormat: "2",
					cursor: String(cursor),
					needPinnedItemIds: "true",
					post_item_list_request_type: "0",
					secUid,
					...(ms ? { msToken: ms } : {}),
				},
				bogusOnly: true as boolean | undefined,
			},
		];
	};

	let lastEmpty = false;
	let replacedMs = false;

	for (let round = 0; round < 2; round++) {
		if (round === 1) {
			// Second round: force a fresh msToken from warm endpoints
			cookieHeader = await refreshSessionTokens(cookieHeader, {
				replaceMsToken: true,
			});
			replacedMs = true;
			await sleep(600);
		}

		const strategies = buildStrategies(cookieHeader);

		for (let i = 0; i < strategies.length; i++) {
			const strategy = strategies[i];

			if (i > 0 && lastEmpty) {
				await sleep(500);
			}

			const url = buildSignedUrl(
				"/api/repost/item_list/",
				strategy.params,
				"",
				{
					bogusOnly: strategy.bogusOnly,
					ubcode: 4,
				},
			);

			const res = await tiktokFetch(
				url,
				{
					method: "GET",
					headers: {
						...baseHeaders(cookieHeader),
						accept: "*/*",
						referer,
					},
				},
				"/api/repost/item_list/",
				1,
			);

			// Merge any rotated tokens from the API response
			const set = extractSetCookieValues(res);
			if (set.msToken) {
				cookieHeader = setCookieInHeader(cookieHeader, "msToken", set.msToken);
			}
			if (set.ttwid) {
				cookieHeader = setCookieInHeader(cookieHeader, "ttwid", set.ttwid);
			}

			const text = await res.text();
			if (!text.trim()) {
				lastEmpty = true;
				continue;
			}

			if (res.status === 429 || /ratelimit/i.test(text)) {
				throw new TikTokServiceError(
					rateLimitMessage("/api/repost/item_list/"),
					429,
				);
			}

			let json: RawRepostList;
			try {
				json = JSON.parse(text) as RawRepostList;
			} catch {
				lastEmpty = true;
				continue;
			}

			const code = json.status_code ?? json.statusCode;
			if (code !== undefined && code !== 0) {
				throw new TikTokServiceError(
					json.status_msg ||
						`Gagal memuat daftar repost (status ${code}). Cookie mungkin kedaluwarsa.`,
					code,
				);
			}

			const items = mapRepostItems(json);
			return {
				items,
				hasMore: Boolean(json.hasMore ?? json.has_more),
				cursor: json.cursor != null ? String(json.cursor) : null,
			};
		}

		if (!lastEmpty || replacedMs) break;
	}

	throw new TikTokServiceError(
		emptyResponseHint("/api/repost/item_list/"),
		200,
	);
}

/** Load all repost pages (capped). */
export async function listAllReposts(
	cookieInput: string,
	secUid: string,
	options?: { maxPages?: number; count?: number; uniqueId?: string },
): Promise<{
	items: TikTokRepostItem[];
	cookieHeader: string;
	refreshed: { msToken?: string; ttwid?: string };
}> {
	const maxPages = options?.maxPages ?? 50;
	const count = options?.count ?? 30;
	const all: TikTokRepostItem[] = [];
	let cursor = "0";
	const seen = new Set<string>();

	// Preserve pasted msToken; only refresh ttwid / missing tokens
	const cookieHeader = await refreshSessionTokens(
		normalizeCookieHeader(cookieInput),
		{ replaceMsToken: false },
	);

	for (let page = 0; page < maxPages; page++) {
		if (page > 0) await sleep(800);
		const result = await listReposts(cookieHeader, secUid, cursor, count, {
			uniqueId: options?.uniqueId,
		});
		for (const item of result.items) {
			if (seen.has(item.id)) continue;
			seen.add(item.id);
			all.push(item);
		}
		if (!result.hasMore || !result.cursor) break;
		cursor = result.cursor;
	}

	return {
		items: all,
		cookieHeader,
		refreshed: {
			msToken: getCookieValue(cookieHeader, "msToken"),
			ttwid: getCookieValue(cookieHeader, "ttwid"),
		},
	};
}

/** Remove a single repost by video id. */
export async function removeRepost(
	cookieInput: string,
	itemId: string,
): Promise<void> {
	const cookieHeader = normalizeCookieHeader(cookieInput);
	const body = "";
	const url = buildSignedUrl(
		"/tiktok/v1/upvote/delete",
		{
			...webCommonParams(cookieHeader),
			item_id: String(itemId),
		},
		body,
	);

	const res = await tiktokFetch(
		url,
		{
			method: "POST",
			headers: {
				...baseHeaders(cookieHeader),
				"content-type": "application/x-www-form-urlencoded",
			},
			body,
		},
		"/tiktok/v1/upvote/delete",
		2,
	);

	const json = await readJson<{
		status_code?: number;
		statusCode?: number;
		status_msg?: string;
	}>(res, "/tiktok/v1/upvote/delete");

	const code = json.status_code ?? json.statusCode;
	if (code !== undefined && code !== 0) {
		throw new TikTokServiceError(
			json.status_msg || `Gagal hapus repost ${itemId} (status ${code})`,
			code,
		);
	}
}
