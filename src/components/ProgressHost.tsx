import { useEffect, useRef } from "react";
import { TikTokProgressDialog } from "#/components/dialog/tiktok-progres.dialog";
import { MinimizedProgressDock } from "#/components/MinimizedProgressDock";
import { useMinimize } from "#/context/MinimizeContext";
import { useNotificationOptional } from "#/context/NotificationContext";

function canMinimize(status: string | undefined, running: boolean) {
	// Keep dialog open when waiting for delete limit
	if (status === "ready") return false;
	if (running) return true;
	return Boolean(
		status &&
			status !== "idle" &&
			status !== "done" &&
			status !== "stopped" &&
			status !== "error",
	);
}

/** Renders full progress dialog + minimized dock from global MinimizeContext. */
export function ProgressHost() {
	const {
		job,
		extState,
		running,
		dialogOpen,
		closeDialog,
		minimize,
		stopJob,
		confirmRemove,
	} = useMinimize();
	const notify = useNotificationOptional();
	const lastStatusRef = useRef<string | null>(null);

	useEffect(() => {
		if (!job || !extState || !notify) return;
		const status = extState.status;
		if (!status || status === lastStatusRef.current) return;
		lastStatusRef.current = status;

		const progress = extState.progress;
		const word = job.listingWord;

		if (status === "ready") {
			notify.info(
				`Ditemukan ${progress?.listed ?? 0} ${word}. Atur jumlah lalu Hapus.`,
				{ title: "Siap dihapus" },
			);
			return;
		}
		if (status === "done") {
			notify.success(
				`Berhasil ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0}`,
				{ title: `${job.modeLabel} selesai` },
			);
			return;
		}
		if (status === "stopped") {
			notify.warning(
				`Dihentikan. OK ${progress?.done ?? 0} · Gagal ${progress?.failed ?? 0}`,
				{ title: job.modeLabel },
			);
			return;
		}
		if (status === "error") {
			notify.error(extState.lastError || "Terjadi error saat proses.", {
				title: "Gagal",
				durationMs: 7000,
			});
		}
	}, [job, extState, notify]);

	useEffect(() => {
		if (!job) lastStatusRef.current = null;
	}, [job]);

	if (!job) {
		return <MinimizedProgressDock />;
	}

	const allowMinimize = canMinimize(extState?.status, running);

	return (
		<>
			<TikTokProgressDialog
				open={dialogOpen}
				onOpenChange={(open) => {
					if (!open) closeDialog();
				}}
				modeLabel={job.modeLabel}
				listingWord={job.listingWord}
				extState={extState}
				running={running}
				onStop={() => void stopJob()}
				onMinimize={allowMinimize ? minimize : undefined}
				onConfirmRemove={async (limit) => {
					const res = await confirmRemove(limit);
					if (!res.ok) {
						notify?.error(res.error || "Gagal memulai hapus.", {
							title: "Konfirmasi",
						});
						throw new Error(res.error || "Gagal memulai hapus.");
					}
					notify?.info(`Menghapus ${limit} ${job.listingWord}…`, {
						title: job.modeLabel,
					});
				}}
			/>
			<MinimizedProgressDock />
		</>
	);
}
