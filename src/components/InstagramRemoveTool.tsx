import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { InstagramBrowserScriptPanel } from "#/components/InstagramBrowserScriptPanel";
import { useAlertStatus } from "#/components/dialog/alert-status.dialog";
import {
	EMPTY_INSTAGRAM_COOKIE_VALUES,
	type InstagramCookieValues,
} from "#/components/InstagramCookieForm";
import { Button } from "#/components/ui/button";
import { Field, FieldLabel } from "#/components/ui/field";
import { useMinimizeOptional } from "#/context/MinimizeContext";
import { useNotificationOptional } from "#/context/NotificationContext";
import {
	useExtensionInstalled,
	useStartExtensionJob,
} from "#/hooks/use-extension";
import { useCookieSession, useSaveCookieSession } from "#/hooks/use-session";
import {
	downloadExtensionZip,
	EXTENSION_INSTALL_HINT,
} from "#/lib/extension-install";
import { hasSavedAccount, isInstagramAccount } from "#/lib/session-store";
import type { TikTokUser } from "#/types/tiktok";

type SpeedMode = "fast" | "normal" | "safe";

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
	fast: 800,
	normal: 1500,
	safe: 3000,
};

const COPY = {
	eyebrow: "Remove repost",
	title: "Hapus Repost Instagram",
	readyHint:
		"Akun tersimpan — tinggal Start. Hapus jalan di tab Instagram yang sudah login.",
	setupHint:
		"Hubungkan akun sekali, lalu Start dari sini lewat ekstensi Chrome.",
	startLabel: "Start Hapus Repost",
	idleHint:
		"Siap. Klik Start untuk memuat daftar, lalu atur jumlah yang dihapus.",
	listingWord: "repost",
} as const;

