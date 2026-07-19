import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export type BadgeVariant =
	| "default"
	| "success"
	| "warning"
	| "danger"
	| "tiktok"
	| "instagram"
	| "neutral";

export type BadgeProps = {
	children: ReactNode;
	variant?: BadgeVariant;
	className?: string;
	dot?: boolean;
};

const variantClass: Record<BadgeVariant, string> = {
	default: "bg-indigo-50 text-indigo-700",
	success: "bg-emerald-50 text-emerald-700",
	warning: "bg-amber-50 text-amber-700",
	danger: "bg-red-50 text-red-700",
	tiktok: "bg-slate-900 text-white",
	instagram: "bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white",
	neutral: "bg-slate-100 text-slate-600",
};

export function Badge({
	children,
	variant = "default",
	className,
	dot = false,
}: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
				variantClass[variant],
				className,
			)}
		>
			{dot ? (
				<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
			) : null}
			{children}
		</span>
	);
}
