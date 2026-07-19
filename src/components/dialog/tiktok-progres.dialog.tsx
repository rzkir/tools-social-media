import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { Progress } from "#/components/ui/progres";
import type { ExtensionState } from "#/lib/extension-bridge";

export type TikTokProgressDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	modeLabel: string;
	listingWord: string;
	extState: ExtensionState | null;
	running: boolean;
	onStop: () => void;
};

function statusCopy(
	status: string,
	listingWord: string,
	progress: ExtensionState["progress"] | undefined,
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
				title: "Gagal",
				detail: "Terjadi error saat proses berjalan.",
			};
		default:
			return {
				title: status || "Progress",
				detail: `OK ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0} · Total ${progress?.total ?? 0}`,
			};
	}
}

function progressPercent(state: ExtensionState | null): number {
	const progress = state?.progress;
	if (!progress) return 0;
	if (progress.total > 0) {
		return Math.round(
			((progress.done + progress.failed) / progress.total) * 100,
		);
	}
	if (progress.listed) {
		return Math.min(99, Math.round((progress.page / 50) * 100));
	}
	if (state?.status === "done") return 100;
	return 0;
}

export function TikTokProgressDialog({
	open,
	onOpenChange,
	modeLabel,
	listingWord,
	extState,
	running,
	onStop,
}: TikTokProgressDialogProps) {
	const status = extState?.status || "idle";
	const progress = extState?.progress;
	const copy = statusCopy(status, listingWord, progress);
	const pct = progressPercent(extState);
	const showBar = status === "listing" || status === "removing" || running;

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title={modeLabel}
			description={copy.title}
			className="max-w-md"
		>
			<div className="space-y-5">
				<div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
					<p className="m-0 text-sm font-semibold text-slate-800">{copy.title}</p>
					<p className="mt-1 mb-0 text-sm text-slate-500">{copy.detail}</p>
					{extState?.lastError ? (
						<p className="mt-3 mb-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{extState.lastError}
						</p>
					) : null}
				</div>

				{showBar ? (
					<Progress value={pct} label="Progress" />
				) : status === "done" ? (
					<Progress value={100} label="Progress" />
				) : null}

				<div className="grid grid-cols-3 gap-2">
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
							{progress?.total || progress?.listed || 0}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{running ? (
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
