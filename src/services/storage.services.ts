import {
	storageGetJson,
	storageRemove,
	storageSetJson,
} from "#/lib/storage";

export const METRICS_STORAGE_KEY = "rr_dashboard_metrics_v1";

export type JobMode = "repost" | "like" | "favorite";

export type MetricsEventType =
	| "job_done"
	| "job_stopped"
	| "job_error"
	| "connect_success"
	| "connect_failed"
	| "session_cleared"
	| "alert";

export type MetricsEvent = {
	id: string;
	at: number;
	type: MetricsEventType;
	title: string;
	detail?: string;
	mode?: JobMode;
	removed?: number;
	failed?: number;
};

export type ModeBucket = {
	removed: number;
	failed: number;
	jobs: number;
};

export type DailyBucket = {
	/** YYYY-MM-DD (local) */
	date: string;
	removed: number;
	failed: number;
	jobs: number;
	connects: number;
};

export type MetricsTotals = {
	removed: number;
	failed: number;
	jobsCompleted: number;
	jobsStopped: number;
	jobsErrored: number;
	connectsSuccess: number;
	connectsFailed: number;
};

export type MetricsSnapshot = {
	version: 1;
	updatedAt: number;
	totals: MetricsTotals;
	byMode: Record<JobMode, ModeBucket>;
	daily: DailyBucket[];
	events: MetricsEvent[];
};

const EMPTY_MODE: ModeBucket = { removed: 0, failed: 0, jobs: 0 };

const EMPTY_TOTALS: MetricsTotals = {
	removed: 0,
	failed: 0,
	jobsCompleted: 0,
	jobsStopped: 0,
	jobsErrored: 0,
	connectsSuccess: 0,
	connectsFailed: 0,
};

function emptySnapshot(): MetricsSnapshot {
	return {
		version: 1,
		updatedAt: Date.now(),
		totals: { ...EMPTY_TOTALS },
		byMode: {
			repost: { ...EMPTY_MODE },
			like: { ...EMPTY_MODE },
			favorite: { ...EMPTY_MODE },
		},
		daily: [],
		events: [],
	};
}

