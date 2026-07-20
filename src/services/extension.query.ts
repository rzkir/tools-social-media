import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	confirmExtensionRemove,
	type ExtensionState,
	fetchExtensionState,
	fetchInstagramCookies,
	fetchTikTokCookies,
	getLastExtensionState,
	pingExtension,
	startExtensionJob,
	stopExtensionJob,
	subscribeExtensionState,
	type InstagramCookieAutofill,
	type TikTokCookieAutofill,
} from "#/lib/extension-bridge";
import { queryKeys } from "#/lib/query-keys";

/** Extension presence — short cache + poll while observed. */
export const extensionInstalledOptions = queryOptions({
	queryKey: queryKeys.extension.installed(),
	queryFn: pingExtension,
	staleTime: 2_000,
	gcTime: 60_000,
	refetchInterval: 4_000,
	refetchOnWindowFocus: true,
	retry: false,
});

/** Live extension job state — push-updated via subscribeExtensionState. */
export const extensionStateOptions = queryOptions({
	queryKey: queryKeys.extension.state(),
	queryFn: async (): Promise<ExtensionState | null> => {
		const fetched = await fetchExtensionState();
		return fetched ?? getLastExtensionState();
	},
	initialData: (): ExtensionState | null => getLastExtensionState(),
	staleTime: Number.POSITIVE_INFINITY,
	gcTime: Number.POSITIVE_INFINITY,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
	retry: false,
});

/** Push extension STATE messages into the Query cache. */
export function syncExtensionStateToQuery(
	queryClient: QueryClient,
): () => void {
	return subscribeExtensionState((state) => {
		queryClient.setQueryData(queryKeys.extension.state(), state);
	});
}

export function setExtensionStateCache(
	queryClient: QueryClient,
	state: ExtensionState | null,
) {
	queryClient.setQueryData(queryKeys.extension.state(), state);
}

export async function startExtensionJobMutation(
	queryClient: QueryClient,
	options: {
		uniqueId: string;
		secUid?: string;
		delayMs: number;
		mode?: "repost" | "like";
		platform?: "tiktok" | "instagram";
	},
) {
	const result = await startExtensionJob(options);
	const state = getLastExtensionState();
	if (state) setExtensionStateCache(queryClient, state);
	await queryClient.invalidateQueries({
		queryKey: queryKeys.extension.installed(),
	});
	return result;
}

export async function stopExtensionJobMutation(queryClient: QueryClient) {
	await stopExtensionJob();
	const state = await fetchExtensionState();
	if (state) setExtensionStateCache(queryClient, state);
}

export async function confirmExtensionRemoveMutation(
	queryClient: QueryClient,
	options: { limit: number; platform?: "tiktok" | "instagram" },
) {
	const result = await confirmExtensionRemove(options);
	const state = getLastExtensionState();
	if (state) setExtensionStateCache(queryClient, state);
	return result;
}

export async function fetchTikTokCookiesMutation(options?: {
	uniqueId?: string;
}): Promise<{
	ok: boolean;
	values?: TikTokCookieAutofill;
	error?: string;
	warning?: string;
}> {
	return fetchTikTokCookies(options);
}

export async function fetchInstagramCookiesMutation(options?: {
	username?: string;
}): Promise<{
	ok: boolean;
	values?: InstagramCookieAutofill;
	error?: string;
	warning?: string;
}> {
	return fetchInstagramCookies(options);
}
