/**
 * TikTok web often returns avatarUri as a path fragment (no host).
 * API / user-detail usually returns a full signed CDN URL string,
 * or occasionally `{ url_list: [...] }`.
 */
export function normalizeTikTokAvatarUrl(raw: unknown): string | undefined {
	if (raw == null) return undefined;

	if (typeof raw === "object") {
		const obj = raw as Record<string, unknown>;
		if (Array.isArray(obj.url_list)) {
			return normalizeTikTokAvatarUrl(obj.url_list[0]);
		}
		if (typeof obj.url === "string") {
			return normalizeTikTokAvatarUrl(obj.url);
		}
		return undefined;
	}

	if (typeof raw !== "string") return undefined;

	let url = raw
		.trim()
		.replace(/\\u002[fF]/g, "/")
		.replace(/\\\//g, "/");
	if (!url) return undefined;

	// Already embedded (survives CDN expiry / hotlink blocks)
	if (url.startsWith("data:image/")) return url;

	if (url.startsWith("//")) url = `https:${url}`;

	if (/^https?:\/\//i.test(url)) return url;

	const path = url.replace(/^\//, "");
	// Path fragments from webapp.app-context.avatarUri
	if (
		/^(tos-|musically-|tiktok-obj|o[0-9]+[-_])/i.test(path) ||
		/~c5_|\.jpe?g|\.webp|\.png/i.test(path)
	) {
		return `https://p16-sign.tiktokcdn-us.com/${path}`;
	}

	return undefined;
}

/** Stable display fallback when TikTok CDN URL is missing/expired. */
export function tiktokAvatarFallbackUrl(uniqueId?: string | null): string | undefined {
	const id = String(uniqueId || "")
		.trim()
		.replace(/^@/, "");
	if (!id) return undefined;
	return `https://unavatar.io/tiktok/${encodeURIComponent(id)}`;
}

/** Prefer an absolute https URL from a list of candidates. */
export function pickTikTokAvatarUrl(
	...candidates: unknown[]
): string | undefined {
	for (const candidate of candidates) {
		if (Array.isArray(candidate)) {
			for (const item of candidate) {
				const url = normalizeTikTokAvatarUrl(item);
				if (url) return url;
			}
			continue;
		}
		const url = normalizeTikTokAvatarUrl(candidate);
		if (url) return url;
	}
	return undefined;
}
