import { Clock, RefreshCw, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export type AccountPlatform = "facebook" | "instagram" | "twitter" | "tiktok";

export type AccountStatus = "active" | "reconnect";

export type AccountMetric = {
	label: string;
	value: ReactNode;
	dimmed?: boolean;
};

export type AccountCardProps = {
	name: string;
	handle: string;
	platform?: AccountPlatform;
	avatarUrl?: string;
	status?: AccountStatus;
	metrics?: AccountMetric[];
	syncedLabel?: string;
	onRefresh?: () => void;
	onSettings?: () => void;
	className?: string;
	footerExtra?: ReactNode;
};

export function Card({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<article
			className={cn(
				"relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm",
				className,
			)}
		>
			{children}
		</article>
	);
}

export function PlatformMark({
	platform,
	className,
}: {
	platform: AccountPlatform;
	className?: string;
}) {
	const styles = {
		facebook: "bg-blue-50 text-[#1877F2]",
		instagram: "bg-pink-50 text-[#E4405F]",
		twitter: "bg-blue-50 text-[#1DA1F2]",
		tiktok: "bg-slate-100 text-slate-900",
	} as const;

	const label = {
		facebook: "f",
		instagram: "IG",
		twitter: "X",
		tiktok: "TT",
	} as const;

	return (
		<div
			className={cn(
				"flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-extrabold",
				styles[platform],
				className,
			)}
		>
			{label[platform]}
		</div>
	);
}

function StatusBadge({ status }: { status: AccountStatus }) {
	if (status === "active") {
		return (
			<div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
				<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
				Active
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
			Reconnect
		</div>
	);
}

export function AccountCard({
	name,
	handle,
	platform = "tiktok",
	avatarUrl,
	status = "active",
	metrics = [],
	syncedLabel = "Connected",
	onRefresh,
	onSettings,
	className,
	footerExtra,
}: AccountCardProps) {
	return (
		<Card className={className}>
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt=""
							className="h-12 w-12 rounded-2xl object-cover"
						/>
					) : (
						<PlatformMark platform={platform} />
					)}
					<div>
						<h4 className="font-bold text-slate-800">{name}</h4>
						<p className="text-xs text-slate-400">{handle}</p>
					</div>
				</div>
				<StatusBadge status={status} />
			</div>

			{metrics.length > 0 ? (
				<div className="mb-6 grid grid-cols-2 gap-4">
					{metrics.map((metric) => (
						<div
							key={metric.label}
							className={cn(
								"rounded-2xl bg-slate-50 p-4",
								metric.dimmed && "opacity-60",
							)}
						>
							<p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
								{metric.label}
							</p>
							<div className="truncate text-lg font-extrabold text-slate-800">
								{metric.value}
							</div>
						</div>
					))}
				</div>
			) : null}

			<div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
				<p className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
					<Clock className="h-3 w-3" />
					{syncedLabel}
				</p>
				<div className="flex gap-2">
					{footerExtra}
					{onRefresh ? (
						<button
							type="button"
							onClick={onRefresh}
							className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
							aria-label="Refresh"
						>
							<RefreshCw className="h-4 w-4" />
						</button>
					) : null}
					{onSettings ? (
						<button
							type="button"
							onClick={onSettings}
							className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
							aria-label="Settings"
						>
							<Settings className="h-4 w-4" />
						</button>
					) : null}
				</div>
			</div>
		</Card>
	);
}
