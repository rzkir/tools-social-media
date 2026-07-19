import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AccountsDialog } from "#/components/dialog/accounts.dialog";
import { AccountCard } from "#/components/ui/card";
import { Empty } from "#/components/ui/empaty";
import { useClearCookieSession, useCookieSession } from "#/hooks/use-session";
import {
	type AccountBridge,
	type AccountPlatform,
	bridgeLabel,
} from "#/lib/session-store";

export const Route = createFileRoute("/dashboard/accounts")({
	component: AccountsPage,
});

function AccountsPage() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { data: session } = useCookieSession();
	const clearSession = useClearCookieSession();

	const user = session?.user ?? null;
	const platform: AccountPlatform = session?.platform ?? "tiktok";
	const bridge: AccountBridge = session?.bridge ?? "cookie";

	const onClearSession = () => {
		clearSession.mutate({ recordMetrics: true });
	};

	const connectedCount = user ? 1 : 0;
	const label = bridgeLabel(platform, bridge);

	return (
		<>
			<div className="flex flex-col gap-8">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h2 className="text-xl font-bold text-slate-800">
							Manage Accounts
						</h2>
						<p className="text-sm text-slate-400">
							{connectedCount > 0
								? `You have ${connectedCount} account connected · ${label}`
								: "No accounts yet · connect TikTok or Instagram cookies"}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setDialogOpen(true)}
						className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-colors hover:bg-indigo-700"
					>
						<Plus className="h-4 w-4" />
						Add New Account
					</button>
				</div>

				{user ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<AccountCard
							platform={platform}
							name={user.nickname || user.uniqueId}
							handle={`@${user.uniqueId}`}
							avatarUrl={user.avatarUrl}
							status="active"
							syncedLabel="Connected"
							bridgeLabel={label}
							onRefresh={() => setDialogOpen(true)}
							onSettings={onClearSession}
							metrics={[
								{ label: "User ID", value: user.uniqueId },
								{
									label: "Tool",
									value:
										platform === "tiktok" ? (
											<Link
												to="/dashboard/tiktok/repost"
												className="text-sm font-bold text-indigo-600 no-underline hover:underline"
											>
												Open Remove Repost
											</Link>
										) : (
											<span className="text-sm font-bold text-slate-400">
												IG soon
											</span>
										),
								},
							]}
						/>
					</div>
				) : (
					<Empty
						title="No accounts connected"
						description="Connect via Cookie TikTok or Cookie Instagram"
						actionLabel="Add New Account"
						onAction={() => setDialogOpen(true)}
						className="max-w-md"
					/>
				)}
			</div>

			<AccountsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
		</>
	);
}
