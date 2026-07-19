import {
	storageGetJson,
	storageRemove,
	storageSetJson,
} from "#/lib/storage";

export const METRICS_STORAGE_KEY = "rr_dashboard_metrics_v1";
export const METRICS_UPDATED_EVENT = "rr-metrics-updated";

function notifyMetricsUpdated() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(METRICS_UPDATED_EVENT));
}

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

/** Detail of a single removed (or failed) video/item. */
export type MetricsItem = {
	id: string;
	at: number;
	mode: JobMode;
	ok: boolean;
	/** Video / content id from TikTok */
	itemId: string;
	author: string;
	nickname?: string;
	/** Short label (nickname or author) */
	title: string;
	/** Caption / description */
	description: string;
	/** Cover / thumbnail URL */
	picture?: string | null;
	url?: string;
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
	/** Recent removed items with title / picture / description */
	items: MetricsItem[];
};

const MAX_ITEMS = 120;
const MAX_EVENTS = 80;

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
		items: [],
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
	return [next, ...events].slice(0, MAX_EVENTS);
}

export type MetricsItemInput = {
	itemId?: string;
	id?: string;
	author?: string;
	nickname?: string;
	title?: string;
	description?: string;
	desc?: string;
	picture?: string | null;
	cover?: string | null;
	url?: string;
	ok: boolean;
	at?: number;
};

function normalizeItemInput(
	raw: MetricsItemInput,
	mode: JobMode,
	at: number,
): MetricsItem | null {
	const itemId = String(raw.itemId || raw.id || "").trim();
	if (!itemId) return null;
	const author = String(raw.author || "").trim().replace(/^@/, "") || "unknown";
	const nickname =
		typeof raw.nickname === "string" && raw.nickname.trim()
			? raw.nickname.trim()
			: undefined;
	const description = String(raw.description ?? raw.desc ?? "").trim();
	const title =
		String(raw.title || "").trim() ||
		nickname ||
		(description ? description.slice(0, 80) : "") ||
		`@${author}`;
	const pictureRaw = raw.picture ?? raw.cover;
	const picture =
		typeof pictureRaw === "string" && pictureRaw.trim()
			? pictureRaw.trim()
			: null;
	const url =
		typeof raw.url === "string" && raw.url.trim()
			? raw.url.trim()
			: author && itemId
				? `https://www.tiktok.com/@${author}/video/${itemId}`
				: undefined;

	return {
		id: nextId(),
		at: typeof raw.at === "number" ? raw.at : at,
		mode,
		ok: Boolean(raw.ok),
		itemId,
		author,
		nickname,
		title,
		description,
		picture,
		url,
	};
}

function pushItems(
	items: MetricsItem[],
	incoming: MetricsItem[],
): MetricsItem[] {
	if (!incoming.length) return items;
	const seen = new Set<string>();
	const merged: MetricsItem[] = [];
	for (const it of [...incoming, ...items]) {
		const key = `${it.mode}:${it.itemId}:${it.ok ? 1 : 0}:${it.at}`;
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(it);
		if (merged.length >= MAX_ITEMS) break;
	}
	return merged;
}

function persist(snapshot: MetricsSnapshot): MetricsSnapshot {
	const next = { ...snapshot, updatedAt: Date.now() };
	storageSetJson(METRICS_STORAGE_KEY, next);
	notifyMetricsUpdated();
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
		events: Array.isArray(raw.events) ? raw.events.slice(0, MAX_EVENTS) : [],
		items: Array.isArray(raw.items)
			? (raw.items as MetricsItem[]).slice(0, MAX_ITEMS)
			: [],
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
	/** Item details collected during the job (title, picture, description, …) */
	items?: MetricsItemInput[];
}): MetricsSnapshot {
	const snap = loadMetrics();
	const mode = normalizeMode(input.mode);
	const removed = Math.max(0, Math.floor(Number(input.removed) || 0));
	const failed = Math.max(0, Math.floor(Number(input.failed) || 0));
	const date = todayKey();
	const { list: daily, bucket } = ensureDaily(snap.daily, date);
	const at = Date.now();

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
		at,
	});

	if (input.items?.length) {
		const normalized = input.items
			.map((it) => normalizeItemInput(it, mode, at))
			.filter((it): it is MetricsItem => Boolean(it));
		snap.items = pushItems(snap.items, normalized);
	}

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
	recentItems: MetricsItem[];
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
		recentItems: snap.items.slice(0, 40),
		updatedAt: snap.updatedAt,
	};
}

/**
 * Live dashboard metrics — refreshes on persist, focus, visibility, and storage.
 * Use in React client components only.
 */
export function subscribeMetrics(onChange: () => void): () => void {
	if (typeof window === "undefined") return () => {};

	const onFocus = () => onChange();
	const onVis = () => {
		if (document.visibilityState === "visible") onChange();
	};
	const onStorage = (e: StorageEvent) => {
		if (e.key === METRICS_STORAGE_KEY || e.key === null) onChange();
	};
	const onCustom = () => onChange();

	window.addEventListener("focus", onFocus);
	document.addEventListener("visibilitychange", onVis);
	window.addEventListener("storage", onStorage);
	window.addEventListener(METRICS_UPDATED_EVENT, onCustom);

	return () => {
		window.removeEventListener("focus", onFocus);
		document.removeEventListener("visibilitychange", onVis);
		window.removeEventListener("storage", onStorage);
		window.removeEventListener(METRICS_UPDATED_EVENT, onCustom);
	};
}
