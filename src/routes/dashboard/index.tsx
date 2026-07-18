import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Mail } from "lucide-react";
import { DashboardAside } from "#/components/ui/aside";
import {
	FollowersLineChart,
	GenderDonutChart,
	SparklineChart,
} from "#/components/ui/chart";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="grid grid-cols-12 gap-8">
			<div className="col-span-12 space-y-8 lg:col-span-8">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="relative flex items-center gap-6 overflow-hidden rounded-[2.5rem] border border-orange-200/50 bg-orange-100/50 p-8">
						<div className="relative z-10 flex-1">
							<h3 className="mb-2 text-lg leading-tight font-bold text-slate-800">
								Have you tried our mobile application?
							</h3>
							<button
								type="button"
								className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-orange-600 shadow-sm transition-all hover:shadow-md"
							>
								Try Now
							</button>
						</div>
						<div className="relative h-32 w-32 flex-shrink-0">
							<img
								src="https://api.dicebear.com/7.x/bottts/svg?seed=app"
								className="h-full w-full"
								alt=""
							/>
						</div>
					</div>

					<div className="relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 text-white">
						<Mail className="absolute -top-6 -right-6 h-36 w-36 text-white/10" />
						<div className="flex gap-1">
							<div className="h-2 w-2 rounded-full bg-white" />
							<div className="h-2 w-2 rounded-full bg-white/40" />
							<div className="h-2 w-2 rounded-full bg-white/40" />
						</div>
						<div>
							<p className="mb-1 text-4xl font-extrabold">20.k</p>
							<p className="font-medium text-white/80">Pending Messages</p>
						</div>
						<div className="mt-4 flex items-center gap-1">
							<div className="h-1 w-1 rounded-full bg-white" />
							<div className="h-1 w-1 rounded-full bg-white" />
							<div className="h-1 w-1 rounded-full bg-white" />
						</div>
					</div>
				</div>

				<section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
					<div className="mb-8 flex items-center justify-between">
						<h3 className="font-bold text-slate-900">Followers on page</h3>
						<div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
							<span className="text-xs font-semibold text-slate-500">
								Aug 25- Sep 25
							</span>
							<ChevronDown className="h-4 w-4 text-slate-400" />
						</div>
					</div>

					<FollowersLineChart />

					<div className="mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-400">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((day) => (
							<span key={day}>{day}</span>
						))}
					</div>
				</section>

				<div className="grid grid-cols-2 gap-6">
					<section className="flex flex-col items-center rounded-[2.5rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
						<h3 className="mb-6 font-bold text-slate-900">Follower gender</h3>
						<GenderDonutChart className="w-full" />
					</section>

					<div className="grid grid-rows-2 gap-6">
						<section className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-slate-400">
									Photo Clicks
								</p>
								<p className="text-xl font-bold text-slate-800">%70</p>
								<div className="flex items-center gap-1">
									<div className="h-0.5 w-0.5 bg-slate-300" />
									<div className="h-0.5 w-0.5 bg-slate-300" />
									<div className="h-0.5 w-0.5 bg-slate-300" />
								</div>
							</div>
							<div className="h-12 w-24">
								<SparklineChart
									path="M0 15 Q10 10 20 18 T40 5"
									stroke="#6366f1"
								/>
							</div>
						</section>

						<section className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
							<div className="space-y-1">
								<p className="text-xs font-semibold text-slate-400">
									Link Clicks
								</p>
								<p className="text-xl font-bold text-slate-800">%30</p>
								<div className="flex items-center gap-1">
									<div className="h-0.5 w-0.5 bg-slate-300" />
									<div className="h-0.5 w-0.5 bg-slate-300" />
									<div className="h-0.5 w-0.5 bg-slate-300" />
								</div>
							</div>
							<div className="h-12 w-24">
								<SparklineChart
									path="M0 18 Q10 12 20 15 T40 10"
									stroke="#f97316"
								/>
							</div>
						</section>
					</div>
				</div>
			</div>

			<DashboardAside className="col-span-12 lg:col-span-4" />
		</div>
	);
}
