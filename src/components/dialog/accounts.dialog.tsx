import { Instagram, Music2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAlertStatus } from "#/components/dialog/alert-status.dialog";
import {
	buildInstagramCookieHeader,
	EMPTY_INSTAGRAM_COOKIE_VALUES,
	InstagramCookieForm,
	type InstagramCookieValues,
} from "#/components/InstagramCookieForm";
import {
	buildCookieHeader,
	EMPTY_COOKIE_VALUES,
	TikTokCookieForm,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import { Dialog } from "#/components/ui/dialog";
import { TabsNavigation } from "#/components/ui/tabs-navigation";
import { useVerifyInstagramSession } from "#/hooks/use-instagram";
import { useRemoveAccount } from "#/hooks/use-session";
import { useVerifySession } from "#/hooks/use-tiktok";
import {
	type AccountBridge,
	type AccountPlatform,
	getAccountById,
	isInstagramAccount,
	isTikTokAccount,
} from "#/lib/session-store";
import type { TikTokUser } from "#/types/tiktok";

const PLATFORM_TABS = [
	{ id: "tiktok" as const, label: "TikTok", icon: Music2 },
	{ id: "instagram" as const, label: "Instagram", icon: Instagram },
];

export type AccountsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** When set, dialog edits that account instead of adding a new one. */
	editAccountId?: string | null;
	defaultPlatform?: AccountPlatform;
	onConnected?: (payload: {
		user: TikTokUser | null;
		platform: AccountPlatform;
		bridge: AccountBridge;
		accountId: string;
	}) => void;
};

