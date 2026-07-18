import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Heart, LayoutDashboard, Repeat2 } from "lucide-react";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/tiktok")({
	component: TikTokLayout,
});

const TABS = [
	{
		to: "/dashboard/tiktok",
		label: "Overview",
		icon: LayoutDashboard,
		exact: true,
	},
	{
		to: "/dashboard/tiktok/repost",
		label: "Remove Repost",
		icon: Repeat2,
		exact: false,
	},
	{
		to: "/dashboard/tiktok/favorite",
		label: "Favorite",
		icon: Heart,
		exact: false,
	},
] as const;

function TikTokLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<div className="space-y-6">
			<nav className="flex flex-wrap gap-2" aria-label="TikTok tools">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const active = tab.exact
						? pathname === "/dashboard/tiktok" ||
							pathname === "/dashboard/tiktok/"
						: pathname.startsWith(tab.to);
					return (
						<Link
							key={tab.to}
							to={tab.to}
							className={cn(
								"inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold no-underline transition",
								active
									? "border-transparent bg-indigo-600 text-white shadow-lg shadow-indigo-100"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
							)}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
						</Link>
					);
				})}
			</nav>
			<Outlet />
		</div>
	);
}
