import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "#/lib/utils";

export type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
};

export function Dialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	className,
}: DialogProps) {
	const titleId = useId();
	const descriptionId = useId();
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onOpenChange(false);
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onOpenChange]);

	useEffect(() => {
		if (!open) return;
		panelRef.current?.focus();
	}, [open]);

	if (!open || typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close dialog"
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
				onClick={() => onOpenChange(false)}
			/>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={description ? descriptionId : undefined}
				tabIndex={-1}
				className={cn(
					"relative z-10 flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 outline-none",
					className,
				)}
			>
				<header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
					<div className="min-w-0 space-y-1">
						<h2
							id={titleId}
							className="text-xl font-bold tracking-tight text-slate-900"
						>
							{title}
						</h2>
						{description ? (
							<p id={descriptionId} className="text-sm text-slate-400">
								{description}
							</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
						aria-label="Close"
					>
						<X className="h-4 w-4" />
					</button>
				</header>
				<div className="overflow-y-auto px-6 py-5">{children}</div>
			</div>
		</div>,
		document.body,
	);
}
