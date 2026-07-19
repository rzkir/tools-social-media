import {
	Heart,
	MoreHorizontal,
	RefreshCw,
	Star,
	Trash2,
} from "lucide-react";
import { ProgressMetric, TotalFollowersChart } from "#/components/ui/chart";
import { Progress } from "#/components/ui/progres";
import { cn } from "#/lib/utils";
import type { DashboardMetricsView } from "#/services/storage.services";

export type DashboardAsideProps = {
	className?: string;
	metrics?: DashboardMetricsView;
};

export function DashboardAside({ className, metrics }: DashboardAsideProps) {
	const removed = metrics?.removed ?? 0;
	const failed = metrics?.failed ?? 0;
	const jobs = metrics?.jobs ?? 0;
	const successRate = metrics?.successRate ?? 0;
	const week = metrics?.last7Days?.map((d) => d.removed) ?? [0, 0, 0, 0, 0, 0, 0];
	const dayLabels =
		metrics?.last7Days?.map((d) => d.date.slice(5)) ??
		["—", "—", "—", "—", "—", "—", "—"];

	const modeTotal = Math.max(
		1,
		(metrics?.byMode.repost.removed ?? 0) +
			(metrics?.byMode.like.removed ?? 0) +
			(metrics?.byMode.favorite.removed ?? 0),
	);

	return (
		<div className={cn("space-y-8", className)}>
			<section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
				<div className="mb-6">
					<p className="text-sm font-bold text-slate-800">Per mode</p>
					<p className="mt-0.5 text-[10px] font-medium text-slate-400">
						Share item berhasil dihapus
					</p>
				</div>

				<div className="space-y-6">
					<ProgressMetric
						value={String(metrics?.byMode.repost.removed ?? 0)}
						label="Repost"
						percent={Math.round(
							((metrics?.byMode.repost.removed ?? 0) / modeTotal) * 100,
						)}
						icon={<RefreshCw className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value={String(metrics?.byMode.like.removed ?? 0)}
						label="Like"
						percent={Math.round(
							((metrics?.byMode.like.removed ?? 0) / modeTotal) * 100,
						)}
						icon={<Heart className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value={String(metrics?.byMode.favorite.removed ?? 0)}
						label="Favorite"
						percent={Math.round(
							((metrics?.byMode.favorite.removed ?? 0) / modeTotal) * 100,
						)}
						icon={<Star className="h-3.5 w-3.5" />}
					/>
				</div>

				<div className="mt-8 space-y-3">
					<Progress
						value={successRate}
						label="Success rate"
						tone="emerald"
						size="sm"
					/>
					<Progress
						value={failed}
						max={Math.max(1, removed + failed)}
						label="Gagal vs total"
						tone="rose"
						size="sm"
					/>
				</div>
			</section>

			<section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-100">
				<div className="absolute top-0 right-0 p-4">
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
						<Trash2 className="h-4 w-4" />
					</span>
				</div>

				<div className="relative z-10 mb-8">
					<h4 className="mb-1 text-4xl font-extrabold tabular-nums">
						{removed.toLocaleString("id-ID")}
					</h4>
					<p className="text-sm font-semibold text-indigo-100/70">
						Total dihapus · {jobs} job
					</p>
				</div>

				<TotalFollowersChart
					className="mb-6"
					values={week}
					highlightLabel={String(Math.max(0, ...week))}
				/>

				<div className="flex items-center justify-between text-[10px] font-bold text-white/50">
					{dayLabels.map((day) => (
						<span key={day}>{day}</span>
					))}
				</div>

				<button
					type="button"
					className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/60"
					aria-label="More"
				>
					<MoreHorizontal className="h-4 w-4" />
					7 hari terakhir
				</button>
			</section>
		</div>
	);
}
