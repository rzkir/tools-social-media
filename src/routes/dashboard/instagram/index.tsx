import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	CheckCircle2,
	Instagram,
	Repeat2,
	Shield,
	UserRound,
} from "lucide-react";
import { useCookieSession } from "#/hooks/use-session";
import {
	bridgeLabel,
	hasSavedAccount,
	isInstagramAccount,
} from "#/lib/session-store";

export const Route = createFileRoute("/dashboard/instagram/")({
	component: InstagramOverviewPage,
});

function InstagramOverviewPage() {
	const { data: session } = useCookieSession("instagram");
	const isIgSession = Boolean(session && isInstagramAccount(session));
	const hasAccount = hasSavedAccount(session) && isIgSession;
	const username = session?.cookies.username || session?.user?.uniqueId || "";
	const label = session
		? bridgeLabel(session.platform, session.bridge)
		: "Cookie Instagram";
	const userId =
		session?.user?.secUid ||
		(session && isInstagramAccount(session) ? session.cookies.ds_user_id : "") ||
		"—";

	return (
		<div className="space-y-6 pb-4">
			<section className="rise-in relative overflow-hidden rounded-4xl border border-slate-100 bg-white px-6 py-9 shadow-sm sm:px-10">
				<div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(225,48,108,0.16),transparent_66%)]" />
				<div className="relative z-1 max-w-xl">
					<p className="mb-2 text-xs font-bold tracking-[0.2em] text-pink-500 uppercase">
						Instagram tools
					</p>
					<h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
						Repost · Session
					</h1>
					<p className="mt-3 mb-0 text-sm leading-relaxed text-slate-500">
						Hapus repost dari dashboard lewat ekstensi Chrome di tab Instagram
						yang sudah login.
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
						{hasAccount ? "Tersimpan & terverifikasi" : "Belum connect"}
					</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Bridge</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">
						{hasAccount ? "Cookie" : "—"}
					</p>
					<p className="mt-1 text-xs text-slate-400">{label}</p>
				</div>
				<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
					<p className="mb-1 text-xs font-semibold text-slate-400">Tools</p>
					<p className="m-0 text-2xl font-extrabold text-slate-900">1</p>
					<p className="mt-1 text-xs text-slate-400">Remove Repost</p>
				</div>
			</div>

			<section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
				<div className="mb-6 flex items-center justify-between gap-3">
					<div>
						<h2 className="m-0 text-lg font-bold text-slate-900">
							{hasAccount ? "Session siap" : "Belum ada session"}
						</h2>
						<p className="m-0 text-sm text-slate-400">
							{hasAccount
								? "Cookie Instagram tersimpan. Lanjut ke tool hapus repost."
								: "Connect akun Instagram dari halaman Accounts."}
						</p>
					</div>
					<Instagram className="h-5 w-5 text-pink-300" />
				</div>

				{hasAccount ? (
					<ul className="mb-6 grid gap-3 sm:grid-cols-2">
						<StatusRow
							icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
							label="Username"
							value={`@${username}`}
						/>
						<StatusRow
							icon={<Shield className="h-4 w-4 text-indigo-600" />}
							label="User ID"
							value={userId}
						/>
						<StatusRow
							icon={<UserRound className="h-4 w-4 text-pink-600" />}
							label="Nama"
							value={session?.user?.nickname || username}
						/>
					</ul>
				) : (
					<Link
						to="/dashboard/accounts"
						className="mb-6 inline-flex rounded-2xl bg-pink-600 px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-pink-100 transition hover:bg-pink-700"
					>
						Buka Accounts
					</Link>
				)}
			</section>

			<section className="grid gap-4 md:grid-cols-2">
				<Link
					to="/dashboard/instagram/repost"
					className="group rounded-[2rem] border border-slate-100 bg-white p-6 no-underline shadow-sm transition hover:border-pink-200 hover:shadow-md"
				>
					<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
						<Repeat2 className="h-5 w-5" />
					</div>
					<h3 className="m-0 text-base font-bold text-slate-900 group-hover:text-pink-600">
						Remove Repost
					</h3>
					<p className="mt-1 mb-0 text-sm text-slate-400">
						Hapus repost dari dashboard lewat ekstensi Chrome.
					</p>
					<span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-600">
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
		</div>
	);
}

function StatusRow({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<li className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
			<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
				{icon}
			</span>
			<div className="min-w-0">
				<p className="m-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
					{label}
				</p>
				<p className="m-0 truncate text-sm font-bold text-slate-800">{value}</p>
			</div>
		</li>
	);
}
