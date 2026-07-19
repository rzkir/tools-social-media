import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { NotificationViewport } from "#/components/ui/notification";

export type NotificationTone = "success" | "error" | "warning" | "info";

export type NotificationItem = {
	id: string;
	tone: NotificationTone;
	title?: string;
	message: string;
	durationMs: number;
};

export type NotifyOptions = {
	title?: string;
	/** Auto-dismiss delay. 0 = stay until closed. Default 4500. */
	durationMs?: number;
};

type NotificationContextValue = {
	notifications: NotificationItem[];
	notify: (
		tone: NotificationTone,
		message: string,
		options?: NotifyOptions,
	) => string;
	success: (message: string, options?: NotifyOptions) => string;
	error: (message: string, options?: NotifyOptions) => string;
	warning: (message: string, options?: NotifyOptions) => string;
	info: (message: string, options?: NotifyOptions) => string;
	dismiss: (id: string) => void;
	clear: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
	null,
);

let seq = 0;
function nextId() {
	seq += 1;
	return `ntf-${Date.now()}-${seq}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);

	const dismiss = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}, []);

	const clear = useCallback(() => {
		setNotifications([]);
	}, []);

	const notify = useCallback(
		(tone: NotificationTone, message: string, options?: NotifyOptions) => {
			const id = nextId();
			const durationMs =
				options?.durationMs === undefined ? 4500 : options.durationMs;
			const item: NotificationItem = {
				id,
				tone,
				title: options?.title,
				message,
				durationMs,
			};
			setNotifications((prev) => [...prev, item].slice(-5));

			if (durationMs > 0) {
				window.setTimeout(() => {
					dismiss(id);
				}, durationMs);
			}
			return id;
		},
		[dismiss],
	);

	const success = useCallback(
		(message: string, options?: NotifyOptions) =>
			notify("success", message, options),
		[notify],
	);
	const error = useCallback(
		(message: string, options?: NotifyOptions) =>
			notify("error", message, options),
		[notify],
	);
	const warning = useCallback(
		(message: string, options?: NotifyOptions) =>
			notify("warning", message, options),
		[notify],
	);
	const info = useCallback(
		(message: string, options?: NotifyOptions) =>
			notify("info", message, options),
		[notify],
	);

	const value = useMemo<NotificationContextValue>(
		() => ({
			notifications,
			notify,
			success,
			error,
			warning,
			info,
			dismiss,
			clear,
		}),
		[notifications, notify, success, error, warning, info, dismiss, clear],
	);

	return (
		<NotificationContext.Provider value={value}>
			{children}
			<NotificationViewport items={notifications} onDismiss={dismiss} />
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	const ctx = useContext(NotificationContext);
	if (!ctx) {
		throw new Error("useNotification must be used within NotificationProvider");
	}
	return ctx;
}

/** Safe hook when provider may be absent. */
export function useNotificationOptional() {
	return useContext(NotificationContext);
}
