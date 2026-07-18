import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

const GRID_LINES = [
	{ id: "g1", strong: false },
	{ id: "g2", strong: false },
	{ id: "g3", strong: false },
	{ id: "g4", strong: false },
	{ id: "g5", strong: true },
] as const;

export type FollowersLineChartProps = {
	className?: string;
	label?: string;
};

export function FollowersLineChart({
	className,
	label = "5.k",
}: FollowersLineChartProps) {
	return (
		<div className={cn("relative h-64", className)}>
			<div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
				{GRID_LINES.map((line) => (
					<div
						key={line.id}
						className={cn(
							"h-px w-full border-b",
							line.strong ? "border-slate-100" : "border-slate-50",
						)}
					/>
				))}
			</div>
			<div className="flex h-full w-full items-end">
				<svg
					viewBox="0 0 100 40"
					className="h-full w-full overflow-visible"
					role="img"
					aria-label={`Followers trend highlight ${label}`}
				>
					<path
						d="M0 35 Q10 32 20 25 T40 28 T60 15 T80 18 T100 5"
						fill="none"
						stroke="#F97316"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
					<circle cx="60" cy="15" r="3" fill="#F97316" />
					<rect
						x="50"
						y="2"
						width="20"
						height="8"
						rx="2"
						fill="white"
						stroke="#F97316"
						strokeWidth="0.5"
					/>
					<text x="54" y="7" fontSize="3" fill="#F97316" fontWeight="bold">
						{label}
					</text>
				</svg>
			</div>
		</div>
	);
}

export type GenderDonutChartProps = {
	className?: string;
	femalePercent?: number;
	malePercent?: number;
};

export function GenderDonutChart({
	className,
	femalePercent = 80,
	malePercent = 20,
}: GenderDonutChartProps) {
	const circumference = 2 * Math.PI * 56;
	const femaleOffset = circumference * (1 - femalePercent / 100);

	return (
		<div className={cn("flex flex-col items-center text-center", className)}>
			<div className="relative flex h-32 w-32 items-center justify-center">
				<svg
					className="h-full w-full -rotate-90"
					role="img"
					aria-label={`Follower gender ${femalePercent}% female ${malePercent}% male`}
				>
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="#f1f5f9"
						strokeWidth="8"
						fill="none"
					/>
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="#F97316"
						strokeWidth="8"
						strokeDasharray={circumference}
						strokeDashoffset={femaleOffset}
						fill="none"
						strokeLinecap="round"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<img
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=gender"
						alt=""
						className="h-10 w-10 rounded-full bg-orange-50"
					/>
				</div>
			</div>
			<div className="mt-8 w-full space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-indigo-600" />
						<span className="text-xs font-semibold text-slate-400">Female</span>
					</div>
					<span className="text-sm font-bold text-slate-800">
						%{femalePercent}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-orange-400" />
						<span className="text-xs font-semibold text-slate-400">Male</span>
					</div>
					<span className="text-sm font-bold text-slate-800">
						%{malePercent}
					</span>
				</div>
			</div>
		</div>
	);
}

export type SparklineChartProps = {
	className?: string;
	path: string;
	stroke?: string;
	label?: string;
};

export function SparklineChart({
	className,
	path,
	stroke = "#6366f1",
	label = "Trend sparkline",
}: SparklineChartProps) {
	return (
		<svg
			viewBox="0 0 40 20"
			className={cn("h-full w-full", className)}
			role="img"
			aria-label={label}
		>
			<path d={path} fill="none" stroke={stroke} strokeWidth="2" />
		</svg>
	);
}

export type TotalFollowersChartProps = {
	className?: string;
	highlightLabel?: string;
};

export function TotalFollowersChart({
	className,
	highlightLabel = "200.000.k",
}: TotalFollowersChartProps) {
	return (
		<div className={cn("relative h-24", className)}>
			<div className="absolute inset-0 flex items-center">
				<div className="h-px w-full bg-white/10" />
			</div>
			<svg
				viewBox="0 0 100 40"
				className="h-full w-full overflow-visible"
				role="img"
				aria-label={`Total followers trend highlight ${highlightLabel}`}
			>
				<path
					d="M0 30 Q10 32 20 28 T40 25 T60 35 T80 20 T100 30"
					fill="none"
					stroke="#F97316"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<circle cx="80" cy="20" r="2" fill="white" />
				<rect x="70" y="8" width="25" height="10" rx="2" fill="white" />
				<text x="72" y="15" fontSize="3" fill="#1e293b" fontWeight="bold">
					{highlightLabel}
				</text>
			</svg>
		</div>
	);
}

export type ProgressMetricProps = {
	value: string;
	label: string;
	percent: number;
	icon: ReactNode;
	rangeLabel?: string;
};

export function ProgressMetric({
	value,
	label,
	percent,
	icon,
	rangeLabel = "Aug 25- Sep 25",
}: ProgressMetricProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between text-xs font-bold">
				<span className="text-slate-800">{value}</span>
				<div className="flex items-center gap-1 text-slate-400">
					<span className="font-medium">{rangeLabel}</span>
				</div>
			</div>
			<p className="text-[10px] font-medium text-slate-400">{label}</p>
			<div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
				<div
					className="absolute top-0 left-0 h-full rounded-full bg-orange-400"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<div className="flex justify-end text-slate-300">{icon}</div>
		</div>
	);
}
