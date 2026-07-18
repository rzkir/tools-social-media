import {
	ChevronDown,
	MessageCircle,
	MoreHorizontal,
	Share2,
	ThumbsUp,
} from "lucide-react";
import { ProgressMetric, TotalFollowersChart } from "#/components/ui/chart";
import { cn } from "#/lib/utils";

const MONTHS = [
	{ id: "jan", label: "Jan" },
	{ id: "feb", label: "Feb" },
	{ id: "mar", label: "Mar" },
	{ id: "apr", label: "Apr" },
	{ id: "may-1", label: "May" },
	{ id: "may-2", label: "May" },
	{ id: "june", label: "June" },
	{ id: "july", label: "July" },
] as const;

export type DashboardAsideProps = {
	className?: string;
	companyName?: string;
	companyHandle?: string;
	totalFollowers?: string;
};

export function DashboardAside({
	className,
	companyName = "Company Name",
	companyHandle = "facebook.com/companyname",
	totalFollowers = "234.000.k",
}: DashboardAsideProps) {
	return (
		<div className={cn("space-y-8", className)}>
			<section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
				<div className="mb-8 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<img
							src="https://api.dicebear.com/7.x/initials/svg?seed=CN"
							alt=""
							className="h-10 w-10 rounded-xl bg-orange-100"
						/>
						<div className="flex flex-col">
							<div className="flex items-center gap-1">
								<span className="text-sm font-bold text-slate-800">
									{companyName}
								</span>
								<ChevronDown className="h-3 w-3 text-slate-400" />
							</div>
							<div className="flex items-center gap-1.5">
								<span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1877F2]" />
								<span className="text-[10px] font-medium text-slate-400">
									{companyHandle}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-8">
					<ProgressMetric
						value="3.k"
						label="Average Likes"
						percent={65}
						icon={<ThumbsUp className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value="22.k"
						label="Average Comments"
						percent={85}
						icon={<MessageCircle className="h-3.5 w-3.5" />}
					/>
					<ProgressMetric
						value="3.k"
						label="Average Shares"
						percent={40}
						icon={<Share2 className="h-3.5 w-3.5" />}
					/>
				</div>

				<div className="mt-10 flex justify-center gap-1.5">
					<div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
					<div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
					<div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
					<div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
				</div>
			</section>

			<section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-xl shadow-indigo-100">
				<div className="absolute top-0 right-0 p-4">
					<button
						type="button"
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
						aria-label="More options"
					>
						<MoreHorizontal className="h-4 w-4" />
					</button>
				</div>

				<div className="relative z-10 mb-8">
					<h4 className="mb-1 text-4xl font-extrabold">{totalFollowers}</h4>
					<p className="text-sm font-semibold text-indigo-100/70">
						Total Followers
					</p>
				</div>

				<TotalFollowersChart className="mb-6" />

				<div className="flex items-center justify-between text-[10px] font-bold text-white/50">
					{MONTHS.map((month) => (
						<span key={month.id}>{month.label}</span>
					))}
				</div>
			</section>
		</div>
	);
}
