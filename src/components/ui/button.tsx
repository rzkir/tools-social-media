import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "#/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
	primary:
		"border-transparent bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700",
	secondary: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
	outline: "border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50",
	danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
	ghost: "border-transparent bg-transparent text-red-600 hover:bg-red-50",
};

const sizeClass: Record<ButtonSize, string> = {
	sm: "rounded-lg px-2.5 py-1 text-xs",
	md: "rounded-2xl px-4 py-2 text-sm",
	lg: "rounded-2xl px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{
			className,
			variant = "primary",
			size = "md",
			type = "button",
			disabled,
			...props
		},
		ref,
	) {
		return (
			<button
				ref={ref}
				type={type}
				disabled={disabled}
				className={cn(
					"inline-flex items-center justify-center gap-2 border font-semibold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
					variantClass[variant],
					sizeClass[size],
					className,
				)}
				{...props}
			/>
		);
	},
);
