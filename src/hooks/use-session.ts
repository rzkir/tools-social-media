import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TikTokCookieValues } from "#/components/TikTokCookieForm";
import type { AccountBridge, AccountPlatform } from "#/lib/session-store";
import { recordConnectResultMutation } from "#/services/metrics.query";
import {
	clearCookieSessionMutation,
	cookieSessionOptions,
	saveCookieSessionMutation,
} from "#/services/session.query";
import type { TikTokUser } from "#/types/tiktok";

export function useCookieSession() {
	return useQuery(cookieSessionOptions);
}

export function useSaveCookieSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			cookies: TikTokCookieValues;
			user: TikTokUser | null;
			meta?: { platform?: AccountPlatform; bridge?: AccountBridge };
		}) =>
			saveCookieSessionMutation(
				queryClient,
				input.cookies,
				input.user,
				input.meta,
			),
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