function todayKey(d = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function nextId(): string {
	return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMode(mode: string | undefined): JobMode {
	if (mode === "like" || mode === "liked") return "like";
	if (mode === "favorite") return "favorite";
	return "repost";
}

function ensureDaily(
	daily: DailyBucket[],
	date: string,
): { list: DailyBucket[]; bucket: DailyBucket } {
	const existing = daily.find((d) => d.date === date);
	if (existing) return { list: daily, bucket: existing };
	const bucket: DailyBucket = {
		date,
		removed: 0,
		failed: 0,
		jobs: 0,
		connects: 0,
	};
	const list = [...daily, bucket]
		.sort((a, b) => a.date.localeCompare(b.date))
		.slice(-60);
	return { list, bucket: list.find((d) => d.date === date) || bucket };
}

function pushEvent(
	events: MetricsEvent[],
	event: Omit<MetricsEvent, "id" | "at"> & { at?: number },
): MetricsEvent[] {
	const next: MetricsEvent = {
		id: nextId(),
		at: event.at ?? Date.now(),
		type: event.type,
		title: event.title,
		detail: event.detail,
		mode: event.mode,
		removed: event.removed,
		failed: event.failed,
	};
	return [next, ...events].slice(0, 80);
}

function persist(snapshot: MetricsSnapshot): MetricsSnapshot {
	const next = { ...snapshot, updatedAt: Date.now() };
	storageSetJson(METRICS_STORAGE_KEY, next);
	return next;
}

export function loadMetrics(): MetricsSnapshot {
	const raw = storageGetJson<Partial<MetricsSnapshot> | null>(
		METRICS_STORAGE_KEY,
		null,
	);
	if (!raw || raw.version !== 1) return emptySnapshot();

	return {
		version: 1,
		updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
		totals: { ...EMPTY_TOTALS, ...(raw.totals || {}) },
		byMode: {
			repost: { ...EMPTY_MODE, ...(raw.byMode?.repost || {}) },
			like: { ...EMPTY_MODE, ...(raw.byMode?.like || {}) },
			favorite: { ...EMPTY_MODE, ...(raw.byMode?.favorite || {}) },
		},
		daily: Array.isArray(raw.daily) ? raw.daily.slice(-60) : [],
		events: Array.isArray(raw.events) ? raw.events.slice(0, 80) : [],
	};
}

export function resetMetrics(): MetricsSnapshot {
	storageRemove(METRICS_STORAGE_KEY);
	return persist(emptySnapshot());
}

export function recordJobResult(input: {
	mode: string;
	status: "done" | "stopped" | "error";
	removed: number;
	failed: number;
	label?: string;
	error?: string | null;
}): MetricsSnapshot {
	const snap = loadMetrics();
	const mode = normalizeMode(input.mode);
	const removed = Math.max(0, Math.floor(Number(input.removed) || 0));
	const failed = Math.max(0, Math.floor(Number(input.failed) || 0));
	const date = todayKey();
	const { list: daily, bucket } = ensureDaily(snap.daily, date);

	snap.totals.removed += removed;
	snap.totals.failed += failed;
	if (input.status === "done") snap.totals.jobsCompleted += 1;
	if (input.status === "stopped") snap.totals.jobsStopped += 1;
	if (input.status === "error") snap.totals.jobsErrored += 1;

	snap.byMode[mode].removed += removed;
	snap.byMode[mode].failed += failed;
	snap.byMode[mode].jobs += 1;

	bucket.removed += removed;
	bucket.failed += failed;
	bucket.jobs += 1;
	snap.daily = daily;

	const type: MetricsEventType =
		input.status === "done"
			? "job_done"
			: input.status === "stopped"
				? "job_stopped"
				: "job_error";

	const title =
		input.label ||
		(mode === "like"
			? "Remove Likes"
			: mode === "favorite"
				? "Remove Favorite"
				: "Remove Repost");

	snap.events = pushEvent(snap.events, {
		type,
		title,
		detail:
			input.status === "error"
				? input.error || "Terjadi error"
				: `OK ${removed} · Gagal ${failed}`,
		mode,
		removed,
		failed,
	});

	return persist(snap);
}

export function recordConnectResult(input: {
	ok: boolean;
	platform?: "tiktok" | "instagram";
	username?: string;
	error?: string;
}): MetricsSnapshot {
	const snap = loadMetrics();
	const date = todayKey();
	const { list: daily, bucket } = ensureDaily(snap.daily, date);

	if (input.ok) {
		snap.totals.connectsSuccess += 1;
		bucket.connects += 1;
		snap.events = pushEvent(snap.events, {
			type: "connect_success",
			title: "Akun terhubung",
			detail: input.username
				? `@${input.username.replace(/^@/, "")} · ${input.platform || "tiktok"}`
				: input.platform || "tiktok",
		});
	} else {
		snap.totals.connectsFailed += 1;
		snap.events = pushEvent(snap.events, {
			type: "connect_failed",
			title: "Connect gagal",
			detail: input.error || "Verifikasi gagal",
		});
	}

	snap.daily = daily;
	return persist(snap);
}

export function recordSessionCleared(): MetricsSnapshot {
	const snap = loadMetrics();
	snap.events = pushEvent(snap.events, {
		type: "session_cleared",
		title: "Session dihapus",
		detail: "Cookie & profil dibersihkan",
	});
	return persist(snap);
}

/** Optional: log alert popup outcomes into recent activity. */
export function recordAlertEvent(input: {
	status: "success" | "error" | "warning" | "info";
	title: string;
	description?: string;
}): MetricsSnapshot {
	const snap = loadMetrics();
	snap.events = pushEvent(snap.events, {
		type: "alert",
		title: input.title,
		detail: input.description,
	});
	return persist(snap);
}

export type DashboardMetricsView = {
	removed: number;
	failed: number;
	jobs: number;
	connects: number;
	successRate: number;
	byMode: Record<JobMode, ModeBucket>;
	last7Days: DailyBucket[];
	recentEvents: MetricsEvent[];
	updatedAt: number;
};

export function getDashboardMetrics(): DashboardMetricsView {
	const snap = loadMetrics();
	const jobs =
		snap.totals.jobsCompleted +
		snap.totals.jobsStopped +
		snap.totals.jobsErrored;
	const attempts = snap.totals.removed + snap.totals.failed;
	const successRate =
		attempts > 0
			? Math.round((snap.totals.removed / attempts) * 1000) / 10
			: 0;

	const byDate = new Map(snap.daily.map((d) => [d.date, d]));
	const last7Days: DailyBucket[] = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const key = todayKey(d);
		last7Days.push(
			byDate.get(key) || {
				date: key,
				removed: 0,
				failed: 0,
				jobs: 0,
				connects: 0,
			},
		);
	}

	return {
		removed: snap.totals.removed,
		failed: snap.totals.failed,
		jobs,
		connects: snap.totals.connectsSuccess,
		successRate,
		byMode: snap.byMode,
		last7Days,
		recentEvents: snap.events.slice(0, 20),
		updatedAt: snap.updatedAt,
	};
}
