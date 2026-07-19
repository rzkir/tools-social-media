import type { HTMLAttributes, RefObject } from "react";
import {
	motion,
	transitionBar,
	useAnimatedNumber,
	useInViewOnce,
	useReducedMotion,
	viewportOnce,
} from "#/lib/animation";
import { cn } from "#/lib/utils";

export type ProgressTone = "indigo" | "orange" | "emerald" | "rose";

const TONE_FILL: Record<ProgressTone, string> = {
	indigo: "bg-indigo-600",
	orange: "bg-orange-500",
	emerald: "bg-emerald-500",
	rose: "bg-rose-500",
};

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
	value: number;
	max?: number;
	label?: string;
	tone?: ProgressTone;
	/** Show animated % on the right of the label row */
	showValue?: boolean;
	size?: "sm" | "md";
};

export function Progress({
	value,
	max = 100,
	label,
	tone = "indigo",
	showValue = true,
	size = "md",
	className,
	...props
}: ProgressProps) {
	const reduce = useReducedMotion();
	const { ref, inView } = useInViewOnce(0.4);
	const target = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
	const display = useAnimatedNumber(target, 0.9, Boolean(reduce) || inView);

	return (
		<div
			ref={ref as RefObject<HTMLDivElement>}
			className={cn("space-y-2", className)}
			{...props}
		>
			{label || showValue ? (
				<div className="flex items-center justify-between gap-3 text-xs font-semibold">
					{label ? <span className="text-slate-500">{label}</span> : <span />}
					{showValue ? (
						<span className="tabular-nums text-slate-800">
							{Math.round(display)}%
						</span>
					) : null}
				</div>
			) : null}
			<div
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={max}
				aria-valuenow={Math.round(display)}
				aria-label={label || "Progress"}
				className={cn(
					"overflow-hidden rounded-full bg-slate-100",
					size === "sm" ? "h-1.5" : "h-2.5",
				)}
			>
				<motion.div
					className={cn(
						"relative h-full origin-left overflow-hidden rounded-full",
						TONE_FILL[tone],
					)}
					initial={reduce ? false : { scaleX: 0 }}
					whileInView={{ scaleX: target / 100 }}
					viewport={viewportOnce}
					transition={reduce ? { duration: 0 } : transitionBar}
				>
					{!reduce && inView ? (
						<motion.div
							aria-hidden
							className="pointer-events-none absolute inset-y-0 w-2/5 bg-linear-to-r from-transparent via-white/40 to-transparent"
							initial={{ x: "-100%" }}
							animate={{ x: "250%" }}
							transition={{
								duration: 2,
								ease: "linear",
								repeat: Infinity,
								repeatDelay: 0.4,
							}}
						/>
					) : null}
				</motion.div>
			</div>
		</div>
	);
}
