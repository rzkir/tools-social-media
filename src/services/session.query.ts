import { type QueryClient, queryOptions } from "@tanstack/react-query";
import type { TikTokCookieValues } from "#/components/TikTokCookieForm";
import { queryKeys } from "#/lib/query-keys";
import {
	type AccountBridge,
	type AccountPlatform,
	clearCookieSession,
	loadCookieSession,
	type StoredCookieSession,
	saveCookieSession,
} from "#/lib/session-store";
import { recordSessionClearedMutation } from "#/services/metrics.query";
import type { TikTokUser } from "#/types/tiktok";

/** Session cookie — cached forever; updated only via mutations. */
export const cookieSessionOptions = queryOptions({
	queryKey: queryKeys.session.cookie(),
	queryFn: (): StoredCookieSession | null => loadCookieSession(),
	initialData: (): StoredCookieSession | null => loadCookieSession(),
	staleTime: Number.POSITIVE_INFINITY,
	gcTime: Number.POSITIVE_INFINITY,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
});

export function setCookieSessionCache(
	queryClient: QueryClient,
	session: StoredCookieSession | null,
) {
	queryClient.setQueryData(queryKeys.session.cookie(), session);
}

export async function saveCookieSessionMutation(
	queryClient: QueryClient,
	cookies: TikTokCookieValues,
	user: TikTokUser | null,
	meta?: { platform?: AccountPlatform; bridge?: AccountBridge },
) {
	saveCookieSession(cookies, user, meta);
	const next = loadCookieSession();
	setCookieSessionCache(queryClient, next);
	return next;
}

export async function clearCookieSessionMutation(
	queryClient: QueryClient,
	options?: { recordMetrics?: boolean },
) {
	clearCookieSession();
	setCookieSessionCache(queryClient, null);
	if (options?.recordMetrics !== false) {
		await recordSessionClearedMutation(queryClient);
	}
	return null;
}