export function AccountsDialog({
	open,
	onOpenChange,
	editAccountId = null,
	defaultPlatform = "tiktok",
	onConnected,
}: AccountsDialogProps) {
	const [platform, setPlatform] = useState<AccountPlatform>(defaultPlatform);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [cookieValues, setCookieValues] =
		useState<TikTokCookieValues>(EMPTY_COOKIE_VALUES);
	const [igCookieValues, setIgCookieValues] = useState<InstagramCookieValues>(
		EMPTY_INSTAGRAM_COOKIE_VALUES,
	);
	const [user, setUser] = useState<TikTokUser | null>(null);
	const [hydrated, setHydrated] = useState(false);
	const statusAlert = useAlertStatus();

	const removeAccount = useRemoveAccount();
	const verifySession = useVerifySession();
	const verifyInstagramSession = useVerifyInstagramSession();

	const cookies = useMemo(
		() => buildCookieHeader(cookieValues),
		[cookieValues],
	);
	const igCookies = useMemo(
		() => buildInstagramCookieHeader(igCookieValues),
		[igCookieValues],
	);

	const busy = verifySession.isPending
		? "verify"
		: verifyInstagramSession.isPending
			? "verify"
			: removeAccount.isPending
				? "load"
				: "idle";

	useEffect(() => {
		if (!open) {
			setHydrated(false);
			return;
		}
		if (hydrated) return;

		const existing = editAccountId ? getAccountById(editAccountId) : null;
		if (existing) {
			setEditingId(existing.id);
			setPlatform(existing.platform);
			setUser(existing.user);
			if (isTikTokAccount(existing)) {
				setCookieValues(existing.cookies);
				setIgCookieValues(EMPTY_INSTAGRAM_COOKIE_VALUES);
			} else if (isInstagramAccount(existing)) {
				setIgCookieValues(existing.cookies);
				setCookieValues(EMPTY_COOKIE_VALUES);
			}
		} else {
			setEditingId(null);
			setPlatform(defaultPlatform);
			setUser(null);
			setCookieValues(EMPTY_COOKIE_VALUES);
			setIgCookieValues(EMPTY_INSTAGRAM_COOKIE_VALUES);
		}
		setHydrated(true);
	}, [open, editAccountId, defaultPlatform, hydrated]);

	const emitConnected = (
		nextUser: TikTokUser | null,
		nextPlatform: AccountPlatform,
		nextBridge: AccountBridge,
		accountId: string,
	) => {
		onConnected?.({
			user: nextUser,
			platform: nextPlatform,
			bridge: nextBridge,
			accountId,
		});
	};

	const onVerifyTikTok = () => {
		verifySession.mutate(
			{
				cookies,
				uniqueId: cookieValues.username.trim() || undefined,
				secUid: cookieValues.secUid.trim() || undefined,
				cookieValues,
				accountId: editingId || undefined,
			},
			{
				onSuccess: (result) => {
					setCookieValues(result.cookieValues);
					setUser(result.user);
					setEditingId(result.accountId);
					emitConnected(result.user, "tiktok", "cookie", result.accountId);
					statusAlert.success(
						"Akun terhubung",
						`Berhasil connect @${result.user.uniqueId}.`,
					);
					onOpenChange(false);
				},
				onError: (err) => {
					statusAlert.error(
						"Verifikasi gagal",
						err instanceof Error ? err.message : "Gagal verifikasi",
					);
				},
			},
		);
	};

	const onVerifyInstagram = () => {
		verifyInstagramSession.mutate(
			{
				cookies: igCookies,
				username: igCookieValues.username.trim() || undefined,
				cookieValues: igCookieValues,
				accountId: editingId || undefined,
			},
			{
				onSuccess: (result) => {
					setIgCookieValues(result.cookieValues);
					setUser(result.user);
					setEditingId(result.accountId);
					emitConnected(
						result.user,
						"instagram",
						"cookie",
						result.accountId,
					);
					statusAlert.success(
						"Instagram terhubung",
						`Berhasil connect @${result.user.uniqueId}.`,
					);
					onOpenChange(false);
				},
				onError: (err) => {
					statusAlert.error(
						"Verifikasi gagal",
						err instanceof Error ? err.message : "Gagal verifikasi Instagram",
					);
				},
			},
		);
	};

	const onClearSession = () => {
		if (!editingId) {
			setCookieValues(EMPTY_COOKIE_VALUES);
			setIgCookieValues(EMPTY_INSTAGRAM_COOKIE_VALUES);
			setUser(null);
			statusAlert.info("Form dikosongkan", "Isi cookie lalu verifikasi.");
			return;
		}
		removeAccount.mutate(
			{ id: editingId, recordMetrics: true },
			{
				onSuccess: () => {
					setCookieValues(EMPTY_COOKIE_VALUES);
					setIgCookieValues(EMPTY_INSTAGRAM_COOKIE_VALUES);
					setUser(null);
					setEditingId(null);
					statusAlert.info(
						"Akun dihapus",
						"Cookie & profil akun sudah dibersihkan.",
					);
					onOpenChange(false);
				},
			},
		);
	};

	const booting = open && !hydrated;
	const canSwitchPlatform = !editingId;

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={onOpenChange}
				title={editingId ? "Edit Account" : "Connect Account"}
				description={
					editingId
						? "Perbarui cookie akun yang dipilih. TikTok & Instagram tersimpan terpisah."
						: "Tambah akun baru. Cookie TikTok dan Instagram tidak saling menimpa."
				}
			>
				{canSwitchPlatform ? (
					<TabsNavigation
						className="mb-4"
						items={PLATFORM_TABS}
						value={platform}
						onValueChange={setPlatform}
					/>
				) : (
					<p className="mb-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">
						{platform === "instagram" ? "Instagram" : "TikTok"} · ID{" "}
						{editingId}
					</p>
				)}

				{booting ? (
					<p className="text-sm text-slate-400">Memulihkan form…</p>
				) : platform === "instagram" ? (
					<InstagramCookieForm
						variant="plain"
						values={igCookieValues}
						onChange={setIgCookieValues}
						onVerify={onVerifyInstagram}
						onClearSession={onClearSession}
						busy={busy}
						user={user}
						error={null}
						verifyLabel={editingId ? "Verifikasi & Update" : "Verifikasi & Connect"}
					/>
				) : (
					<TikTokCookieForm
						variant="plain"
						values={cookieValues}
						onChange={setCookieValues}
						onVerify={onVerifyTikTok}
						onClearSession={onClearSession}
						busy={busy}
						user={user}
						error={null}
						verifyLabel={editingId ? "Verifikasi & Update" : "Verifikasi & Connect"}
					/>
				)}
			</Dialog>
			{statusAlert.dialog}
		</>
	);
}
