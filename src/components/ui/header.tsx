import { useRouterState } from "@tanstack/react-router";
import { Bell, Mail, Search } from "lucide-react";
import { cn } from "#/lib/utils";

export type DashboardHeaderProps = {
	userName?: string;
	title?: string;
	subtitle?: string;
	showNotificationDot?: boolean;
	className?: string;
};

function headerCopyFromPath(pathname: string): {
	title: string;
	subtitle: string;
} {
	if (pathname.startsWith("/dashboard/accounts")) {
		return {
			title: "Accounts",
			subtitle: "Manage connected social profiles",
		};
	}
	if (pathname.startsWith("/dashboard/tiktok/repost")) {
		return {
			title: "Remove Repost",
			subtitle: "Hapus repost via Chrome extension",
		};
	}
	if (pathname.startsWith("/dashboard/tiktok/like")) {
		return {
			title: "Hapus Disukai",
			subtitle: "Hapus like via Chrome extension",
		};
	}
	if (pathname.startsWith("/dashboard/tiktok/favorite")) {
		return {
			title: "Favorite",
			subtitle: "Hapus favorite via Chrome extension",
		};
	}
	if (pathname.startsWith("/dashboard/tiktok")) {
		return {
			title: "TikTok Tool",
			subtitle: "Overview metrics & tools",
		};
	}
	return {
		title: "Analytics",
		subtitle: "welcome back!",
	};
}

export function DashboardHeader({
	userName = "Chris",
	title,
	subtitle,
	showNotificationDot = true,
	className,
}: DashboardHeaderProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const copy = headerCopyFromPath(pathname);
	const resolvedTitle = title ?? copy.title;
	const resolvedSubtitle =
		subtitle ??
		(copy.subtitle === "welcome back!"
			? `Hello ${userName}, welcome back!`
			: copy.subtitle);

	return (
		<header className={cn("mb-8 flex items-center justify-between", className)}>
			<div className="space-y-1">
				<h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
					{resolvedTitle}
				</h1>
				<p className="text-sm text-slate-400">{resolvedSubtitle}</p>
			</div>
			<div className="flex items-center gap-4">
				<div className="relative flex items-center">
					<Search className="absolute left-4 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Search Dashboard..."
						className="w-72 rounded-2xl border-0 bg-white py-2.5 pr-4 pl-11 text-sm outline-none ring-1 ring-slate-200 transition-all focus:ring-2 focus:ring-indigo-600"
					/>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
						aria-label="Mail"
					>
						<Mail className="h-5 w-5" />
					</button>
					<button
						type="button"
						className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
						aria-label="Notifications"
					>
						<Bell className="h-5 w-5" />
						{showNotificationDot ? (
							<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500" />
						) : null}
					</button>
				</div>
			</div>
		</header>
	);
}
