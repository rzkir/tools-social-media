import {
	CheckCircle2,
	Info,
	TriangleAlert,
	XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { AlertDialog } from "#/components/ui/alert-dialog";
import { cn } from "#/lib/utils";

export type AlertStatus = "success" | "error" | "warning" | "info";

export type AlertStatusState = {
	open: boolean;
	status: AlertStatus;
	title: string;
	description: string;
};

export type AlertStatusDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: AlertStatus;
	title: string;
	description?: string;
	confirmLabel?: string;
	onConfirm?: () => void;
	cancelLabel?: string;
	onCancel?: () => void;
};

const STATUS_META: Record<
	AlertStatus,
	{
		Icon: typeof CheckCircle2;
		iconWrap: string;
		iconClass: string;
		confirmVariant: "primary" | "danger";
		defaultTitle: string;
		defaultConfirm: string;
	}
> = {
	success: {
		Icon: CheckCircle2,
		iconWrap: "bg-emerald-50 ring-emerald-100",
		iconClass: "text-emerald-600",
		confirmVariant: "primary",
		defaultTitle: "Berhasil",
		defaultConfirm: "OK",
	},
	error: {
		Icon: XCircle,
		iconWrap: "bg-red-50 ring-red-100",
		iconClass: "text-red-600",
		confirmVariant: "danger",
		defaultTitle: "Gagal",
		defaultConfirm: "Tutup",
	},
	warning: {
		Icon: TriangleAlert,
		iconWrap: "bg-amber-50 ring-amber-100",
		iconClass: "text-amber-600",
		confirmVariant: "primary",
		defaultTitle: "Perhatian",
		defaultConfirm: "Mengerti",
	},
	info: {
		Icon: Info,
		iconWrap: "bg-indigo-50 ring-indigo-100",
		iconClass: "text-indigo-600",
		confirmVariant: "primary",
		defaultTitle: "Info",
		defaultConfirm: "OK",
	},
};

/** Centered status popup — success / error / warning / info. */
export function AlertStatusDialog({
	open,
	onOpenChange,
	status,
	title,
	description,
	confirmLabel,
	onConfirm,
	cancelLabel,
	onCancel,
}: AlertStatusDialogProps) {
	const meta = STATUS_META[status];
	const Glyph = meta.Icon;

	return (
		<AlertDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title || meta.defaultTitle}
			description={description}
			confirmLabel={confirmLabel || meta.defaultConfirm}
			confirmVariant={meta.confirmVariant}
			onConfirm={onConfirm}
			cancelLabel={cancelLabel}
			onCancel={onCancel}
			icon={
				<div
					className={cn(
						"flex h-14 w-14 items-center justify-center rounded-2xl ring-8",
						meta.iconWrap,
					)}
				>
					<Glyph className={cn("h-7 w-7", meta.iconClass)} aria-hidden />
				</div>
			}
		/>
	);
}

const EMPTY: AlertStatusState = {
	open: false,
	status: "info",
	title: "",
	description: "",
};

/** Local state helper for opening status popups. */
export function useAlertStatus() {
	const [alert, setAlert] = useState<AlertStatusState>(EMPTY);

	const close = useCallback(() => {
		setAlert((prev) => ({ ...prev, open: false }));
	}, []);

	const show = useCallback(
		(
			status: AlertStatus,
			title: string,
			description?: string,
		) => {
			setAlert({
				open: true,
				status,
				title,
				description: description || "",
			});
		},
		[],
	);

	const success = useCallback(
		(title: string, description?: string) =>
			show("success", title, description),
		[show],
	);
	const error = useCallback(
		(title: string, description?: string) =>
			show("error", title, description),
		[show],
	);
	const warning = useCallback(
		(title: string, description?: string) =>
			show("warning", title, description),
		[show],
	);
	const info = useCallback(
		(title: string, description?: string) => show("info", title, description),
		[show],
	);

	const dialog = (
		<AlertStatusDialog
			open={alert.open}
			onOpenChange={(open) => {
				if (!open) close();
			}}
			status={alert.status}
			title={alert.title}
			description={alert.description}
		/>
	);

	return {
		alert,
		dialog,
		show,
		success,
		error,
		warning,
		info,
		close,
		setAlert,
	};
}
