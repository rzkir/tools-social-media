import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	useConfirmExtensionRemove,
	useExtensionInstalled,
	useExtensionState,
	useSetExtensionState,
	useStopExtensionJob,
} from "#/hooks/use-extension";
import {
	type ExtensionState,
	markExtensionHost,
	unmarkExtensionHost,
} from "#/lib/extension-bridge";

export type ProgressJobMode = "repost" | "like";

export type ProgressJob = {
	mode: ProgressJobMode;
	modeLabel: string;
	listingWord: string;
};

type MinimizeContextValue = {
	job: ProgressJob | null;
	extState: ExtensionState | null;
	extInstalled: boolean;
	running: boolean;
	/** Full progress dialog visible */
	dialogOpen: boolean;
	/** Compact dock visible (dialog hidden) */
	minimized: boolean;
	/** Any progress UI should show (dialog or dock) */
	hasProgress: boolean;
	openProgress: (job: ProgressJob) => void;
	minimize: () => void;
	expand: () => void;
	/** Close dialog: minimize if running, else dismiss */
	closeDialog: () => void;
	dismiss: () => void;
	stopJob: () => Promise<void>;
	/** Confirm delete with limit (status must be ready) */
	confirmRemove: (limit: number) => Promise<{ ok: boolean; error?: string }>;
};

const MinimizeContext = createContext<MinimizeContextValue | null>(null);

function matchesJob(state: ExtensionState | null, job: ProgressJob | null) {
	if (!state || !job) return false;
	return !state.mode || state.mode === job.mode;
}

function isActiveStatus(status: string | undefined) {
	return Boolean(
		status &&
			status !== "idle" &&
			status !== "done" &&
			status !== "stopped" &&
			status !== "error",
	);
}

export function MinimizeProvider({ children }: { children: ReactNode }) {
	const [job, setJob] = useState<ProgressJob | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [minimized, setMinimized] = useState(false);
	/** Local clock start — keeps timer working even if extension omits startedAt */
	const [clientStartedAt, setClientStartedAt] = useState<number | null>(null);

	const { data: extInstalled = false } = useExtensionInstalled();
	const { data: extState = null } = useExtensionState(true);
	const setExtState = useSetExtensionState();
	const stopMutation = useStopExtensionJob();
	const confirmMutation = useConfirmExtensionRemove();

	useEffect(() => {
		markExtensionHost();
		return () => {
			unmarkExtensionHost();
		};
	}, []);

	const running = Boolean(extState?.running) && matchesJob(extState, job);

	const hasProgress = Boolean(
		job &&
			extState &&
			matchesJob(extState, job) &&
			extState.status !== "idle" &&
			(running ||
				isActiveStatus(extState.status) ||
				extState.status === "done" ||
				extState.status === "stopped" ||
				extState.status === "error"),
	);

	// Keep job visible while extension reports activity for this mode
	useEffect(() => {
		if (!job || !extState) return;
		if (!matchesJob(extState, job)) return;
		if (running || isActiveStatus(extState.status)) {
			if (!dialogOpen && !minimized) {
				setDialogOpen(true);
			}
		}
	}, [extState, job, running, dialogOpen, minimized]);

	const openProgress = useCallback(
		(next: ProgressJob) => {
			setJob(next);
			setMinimized(false);
			setDialogOpen(true);
			setClientStartedAt(null);
			// Wipe stale job UI immediately so we never show previous run as "already going"
			setExtState({
				running: true,
				status: "starting",
				mode: next.mode,
				progress: { done: 0, failed: 0, total: 0, listed: 0, page: 0 },
				lastError: null,
				startedAt: null,
				endedAt: null,
			});
		},
		[setExtState],
	);

	const minimize = useCallback(() => {
		setDialogOpen(false);
		setMinimized(true);
	}, []);

	const expand = useCallback(() => {
		setMinimized(false);
		setDialogOpen(true);
	}, []);

	const dismiss = useCallback(() => {
		setDialogOpen(false);
		setMinimized(false);
		if (!extState?.running) {
			setJob(null);
			setClientStartedAt(null);
		}
	}, [extState?.running]);

	const closeDialog = useCallback(() => {
		if (running || isActiveStatus(extState?.status)) {
			minimize();
			return;
		}
		dismiss();
	}, [running, extState?.status, minimize, dismiss]);

	const stopJob = useCallback(async () => {
		await stopMutation.mutateAsync();
	}, [stopMutation]);

	const confirmRemove = useCallback(
		async (limit: number) => {
			setClientStartedAt(Date.now());
			setMinimized(false);
			setDialogOpen(true);
			return confirmMutation.mutateAsync({ limit });
		},
		[confirmMutation],
	);

	// When listing finishes, open dialog so user can set delete limit
	useEffect(() => {
		if (extState?.status === "ready" && job && matchesJob(extState, job)) {
			setMinimized(false);
			setDialogOpen(true);
		}
	}, [extState, job]);

	const resolvedExtState = useMemo(() => {
		if (!job || !extState || !matchesJob(extState, job)) return null;
		const removedCount =
			(extState.progress?.done || 0) + (extState.progress?.failed || 0);
		const removePhase =
			extState.status === "removing" ||
			((extState.status === "done" ||
				extState.status === "stopped" ||
				extState.status === "error") &&
				removedCount > 0);
		// Only expose a clock start after user confirms Hapus (not during listing)
		let startedAt: number | null = null;
		if (clientStartedAt != null || removePhase) {
			startedAt =
				clientStartedAt == null
					? (extState.startedAt ?? null)
					: extState.startedAt != null && extState.startedAt >= clientStartedAt
						? extState.startedAt
						: clientStartedAt;
		}
		return {
			...extState,
			startedAt,
		};
	}, [extState, job, clientStartedAt]);

	const value = useMemo<MinimizeContextValue>(
		() => ({
			job,
			extState: resolvedExtState,
			extInstalled,
			running,
			dialogOpen,
			minimized: minimized && Boolean(job),
			hasProgress,
			openProgress,
			minimize,
			expand,
			closeDialog,
			dismiss,
			stopJob,
			confirmRemove,
		}),
		[
			job,
			resolvedExtState,
			extInstalled,
			running,
			dialogOpen,
			minimized,
			hasProgress,
			openProgress,
			minimize,
			expand,
			closeDialog,
			dismiss,
			stopJob,
			confirmRemove,
		],
	);

	return (
		<MinimizeContext.Provider value={value}>
			{children}
		</MinimizeContext.Provider>
	);
}

export function useMinimize() {
	const ctx = useContext(MinimizeContext);
	if (!ctx) {
		throw new Error("useMinimize must be used within MinimizeProvider");
	}
	return ctx;
}

/** Safe hook when provider may be absent (e.g. outside dashboard). */
export function useMinimizeOptional() {
	return useContext(MinimizeContext);
}
