import { useEffect, useRef } from "react";
import { TikTokProgressDialog } from "#/components/dialog/tiktok-progres.dialog";
import { MinimizedProgressDock } from "#/components/MinimizedProgressDock";
import { useMinimize } from "#/context/MinimizeContext";
import { useNotificationOptional } from "#/context/NotificationContext";
import {
	type MetricsItemInput,
	recordJobResult,
} from "#/services/storage.services";

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
	const lastCountsRef = useRef({ done: 0, failed: 0 });
	const collectedItemsRef = useRef<MetricsItemInput[]>([]);

	// Collect title / picture / description as each item is processed
	useEffect(() => {
		if (!job || !extState) return;
		const status = extState.status;
		const progress = extState.progress;
		if (!progress) return;

		if (status === "starting" || status === "ready" || status === "listing") {
			lastCountsRef.current = { done: 0, failed: 0 };
			collectedItemsRef.current = [];
			return;
		}

		if (status !== "removing") return;

		const done = progress.done ?? 0;
		const failed = progress.failed ?? 0;
		const prev = lastCountsRef.current;
		const current = progress.current;

		if (!current?.id) {
			lastCountsRef.current = { done, failed };
			return;
		}

		const okDelta = done - prev.done;
		const failDelta = failed - prev.failed;

		if (okDelta > 0 || failDelta > 0) {
			const ok = okDelta > 0;
			const already = collectedItemsRef.current.some(
				(it) => it.itemId === current.id && it.ok === ok,
			);
			if (!already) {
				collectedItemsRef.current.push({
					itemId: current.id,
					author: current.author,
					nickname: current.nickname,
					title: current.nickname || current.author,
					description: current.desc || "",
					desc: current.desc || "",
					picture: current.cover ?? null,
					cover: current.cover ?? null,
					ok,
					at: Date.now(),
				});
			}
		}

		lastCountsRef.current = { done, failed };
	}, [job, extState]);

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
		if (status === "done" || status === "stopped" || status === "error") {
			recordJobResult({
				mode: job.mode,
				status,
				removed: progress?.done ?? 0,
				failed: progress?.failed ?? 0,
				label: job.modeLabel,
				error: extState.lastError,
				items: collectedItemsRef.current,
			});
			collectedItemsRef.current = [];
			lastCountsRef.current = { done: 0, failed: 0 };
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
		if (!job) {
			lastStatusRef.current = null;
			lastCountsRef.current = { done: 0, failed: 0 };
			collectedItemsRef.current = [];
		}
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
