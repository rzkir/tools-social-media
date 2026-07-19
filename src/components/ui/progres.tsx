import type { HTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
	value: number;
	max?: number;
	label?: string;
};

export function Progress({
	value,
	max = 100,
	label,
	className,
	...props
}: ProgressProps) {
	const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));

	return (
		<div className={cn("space-y-2", className)} {...props}>
			{label ? (
				<div className="flex items-center justify-between gap-3 text-xs font-semibold">
					<span className="text-slate-500">{label}</span>
					<span className="tabular-nums text-slate-800">{Math.round(pct)}%</span>
				</div>
			) : null}
			<div
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={max}
				aria-valuenow={Math.round(pct)}
				aria-label={label || "Progress"}
				className="h-2.5 overflow-hidden rounded-full bg-slate-100"
			>
				<div
					className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
