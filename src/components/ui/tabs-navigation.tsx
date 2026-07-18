import type { LucideIcon } from "lucide-react";
import { cn } from "#/lib/utils";

export type TabItem<T extends string = string> = {
	id: T;
	label: string;
	icon?: LucideIcon;
	disabled?: boolean;
};

export type TabsNavigationProps<T extends string = string> = {
	items: TabItem<T>[];
	value: T;
	onValueChange: (value: T) => void;
	className?: string;
	/** pill = filled active tab; underline = bottom border active */
	variant?: "pill" | "underline";
};

export function TabsNavigation<T extends string>({
	items,
	value,
	onValueChange,
	className,
	variant = "pill",
}: TabsNavigationProps<T>) {
	return (
		<div
			role="tablist"
			className={cn(
				variant === "pill"
					? "flex flex-wrap gap-2"
					: "flex gap-1 border-b border-slate-100",
				className,
			)}
		>
			{items.map((item) => {
				const isActive = value === item.id;
				const Icon = item.icon;

				return (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={isActive}
						disabled={item.disabled}
						onClick={() => onValueChange(item.id)}
						className={cn(
							"inline-flex items-center justify-center gap-2 text-sm font-semibold transition",
							variant === "pill" &&
								cn(
									"rounded-2xl border px-4 py-2",
									isActive
										? "border-transparent bg-indigo-600 text-white shadow-lg shadow-indigo-100"
										: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
								),
							variant === "underline" &&
								cn(
									"-mb-px border-b-2 px-4 py-2.5",
									isActive
										? "border-indigo-600 text-indigo-600"
										: "border-transparent text-slate-400 hover:text-slate-700",
								),
							item.disabled && "pointer-events-none opacity-50",
						)}
					>
						{Icon ? <Icon className="h-4 w-4" /> : null}
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
