import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { createPortal } from "react-dom";
import type { NotificationItem, NotificationTone } from "#/context/NotificationContext";
import { cn } from "#/lib/utils";

const toneClass: Record<NotificationTone, string> = {
	success: "border-emerald-200 bg-white",
	error: "border-red-200 bg-white",
	warning: "border-amber-200 bg-white",
	info: "border-indigo-200 bg-white",
};

const iconClass: Record<NotificationTone, string> = {
	success: "text-emerald-600",
	error: "text-red-600",
	warning: "text-amber-600",
	info: "text-indigo-600",
};

const Icon = {
	success: CheckCircle2,
	error: XCircle,
	warning: TriangleAlert,
	info: Info,
} as const;

export type NotificationToastProps = {
	item: NotificationItem;
	onDismiss: (id: string) => void;
};

export function NotificationToast({ item, onDismiss }: NotificationToastProps) {
	const Glyph = Icon[item.tone];

	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				"pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-900/10",
				toneClass[item.tone],
			)}
		>
			<Glyph
				className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass[item.tone])}
				aria-hidden
			/>
			<div className="min-w-0 flex-1">
				{item.title ? (
					<p className="m-0 text-sm font-bold text-slate-900">{item.title}</p>
				) : null}
				<p
					className={cn(
						"m-0 text-sm text-slate-600",
						item.title ? "mt-0.5" : "font-medium text-slate-800",
					)}
				>
					{item.message}
				</p>
			</div>
			<button
				type="button"
				onClick={() => onDismiss(item.id)}
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
				aria-label="Tutup notifikasi"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

export type NotificationViewportProps = {
	items: NotificationItem[];
	onDismiss: (id: string) => void;
};

/** Fixed toast stack — render via portal to body. */
export function NotificationViewport({
	items,
	onDismiss,
}: NotificationViewportProps) {
	if (typeof document === "undefined" || items.length === 0) return null;

	return createPortal(
		<div
			className="pointer-events-none fixed top-4 right-4 z-[80] flex flex-col gap-2"
			aria-label="Notifikasi"
		>
			{items.map((item) => (
				<NotificationToast
					key={item.id}
					item={item}
					onDismiss={onDismiss}
				/>
			))}
		</div>,
		document.body,
	);
}
