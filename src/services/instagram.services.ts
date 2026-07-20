import type { InstagramCookieValues } from "#/components/InstagramCookieForm";
import type { TikTokUser } from "#/types/tiktok";

const IG_ORIGIN = "https://www.instagram.com";
const IG_APP_ID = "936619673304451";
const IG_USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export class InstagramServiceError extends Error {
	statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = "InstagramServiceError";
		this.statusCode = statusCode;
	}
}

function decodeCookieValue(raw: string): string {
	const value = raw.trim();
	if (!value || !/%[0-9A-Fa-f]{2}/.test(value)) return value;
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function parseCookieStringToMap(raw: string): Map<string, string> {
	const map = new Map<string, string>();
	const trimmed = raw.trim();
	if (!trimmed) return map;

	for (const part of trimmed.split(/;\s*/)) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = decodeCookieValue(part.slice(eq + 1).trim());
		if (key) map.set(key, value);
	}
	return map;
}

export function parseInstagramCookieString(
	raw: string,
): Partial<InstagramCookieValues> | null {
	const map = parseCookieStringToMap(raw);
	if (map.size === 0) return null;

	return {
		sessionid: map.get("sessionid") || "",
		ds_user_id: map.get("ds_user_id") || "",
		csrftoken: map.get("csrftoken") || "",
		mid: map.get("mid") || "",
		ig_did: map.get("ig_did") || "",
		datr: map.get("datr") || "",
	};
}

/** Normalize pasted cookies into a Cookie header string. */
export function normalizeInstagramCookieHeader(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) {
		throw new InstagramServiceError(
			"Cookie kosong. Tempel cookie Instagram kamu.",
		);
	}

	if (trimmed.includes("=")) {
		const map = parseCookieStringToMap(trimmed);
		if (!map.has("sessionid")) {
			throw new InstagramServiceError(
				"Cookie harus berisi sessionid. Export cookie dari browser setelah login ke instagram.com.",
			);
		}
		if (!map.has("csrftoken")) {
			throw new InstagramServiceError(
				"Cookie harus berisi csrftoken. Export cookie lengkap dari DevTools.",
			);
		}
		if (!map.has("ds_user_id")) {
			throw new InstagramServiceError(
				"Cookie harus berisi ds_user_id. Export cookie lengkap dari DevTools.",
			);
		}
		return Array.from(map.entries())
			.map(([k, v]) => `${k}=${v}`)
			.join("; ");
	}

	throw new InstagramServiceError(
		"Format cookie tidak valid. Tempel baris cookie lengkap (sessionid=…; ds_user_id=…; csrftoken=…).",
	);
}

export function buildInstagramCookieHeaderFromValues(
	values: InstagramCookieValues,
): string {
	const header = normalizeInstagramCookieHeader(
		[
			values.sessionid && `sessionid=${values.sessionid.trim()}`,
			values.ds_user_id && `ds_user_id=${values.ds_user_id.trim()}`,
			values.csrftoken && `csrftoken=${values.csrftoken.trim()}`,
			values.mid && `mid=${values.mid.trim()}`,
			values.ig_did && `ig_did=${values.ig_did.trim()}`,
			values.datr && `datr=${values.datr.trim()}`,
		]
			.filter(Boolean)
			.join("; "),
	);
	return header;
}

function getCookieValue(
	cookieHeader: string,
	name: string,
): string | undefined {
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match?.[1] ? decodeCookieValue(match[1]) : undefined;
}

function baseHeaders(cookieHeader: string, csrftoken: string): HeadersInit {
	return {
		accept: "*/*",
		"accept-language": "en-US,en;q=0.9",
		cookie: cookieHeader,
		origin: IG_ORIGIN,
		referer: `${IG_ORIGIN}/`,
		"user-agent": IG_USER_AGENT,
		"x-csrftoken": csrftoken,
		"x-ig-app-id": IG_APP_ID,
		"x-requested-with": "XMLHttpRequest",
		"sec-ch-ua":
			'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
	};
}

