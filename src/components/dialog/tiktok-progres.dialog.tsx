import { Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Progress } from "#/components/ui/progres";
import type {
	ExtensionProgressItem,
	ExtensionState,
} from "#/lib/extension-bridge";
import { useElapsedMs } from "#/lib/use-elapsed-ms";

export type TikTokProgressDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	modeLabel: string;
	listingWord: string;
	extState: ExtensionState | null;
	running: boolean;
	onStop: () => void;
	onMinimize?: () => void;
	onConfirmRemove?: (limit: number) => Promise<void>;
};

export function statusCopy(
	status: string,
	listingWord: string,
	progress: ExtensionState["progress"] | undefined,
	lastError?: string | null,
): { title: string; detail: string } {
	switch (status) {
		case "starting":
		case "navigating":
			return {
				title: "Menyiapkan…",
				detail: "Membuka tab TikTok dan menyiapkan sesi.",
			};
		case "listing":
			return {
				title: `Memuat daftar ${listingWord}`,
				detail: `Halaman ${progress?.page ?? 0} · ${progress?.listed ?? 0} ${listingWord} ditemukan`,
			};
		case "ready":
			return {
				title: "Siap dihapus",
				detail: `Ditemukan ${progress?.listed ?? 0} ${listingWord}. Atur jumlah lalu klik Hapus.`,
			};
		case "removing":
			return {
				title: `Menghapus ${listingWord}`,
				detail: `OK ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0} · Total ${progress?.total ?? 0}`,
			};
		case "done":
			return {
				title: "Selesai",
				detail: `Berhasil ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0} · Total ${progress?.total ?? 0}`,
			};
		case "stopped":
			return {
				title: "Dihentikan",
				detail: `Berhasil ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0} sebelum dihentikan.`,
			};
		case "error":
			return {
				title: /rate-?limit/i.test(lastError || "")
					? "Rate-limit TikTok"
					: "Gagal",
				detail:
					lastError ||
					"Terjadi error saat proses berjalan. Coba lagi dengan kecepatan Aman.",
			};
		default:
			return {
				title: status || "Progress",
				detail: `OK ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0} · Total ${progress?.total ?? 0}`,
			};
	}
}

export function progressPercent(state: ExtensionState | null): number {
	const progress = state?.progress;
	if (!progress) return 0;
	const status = state?.status || "idle";

	if (
		status === "starting" ||
		status === "navigating" ||
		status === "listing" ||
		status === "ready" ||
		status === "idle"
	) {
		return 0;
	}

	if (status === "done") return 100;

	if (
		(status === "removing" || status === "stopped" || status === "error") &&
		progress.total > 0
	) {
		return Math.round(
			((progress.done + progress.failed) / progress.total) * 100,
		);
	}

	return 0;
}

/** Format ms → "0:05", "1:23", "1:02:05" */
export function formatDuration(ms: number): string {
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}
	return `${m}:${String(s).padStart(2, "0")}`;
}

export { useElapsedMs };

/** Compact TikTok-style preview of the item being removed */
export function TikTokContentPreview({
	item,
	total,
}: {
	item: ExtensionProgressItem;
	total?: number;
}) {
	const [imgFailed, setImgFailed] = useState(false);
	const cover = item.cover && !imgFailed ? item.cover : null;
	const handle = item.author?.startsWith("@")
		? item.author
		: `@${item.author || "unknown"}`;
	const name = item.nickname || handle.replace(/^@/, "");
	const desc = (item.desc || "").trim() || "Tanpa deskripsi";
	const indexLabel =
		item.index && total ? `${item.index}/${total}` : item.index || null;

	return (
		<div className="flex gap-3 overflow-hidden rounded-2xl bg-[#121212] p-2.5 text-white shadow-lg shadow-black/20 ring-1 ring-white/10">
			<div className="relative h-[7.5rem] w-[5.25rem] shrink-0 overflow-hidden rounded-xl bg-[#2a2a2a]">
				{cover ? (
					<img
						src={cover}
						alt=""
						referrerPolicy="no-referrer"
						className="h-full w-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#25F4EE]/40 via-[#121212] to-[#FE2C55]/50">
						<span className="text-[10px] font-bold tracking-widest text-white/50">
							TT
						</span>
					</div>
				)}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
				{indexLabel ? (
					<span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
						{indexLabel}
					</span>
				) : null}
			</div>
			<div className="min-w-0 flex-1 py-0.5">
				<p className="m-0 truncate text-[11px] font-bold tracking-wide text-[#25F4EE]">
					Sedang dihapus
				</p>
				<p className="m-0 mt-1 truncate text-sm font-bold text-white">{name}</p>
				<p className="m-0 truncate text-xs text-white/55">{handle}</p>
				<p className="mt-2 mb-0 line-clamp-3 text-xs leading-snug text-white/80">
					{desc}
				</p>
			</div>
		</div>
	);
}

