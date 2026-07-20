import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	Music2,
	Repeat2,
	Shield,
	ThumbsUp,
	UserRound,
} from "lucide-react";
import { ProgressMetric } from "#/components/ui/chart";
import { useExtensionInstalled } from "#/hooks/use-extension";
import { useCookieSession } from "#/hooks/use-session";
import { hasSavedAccount, isTikTokAccount } from "#/lib/session-store";

export const Route = createFileRoute("/dashboard/tiktok/")({
	component: TikTokOverviewPage,
});

function TikTokOverviewPage() {
	const { data: session } = useCookieSession("tiktok");
	const { data: extOk = false } = useExtensionInstalled();

	const hasAccount = hasSavedAccount(session) && Boolean(session && isTikTokAccount(session));
	const username = session?.cookies.username || session?.user?.uniqueId || "";

	return (
		<div className="space-y-6 pb-4">
			<section className="rise-in relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white px-6 py-9 shadow-sm sm:px-10">
				<div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_66%)]" />
				<div className="relative z-[1] max-w-xl">
					<p className="mb-2 text-xs font-bold tracking-[0.2em] text-indigo-500 uppercase">
						TikTok tools
					</p>
					<h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
						Repost · Disukai
					</h1>
					<p className="mt-3 mb-0 text-sm leading-relaxed text-slate-500">
						Hapus repost & like dari dashboard lewat ekstensi Chrome di tab
						TikTok yang sudah login.
					</p>
				</div>
			</section>

			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Akun</p>
					<p className="m-0 truncate text-2xl font-extrabold text-slate-900">
						{hasAccount ? `@${username || "…"}` : "—"}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{hasAccount ? "Tersimpan" : "Belum connect"}
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Extension</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">
						{extOk ? "ON" : "OFF"}
					</p>
					<p className="mt-1 text-xs text-slate-400">
						{extOk ? "Terhubung" : "Belum terdeteksi"}
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Tools</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">2</p>
					<p className="mt-1 text-xs text-slate-400">Repost · Disukai</p>
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

			<section className="grid gap-4 md:grid-cols-2">
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
			</section>

			{!hasAccount ? (
				<div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/80 px-5 py-4 text-sm text-amber-900">
					<span className="font-semibold">Belum ada akun.</span>{" "}
					<Link
						to="/dashboard/accounts"
						className="inline-flex items-center gap-1 font-bold text-indigo-600 no-underline"
					>
						<UserRound className="h-3.5 w-3.5" />
						Connect di Accounts
					</Link>
				</div>
			) : null}
		</div>
	);
}
