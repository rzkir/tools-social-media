import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AccountsDialog } from "#/components/dialog/accounts.dialog";
import { AccountCard } from "#/components/ui/card";
import { Empty } from "#/components/ui/empaty";
import {
	useAccounts,
	useRemoveAccount,
	useSetActiveAccount,
} from "#/hooks/use-session";
import {
	type AccountPlatform,
	bridgeLabel,
	isTikTokAccount,
} from "#/lib/session-store";

export const Route = createFileRoute("/dashboard/accounts")({
	component: AccountsPage,
});

function AccountsPage() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editAccountId, setEditAccountId] = useState<string | null>(null);
	const [defaultPlatform, setDefaultPlatform] =
		useState<AccountPlatform>("tiktok");

	const { accounts } = useAccounts();
	const removeAccount = useRemoveAccount();
	const setActive = useSetActiveAccount();

	const openAdd = (platform: AccountPlatform = "tiktok") => {
		setEditAccountId(null);
		setDefaultPlatform(platform);
		setDialogOpen(true);
	};

	const openEdit = (id: string) => {
		setEditAccountId(id);
		setDialogOpen(true);
	};

	return (
		<>
			<div className="flex flex-col gap-8">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h2 className="text-xl font-bold text-slate-800">
							Manage Accounts
						</h2>
						<p className="text-sm text-slate-400">
							{accounts.length > 0
								? `${accounts.length} akun tersimpan · TikTok & Instagram terpisah`
								: "Belum ada akun · connect cookie TikTok atau Instagram"}
						</p>
					</div>
					<button
						type="button"
						onClick={() => openAdd("tiktok")}
						className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-colors hover:bg-indigo-700"
					>
						<Plus className="h-4 w-4" />
						Add New Account
					</button>
				</div>

				{accounts.length > 0 ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{accounts.map((account) => {
							const user = account.user;
							const username =
								user?.uniqueId ||
								account.cookies.username ||
								"unknown";
							const label = bridgeLabel(account.platform, account.bridge);
							return (
								<AccountCard
									key={account.id}
									platform={account.platform}
									name={user?.nickname || username}
									handle={`@${username}`}
									avatarUrl={user?.avatarUrl}
									status="active"
									syncedLabel={`ID ${account.id.slice(0, 12)}…`}
									bridgeLabel={label}
									onRefresh={() => openEdit(account.id)}
									onSettings={() => {
										if (
											typeof window !== "undefined" &&
											!window.confirm(`Hapus akun @${username}?`)
										) {
											return;
										}
										removeAccount.mutate({
											id: account.id,
											recordMetrics: true,
										});
									}}
									metrics={[
										{
											label: "Platform",
											value:
												account.platform === "tiktok"
													? "TikTok"
													: "Instagram",
										},
										{
											label: "Tool",
											value: isTikTokAccount(account) ? (
												<Link
													to="/dashboard/tiktok/repost"
													className="text-sm font-bold text-indigo-600 no-underline hover:underline"
													onClick={() =>
														setActive.mutate({
															platform: "tiktok",
															id: account.id,
														})
													}
												>
													Open Remove Repost
												</Link>
											) : (
												<Link
													to="/dashboard/instagram"
													className="text-sm font-bold text-pink-600 no-underline hover:underline"
													onClick={() =>
														setActive.mutate({
															platform: "instagram",
															id: account.id,
														})
													}
												>
													Open Instagram
												</Link>
											),
										},
									]}
								/>
							);
						})}
					</div>
				) : (
					<Empty
						title="No accounts connected"
						description="Connect via Cookie TikTok or Cookie Instagram — keduanya bisa disimpan bersamaan."
						actionLabel="Add New Account"
						onAction={() => openAdd("tiktok")}
						className="max-w-md"
					/>
				)}
			</div>

			<AccountsDialog
				open={dialogOpen}
				onOpenChange={(open) => {
					setDialogOpen(open);
					if (!open) setEditAccountId(null);
				}}
				editAccountId={editAccountId}
				defaultPlatform={defaultPlatform}
			/>
		</>
	);
}
