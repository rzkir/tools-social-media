import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ExtensionState } from "#/lib/extension-bridge";
import {
	confirmExtensionRemoveMutation,
	extensionInstalledOptions,
	extensionStateOptions,
	fetchTikTokCookiesMutation,
	setExtensionStateCache,
	startExtensionJobMutation,
	stopExtensionJobMutation,
	syncExtensionStateToQuery,
} from "#/services/extension.query";

export function useExtensionInstalled() {
	return useQuery(extensionInstalledOptions);
}

export function useExtensionState(enabled = true) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!enabled) return;
		return syncExtensionStateToQuery(queryClient);
	}, [enabled, queryClient]);

	return useQuery({
		...extensionStateOptions,
		enabled,
	});
}

export function useSetExtensionState() {
	const queryClient = useQueryClient();
	return (state: ExtensionState | null) =>
		setExtensionStateCache(queryClient, state);
}

export function useStartExtensionJob() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (options: {
			uniqueId: string;
			secUid?: string;
			delayMs: number;
			mode?: "repost" | "favorite" | "like";
		}) => startExtensionJobMutation(queryClient, options),
	});
}

export function useStopExtensionJob() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => stopExtensionJobMutation(queryClient),
	});
}

export function useConfirmExtensionRemove() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (options: { limit: number }) =>
			confirmExtensionRemoveMutation(queryClient, options),
	});
}

export function useFetchTikTokCookies() {
	return useMutation({
		mutationFn: (options?: { uniqueId?: string }) =>
			fetchTikTokCookiesMutation(options),
	});
}
