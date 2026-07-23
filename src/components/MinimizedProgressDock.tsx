import { Maximize2, Square } from "lucide-react";
import { createPortal } from "react-dom";
import {
	TikTokContentPreview,
	formatDuration,
	progressPercent,
	statusCopy,
} from "#/components/dialog/tiktok-progres.dialog";
import { Progress } from "#/components/ui/progres";
import { useMinimize } from "#/context/MinimizeContext";
import { useElapsedMs } from "#/lib/use-elapsed-ms";

export function MinimizedProgressDock() {
	const {
		job,
		extState,
		running,
		minimized,
		expand,
		stopJob,
		dismiss,
	} = useMinimize();

	const active = Boolean(minimized && job);
	const status = extState?.status || "idle";
	const progress = extState?.progress;
	const current = progress?.current ?? null;
	const copy = job
		? statusCopy(
				status,
				job.listingWord,
				progress,
				extState?.lastError,
				job.platform || extState?.platform || "tiktok",
			)
		: { title: "", detail: "" };
	const pct = progressPercent(extState);
	const timing = status === "removing" && Boolean(extState?.startedAt);
	const showFinalTime =
		(status === "done" || status === "stopped" || status === "error") &&
		Boolean(extState?.startedAt);
	const removing = status === "removing";
	const elapsedMs = useElapsedMs(
		timing || showFinalTime ? extState?.startedAt : null,
		extState?.endedAt,
		removing,
		active && (timing || showFinalTime),
	);
	const durationLabel =
		timing || showFinalTime ? formatDuration(elapsedMs) : "—";

	if (!active || !job || typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed right-4 bottom-4 z-[210] w-[min(100vw-2rem,22rem)]">
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
				<div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
					<div className="min-w-0">
						<p className="m-0 truncate text-sm font-bold text-slate-900">
							{job.modeLabel}
						</p>
						<p className="m-0 truncate text-xs text-slate-500">{copy.title}</p>
					</div>
					<div className="flex shrink-0 gap-1">
						<button
							type="button"
							onClick={expand}
							className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
							aria-label="Perbesar"
							title="Perbesar"
						>
							<Maximize2 className="h-3.5 w-3.5" />
						</button>
						{running ? (
							<button
								type="button"
								onClick={() => void stopJob()}
								className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
								aria-label="Stop"
								title="Stop"
							>
								<Square className="h-3 w-3 fill-current" />
							</button>
						) : (
							<button
								type="button"
								onClick={dismiss}
								className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
								aria-label="Tutup"
								title="Tutup"
							>
								×
							</button>
						)}
					</div>
				</div>

				<div className="space-y-3 px-4 py-3">
					{removing && current ? (
						<TikTokContentPreview item={current} total={progress?.total} />
					) : (
						<p className="m-0 text-xs text-slate-500">{copy.detail}</p>
					)}
					{status === "removing" ? <Progress value={pct} /> : null}
					{status === "done" ? <Progress value={100} /> : null}
					<div className="flex items-center justify-between gap-2 text-xs">
						<span className="font-semibold text-slate-600">
							OK {progress?.done ?? 0} · Gagal {progress?.failed ?? 0}
						</span>
						<span className="font-mono font-bold tabular-nums text-indigo-600">
							{durationLabel}
						</span>
					</div>
					{extState?.lastError ? (
						<p className="m-0 line-clamp-2 text-xs text-red-600">
							{extState.lastError}
						</p>
					) : null}
					<button
						type="button"
						onClick={expand}
						className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
					>
						{status === "ready" ? "Atur Jumlah Hapus" : "Buka Progress"}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
