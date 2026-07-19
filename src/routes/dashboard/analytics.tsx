import { createFileRoute } from "@tanstack/react-router";
import {
	CheckCircle2,
	Heart,
	RefreshCw,
	Star,
	Trash2,
	XCircle,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	getDashboardMetrics,
	resetMetrics,
	type MetricsEvent,
} from "#/services/storage.services";

export const Route = createFileRoute("/dashboard/analytics")({
	component: AnalyticsPage,
});

function formatWhen(at: number) {
	try {
		return new Intl.DateTimeFormat("id-ID", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(at));
	} catch {
		return new Date(at).toLocaleString();
	}
}

function eventTone(type: MetricsEvent["type"]) {
	if (type === "job_done" || type === "connect_success") {
		return "text-emerald-700 bg-emerald-50 border-emerald-100";
	}
	if (type === "job_error" || type === "connect_failed") {
		return "text-red-700 bg-red-50 border-red-100";
	}
	if (type === "job_stopped") {
		return "text-amber-800 bg-amber-50 border-amber-100";
	}
	return "text-slate-700 bg-slate-50 border-slate-100";
}

function AnalyticsPage() {
	const [tick, setTick] = useState(0);
	const metrics = useMemo(() => getDashboardMetrics(), [tick]);

	const maxRemoved = Math.max(
		1,
		...metrics.last7Days.map((d) => d.removed + d.failed),
	);

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-slate-800">Analytics</h2>
					<p className="mt-1 text-sm text-slate-400">
						Statistik lokal dari localStorage — hapus repost / like / favorite
						& connect akun.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => setTick((n) => n + 1)}
					>
						<RefreshCw className="h-4 w-4" />
						Refresh
					</Button>
					<Button
						variant="danger"
						onClick={() => {
							if (
								typeof window !== "undefined" &&
								window.confirm("Reset semua statistik lokal?")
							) {
								resetMetrics();
								setTick((n) => n + 1);
							}
						}}
					>
						Reset metrics
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Berhasil dihapus"
					value={metrics.removed}
					hint="Total item OK"
					icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
				/>
				<StatCard
					label="Gagal dihapus"
					value={metrics.failed}
					hint="Total item gagal"
					icon={<XCircle className="h-5 w-5 text-red-600" />}
				/>
				<StatCard
					label="Job dijalankan"
					value={metrics.jobs}
					hint="Done + stopped + error"
					icon={<Trash2 className="h-5 w-5 text-indigo-600" />}
				/>
				<StatCard
					label="Success rate"
					value={`${metrics.successRate}%`}
					hint={`${metrics.connects} connect sukses`}
					icon={<RefreshCw className="h-5 w-5 text-orange-500" />}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
					<h3 className="mb-6 font-bold text-slate-900">7 hari terakhir</h3>
					<div className="flex h-48 items-end gap-2">
						{metrics.last7Days.map((day) => {
							const total = day.removed + day.failed;
							const h = Math.round((total / maxRemoved) * 100);
							const okH =
								total > 0 ? Math.round((day.removed / total) * h) : 0;
							const label = day.date.slice(5);
							return (
								<div
									key={day.date}
									className="flex flex-1 flex-col items-center gap-2"
								>
									<div className="flex h-36 w-full flex-col justify-end overflow-hidden rounded-xl bg-slate-50">
										<div
											className="w-full bg-red-300/80"
											style={{ height: `${Math.max(0, h - okH)}%` }}
											title={`Gagal ${day.failed}`}
										/>
										<div
											className="w-full bg-indigo-500"
											style={{ height: `${okH}%` }}
											title={`OK ${day.removed}`}
										/>
									</div>
									<span className="text-[10px] font-bold text-slate-400">
										{label}
									</span>
								</div>
							);
						})}
					</div>
					<p className="mt-4 text-xs text-slate-400">
						Biru = berhasil · Merah = gagal
					</p>
				</section>

				<section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
					<h3 className="mb-5 font-bold text-slate-900">Per mode</h3>
					<ul className="space-y-4">
						<ModeRow
							icon={<RefreshCw className="h-4 w-4" />}
							label="Repost"
							bucket={metrics.byMode.repost}
						/>
						<ModeRow
							icon={<Heart className="h-4 w-4" />}
							label="Like"
							bucket={metrics.byMode.like}
						/>
						<ModeRow
							icon={<Star className="h-4 w-4" />}
							label="Favorite"
							bucket={metrics.byMode.favorite}
						/>
					</ul>
				</section>
			</div>

			<section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
				<h3 className="mb-4 font-bold text-slate-900">Aktivitas terbaru</h3>
				{metrics.recentEvents.length === 0 ? (
					<p className="text-sm text-slate-400">
						Belum ada data. Jalankan hapus repost/like atau connect akun dulu.
					</p>
				) : (
					<ul className="divide-y divide-slate-100">
						{metrics.recentEvents.map((ev) => (
							<li
								key={ev.id}
								className="flex flex-wrap items-start justify-between gap-3 py-3"
							>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${eventTone(ev.type)}`}
										>
											{ev.type.replace(/_/g, " ")}
										</span>
										<p className="m-0 text-sm font-semibold text-slate-800">
											{ev.title}
										</p>
									</div>
									{ev.detail ? (
										<p className="mt-1 text-sm text-slate-500">{ev.detail}</p>
									) : null}
								</div>
								<span className="shrink-0 text-xs text-slate-400">
									{formatWhen(ev.at)}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function StatCard({
	label,
	value,
	hint,
	icon,
}: {
	label: string;
	value: string | number;
	hint: string;
	icon: ReactNode;
}) {
	return (
		<div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
					{label}
				</p>
				{icon}
			</div>
			<p className="text-3xl font-extrabold text-slate-900">{value}</p>
			<p className="mt-1 text-xs text-slate-400">{hint}</p>
		</div>
	);
}

function ModeRow({
	icon,
	label,
	bucket,
}: {
	icon: ReactNode;
	label: string;
	bucket: { removed: number; failed: number; jobs: number };
}) {
	return (
		<li className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
			<div className="flex items-center gap-3 text-slate-700">
				<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
					{icon}
				</span>
				<div>
					<p className="m-0 text-sm font-bold">{label}</p>
					<p className="m-0 text-xs text-slate-400">{bucket.jobs} job</p>
				</div>
			</div>
			<div className="text-right text-xs">
				<p className="m-0 font-bold text-emerald-700">OK {bucket.removed}</p>
				<p className="m-0 font-semibold text-red-600">Gagal {bucket.failed}</p>
			</div>
		</li>
	);
}
