import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	Heart,
	RefreshCw,
	Trash2,
	XCircle,
} from "lucide-react";
import { type ReactNode, type RefObject, useState } from "react";
import { DashboardAside } from "#/components/ui/aside";
import {
	FollowersLineChart,
	GenderDonutChart,
	SparklineChart,
} from "#/components/ui/chart";
import { Progress } from "#/components/ui/progres";
import { useDashboardMetrics } from "#/hooks/use-metrics";
import {
	fadeUp,
	inViewProps,
	motion,
	useAnimatedNumber,
	useInViewOnce,
	useReducedMotion,
} from "#/lib/animation";
import { formatWhen } from "#/lib/format-when";
import type { MetricsItem } from "#/services/storage.services";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const { ref: heroRef, inView: heroInView } = useInViewOnce(0.3);
	const { data: metrics } = useDashboardMetrics();

	const removedAnim = useAnimatedNumber(
		metrics.removed,
		1,
		Boolean(reduce) || heroInView,
	);
	const failedAnim = useAnimatedNumber(
		metrics.failed,
		1,
		Boolean(reduce) || heroInView,
	);
	const jobsAnim = useAnimatedNumber(
		metrics.jobs,
		1,
		Boolean(reduce) || heroInView,
	);

	const weekRemoved = metrics.last7Days.map((d) => d.removed);
	const weekFailed = metrics.last7Days.map((d) => d.failed);
	const weekJobs = metrics.last7Days.map((d) => d.jobs);
	const weekPeak = Math.max(0, ...weekRemoved);
	const dayLabels = metrics.last7Days.map((d) => d.date.slice(5));
	const weekOkSum = weekRemoved.reduce((a, b) => a + b, 0);
	const weekFailSum = weekFailed.reduce((a, b) => a + b, 0);

	const attempts = metrics.removed + metrics.failed;
	const failRate =
		attempts > 0 ? Math.round((metrics.failed / attempts) * 1000) / 10 : 0;

	const modeTotal = Math.max(
		1,
		metrics.byMode.repost.removed + metrics.byMode.like.removed,
	);

	const recentPreview = metrics.recentItems.slice(0, 4);

	return (
		<div className="grid grid-cols-12 gap-8">
			<div className="col-span-12 space-y-8 lg:col-span-8">
				<div
					ref={heroRef as RefObject<HTMLDivElement>}
					className="grid grid-cols-1 gap-6 md:grid-cols-2"
				>
					<motion.div
						className="relative flex items-center gap-6 overflow-hidden rounded-[2.5rem] border border-orange-200/50 bg-orange-100/50 p-8"
						variants={fadeUp}
						{...view}
					>
						<div className="relative z-10 flex-1">
							<h3 className="mb-2 text-lg leading-tight font-bold text-slate-800">
								Statistik tersimpan di browser (localStorage)
							</h3>
							<p className="mb-4 text-xs text-slate-500">
								Update otomatis setelah job / connect.
								{metrics.updatedAt ? ` · ${formatWhen(metrics.updatedAt)}` : ""}
							</p>
							<Link
								to="/dashboard/analytics"
								className="inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-bold text-orange-600 shadow-sm transition-all hover:shadow-md"
							>
								Lihat Analytics
							</Link>
						</div>
						<div className="relative h-32 w-32 shrink-0">
							<img
								src="https://api.dicebear.com/7.x/bottts/svg?seed=app"
								className="h-full w-full"
								alt=""
							/>
						</div>
					</motion.div>

					<motion.div
						className="relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 text-white"
						variants={fadeUp}
						{...view}
						custom={0.08}
					>
						<div className="flex gap-1">
							<div className="h-2 w-2 rounded-full bg-white" />
							<div className="h-2 w-2 rounded-full bg-white/40" />
							<div className="h-2 w-2 rounded-full bg-white/40" />
						</div>
						<div>
							<p className="mb-1 text-4xl font-extrabold tabular-nums">
								{Math.round(removedAnim).toLocaleString("id-ID")}
							</p>
							<p className="font-medium text-white/80">Item berhasil dihapus</p>
						</div>
						<div className="mt-5 space-y-3">
							<div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
								<Progress
									value={metrics.successRate}
									max={100}
									label="Success rate"
									tone="orange"
								/>
							</div>
							<p className="text-sm text-white/70">
								Gagal {Math.round(failedAnim)} · Job {Math.round(jobsAnim)} ·
								Connect {metrics.connects}
							</p>
						</div>
					</motion.div>
				</div>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<StatPill
						icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
						label="OK"
						value={metrics.removed}
					/>
					<StatPill
						icon={<XCircle className="h-4 w-4 text-red-500" />}
						label="Gagal"
						value={metrics.failed}
					/>
					<StatPill
						icon={<Trash2 className="h-4 w-4 text-indigo-600" />}
						label="Jobs"
						value={metrics.jobs}
					/>
					<StatPill
						icon={<RefreshCw className="h-4 w-4 text-orange-500" />}
						label="Rate"
						value={`${metrics.successRate}%`}
					/>
				</div>

				<section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<h3 className="font-bold text-slate-900">Aktivitas 7 hari</h3>
							<p className="mt-1 text-xs text-slate-400">
								OK {weekOkSum} · Gagal {weekFailSum} · Jobs{" "}
								{weekJobs.reduce((a, b) => a + b, 0)}
							</p>
						</div>
						<div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
							<span className="text-xs font-semibold text-slate-500">
								Peak {weekPeak}
							</span>
						</div>
					</div>

					<FollowersLineChart
						values={weekRemoved}
						label={String(weekPeak)}
						stroke="#F97316"
					/>

					<div className="mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-400">
						{dayLabels.map((day) => (
							<span key={day}>{day}</span>
						))}
					</div>
				</section>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<section className="flex flex-col items-center rounded-[2.5rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
						<h3 className="mb-6 font-bold text-slate-900">Success vs gagal</h3>
						<GenderDonutChart
							className="w-full"
							primaryPercent={metrics.successRate || 0}
							secondaryPercent={failRate}
							primaryLabel="Berhasil"
							secondaryLabel="Gagal"
						/>
					</section>

					<div className="space-y-6">
						<section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
							<div className="mb-4 flex items-center justify-between gap-4">
								<div className="space-y-1">
									<p className="text-xs font-semibold text-slate-400">
										Trend OK (7h)
									</p>
									<p className="text-xl font-bold tabular-nums text-slate-800">
										{weekOkSum}
									</p>
								</div>
								<div className="h-12 w-28">
									<SparklineChart
										values={weekRemoved}
										stroke="#6366f1"
										label="Removed sparkline"
									/>
								</div>
							</div>
							<Progress
								value={metrics.byMode.repost.removed}
								max={modeTotal}
								label={`Repost · ${metrics.byMode.repost.removed} OK`}
								tone="indigo"
								size="sm"
							/>
						</section>

						<section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
							<div className="mb-4 flex items-center justify-between gap-4">
								<div className="space-y-1">
									<p className="text-xs font-semibold text-slate-400">
										Trend gagal (7h)
									</p>
									<p className="text-xl font-bold tabular-nums text-slate-800">
										{weekFailSum}
									</p>
								</div>
								<div className="h-12 w-28">
									<SparklineChart
										values={weekFailed}
										stroke="#f97316"
										label="Failed sparkline"
									/>
								</div>
							</div>
							<div className="space-y-3">
								<Progress
									value={metrics.byMode.like.removed}
									max={modeTotal}
									label={`Like · ${metrics.byMode.like.removed} OK`}
									tone="rose"
									size="sm"
								/>
							</div>
						</section>
					</div>
				</div>

				<section className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div>
							<h3 className="font-bold text-slate-900">Item terbaru</h3>
							<p className="mt-0.5 text-xs text-slate-400">
								Dari localStorage · title / picture / description
							</p>
						</div>
						<Link
							to="/dashboard/analytics"
							className="text-xs font-bold text-indigo-600 no-underline hover:underline"
						>
							Lihat semua
						</Link>
					</div>
					{recentPreview.length === 0 ? (
						<p className="m-0 text-sm text-slate-400">
							Belum ada item. Jalankan hapus repost / like dulu.
						</p>
					) : (
						<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{recentPreview.map((item) => (
								<RecentItemRow key={item.id} item={item} />
							))}
						</ul>
					)}
				</section>
			</div>

			<DashboardAside className="col-span-12 lg:col-span-4" metrics={metrics} />
		</div>
	);
}

