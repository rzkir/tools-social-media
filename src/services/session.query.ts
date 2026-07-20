import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { queryKeys } from "#/lib/query-keys";
import {
	type AccountBridge,
	type AccountPlatform,
	type AccountsStore,
	type InstagramCookieValues,
	type StoredAccount,
	type TikTokCookieValues,
	clearAllAccounts,
	getActiveAccount,
	listAccounts,
	loadAccountsStore,
	removeAccount,
	setActiveAccountId,
	upsertAccount,
} from "#/lib/session-store";
import { recordSessionClearedMutation } from "#/services/metrics.query";
import type { TikTokUser } from "#/types/tiktok";

export type { InstagramCookieValues, TikTokCookieValues };

/** Multi-account store — cached forever; updated only via mutations. */
export const accountsStoreOptions = queryOptions({
	queryKey: queryKeys.session.cookie(),
	queryFn: (): AccountsStore => loadAccountsStore(),
	initialData: (): AccountsStore => loadAccountsStore(),
	staleTime: Number.POSITIVE_INFINITY,
	gcTime: Number.POSITIVE_INFINITY,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
});

export function setAccountsStoreCache(
	queryClient: QueryClient,
	store: AccountsStore,
) {
	queryClient.setQueryData(queryKeys.session.cookie(), store);
}

function refreshCache(queryClient: QueryClient): AccountsStore {
	const next = loadAccountsStore();
	setAccountsStoreCache(queryClient, next);
	return next;
}

export async function upsertAccountMutation(
	queryClient: QueryClient,
	input: {
		id?: string;
		platform: AccountPlatform;
		cookies: TikTokCookieValues | InstagramCookieValues;
		user: TikTokUser | null;
		bridge?: AccountBridge;
		setActive?: boolean;
	},
): Promise<StoredAccount> {
	const account =
		input.platform === "instagram"
			? upsertAccount({
					id: input.id,
					platform: "instagram",
					cookies: input.cookies as InstagramCookieValues,
					user: input.user,
					bridge: input.bridge,
					setActive: input.setActive,
				})
			: upsertAccount({
					id: input.id,
					platform: "tiktok",
					cookies: input.cookies as TikTokCookieValues,
					user: input.user,
					bridge: input.bridge,
					setActive: input.setActive,
				});
	refreshCache(queryClient);
	return account;
}

/** @deprecated Prefer upsertAccountMutation */
export async function saveCookieSessionMutation(
	queryClient: QueryClient,
	cookies: TikTokCookieValues | InstagramCookieValues,
	user: TikTokUser | null,
	meta?: {
		platform?: AccountPlatform;
		bridge?: AccountBridge;
		id?: string;
		setActive?: boolean;
	},
) {
	return upsertAccountMutation(queryClient, {
		id: meta?.id,
		platform: meta?.platform ?? "tiktok",
		cookies,
		user,
		bridge: meta?.bridge,
		setActive: meta?.setActive,
	});
}

export async function removeAccountMutation(
	queryClient: QueryClient,
	id: string,
	options?: { recordMetrics?: boolean },
) {
	removeAccount(id);
	refreshCache(queryClient);
	if (options?.recordMetrics) {
		await recordSessionClearedMutation(queryClient);
	}
	return loadAccountsStore();
}

export async function setActiveAccountMutation(
	queryClient: QueryClient,
	platform: AccountPlatform,
	id: string | null,
) {
	setActiveAccountId(platform, id);
	return refreshCache(queryClient);
}

export async function clearCookieSessionMutation(
	queryClient: QueryClient,
	options?: { recordMetrics?: boolean },
) {
	clearAllAccounts();
	setAccountsStoreCache(queryClient, {
		version: 2,
		accounts: [],
		activeIds: { tiktok: null, instagram: null },
	});
	if (options?.recordMetrics !== false) {
		await recordSessionClearedMutation(queryClient);
	}
	return null;
}

export function getActiveSession(
	platform: AccountPlatform = "tiktok",
): StoredAccount | null {
	return getActiveAccount(platform);
}

export function getListedAccounts(platform?: AccountPlatform): StoredAccount[] {
	return listAccounts(platform);
}
