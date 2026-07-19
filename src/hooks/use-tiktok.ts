import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TikTokCookieValues } from "#/components/TikTokCookieForm";
import { verifySessionMutation } from "#/services/tiktok.query";

export function useVerifySession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			cookies: string;
			uniqueId?: string;
			secUid?: string;
			cookieValues: TikTokCookieValues;
		}) => verifySessionMutation(queryClient, input),
	});
}