function StatPill({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string | number;
}) {
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
			<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
				{icon}
			</span>
			<div className="min-w-0">
				<p className="m-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
					{label}
				</p>
				<p className="m-0 truncate text-lg font-extrabold tabular-nums text-slate-900">
					{typeof value === "number" ? value.toLocaleString("id-ID") : value}
				</p>
			</div>
		</div>
	);
}

function RecentItemRow({ item }: { item: MetricsItem }) {
	const [imgFailed, setImgFailed] = useState(false);
	const picture = item.picture && !imgFailed ? item.picture : null;
	const modeIcon =
		item.mode === "like" ? (
			<Heart className="h-3 w-3" />
		) : (
			<RefreshCw className="h-3 w-3" />
		);

	const body = (
		<>
			<div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
				{picture ? (
					<img
						src={picture}
						alt=""
						referrerPolicy="no-referrer"
						className="h-full w-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-slate-300">
						TT
					</div>
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-1.5">
					<span
						className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
							item.ok
								? "bg-emerald-50 text-emerald-700"
								: "bg-red-50 text-red-700"
						}`}
					>
						{item.ok ? "OK" : "Gagal"}
					</span>
					<span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
						{modeIcon}
						{item.mode}
					</span>
				</div>
				<p className="mt-1 truncate text-sm font-bold text-slate-800">
					{item.title}
				</p>
				<p className="m-0 line-clamp-1 text-xs text-slate-400">
					{item.description || "Tanpa deskripsi"}
				</p>
			</div>
		</>
	);

	if (item.url) {
		return (
			<li>
				<a
					href={item.url}
					target="_blank"
					rel="noreferrer"
					className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 no-underline transition-colors hover:bg-slate-50"
				>
					{body}
				</a>
			</li>
		);
	}

	return (
		<li className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2">
			{body}
		</li>
	);
}
