import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	AccountBridge,
	AccountPlatform,
	InstagramCookieValues,
	StoredAccount,
	TikTokCookieValues,
} from "#/lib/session-store";
import { recordConnectResultMutation } from "#/services/metrics.query";
import {
	accountsStoreOptions,
	clearCookieSessionMutation,
	removeAccountMutation,
	setActiveAccountMutation,
	upsertAccountMutation,
} from "#/services/session.query";
import type { TikTokUser } from "#/types/tiktok";

/** Full multi-account store. */
export function useAccountsStore() {
	return useQuery(accountsStoreOptions);
}

/** All accounts, optionally filtered by platform. */
export function useAccounts(platform?: AccountPlatform) {
	const query = useAccountsStore();
	const accounts = platform
		? (query.data?.accounts.filter((a) => a.platform === platform) ?? [])
		: (query.data?.accounts ?? []);
	return { ...query, accounts };
}

/**
 * Active account for a platform (tools / overview).
 * Defaults to TikTok so existing TikTok tool call sites keep working.
 */
export function useCookieSession(platform: AccountPlatform = "tiktok") {
	const query = useAccountsStore();
	const store = query.data;
	let session: StoredAccount | null = null;
	if (store) {
		const activeId = store.activeIds[platform];
		if (activeId) {
			session =
				store.accounts.find(
					(a) => a.id === activeId && a.platform === platform,
				) ?? null;
		}
		if (!session) {
			session = store.accounts.find((a) => a.platform === platform) ?? null;
		}
	}
	return { ...query, data: session };
}

export function useUpsertAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			id?: string;
			platform: AccountPlatform;
			cookies: TikTokCookieValues | InstagramCookieValues;
			user: TikTokUser | null;
			bridge?: AccountBridge;
			setActive?: boolean;
		}) => upsertAccountMutation(queryClient, input),
	});
}

/** @deprecated Prefer useUpsertAccount */
export function useSaveCookieSession() {
	const upsert = useUpsertAccount();
	return {
		...upsert,
		mutate: (
			input: {
				cookies: TikTokCookieValues | InstagramCookieValues;
				user: TikTokUser | null;
				meta?: {
					platform?: AccountPlatform;
					bridge?: AccountBridge;
					id?: string;
					setActive?: boolean;
				};
			},
			options?: Parameters<typeof upsert.mutate>[1],
		) =>
			upsert.mutate(
				{
					id: input.meta?.id,
					platform: input.meta?.platform ?? "tiktok",
					cookies: input.cookies,
					user: input.user,
					bridge: input.meta?.bridge,
					setActive: input.meta?.setActive,
				},
				options,
			),
		mutateAsync: (input: {
			cookies: TikTokCookieValues | InstagramCookieValues;
			user: TikTokUser | null;
			meta?: {
				platform?: AccountPlatform;
				bridge?: AccountBridge;
				id?: string;
				setActive?: boolean;
			};
		}) =>
			upsert.mutateAsync({
				id: input.meta?.id,
				platform: input.meta?.platform ?? "tiktok",
				cookies: input.cookies,
				user: input.user,
				bridge: input.meta?.bridge,
				setActive: input.meta?.setActive,
			}),
	};
}

export function useRemoveAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { id: string; recordMetrics?: boolean }) =>
			removeAccountMutation(queryClient, input.id, {
				recordMetrics: input.recordMetrics,
			}),
	});
}

export function useSetActiveAccount() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { platform: AccountPlatform; id: string | null }) =>
			setActiveAccountMutation(queryClient, input.platform, input.id),
	});
}

export function useClearCookieSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (options?: { recordMetrics?: boolean }) =>
			clearCookieSessionMutation(queryClient, options),
	});
}

export function useRecordConnect() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			ok: boolean;
			platform?: "tiktok" | "instagram";
			username?: string;
			error?: string;
		}) => recordConnectResultMutation(queryClient, input),
	});
}
