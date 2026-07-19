import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { queryKeys } from "#/lib/query-keys";
import {
	type DashboardMetricsView,
	getDashboardMetrics,
	type MetricsItemInput,
	recordConnectResult,
	recordJobResult,
	recordSessionCleared,
	resetMetrics,
	subscribeMetrics,
} from "#/services/storage.services";

/** Local metrics — cached forever; updated via mutations + storage sync. */
export const dashboardMetricsOptions = queryOptions({
	queryKey: queryKeys.metrics.dashboard(),
	queryFn: getDashboardMetrics,
	initialData: getDashboardMetrics,
	staleTime: Number.POSITIVE_INFINITY,
	gcTime: Number.POSITIVE_INFINITY,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
});

/** Keep Query cache in sync with localStorage + cross-tab updates. */
export function syncMetricsToQuery(queryClient: QueryClient): () => void {
	return subscribeMetrics(() => {
		queryClient.setQueryData(
			queryKeys.metrics.dashboard(),
			getDashboardMetrics(),
		);
	});
}

function setMetricsCache(queryClient: QueryClient): DashboardMetricsView {
	const next = getDashboardMetrics();
	queryClient.setQueryData(queryKeys.metrics.dashboard(), next);
	return next;
}

export async function resetMetricsMutation(queryClient: QueryClient) {
	resetMetrics();
	return setMetricsCache(queryClient);
}

export async function recordJobResultMutation(
	queryClient: QueryClient,
	input: {
		mode: string;
		status: "done" | "stopped" | "error";
		removed: number;
		failed: number;
		label?: string;
		error?: string | null;
		items?: MetricsItemInput[];
	},
) {
	recordJobResult(input);
	return setMetricsCache(queryClient);
}

export async function recordConnectResultMutation(
	queryClient: QueryClient,
	input: {
		ok: boolean;
		platform?: "tiktok" | "instagram";
		username?: string;
		error?: string;
	},
) {
	recordConnectResult(input);
	return setMetricsCache(queryClient);
}

export async function recordSessionClearedMutation(queryClient: QueryClient) {
	recordSessionCleared();
	return setMetricsCache(queryClient);
}
