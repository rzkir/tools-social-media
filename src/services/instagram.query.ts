import type { QueryClient } from "@tanstack/react-query";
import type { InstagramCookieValues } from "#/components/InstagramCookieForm";
import { verifyInstagramSessionFn } from "#/server/instagram.functions";
import { recordConnectResultMutation } from "#/services/metrics.query";
import { saveCookieSessionMutation } from "#/services/session.query";
import type { TikTokUser } from "#/types/tiktok";

export type VerifyInstagramSessionInput = {
	cookies: string;
	username?: string;
	cookieValues: InstagramCookieValues;
	/** Existing account id when re-verifying */
	accountId?: string;
};

export type VerifyInstagramSessionSuccess = {
	ok: true;
	user: TikTokUser;
	cookieValues: InstagramCookieValues;
	accountId: string;
};

export async function verifyInstagramSessionMutation(
	queryClient: QueryClient,
	input: VerifyInstagramSessionInput,
): Promise<VerifyInstagramSessionSuccess> {
	const result = await verifyInstagramSessionFn({
		data: {
			cookies: input.cookies,
			username: input.username || input.cookieValues.username,
			avatarHint: input.cookieValues.avatarUrl,
		},
	});

	if (!result?.ok) {
		const message =
			result && "error" in result
				? result.error
				: "Server error. Coba refresh halaman.";
		await recordConnectResultMutation(queryClient, {
			ok: false,
			platform: "instagram",
			error: message,
		});
		throw new Error(message);
	}

	const nextCookies: InstagramCookieValues = {
		...input.cookieValues,
		username: result.user.uniqueId,
		ds_user_id: result.user.secUid || input.cookieValues.ds_user_id,
	};

	const saved = await saveCookieSessionMutation(
		queryClient,
		nextCookies,
		result.user,
		{
			platform: "instagram",
			bridge: "cookie",
			id: input.accountId,
			setActive: true,
		},
	);

	await recordConnectResultMutation(queryClient, {
		ok: true,
		platform: "instagram",
		username: result.user.uniqueId,
	});

	return {
		ok: true,
		user: result.user,
		cookieValues: nextCookies,
		accountId: saved.id,
	};
}
