import { Cookie, Globe } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserScriptPanel } from "#/components/BrowserScriptPanel";
import {
	buildCookieHeader,
	EMPTY_COOKIE_VALUES,
	TikTokCookieForm,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { TabsNavigation } from "#/components/ui/tabs-navigation";
import {
	clearCookieSession,
	loadCookieSession,
	saveCookieSession,
} from "#/lib/session-store";
import { verifySessionFn } from "#/server/tiktok.functions";
import type { TikTokUser } from "#/types/tiktok";

type ConnectMode = "cookie" | "browser";
type SpeedMode = "fast" | "normal" | "safe";

const CONNECT_TABS = [
	{ id: "cookie" as const, label: "Cookie", icon: Cookie },
	{ id: "browser" as const, label: "Script Browser", icon: Globe },
];

export type AccountsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConnected?: (user: TikTokUser | null) => void;
};

export function AccountsDialog({
	open,
	onOpenChange,
	onConnected,
}: AccountsDialogProps) {
	const [mode, setMode] = useState<ConnectMode>("cookie");
	const [cookieValues, setCookieValues] =
		useState<TikTokCookieValues>(EMPTY_COOKIE_VALUES);
	const [user, setUser] = useState<TikTokUser | null>(null);
	const [busy, setBusy] = useState<"idle" | "verify" | "load" | "remove">(
		"idle",
	);
	const [error, setError] = useState<string | null>(null);
	const [speed, setSpeed] = useState<SpeedMode>("safe");
	const [booting, setBooting] = useState(true);
	const hydratedRef = useRef(false);

	const cookies = useMemo(
		() => buildCookieHeader(cookieValues),
		[cookieValues],
	);

	useEffect(() => {
		if (!open) return;
		const stored = loadCookieSession();
		if (stored) {
			setCookieValues(stored.cookies);
			setUser(stored.user);
		}
		hydratedRef.current = true;
		setBooting(false);
	}, [open]);

	useEffect(() => {
		if (!hydratedRef.current) return;
		saveCookieSession(cookieValues, user);
	}, [cookieValues, user]);

	const onVerify = async () => {
		setError(null);
		setBusy("verify");
		try {
			const result = await verifySessionFn({
				data: {
					cookies,
					uniqueId: cookieValues.username.trim() || undefined,
					secUid: cookieValues.secUid.trim() || undefined,
				},
			});
			if (!result?.ok) {
				setError(
					result && "error" in result
						? result.error
						: "Verifikasi gagal (server error). Coba refresh halaman.",
				);
				return;
			}

			const nextCookies: TikTokCookieValues = {
				...cookieValues,
				username: result.user.uniqueId,
				secUid: result.user.secUid,
			};
			setCookieValues(nextCookies);
			setUser(result.user);
			saveCookieSession(nextCookies, result.user);
			onConnected?.(result.user);
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal verifikasi");
		} finally {
			setBusy("idle");
		}
	};

	const onClearSession = () => {
		clearCookieSession();
		setCookieValues(EMPTY_COOKIE_VALUES);
		setUser(null);
		setError(null);
		onConnected?.(null);
	};

	const onSaveBrowserProfile = () => {
		const username = cookieValues.username.trim().replace(/^@/, "");
		if (!username) {
			setError("Isi username dulu.");
			return;
		}
		const next: TikTokCookieValues = {
			...cookieValues,
			username,
		};
		const nextUser: TikTokUser = {
			uniqueId: username,
			secUid: cookieValues.secUid.trim(),
			nickname: username,
		};
		setCookieValues(next);
		setUser(nextUser);
		saveCookieSession(next, nextUser);
		setError(null);
		onConnected?.(nextUser);
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Connect TikTok Account"
			description="Hubungkan akun lewat cookie atau simpan profil untuk Script Browser."
		>
			<TabsNavigation
				className="mb-5"
				items={CONNECT_TABS}
				value={mode}
				onValueChange={setMode}
			/>

			{booting ? (
				<p className="text-sm text-slate-400">Memulihkan session…</p>
			) : mode === "cookie" ? (
				<TikTokCookieForm
					variant="plain"
					values={cookieValues}
					onChange={setCookieValues}
					onVerify={onVerify}
					onClearSession={onClearSession}
					busy={busy}
					user={user}
					error={error}
				/>
			) : (
				<div className="space-y-4">
					<BrowserScriptPanel
						variant="plain"
						username={cookieValues.username}
						secUid={cookieValues.secUid}
						onUsernameChange={(username) =>
							setCookieValues((prev) => ({ ...prev, username }))
						}
						onSecUidChange={(secUid) =>
							setCookieValues((prev) => ({ ...prev, secUid }))
						}
						speed={speed}
						onSpeedChange={setSpeed}
					/>
					{error ? (
						<p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</p>
					) : null}
					<Button onClick={onSaveBrowserProfile} size="lg">
						Simpan Profil & Tutup
					</Button>
				</div>
			)}
		</Dialog>
	);
}
