import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Instagram,
	Layers,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Music2,
	TrendingUp,
	Users,
} from "lucide-react";
import { cn } from "#/lib/utils";

export type SidebarActiveItem =
	| "dashboard"
	| "analytics"
	| "accounts"
	| "tiktok"
	| "instagram";

type NavItem = {
	id: SidebarActiveItem;
	label: string;
	to:
		| "/dashboard"
		| "/dashboard/analytics"
		| "/dashboard/accounts"
		| "/dashboard/tiktok"
		| "/dashboard/instagram";
	icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		to: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		id: "analytics",
		label: "Analytics",
		to: "/dashboard/analytics",
		icon: BarChart3,
	},
	{ id: "accounts", label: "Accounts", to: "/dashboard/accounts", icon: Users },
	{ id: "tiktok", label: "TikTok Tool", to: "/dashboard/tiktok", icon: Music2 },
	{
		id: "instagram",
		label: "Instagram Tool",
		to: "/dashboard/instagram",
		icon: Instagram,
	},
];

function activeFromPath(pathname: string): SidebarActiveItem {
	if (pathname.startsWith("/dashboard/analytics")) return "analytics";
	if (pathname.startsWith("/dashboard/accounts")) return "accounts";
	if (pathname.startsWith("/dashboard/instagram")) return "instagram";
	if (pathname.startsWith("/dashboard/tiktok")) return "tiktok";
	return "dashboard";
}

export type SidebarProps = {
	activeItem?: SidebarActiveItem;
	userName?: string;
	userPlan?: string;
	userAvatar?: string;
	className?: string;
};

export function Sidebar({
	activeItem: activeItemProp,
	userName = "Chris Allow",
	userPlan = "Premium Plan",
	userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
	className,
}: SidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const activeItem = activeItemProp ?? activeFromPath(pathname);

	return (
		<aside
			className={cn(
				"sidebar-nav fixed z-30 flex h-full w-64 flex-col border-r border-slate-200 bg-slate-50/50",
				className,
			)}
		>
			<div className="flex items-center gap-3 p-6">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
					<Layers className="h-6 w-6" />
				</div>
				<span className="text-xl font-bold tracking-tight text-slate-800">
					Socooil
				</span>
			</div>

			<nav className="mt-4 flex-1 space-y-2 px-4">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const isActive = activeItem === item.id;
					const isInstagram = item.id === "instagram";
					return (
						<Link
							key={item.id}
							to={item.to}
							className={cn(
								"flex items-center gap-3 rounded-2xl px-4 py-3 font-medium no-underline transition-all",
								isActive
									? isInstagram
										? "bg-white text-pink-600 shadow-[0_4px_12px_-2px_rgba(219,39,119,0.12)]"
										: "bg-white text-indigo-600 shadow-[0_4px_12px_-2px_rgba(124,58,237,0.1)]"
									: "text-slate-500 hover:bg-white hover:text-indigo-600",
								!isActive && isInstagram && "hover:text-pink-600",
							)}
						>
							<Icon className="h-5 w-5" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="group relative mx-4 mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 shadow-xl shadow-indigo-100">
				<div className="relative z-10 text-white">
					<p className="text-xs font-medium text-white/80">
						Buy Paid Packages To
					</p>
					<h4 className="mb-3 text-sm font-bold">Increase Followers.</h4>
					<button
						type="button"
						className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-600 transition-shadow hover:shadow-lg"
					>
						Buy Now
					</button>
				</div>
				<TrendingUp className="absolute -right-4 -bottom-4 h-16 w-16 text-white/10 transition-transform group-hover:scale-110" />
			</div>

			<div className="mt-auto flex items-center gap-3 border-t border-slate-200 p-4">
				<img
					src={userAvatar}
					alt=""
					className="h-10 w-10 rounded-xl bg-orange-100"
				/>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-bold text-slate-800">
						{userName}
					</p>
					<p className="truncate text-xs text-slate-400">{userPlan}</p>
				</div>
				<button
					type="button"
					className="text-slate-400 transition-colors hover:text-red-500"
					aria-label="Log out"
				>
					<LogOut className="h-5 w-5" />
				</button>
			</div>
		</aside>
	);
}
