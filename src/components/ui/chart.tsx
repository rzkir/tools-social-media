import type { ReactNode } from "react";
import {
	dotPulse,
	fadeIn,
	fadeUp,
	inViewProps,
	motion,
	pathDraw,
	transitionBar,
	useReducedMotion,
	viewportOnce,
} from "#/lib/animation";
import { cn } from "#/lib/utils";

const GRID_LINES = [
	{ id: "g1", strong: false },
	{ id: "g2", strong: false },
	{ id: "g3", strong: false },
	{ id: "g4", strong: false },
	{ id: "g5", strong: true },
] as const;

const DEFAULT_LINE = [2, 5, 4, 8, 6, 12, 9];

/** Build a polyline path + peak point from numeric series (viewBox 0..w × 0..h). */
export function buildLinePath(
	values: number[],
	w = 100,
	h = 40,
	padY = 5,
): { path: string; peak: { x: number; y: number; value: number } } {
	const series = values.length ? values : [0];
	const max = Math.max(1, ...series);
	const n = series.length;
	const step = n <= 1 ? 0 : w / (n - 1);
	const points = series.map((v, i) => ({
		x: i * step,
		y: h - padY - (v / max) * (h - padY * 2),
		value: v,
	}));

	let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
	for (let i = 1; i < points.length; i++) {
		const prev = points[i - 1];
		const cur = points[i];
		const cpx = (prev.x + cur.x) / 2;
		path += ` Q${cpx.toFixed(2)} ${prev.y.toFixed(2)} ${cur.x.toFixed(2)} ${cur.y.toFixed(2)}`;
	}

	let peakIdx = 0;
	for (let i = 1; i < series.length; i++) {
		if (series[i] >= series[peakIdx]) peakIdx = i;
	}

	return { path, peak: points[peakIdx] };
}

export type FollowersLineChartProps = {
	className?: string;
	/** Daily / series values — drives the animated line */
	values?: number[];
	label?: string;
	stroke?: string;
};

export function FollowersLineChart({
	className,
	values = DEFAULT_LINE,
	label,
	stroke = "#F97316",
}: FollowersLineChartProps) {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const { path, peak } = buildLinePath(values);
	const tip =
		label ??
		(peak.value >= 1000
			? `${(peak.value / 1000).toFixed(1)}k`
			: String(peak.value));
	const tipW = Math.max(16, tip.length * 3.2 + 6);
	const tipX = Math.min(100 - tipW - 1, Math.max(0, peak.x - tipW / 2));

	return (
		<div className={cn("relative h-64", className)}>
			<div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
				{GRID_LINES.map((line, i) => (
					<motion.div
						key={line.id}
						className={cn(
							"h-px w-full border-b",
							line.strong ? "border-slate-100" : "border-slate-50",
						)}
						variants={fadeUp}
						{...view}
						custom={0.04 + i * 0.04}
					/>
				))}
			</div>
			<div className="flex h-full w-full items-end">
				<svg
					viewBox="0 0 100 40"
					className="h-full w-full overflow-visible"
					role="img"
					aria-label={`Trend highlight ${tip}`}
				>
					<motion.path
						d={path}
						fill="none"
						stroke={stroke}
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						variants={pathDraw}
						{...view}
					/>
					{!reduce ? (
						<motion.circle
							cx={peak.x}
							cy={peak.y}
							r="5"
							fill="none"
							stroke={stroke}
							strokeWidth="1"
							initial={dotPulse.initial}
							whileInView={dotPulse.show}
							viewport={viewportOnce}
						/>
					) : null}
					<motion.circle
						cx={peak.x}
						cy={peak.y}
						r="3"
						fill={stroke}
						variants={fadeIn}
						{...view}
						custom={0.55}
					/>
					<motion.g variants={fadeIn} {...view} custom={0.7}>
						<rect
							x={tipX}
							y={Math.max(0, peak.y - 12)}
							width={tipW}
							height="8"
							rx="2"
							fill="white"
							stroke={stroke}
							strokeWidth="0.5"
						/>
						<text
							x={tipX + tipW / 2}
							y={Math.max(0, peak.y - 12) + 5.5}
							fontSize="3"
							fill={stroke}
							fontWeight="bold"
							textAnchor="middle"
						>
							{tip}
						</text>
					</motion.g>
				</svg>
			</div>
		</div>
	);
}

export type GenderDonutChartProps = {
	className?: string;
	/** Primary arc percent 0–100 */
	primaryPercent?: number;
	secondaryPercent?: number;
	primaryLabel?: string;
	secondaryLabel?: string;
	/** @deprecated use primaryPercent */
	femalePercent?: number;
	/** @deprecated use secondaryPercent */
	malePercent?: number;
};

