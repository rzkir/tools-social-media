import { QueryClient } from "@tanstack/react-query";

/** Fresh QueryClient per router/request (required for SSR isolation). */
export function createAppQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: 1,
				refetchOnWindowFocus: true,
			},
			mutations: {
				retry: 0,
			},
		},
	});
}
