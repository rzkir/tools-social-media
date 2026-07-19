import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	Heart,
	Music2,
	Repeat2,
	Shield,
	ThumbsUp,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ProgressMetric } from "#/components/ui/chart";
import { pingExtension } from "#/lib/extension-bridge";
import { hasSavedAccount, loadCookieSession } from "#/lib/session-store";

export const Route = createFileRoute("/dashboard/tiktok/")({
	component: TikTokOverviewPage,
});

function TikTokOverviewPage() {
	const [username, setUsername] = useState("");
	const [hasAccount, setHasAccount] = useState(false);
	const [extOk, setExtOk] = useState(false);

	useEffect(() => {
		const stored = loadCookieSession();
		setHasAccount(hasSavedAccount(stored));
		setUsername(stored?.cookies.username || stored?.user?.uniqueId || "");
		void pingExtension().then(setExtOk);
	}, []);

	return (
		<div className="space-y-6 pb-4">
			<section className="rise-in relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white px-6 py-9 shadow-sm sm:px-10">
				<div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_66%)]" />
				<p className="mb-3 text-xs font-bold tracking-widest text-indigo-600 uppercase">
					TikTok
				</p>
				<h1 className="mb-2 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
					Overview
				</h1>
				<p className="m-0 max-w-2xl text-base text-slate-400">
					Ringkasan akun & tools. Fitur baru akan muncul di sini.
				</p>
			</section>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Akun</p>
					<p className="m-0 truncate text-2xl font-extrabold text-slate-900">
						{hasAccount ? `@${username}` : "—"}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{hasAccount ? "Siap dipakai" : "Belum dihubungkan"}
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Ekstensi</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">
						{extOk ? "ON" : "OFF"}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{extOk ? "Terhubung" : "Belum terdeteksi"}
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Tools</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">3</p>
					<p className="mt-1 text-xs text-slate-400">
						Repost · Disukai · Favorite
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Status</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">
						{hasAccount && extOk ? "Ready" : "Setup"}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{hasAccount && extOk
							? "Bisa Start tool"
							: "Lengkapi akun / ekstensi"}
					</p>
				</div>
			</div>

			<section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
				<div className="mb-6 flex items-center justify-between gap-3">
					<div>
						<h2 className="m-0 text-lg font-bold text-slate-900">Metrics</h2>
						<p className="m-0 text-sm text-slate-400">
							Placeholder — nanti diisi data real dari tool runs.
						</p>
					</div>
					<Music2 className="h-5 w-5 text-slate-300" />
				</div>
				<div className="grid gap-8 md:grid-cols-3">
					<ProgressMetric
						value="—"
						label="Repost dihapus"
						percent={hasAccount ? 35 : 0}
						icon={<Repeat2 className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value="—"
						label="Like dibersihkan"
						percent={0}
						icon={<ThumbsUp className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value={extOk ? "OK" : "—"}
						label="Extension health"
						percent={extOk ? 100 : 10}
						icon={<Shield className="h-3.5 w-3.5" />}
					/>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Link
					to="/dashboard/tiktok/repost"
					className="group rounded-[2rem] border border-slate-100 bg-white p-6 no-underline shadow-sm transition hover:border-indigo-200 hover:shadow-md"
				>
					<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
						<Repeat2 className="h-5 w-5" />
					</div>
					<h3 className="m-0 text-base font-bold text-slate-900 group-hover:text-indigo-600">
						Remove Repost
					</h3>
					<p className="mt-1 mb-0 text-sm text-slate-400">
						Hapus repost dari dashboard lewat ekstensi Chrome.
					</p>
					<span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
						{hasAccount ? (
							<>
								<CheckCircle2 className="h-3.5 w-3.5" /> Buka tool
							</>
						) : (
							"Setup akun dulu"
						)}
					</span>
				</Link>

				<Link
					to="/dashboard/tiktok/like"
					className="group rounded-[2rem] border border-slate-100 bg-white p-6 no-underline shadow-sm transition hover:border-indigo-200 hover:shadow-md"
				>
					<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
						<ThumbsUp className="h-5 w-5" />
					</div>
					<h3 className="m-0 text-base font-bold text-slate-900 group-hover:text-indigo-600">
						Hapus Disukai
					</h3>
					<p className="mt-1 mb-0 text-sm text-slate-400">
						Hapus like (Disukai) dari dashboard lewat ekstensi Chrome.
					</p>
					<span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
						{hasAccount ? (
							<>
								<CheckCircle2 className="h-3.5 w-3.5" /> Buka tool
							</>
						) : (
							"Setup akun dulu"
						)}
					</span>
				</Link>

				<Link
					to="/dashboard/tiktok/favorite"
					className="group rounded-[2rem] border border-slate-100 bg-white p-6 no-underline shadow-sm transition hover:border-indigo-200 hover:shadow-md"
				>
					<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
						<Heart className="h-5 w-5" />
					</div>
					<h3 className="m-0 text-base font-bold text-slate-900 group-hover:text-indigo-600">
						Favorite
					</h3>
					<p className="mt-1 mb-0 text-sm text-slate-400">
						Hapus favorite/tersimpan dari dashboard lewat ekstensi Chrome.
					</p>
					<span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
						{hasAccount ? (
							<>
								<CheckCircle2 className="h-3.5 w-3.5" /> Buka tool
							</>
						) : (
							"Setup akun dulu"
						)}
					</span>
				</Link>
			</section>

			{!hasAccount ? (
				<section className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-amber-100 bg-amber-50 px-5 py-4">
					<div className="flex items-center gap-3">
						<UserRound className="h-5 w-5 text-amber-700" />
						<p className="m-0 text-sm text-amber-900">
							Belum ada akun TikTok di session. Hubungkan dulu di Accounts.
						</p>
					</div>
					<Link
						to="/dashboard/accounts"
						className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-600 no-underline ring-1 ring-slate-200"
					>
						Buka Accounts
					</Link>
				</section>
			) : null}
		</div>
	);
}
