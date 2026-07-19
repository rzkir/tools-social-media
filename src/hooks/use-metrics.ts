import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	dashboardMetricsOptions,
	recordJobResultMutation,
	resetMetricsMutation,
	syncMetricsToQuery,
} from "#/services/metrics.query";
import type {
	DashboardMetricsView,
	MetricsItemInput,
} from "#/services/storage.services";

/** Register once at dashboard layout — keeps metrics cache in sync with storage. */
export function useMetricsCacheSync() {
	const queryClient = useQueryClient();
	useEffect(() => syncMetricsToQuery(queryClient), [queryClient]);
}

export function useDashboardMetrics() {
	const query = useQuery(dashboardMetricsOptions);
	return {
		...query,
		/** Always defined via initialData from localStorage. */
		data: query.data as DashboardMetricsView,
	};
}

export function useResetMetrics() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => resetMetricsMutation(queryClient),
	});
}

export function useRecordJobResult() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			mode: string;
			status: "done" | "stopped" | "error";
			removed: number;
			failed: number;
			label?: string;
			error?: string | null;
			items?: MetricsItemInput[];
		}) => recordJobResultMutation(queryClient, input),
	});
}
