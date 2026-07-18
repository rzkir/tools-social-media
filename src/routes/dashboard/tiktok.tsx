import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	buildCookieHeader,
	EMPTY_COOKIE_VALUES,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import { Button } from "#/components/ui/button";
import { Field, FieldLabel } from "#/components/ui/field";
import { loadCookieSession, saveCookieSession } from "#/lib/session-store";
import { listAllRepostsFn, removeRepostFn } from "#/server/tiktok.functions";
import type { TikTokRepostItem, TikTokUser } from "#/types/tiktok";

export const Route = createFileRoute("/dashboard/tiktok")({
	component: TikTokRemovePage,
});

type SpeedMode = "fast" | "normal" | "safe";

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
	fast: 800,
	normal: 1500,
	safe: 3000,
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function TikTokRemovePage() {
	const [cookieValues, setCookieValues] =
		useState<TikTokCookieValues>(EMPTY_COOKIE_VALUES);
	const [user, setUser] = useState<TikTokUser | null>(null);
	const [items, setItems] = useState<TikTokRepostItem[]>([]);
	const [speed, setSpeed] = useState<SpeedMode>("safe");
	const [busy, setBusy] = useState<"idle" | "load" | "remove">("idle");
	const [booting, setBooting] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [log, setLog] = useState<string[]>([]);
	const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 });
	const stopRef = useRef(false);

	const cookies = useMemo(
		() => buildCookieHeader(cookieValues),
		[cookieValues],
	);

	const canUseCookieApi =
		Boolean(user?.secUid) &&
		Boolean(cookieValues.sessionid.trim()) &&
		Boolean(cookieValues.msToken.trim());

	useEffect(() => {
		const stored = loadCookieSession();
		if (stored) {
			setCookieValues(stored.cookies);
			setUser(stored.user);
			if (stored.user) {
				setLog([`Session: @${stored.user.uniqueId}`]);
			}
		}
		setBooting(false);
	}, []);

	const pushLog = (line: string) => {
		setLog((prev) => [line, ...prev].slice(0, 80));
	};

	const loadReposts = async (): Promise<boolean> => {
		if (!user?.secUid) return false;
		setBusy("load");
		setError(null);
		try {
			const result = await listAllRepostsFn({
				data: { cookies, secUid: user.secUid },
			});
			if (!result?.ok) {
				setError(
					result && "error" in result
						? result.error
						: "Gagal memuat repost (server error).",
				);
				return false;
			}

			if (result.refreshed?.msToken || result.refreshed?.ttwid) {
				const next: TikTokCookieValues = {
					...cookieValues,
					...(result.refreshed.msToken
						? { msToken: result.refreshed.msToken }
						: {}),
					...(result.refreshed.ttwid ? { ttwid: result.refreshed.ttwid } : {}),
				};
				setCookieValues(next);
				saveCookieSession(next, user);
			}

			setItems(result.items);
			pushLog(
				result.items.length > 0
					? `Ditemukan ${result.items.length} repost`
					: "Tidak ada repost (0). Cek tab Repost di profil TikTok.",
			);
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat repost");
			return false;
		} finally {
			setBusy("idle");
		}
	};

	const onRemoveAll = async () => {
		if (!items.length) return;
		stopRef.current = false;
		setError(null);
		setBusy("remove");

		const queue = [...items];
		setProgress({ done: 0, failed: 0, total: queue.length });

		let done = 0;
		let failed = 0;
		const failedItems: TikTokRepostItem[] = [];
		const delay = SPEED_DELAY_MS[speed];

		for (let i = 0; i < queue.length; i++) {
			if (stopRef.current) {
				const leftover = queue.slice(i);
				setItems([...failedItems, ...leftover]);
				pushLog("Dijeda oleh pengguna");
				setBusy("idle");
				return;
			}

			const item = queue[i];
			const result = await removeRepostFn({
				data: { cookies, itemId: item.id },
			});

			if (result?.ok) {
				done += 1;
				pushLog(`Dihapus ${item.authorName}`);
				setItems((prev) => prev.filter((x) => x.id !== item.id));
			} else {
				failed += 1;
				failedItems.push(item);
				const msg = result && "error" in result ? result.error : "server error";
				pushLog(`Gagal ${item.id}: ${msg}`);
			}

			setProgress({ done, failed, total: queue.length });
			await sleep(delay);
		}

		setItems(failedItems);
		pushLog(`Selesai. Berhasil ${done}, gagal ${failed}`);
		setBusy("idle");
	};

	const onRemoveOne = async (item: TikTokRepostItem) => {
		setError(null);
		const result = await removeRepostFn({
			data: { cookies, itemId: item.id },
		});
		if (!result?.ok) {
			const msg = result && "error" in result ? result.error : "server error";
			setError(msg);
			pushLog(`Gagal ${item.id}: ${msg}`);
			return;
		}
		setItems((prev) => prev.filter((x) => x.id !== item.id));
		pushLog(`Dihapus ${item.authorName}`);
	};

	const pct =
		progress.total > 0
			? Math.round(((progress.done + progress.failed) / progress.total) * 100)
			: 0;

	if (booting) {
		return (
			<section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
				<p className="m-0 text-sm text-slate-400">Memulihkan session…</p>
			</section>
		);
	}

	if (!user) {
		return (
			<section className="rise-in rounded-[2rem] border border-slate-100 bg-white px-6 py-10 shadow-sm sm:px-10">
				<p className="mb-3 text-xs font-bold tracking-widest text-indigo-600 uppercase">
					Remove repost
				</p>
				<h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
					Belum ada akun terhubung
				</h1>
				<p className="mb-6 max-w-xl text-slate-400">
					Hubungkan TikTok di Accounts dulu. Setelah session tersimpan, halaman
					ini hanya untuk memuat dan menghapus repost.
				</p>
				<Link
					to="/dashboard/accounts"
					className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-100 hover:bg-indigo-700"
				>
					Connect Account
				</Link>
			</section>
		);
	}

	return (
		<div className="pb-4">
			<section className="rise-in relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white px-6 py-9 shadow-sm sm:px-10">
				<div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_66%)]" />
				<p className="mb-3 text-xs font-bold tracking-widest text-indigo-600 uppercase">
					Remove repost
				</p>
				<h1 className="mb-2 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
					Hapus Repost
				</h1>
				<p className="m-0 max-w-2xl text-base text-slate-400">
					Akun aktif:{" "}
					<strong className="text-slate-800">@{user.uniqueId}</strong>
					{!canUseCookieApi
						? " · Cookie belum lengkap. Connect ulang lewat Accounts → Cookie."
						: null}
				</p>
			</section>

			{!canUseCookieApi ? (
				<div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
					Untuk hapus via server butuh cookie lengkap. Buka{" "}
					<Link
						to="/dashboard/accounts"
						className="font-semibold text-orange-900 underline"
					>
						Accounts
					</Link>{" "}
					→ Add New Account → Cookie, lalu verifikasi.
				</div>
			) : (
				<section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="mb-1 text-xs font-bold tracking-widest text-indigo-600 uppercase">
								Repost
							</p>
							<h2 className="m-0 text-xl font-semibold text-slate-900">
								{busy === "load"
									? "Memuat repost…"
									: `${items.length} video terdeteksi`}
							</h2>
						</div>

						<Field orientation="horizontal" className="gap-2">
							<FieldLabel htmlFor="speed-mode" className="text-xs">
								Kecepatan
							</FieldLabel>
							<select
								id="speed-mode"
								value={speed}
								onChange={(e) => setSpeed(e.target.value as SpeedMode)}
								disabled={busy === "remove"}
								className="rounded-xl border-0 bg-white px-2 py-1.5 text-sm text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-600"
							>
								<option value="fast">Cepat (~0.8s)</option>
								<option value="normal">Normal (~1.5s)</option>
								<option value="safe">Aman (~3s)</option>
							</select>

							<Button
								variant="secondary"
								onClick={() => void loadReposts()}
								disabled={busy !== "idle"}
							>
								{busy === "load" ? "Memuat…" : "Muat Repost"}
							</Button>

							{busy === "remove" ? (
								<Button
									variant="danger"
									onClick={() => {
										stopRef.current = true;
									}}
								>
									Stop
								</Button>
							) : (
								<Button
									onClick={() => void onRemoveAll()}
									disabled={busy !== "idle" || items.length === 0}
								>
									Hapus Semua
								</Button>
							)}
						</Field>
					</div>

					{error ? (
						<p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</p>
					) : null}

					{busy === "remove" && (
						<div className="mt-4">
							<div className="mb-1 flex justify-between text-xs text-slate-400">
								<span>
									Progress {progress.done + progress.failed}/{progress.total}
								</span>
								<span>
									OK {progress.done} · Gagal {progress.failed}
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-slate-100">
								<div
									className="h-full rounded-full bg-indigo-600 transition-all"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					)}

					<ul className="mt-5 grid max-h-[28rem] list-none gap-2 overflow-y-auto p-0 sm:grid-cols-2">
						{items.map((item) => (
							<li
								key={item.id}
								className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
							>
								{item.coverUrl ? (
									<img
										src={item.coverUrl}
										alt=""
										className="h-12 w-10 flex-shrink-0 rounded-md object-cover"
									/>
								) : (
									<div className="h-12 w-10 flex-shrink-0 rounded-md bg-indigo-100" />
								)}
								<div className="min-w-0 flex-1">
									<p className="m-0 truncate text-sm font-semibold text-slate-800">
										{item.authorName}
									</p>
									<p className="m-0 truncate text-xs text-slate-400">
										{item.desc || item.id}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => void onRemoveOne(item)}
									disabled={busy !== "idle"}
								>
									Hapus
								</Button>
							</li>
						))}
						{items.length === 0 && busy === "idle" && (
							<li className="col-span-full py-8 text-center text-sm text-slate-400">
								Klik <strong className="text-slate-700">Muat Repost</strong>{" "}
								untuk mulai.
							</li>
						)}
					</ul>
				</section>
			)}

			{log.length > 0 && (
				<section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
					<p className="mb-3 text-xs font-bold tracking-widest text-indigo-600 uppercase">
						Log
					</p>
					<ul className="m-0 max-h-48 list-none space-y-1 overflow-y-auto p-0 font-mono text-xs text-slate-400">
						{log.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