export function GenderDonutChart({
	className,
	femalePercent,
	malePercent,
	primaryPercent = femalePercent ?? 80,
	secondaryPercent = malePercent ?? 20,
	primaryLabel = "Female",
	secondaryLabel = "Male",
}: GenderDonutChartProps) {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const circumference = 2 * Math.PI * 56;
	const primaryOffset = circumference * (1 - primaryPercent / 100);

	return (
		<div className={cn("flex flex-col items-center text-center", className)}>
			<motion.div
				className="relative flex h-32 w-32 items-center justify-center"
				variants={fadeUp}
				{...view}
			>
				<svg
					className="h-full w-full -rotate-90"
					role="img"
					aria-label={`${primaryLabel} ${primaryPercent}% · ${secondaryLabel} ${secondaryPercent}%`}
				>
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="#f1f5f9"
						strokeWidth="8"
						fill="none"
					/>
					<motion.circle
						cx="64"
						cy="64"
						r="56"
						stroke="#F97316"
						strokeWidth="8"
						strokeDasharray={circumference}
						fill="none"
						strokeLinecap="round"
						initial={
							reduce
								? { strokeDashoffset: primaryOffset }
								: { strokeDashoffset: circumference }
						}
						whileInView={{ strokeDashoffset: primaryOffset }}
						viewport={viewportOnce}
						transition={
							reduce ? { duration: 0 } : { duration: 1.3, ease: [0.4, 0, 0.2, 1] }
						}
					/>
				</svg>
				<motion.div
					className="absolute inset-0 flex items-center justify-center"
					variants={fadeIn}
					{...view}
					custom={0.35}
				>
					<span className="text-lg font-extrabold text-slate-800">
						{Math.round(primaryPercent)}%
					</span>
				</motion.div>
			</motion.div>
			<div className="mt-8 w-full space-y-3">
				<motion.div
					className="flex items-center justify-between"
					variants={fadeUp}
					{...view}
					custom={0.2}
				>
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-orange-400" />
						<span className="text-xs font-semibold text-slate-400">
							{primaryLabel}
						</span>
					</div>
					<span className="text-sm font-bold text-slate-800">
						%{Math.round(primaryPercent)}
					</span>
				</motion.div>
				<motion.div
					className="flex items-center justify-between"
					variants={fadeUp}
					{...view}
					custom={0.32}
				>
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-indigo-600" />
						<span className="text-xs font-semibold text-slate-400">
							{secondaryLabel}
						</span>
					</div>
					<span className="text-sm font-bold text-slate-800">
						%{Math.round(secondaryPercent)}
					</span>
				</motion.div>
			</div>
		</div>
	);
}

export type SparklineChartProps = {
	className?: string;
	path?: string;
	values?: number[];
	stroke?: string;
	label?: string;
};

export function SparklineChart({
	className,
	path: pathProp,
	values,
	stroke = "#6366f1",
	label = "Trend sparkline",
}: SparklineChartProps) {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const path =
		pathProp ||
		buildLinePath(values?.length ? values : [4, 8, 5, 12, 7], 40, 20, 3).path;

	return (
		<svg
			viewBox="0 0 40 20"
			className={cn("h-full w-full", className)}
			role="img"
			aria-label={label}
		>
			<motion.path
				d={path}
				fill="none"
				stroke={stroke}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={pathDraw}
				{...view}
			/>
		</svg>
	);
}

export type TotalFollowersChartProps = {
	className?: string;
	values?: number[];
	highlightLabel?: string;
};

export function TotalFollowersChart({
	className,
	values = DEFAULT_LINE,
	highlightLabel,
}: TotalFollowersChartProps) {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const { path, peak } = buildLinePath(values);
	const tip =
		highlightLabel ??
		(peak.value >= 1000
			? `${(peak.value / 1000).toFixed(1)}k`
			: String(peak.value));
	const tipW = Math.max(18, tip.length * 2.8 + 8);
	const tipX = Math.min(100 - tipW - 1, Math.max(0, peak.x - tipW / 2));

	return (
		<div className={cn("relative h-24", className)}>
			<div className="absolute inset-0 flex items-center">
				<motion.div
					className="h-px w-full bg-white/10"
					variants={fadeUp}
					{...view}
				/>
			</div>
			<svg
				viewBox="0 0 100 40"
				className="h-full w-full overflow-visible"
				role="img"
				aria-label={`Trend highlight ${tip}`}
			>
				<motion.path
					d={path}
					fill="none"
					stroke="#F97316"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					variants={pathDraw}
					{...view}
				/>
				{!reduce ? (
					<motion.circle
						cx={peak.x}
						cy={peak.y}
						r="4"
						fill="none"
						stroke="white"
						strokeWidth="1"
						initial={dotPulse.initial}
						whileInView={dotPulse.show}
						viewport={viewportOnce}
					/>
				) : null}
				<motion.circle
					cx={peak.x}
					cy={peak.y}
					r="2"
					fill="white"
					variants={fadeIn}
					{...view}
					custom={0.55}
				/>
				<motion.g variants={fadeIn} {...view} custom={0.7}>
					<rect
						x={tipX}
						y={Math.max(0, peak.y - 12)}
						width={tipW}
						height="10"
						rx="2"
						fill="white"
					/>
					<text
						x={tipX + tipW / 2}
						y={Math.max(0, peak.y - 12) + 7}
						fontSize="3"
						fill="#1e293b"
						fontWeight="bold"
						textAnchor="middle"
					>
						{tip}
					</text>
				</motion.g>
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
	rangeLabel = "7 hari terakhir",
}: ProgressMetricProps) {
	const reduce = useReducedMotion();
	const view = inViewProps(reduce);
	const safe = Math.max(0, Math.min(100, percent));

	return (
		<motion.div className="space-y-3" variants={fadeUp} {...view}>
			<div className="flex items-center justify-between text-xs font-bold">
				<span className="text-slate-800">{value}</span>
				<div className="flex items-center gap-1 text-slate-400">
					<span className="font-medium">{rangeLabel}</span>
				</div>
			</div>
			<p className="text-[10px] font-medium text-slate-400">{label}</p>
			<div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
				<motion.div
					className="absolute inset-y-0 left-0 origin-left rounded-full bg-orange-400"
					style={{ width: "100%" }}
					initial={reduce ? false : { scaleX: 0 }}
					whileInView={{ scaleX: safe / 100 }}
					viewport={viewportOnce}
					transition={reduce ? { duration: 0 } : transitionBar}
				/>
			</div>
			<div className="flex justify-end text-slate-300">{icon}</div>
		</motion.div>
	);
}
