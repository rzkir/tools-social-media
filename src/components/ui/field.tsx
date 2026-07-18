import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

export function FieldGroup({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-col gap-4", className)}
			role="group"
			{...props}
		/>
	);
}

export function Field({
	className,
	orientation = "vertical",
	...props
}: HTMLAttributes<HTMLDivElement> & {
	orientation?: "vertical" | "horizontal";
}) {
	return (
		<div
			data-orientation={orientation}
			className={cn(
				"flex gap-2",
				orientation === "horizontal"
					? "flex-row flex-wrap items-center"
					: "flex-col",
				className,
			)}
			{...props}
		/>
	);
}

export function FieldLabel({
	className,
	required,
	children,
	...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
	return (
		<label
			className={cn("text-sm font-semibold text-slate-800", className)}
			{...props}
		>
			{children}
			{required ? (
				<span className="ml-1 text-indigo-600" aria-hidden>
					*
				</span>
			) : null}
		</label>
	);
}

export function FieldDescription({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn("m-0 text-xs leading-5 text-slate-400", className)}
			{...props}
		/>
	);
}

export function FieldError({
	className,
	children,
	...props
}: HTMLAttributes<HTMLParagraphElement> & { children?: ReactNode }) {
	if (!children) return null;
	return (
		<p
			role="alert"
			className={cn(
				"m-0 rounded-xl border border-red-300/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200",
				className,
			)}
			{...props}
		>
			{children}
		</p>
	);
}
