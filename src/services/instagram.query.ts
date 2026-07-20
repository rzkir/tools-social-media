import type { QueryClient } from "@tanstack/react-query";
import type { InstagramCookieValues } from "#/components/InstagramCookieForm";
import {
	hasExtensionMarker,
	verifyInstagramSessionViaExtension,
} from "#/lib/extension-bridge";
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
	const verifyInput = {
		cookies: input.cookies,
		username: input.username || input.cookieValues.username,
		avatarHint: input.cookieValues.avatarUrl,
	};

	let result: Awaited<ReturnType<typeof verifyInstagramSessionFn>>;

	if (hasExtensionMarker()) {
		const extResult = await verifyInstagramSessionViaExtension(verifyInput);
		if (extResult.ok) {
			result = { ok: true as const, user: extResult.user };
		} else {
			// Extension verify failed — retry server only if extension unreachable
			const unreachable =
				/timeout|tidak merespons|terputus|unavailable/i.test(
					extResult.error || "",
				);
			result = unreachable
				? await verifyInstagramSessionFn({ data: verifyInput })
				: { ok: false as const, error: extResult.error };
		}
	} else {
		result = await verifyInstagramSessionFn({ data: verifyInput });
	}

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