async function parseJsonResponse(
	res: Response,
	path: string,
): Promise<Record<string, unknown>> {
	const text = await res.text();
	if (!text.trim()) {
		throw new InstagramServiceError(
			`Instagram mengembalikan respons kosong dari ${path}. Perbarui cookie dari DevTools.`,
			res.status,
		);
	}
	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		if (res.status === 401 || res.status === 403) {
			throw new InstagramServiceError(
				"Session Instagram tidak valid atau kedaluwarsa. Login ulang di instagram.com lalu export cookie baru.",
				res.status,
			);
		}
		throw new InstagramServiceError(
			`Respons Instagram bukan JSON dari ${path} (HTTP ${res.status}).`,
			res.status,
		);
	}
}

function mapInstagramUser(
	user: Record<string, unknown>,
	fallbackId?: string,
): TikTokUser {
	const username = String(user.username || "").trim().replace(/^@/, "");
	const pk = String(user.pk || user.id || fallbackId || "").trim();
	const nickname =
		typeof user.full_name === "string" && user.full_name.trim()
			? user.full_name.trim()
			: username;
	const avatarUrl =
		(typeof user.profile_pic_url === "string" && user.profile_pic_url) ||
		(typeof user.profile_pic_url_hd === "string" && user.profile_pic_url_hd) ||
		undefined;

	if (!username) {
		throw new InstagramServiceError(
			"Profil Instagram tidak ditemukan dari cookie.",
		);
	}

	return {
		uniqueId: username,
		secUid: pk,
		nickname,
		avatarUrl,
	};
}

async function getCurrentUser(cookieHeader: string): Promise<TikTokUser | null> {
	const csrftoken = getCookieValue(cookieHeader, "csrftoken");
	if (!csrftoken) return null;

	const path = "/api/v1/accounts/current_user/?edit=true";
	const res = await fetch(`${IG_ORIGIN}${path}`, {
		headers: baseHeaders(cookieHeader, csrftoken),
	});
	if (!res.ok) return null;

	const json = await parseJsonResponse(res, path);
	const user = (json.user || json) as Record<string, unknown>;
	if (!user || typeof user !== "object") return null;
	return mapInstagramUser(user, getCookieValue(cookieHeader, "ds_user_id"));
}

async function getUserByUsername(
	cookieHeader: string,
	username: string,
): Promise<TikTokUser | null> {
	const csrftoken = getCookieValue(cookieHeader, "csrftoken");
	if (!csrftoken) return null;

	const handle = username.trim().replace(/^@/, "");
	if (!handle) return null;

	const path = `/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`;
	const res = await fetch(`${IG_ORIGIN}${path}`, {
		headers: baseHeaders(cookieHeader, csrftoken),
	});
	if (!res.ok) return null;

	const json = await parseJsonResponse(res, path);
	const data = json.data as Record<string, unknown> | undefined;
	const user = data?.user as Record<string, unknown> | undefined;
	if (!user) return null;

	const dsUserId = getCookieValue(cookieHeader, "ds_user_id");
	const profileId = String(user.id || user.pk || "").trim();
	if (dsUserId && profileId && dsUserId !== profileId) {
		throw new InstagramServiceError(
			`Cookie ds_user_id (${dsUserId}) tidak cocok dengan profil @${handle} (${profileId}). Pastikan cookie dari akun yang sama.`,
		);
	}

	return mapInstagramUser(user, dsUserId || profileId);
}

export async function getSelfUser(
	cookieInput: string,
	usernameHint?: string,
): Promise<TikTokUser> {
	const cookieHeader = normalizeInstagramCookieHeader(cookieInput);
	const hint = usernameHint?.trim().replace(/^@/, "");

	try {
		const current = await getCurrentUser(cookieHeader);
		if (current) {
			if (hint && current.uniqueId.toLowerCase() !== hint.toLowerCase()) {
				throw new InstagramServiceError(
					`Cookie milik @${current.uniqueId}, bukan @${hint}. Perbarui cookie atau username.`,
				);
			}
			return current;
		}
	} catch (err) {
		if (err instanceof InstagramServiceError) throw err;
	}

	if (hint) {
		const fromProfile = await getUserByUsername(cookieHeader, hint);
		if (fromProfile) return fromProfile;
	}

	throw new InstagramServiceError(
		"Gagal verifikasi cookie Instagram. Pastikan sessionid, ds_user_id, dan csrftoken masih valid — login ulang di instagram.com lalu export cookie baru.",
	);
}
