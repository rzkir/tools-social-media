/** Central query-key factory for TanStack Query. */
export const queryKeys = {
	metrics: {
		all: ["metrics"] as const,
		dashboard: () => [...queryKeys.metrics.all, "dashboard"] as const,
	},
	session: {
		all: ["session"] as const,
		cookie: () => [...queryKeys.session.all, "cookie"] as const,
	},
	extension: {
		all: ["extension"] as const,
		installed: () => [...queryKeys.extension.all, "installed"] as const,
		state: () => [...queryKeys.extension.all, "state"] as const,
	},
} as const;
