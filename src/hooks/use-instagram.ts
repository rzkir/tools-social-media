import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InstagramCookieValues } from "#/components/InstagramCookieForm";
import { verifyInstagramSessionMutation } from "#/services/instagram.query";

export function useVerifyInstagramSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			cookies: string;
			username?: string;
			cookieValues: InstagramCookieValues;
			accountId?: string;
		}) => verifyInstagramSessionMutation(queryClient, input),
	});
}