export function TikTokProgressDialog({
	open,
	onOpenChange,
	modeLabel,
	listingWord,
	extState,
	running,
	onStop,
	onMinimize,
	onConfirmRemove,
}: TikTokProgressDialogProps) {
	const status = extState?.status || "idle";
	const progress = extState?.progress;
	const listed = progress?.listed ?? 0;
	const current = progress?.current ?? null;
	const copy = statusCopy(status, listingWord, progress, extState?.lastError);
	const pct = progressPercent(extState);
	const showBar = status === "removing";
	const isReady = status === "ready";
	const timing = status === "removing" && Boolean(extState?.startedAt);
	const showFinalTime =
		(status === "done" || status === "stopped" || status === "error") &&
		Boolean(extState?.startedAt);
	const removing = status === "removing";

	const [limit, setLimit] = useState("1");
	const [confirming, setConfirming] = useState(false);
	const [confirmError, setConfirmError] = useState<string | null>(null);

	useEffect(() => {
		if (!isReady) return;
		const max = Math.max(1, listed);
		setLimit(String(max));
		setConfirmError(null);
		setConfirming(false);
	}, [isReady, listed]);

	const elapsedMs = useElapsedMs(
		timing || showFinalTime ? extState?.startedAt : null,
		extState?.endedAt,
		removing,
		open && (timing || showFinalTime),
	);
	const durationLabel =
		timing || showFinalTime ? formatDuration(elapsedMs) : "—";

	const onConfirm = async () => {
		if (!onConfirmRemove) return;
		const max = Math.max(1, listed);
		const parsed = Math.floor(Number(limit));
		if (!Number.isFinite(parsed) || parsed < 1) {
			setConfirmError("Masukkan jumlah minimal 1.");
			return;
		}
		const safe = Math.min(parsed, max);
		setConfirming(true);
		setConfirmError(null);
		try {
			await onConfirmRemove(safe);
		} catch (err) {
			setConfirmError(
				err instanceof Error ? err.message : "Gagal memulai hapus.",
			);
		} finally {
			setConfirming(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title={modeLabel}
			description={copy.title}
			className="max-w-md"
			onMinimize={onMinimize}
		>
			<div className="space-y-5">
				<div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
					<div className="min-w-0">
						<p className="m-0 text-sm font-semibold text-slate-800">
							{copy.title}
						</p>
						<p className="mt-1 mb-0 text-sm text-slate-500">{copy.detail}</p>
					</div>

					{removing && current ? (
						<TikTokContentPreview item={current} total={progress?.total} />
					) : null}

					{extState?.lastError ? (
						<p className="m-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{extState.lastError}
						</p>
					) : null}
				</div>

				{isReady ? (
					<div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
						<Field>
							<FieldLabel htmlFor="remove-limit" className="text-xs">
								Jumlah {listingWord} yang dihapus
							</FieldLabel>
							<Input
								id="remove-limit"
								type="number"
								min={1}
								max={Math.max(1, listed)}
								value={limit}
								onChange={(e) => setLimit(e.target.value)}
								disabled={confirming}
								className="mt-1 bg-white"
							/>
							<p className="m-0 mt-1.5 text-xs text-slate-500">
								Maksimal {listed} {listingWord}
							</p>
						</Field>
						{confirmError ? (
							<p className="m-0 text-sm text-red-600">{confirmError}</p>
						) : null}
					</div>
				) : null}

				{showBar ? (
					<Progress value={pct} label="Progress" />
				) : status === "done" ? (
					<Progress value={100} label="Progress" />
				) : null}

				<div className="grid grid-cols-4 gap-2">
					<div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center">
						<p className="m-0 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							OK
						</p>
						<p className="m-0 mt-1 text-lg font-bold tabular-nums text-emerald-600">
							{progress?.done ?? 0}
						</p>
					</div>
					<div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center">
						<p className="m-0 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Gagal
						</p>
						<p className="m-0 mt-1 text-lg font-bold tabular-nums text-red-600">
							{progress?.failed ?? 0}
						</p>
					</div>
					<div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center">
						<p className="m-0 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Total
						</p>
						<p className="m-0 mt-1 text-lg font-bold tabular-nums text-slate-800">
							{status === "ready" || status === "listing"
								? (progress?.listed ?? 0)
								: progress?.total || progress?.listed || 0}
						</p>
					</div>
					<div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center">
						<p className="m-0 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
							Waktu
						</p>
						<p className="m-0 mt-1 text-lg font-bold tabular-nums text-indigo-600">
							{durationLabel}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{onMinimize && !isReady ? (
						<Button
							variant="secondary"
							className="gap-2"
							onClick={onMinimize}
						>
							<Minimize2 className="h-4 w-4" />
							Minimize
						</Button>
					) : null}
					{isReady ? (
						<>
							<Button
								className="flex-1"
								disabled={confirming || listed < 1 || !onConfirmRemove}
								onClick={() => void onConfirm()}
							>
								{confirming ? "Memulai…" : "Hapus"}
							</Button>
							<Button
								variant="danger"
								disabled={confirming}
								onClick={onStop}
							>
								Batal
							</Button>
						</>
					) : running ? (
						<Button variant="danger" className="flex-1" onClick={onStop}>
							Stop
						</Button>
					) : (
						<Button
							variant="secondary"
							className="flex-1"
							onClick={() => onOpenChange(false)}
						>
							Tutup
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	);
}
