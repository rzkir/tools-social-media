import { type LucideIcon, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export type EmptyProps = {
	title: string;
	description?: string;
	icon?: LucideIcon;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
	children?: ReactNode;
};

export function Empty({
	title,
	description,
	icon: Icon = Plus,
	actionLabel,
	onAction,
	className,
	children,
}: EmptyProps) {
	const content = (
		<>
			<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
				<Icon className="h-5 w-5" />
			</div>
			<div>
				<p className="font-bold text-slate-800">{title}</p>
				{description ? (
					<p className="mt-1 text-xs text-slate-400">{description}</p>
				) : null}
			</div>
			{children}
			{actionLabel && onAction ? (
				<span className="mt-1 text-xs font-semibold text-indigo-600">
					{actionLabel}
				</span>
			) : null}
		</>
	);

	if (onAction) {
		return (
			<button
				type="button"
				onClick={onAction}
				className={cn(
					"flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition-colors hover:bg-indigo-50",
					className,
				)}
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={cn(
				"flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center",
				className,
			)}
		>
			{content}
		</div>
	);
}
