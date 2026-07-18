import {
	EMPTY_COOKIE_VALUES,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import type { TikTokUser } from "#/types/tiktok";

const STORAGE_KEY = "tt_repost_cookie_session";

export type StoredCookieSession = {
	cookies: TikTokCookieValues;
	user: TikTokUser | null;
};

function parseUser(value: unknown): TikTokUser | null {
	if (!value || typeof value !== "object") return null;
	const u = value as Record<string, unknown>;
	if (typeof u.uniqueId !== "string" || !u.uniqueId.trim()) return null;
	return {
		uniqueId: u.uniqueId.trim().replace(/^@/, ""),
		secUid: typeof u.secUid === "string" ? u.secUid : "",
		nickname:
			typeof u.nickname === "string" && u.nickname.trim()
				? u.nickname
				: u.uniqueId.trim().replace(/^@/, ""),
		avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : undefined,
	};
}

function parseCookies(value: unknown): TikTokCookieValues {
	if (!value || typeof value !== "object") return { ...EMPTY_COOKIE_VALUES };
	const v = value as Record<string, unknown>;
	return {
		...EMPTY_COOKIE_VALUES,
		sessionid: typeof v.sessionid === "string" ? v.sessionid : "",
		tt_csrf_token: typeof v.tt_csrf_token === "string" ? v.tt_csrf_token : "",
		msToken: typeof v.msToken === "string" ? v.msToken : "",
		s_v_web_id: typeof v.s_v_web_id === "string" ? v.s_v_web_id : "",
		ttwid: typeof v.ttwid === "string" ? v.ttwid : "",
		username: typeof v.username === "string" ? v.username.replace(/^@/, "") : "",
		secUid: typeof v.secUid === "string" ? v.secUid : "",
	};
}

export function loadCookieSession(): StoredCookieSession | null {
	if (typeof sessionStorage === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredCookieSession>;
		const cookies = parseCookies(parsed.cookies);
		const user = parseUser(parsed.user);

		// Fill username/secUid from user if cookies incomplete
		if (user?.uniqueId && !cookies.username) cookies.username = user.uniqueId;
		if (user?.secUid && !cookies.secUid) cookies.secUid = user.secUid;

		if (!cookies.username && !user) return null;

		return { cookies, user };
	} catch {
		return null;
	}
}

export function saveCookieSession(
	cookies: TikTokCookieValues,
	user: TikTokUser | null,
): void {
	if (typeof sessionStorage === "undefined") return;
	try {
		const payload: StoredCookieSession = { cookies, user };
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// ignore quota / private mode
	}
}

export function clearCookieSession(): void {
	if (typeof sessionStorage === "undefined") return;
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

/** True when session already has a username — enough to Start. */
export function hasSavedAccount(
	session: StoredCookieSession | null | undefined,
): boolean {
	if (!session) return false;
	const username =
		session.cookies.username?.trim() || session.user?.uniqueId?.trim() || "";
	return Boolean(username);
}
