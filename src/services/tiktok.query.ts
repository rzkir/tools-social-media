import type { QueryClient } from "@tanstack/react-query";
import type { TikTokCookieValues } from "#/components/TikTokCookieForm";
import { verifySessionFn } from "#/server/tiktok.functions";
import { recordConnectResultMutation } from "#/services/metrics.query";
import { saveCookieSessionMutation } from "#/services/session.query";
import type { TikTokUser } from "#/types/tiktok";

export type VerifySessionInput = {
	cookies: string;
	uniqueId?: string;
	secUid?: string;
	/** Current form values — updated with verified uniqueId/secUid on success */
	cookieValues: TikTokCookieValues;
};

export type VerifySessionSuccess = {
	ok: true;
	user: TikTokUser;
	cookieValues: TikTokCookieValues;
};

export async function verifySessionMutation(
	queryClient: QueryClient,
	input: VerifySessionInput,
): Promise<VerifySessionSuccess> {
	const result = await verifySessionFn({
		data: {
			cookies: input.cookies,
			uniqueId: input.uniqueId,
			secUid: input.secUid,
		},
	});

	if (!result?.ok) {
		const message =
			result && "error" in result
				? result.error
				: "Server error. Coba refresh halaman.";
		await recordConnectResultMutation(queryClient, {
			ok: false,
			platform: "tiktok",
			error: message,
		});
		throw new Error(message);
	}

	const nextCookies: TikTokCookieValues = {
		...input.cookieValues,
		username: result.user.uniqueId,
		secUid: result.user.secUid,
	};

	await saveCookieSessionMutation(queryClient, nextCookies, result.user, {
		platform: "tiktok",
		bridge: "cookie",
	});

	await recordConnectResultMutation(queryClient, {
		ok: true,
		platform: "tiktok",
		username: result.user.uniqueId,
	});

	return {
		ok: true,
		user: result.user,
		cookieValues: nextCookies,
	};
}
