import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export type AlertDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	children?: ReactNode;
	/** Primary action (right). Defaults to closing. */
	confirmLabel?: string;
	onConfirm?: () => void;
	/** Optional secondary action (left). */
	cancelLabel?: string;
	onCancel?: () => void;
	confirmVariant?: "primary" | "secondary" | "outline" | "danger";
	className?: string;
	/** Extra node above the title (icon, illustration). */
	icon?: ReactNode;
};

export function AlertDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	confirmLabel = "OK",
	onConfirm,
	cancelLabel,
	onCancel,
	confirmVariant = "primary",
	className,
	icon,
}: AlertDialogProps) {
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

	const handleConfirm = () => {
		onConfirm?.();
		onOpenChange(false);
	};

	const handleCancel = () => {
		onCancel?.();
		onOpenChange(false);
	};

	return createPortal(
		<div className="fixed inset-0 z-70 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Tutup"
				className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
				onClick={() => onOpenChange(false)}
			/>
			<div
				ref={panelRef}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={title ? titleId : undefined}
				aria-describedby={description ? descriptionId : undefined}
				tabIndex={-1}
				className={cn(
					"relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-900/15 outline-none",
					className,
				)}
			>
				<button
					type="button"
					onClick={() => onOpenChange(false)}
					className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
					aria-label="Tutup"
				>
					<X className="h-4 w-4" />
				</button>

				{icon ? (
					<div className="mb-4 flex justify-center">{icon}</div>
				) : null}

				{title ? (
					<h2
						id={titleId}
						className={cn(
							"pr-10 text-lg font-bold tracking-tight text-slate-900",
							icon ? "text-center" : "",
						)}
					>
						{title}
					</h2>
				) : null}

				{description ? (
					<p
						id={descriptionId}
						className={cn(
							"mt-2 text-sm leading-relaxed text-slate-500",
							icon ? "text-center" : "",
						)}
					>
						{description}
					</p>
				) : null}

				{children ? <div className="mt-4">{children}</div> : null}

				<div
					className={cn(
						"mt-6 flex flex-wrap gap-2",
						icon || cancelLabel ? "justify-center" : "justify-end",
					)}
				>
					{cancelLabel ? (
						<Button variant="outline" size="lg" onClick={handleCancel}>
							{cancelLabel}
						</Button>
					) : null}
					<Button
						variant={confirmVariant}
						size="lg"
						onClick={handleConfirm}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
