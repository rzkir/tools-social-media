import { createServerFn } from "@tanstack/react-start";
import { normalizeTikTokAvatarUrl } from "#/lib/tiktok-avatar";
import { TIKTOK_USER_AGENT } from "#/lib/tiktok-sign/sign";
import { getSelfUser, TikTokServiceError } from "#/services/tiktok.services";
import type { TikTokUser } from "#/types/tiktok";

function toErrorMessage(err: unknown): string {
	if (err instanceof TikTokServiceError) return err.message;
	if (err instanceof Error) return err.message;
	return "Terjadi kesalahan tidak dikenal.";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

/** Fetch CDN avatar server-side and embed as data URL (avoids browser hotlink/expiry). */
async function embedAvatarDataUrl(user: TikTokUser): Promise<TikTokUser> {
	const raw = normalizeTikTokAvatarUrl(user.avatarUrl) ?? user.avatarUrl;
	if (!raw || raw.startsWith("data:")) return user;
	if (!/^https?:\/\//i.test(raw)) return user;

	try {
		const res = await fetch(raw, {
			headers: {
				"User-Agent": TIKTOK_USER_AGENT,
				Referer: "https://www.tiktok.com/",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
			},
		});
		if (!res.ok) return user;
		const buf = await res.arrayBuffer();
		if (!buf.byteLength || buf.byteLength > 400_000) return user;
		const contentType = (res.headers.get("content-type") || "image/jpeg")
			.split(";")[0]
			.trim();
		if (!contentType.startsWith("image/")) return user;
		return {
			...user,
			avatarUrl: `data:${contentType};base64,${arrayBufferToBase64(buf)}`,
		};
	} catch {
		return user;
	}
}

export const verifySessionFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			cookies: string;
			uniqueId?: string;
			secUid?: string;
			avatarHint?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		try {
			let user = await getSelfUser(data.cookies, data.uniqueId, data.secUid);
			const hint = normalizeTikTokAvatarUrl(data.avatarHint);
			if (!user.avatarUrl && hint) {
				user = { ...user, avatarUrl: hint };
			}
			user = await embedAvatarDataUrl(user);
			return { ok: true as const, user };
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});