export function InstagramRemoveTool() {
	const minimizeCtx = useMinimizeOptional();
	const notify = useNotificationOptional();
	const statusAlert = useAlertStatus();
	const { data: session, isLoading: sessionLoading } =
		useCookieSession("instagram");
	const {
		data: queryExtOk = false,
		isFetching: extFetching,
		refetch: refetchExt,
	} = useExtensionInstalled();
	const startJob = useStartExtensionJob();
	const saveSession = useSaveCookieSession();

	const extInstalled = minimizeCtx?.extInstalled ?? queryExtOk;
	const running = minimizeCtx?.running ?? false;
	const job = minimizeCtx?.job ?? null;
	const hasProgress = minimizeCtx?.hasProgress ?? false;
	const openProgress = minimizeCtx?.openProgress;
	const expand = minimizeCtx?.expand;
	const stopJob = minimizeCtx?.stopJob;

	const [cookieValues, setCookieValues] = useState<InstagramCookieValues>(
		EMPTY_INSTAGRAM_COOKIE_VALUES,
	);
	const [user, setUser] = useState<TikTokUser | null>(null);
	const [speed, setSpeed] = useState<SpeedMode>("normal");
	const [error, setError] = useState<string | null>(null);
	const [showFallback, setShowFallback] = useState(false);
	const [editAccount, setEditAccount] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		if (sessionLoading) return;
		if (session && isInstagramAccount(session)) {
			setCookieValues(session.cookies);
			setUser(session.user);
			setEditAccount(!hasSavedAccount(session));
		} else {
			setEditAccount(true);
		}
		setHydrated(true);
	}, [session, sessionLoading]);

	const persist = (
		nextCookies: InstagramCookieValues,
		nextUser: TikTokUser | null = user,
	) => {
		setCookieValues(nextCookies);
		if (nextUser) setUser(nextUser);
		saveSession.mutate({
			cookies: nextCookies,
			user: nextUser,
			meta: {
				platform: "instagram",
				bridge: "cookie",
				id: session && isInstagramAccount(session) ? session.id : undefined,
				setActive: true,
			},
		});
	};

	const username = cookieValues.username || user?.uniqueId || "";
	const userId = cookieValues.ds_user_id || user?.secUid || "";
	const displayName = user?.nickname || username;
	const hasAccount = Boolean(username.trim());
	const extensionOk = queryExtOk || extInstalled;
	const extChecking = !hydrated || (extFetching && !extensionOk);
	const thisJobRunning =
		running && job?.mode === "repost" && job?.platform === "instagram";
	const showProgressActions = Boolean(job) || hasProgress;

	const onStart = async () => {
		setError(null);
		const handle = username.trim().replace(/^@/, "");
		if (!handle) {
			const msg = "Belum ada akun. Isi username atau hubungkan di Accounts.";
			setError(msg);
			notify?.warning(msg, { title: "Akun diperlukan" });
			statusAlert.warning(
				"Akun diperlukan",
				"Isi username di bawah, atau hubungkan akun di halaman Accounts dulu.",
			);
			setEditAccount(true);
			return;
		}
		if (!extensionOk) {
			const msg = "Ekstensi belum terpasang. Install dulu, lalu Cek Ulang.";
			setError(msg);
			notify?.warning(msg, { title: "Ekstensi" });
			statusAlert.warning(
				"Ekstensi diperlukan",
				"Klik Pasang Ekstensi, extract zip, jalankan INSTALL.bat, lalu Cek Ulang.",
			);
			return;
		}
		persist({ ...cookieValues, username: handle });
		setEditAccount(false);
		openProgress?.({
			mode: "repost",
			platform: "instagram",
			modeLabel: COPY.title,
			listingWord: COPY.listingWord,
		});
		const result = await startJob.mutateAsync({
			uniqueId: handle,
			secUid: userId.trim() || undefined,
			delayMs: SPEED_DELAY_MS[speed],
			mode: "repost",
			platform: "instagram",
		});
		if (!result.ok) {
			const msg = result.error || "Gagal memulai.";
			setError(msg);
			notify?.error(msg, { title: "Gagal Start" });
			statusAlert.error("Gagal Start", msg);
		} else {
			notify?.info(`Memuat daftar ${COPY.listingWord}…`, {
				title: COPY.title,
			});
			statusAlert.info(
				COPY.title,
				`Memuat daftar ${COPY.listingWord}… Progress muncul di dialog. Atur jumlah lalu Hapus.`,
			);
		}
	};

	const onRecheck = async () => {
		const { data: ok } = await refetchExt();
		if (!ok) {
			const msg = "Ekstensi belum terdeteksi. Ikuti langkah instal di bawah.";
			setError(msg);
			notify?.error(msg, { title: "Ekstensi" });
			statusAlert.error(
				"Ekstensi tidak ditemukan",
				"Pastikan ekstensi sudah di-load di chrome://extensions, lalu hard refresh halaman ini.",
			);
		} else {
			setError(null);
			notify?.success("Ekstensi terhubung.", { title: "Ekstensi" });
			statusAlert.success(
				"Ekstensi terhubung",
				"Siap Start dari dashboard. Pastikan tab Instagram sudah login.",
			);
		}
	};

	if (!hydrated || sessionLoading) {
		return (
			<section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
				<p className="m-0 text-sm text-slate-400">Memulihkan session…</p>
			</section>
		);
	}

	return (
		<div className="pb-4">
			<section className="rise-in relative overflow-hidden rounded-4xl border border-slate-100 bg-white px-6 py-9 shadow-sm sm:px-10">
				<div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(225,48,108,0.16),transparent_66%)]" />
				<p className="mb-3 text-xs font-bold tracking-widest text-pink-600 uppercase">
					{COPY.eyebrow}
				</p>
				<h1 className="mb-2 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
					{COPY.title}
				</h1>
				<p className="m-0 max-w-2xl text-base text-slate-400">
					{hasAccount ? COPY.readyHint : COPY.setupHint}
				</p>
			</section>

			<section className="mt-6 rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="mb-1 text-xs font-bold tracking-widest text-pink-600 uppercase">
							Ekstensi
						</p>
						<p className="m-0 text-sm text-slate-600">
							{extChecking
								? "Mengecek ekstensi…"
								: extensionOk
									? "Ekstensi terhubung — bisa Start dari sini."
									: "Ekstensi belum terpasang."}
						</p>
					</div>
					<span
						className={`rounded-full px-3 py-1 text-xs font-bold ${
							extensionOk
								? "bg-emerald-50 text-emerald-700"
								: "bg-slate-100 text-slate-500"
						}`}
					>
						{extensionOk ? "Connected" : "Not found"}
					</span>
				</div>

				{!extensionOk ? (
					<div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm text-orange-900">
						<p className="m-0 font-semibold">Pasang ekstensi (sekali saja)</p>
						<p className="m-0 text-orange-800">
							Klik <strong>Pasang Ekstensi</strong> → extract zip → double-klik{" "}
							<code className="rounded bg-white px-1 font-mono text-xs">
								INSTALL.bat
							</code>{" "}
							(path tersalin otomatis + buka chrome://extensions) → Developer
							mode → Load unpacked → Ctrl+V.
						</p>
						<div className="flex flex-wrap gap-2 pt-1">
							<Button
								onClick={() => {
									downloadExtensionZip();
									statusAlert.info("Pasang Ekstensi", EXTENSION_INSTALL_HINT);
								}}
							>
								<Download className="h-4 w-4" />
								Pasang Ekstensi
							</Button>
							<Button variant="secondary" onClick={() => void onRecheck()}>
								Cek Ulang
							</Button>
							<Button
								variant="ghost"
								onClick={() => setShowFallback((v) => !v)}
							>
								{showFallback ? "Sembunyikan" : "Pakai Console (fallback)"}
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{hasAccount && !editAccount ? (
							<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
								<div className="min-w-0">
									<p className="m-0 text-xs font-bold tracking-widest text-slate-400 uppercase">
										Akun tersimpan
									</p>
									<p className="m-0 truncate text-base font-semibold text-slate-900">
										{displayName}
									</p>
									<p className="m-0 text-sm text-slate-500">@{username}</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="ghost"
										size="sm"
										disabled={thisJobRunning}
										onClick={() => setEditAccount(true)}
									>
										Ganti
									</Button>
									<Link
										to="/dashboard/accounts"
										className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold text-pink-600 no-underline hover:bg-pink-50"
									>
										Accounts
									</Link>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								{!hasAccount ? (
									<p className="m-0 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
										Belum ada akun. Isi username di bawah, atau{" "}
										<Link
											to="/dashboard/accounts"
											className="font-semibold text-pink-600"
										>
											hubungkan di Accounts
										</Link>
										.
									</p>
								) : null}
								<div className="grid gap-3 sm:grid-cols-2">
									<label className="block">
										<span className="mb-1 block text-xs font-semibold text-slate-500">
											username
										</span>
										<input
											value={username}
											onChange={(e) => {
												const cleaned = e.target.value.replace(/^@/, "");
												persist(
													{ ...cookieValues, username: cleaned },
													user
														? { ...user, uniqueId: cleaned || user.uniqueId }
														: cleaned
															? {
																	uniqueId: cleaned,
																	secUid: userId,
																	nickname: cleaned,
																}
															: null,
												);
											}}
											placeholder="rizverse2025"
											disabled={thisJobRunning}
											className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none"
										/>
									</label>
									<label className="block">
										<span className="mb-1 block text-xs font-semibold text-slate-500">
											ds_user_id (opsional)
										</span>
										<input
											value={userId}
											onChange={(e) => {
												const next = e.target.value;
												persist(
													{ ...cookieValues, ds_user_id: next },
													user
														? { ...user, secUid: next }
														: username
															? {
																	uniqueId: username,
																	secUid: next,
																	nickname: username,
																}
															: null,
												);
											}}
											placeholder="76633366542"
											disabled={thisJobRunning}
											className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-900 ring-1 ring-slate-200 outline-none"
										/>
									</label>
								</div>
								{hasAccount ? (
									<button
										type="button"
										className="text-xs font-semibold text-slate-400 underline"
										onClick={() => setEditAccount(false)}
									>
										Selesai edit
									</button>
								) : null}
							</div>
						)}

						<Field
							orientation="horizontal"
							className="flex-wrap items-end gap-2"
						>
							<div>
								<FieldLabel htmlFor="ig-ext-speed" className="text-xs">
									Kecepatan
								</FieldLabel>
								<select
									id="ig-ext-speed"
									value={speed}
									onChange={(e) => setSpeed(e.target.value as SpeedMode)}
									disabled={thisJobRunning}
									className="mt-1 rounded-xl border-0 bg-white px-2 py-1.5 text-sm text-slate-800 ring-1 ring-slate-200 outline-none"
								>
									<option value="fast">Cepat (~0.8s)</option>
									<option value="normal">Normal (~1.5s)</option>
									<option value="safe">Aman (~3s)</option>
								</select>
							</div>

							{thisJobRunning ? (
								<>
									<Button variant="danger" onClick={() => void stopJob?.()}>
										Stop
									</Button>
									{expand ? (
										<Button variant="secondary" onClick={expand}>
											Lihat Progress
										</Button>
									) : null}
								</>
							) : (
								<>
									<Button
										onClick={() => void onStart()}
										size="lg"
										disabled={!hasAccount}
									>
										{COPY.startLabel}
									</Button>
									{showProgressActions && expand ? (
										<Button variant="secondary" onClick={expand}>
											Lihat Progress
										</Button>
									) : null}
								</>
							)}
						</Field>

						{error ? (
							<p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{error}
							</p>
						) : null}

						{hasAccount && !thisJobRunning ? (
							<p className="m-0 text-sm text-slate-400">{COPY.idleHint}</p>
						) : null}

						<button
							type="button"
							className="text-xs font-semibold text-slate-400 underline"
							onClick={() => setShowFallback((v) => !v)}
						>
							{showFallback
								? "Sembunyikan fallback Console"
								: "Fallback: Script Console"}
						</button>
					</div>
				)}
			</section>

			{showFallback ? (
				<section className="mt-6 rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
					<InstagramBrowserScriptPanel
						variant="plain"
						username={username}
						userId={userId}
						onUsernameChange={(nextUsername) => {
							const cleaned = nextUsername.replace(/^@/, "");
							persist(
								{ ...cookieValues, username: cleaned },
								user
									? { ...user, uniqueId: cleaned || user.uniqueId }
									: cleaned
										? {
												uniqueId: cleaned,
												secUid: userId,
												nickname: cleaned,
											}
										: null,
							);
						}}
						speed={speed}
						onSpeedChange={setSpeed}
					/>
				</section>
			) : null}

			{statusAlert.dialog}
		</div>
	);
}
