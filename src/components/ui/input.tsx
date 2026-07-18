import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ className, type = "text", ...props },
	ref,
) {
	return (
		<input
			ref={ref}
			type={type}
			className={cn(
				"w-full rounded-2xl border-0 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-800 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60",
				className,
			)}
			{...props}
		/>
	);
});
