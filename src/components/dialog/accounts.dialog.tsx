import { Cookie, Globe, Instagram, Music2 } from "lucide-react";
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
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { TabsNavigation } from "#/components/ui/tabs-navigation";
import {
	type AccountBridge,
	type AccountPlatform,
	clearCookieSession,
	loadCookieSession,
	saveCookieSession,
} from "#/lib/session-store";
import { verifySessionFn } from "#/server/tiktok.functions";
import type { TikTokUser } from "#/types/tiktok";

type ConnectMode = "cookie" | "browser";
type SpeedMode = "fast" | "normal" | "safe";

const PLATFORM_TABS = [
	{ id: "tiktok" as const, label: "TikTok", icon: Music2 },
	{ id: "instagram" as const, label: "Instagram", icon: Instagram },
];

const CONNECT_TABS = [
	{ id: "cookie" as const, label: "Cookie", icon: Cookie },
	{ id: "browser" as const, label: "Script Browser", icon: Globe },
];

export type AccountsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConnected?: (payload: {
		user: TikTokUser | null;
		platform: AccountPlatform;
		bridge: AccountBridge;
	}) => void;
};

export function AccountsDialog({
	open,
	onOpenChange,
	onConnected,
}: AccountsDialogProps) {
	const [platform, setPlatform] = useState<AccountPlatform>("tiktok");
	const [mode, setMode] = useState<ConnectMode>("cookie");
	const [cookieValues, setCookieValues] =
		useState<TikTokCookieValues>(EMPTY_COOKIE_VALUES);
	const [igUsername, setIgUsername] = useState("");
	const [igCookie, setIgCookie] = useState("");
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
			setPlatform(stored.platform);
			setMode(stored.bridge === "browser" ? "browser" : "cookie");
			if (stored.platform === "instagram") {
				setIgUsername(stored.user?.uniqueId || stored.cookies.username || "");
				setIgCookie(stored.cookies.sessionid || "");
			}
		}
		hydratedRef.current = true;
		setBooting(false);
	}, [open]);

	useEffect(() => {
		if (!hydratedRef.current) return;
		if (platform !== "tiktok") return;
		saveCookieSession(cookieValues, user, {
			platform: "tiktok",
			bridge: mode === "browser" ? "browser" : "cookie",
		});
	}, [cookieValues, user, platform, mode]);

	const emitConnected = (
		nextUser: TikTokUser | null,
		nextPlatform: AccountPlatform,
		nextBridge: AccountBridge,
	) => {
		onConnected?.({
			user: nextUser,
			platform: nextPlatform,
			bridge: nextBridge,
		});
	};

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
			saveCookieSession(nextCookies, result.user, {
				platform: "tiktok",
				bridge: "cookie",
			});
			emitConnected(result.user, "tiktok", "cookie");
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
		setIgUsername("");
		setIgCookie("");
		setError(null);
		emitConnected(null, platform, mode === "browser" ? "browser" : "cookie");
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
			avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`,
		};
		setCookieValues(next);
		setUser(nextUser);
		saveCookieSession(next, nextUser, {
			platform: "tiktok",
			bridge: "browser",
		});
		setError(null);
		emitConnected(nextUser, "tiktok", "browser");
		onOpenChange(false);
	};

	const onSaveInstagram = () => {
		const username = igUsername.trim().replace(/^@/, "");
		if (!username) {
			setError("Isi username Instagram dulu.");
			return;
		}
		if (!igCookie.trim()) {
			setError("Tempel cookie Instagram (minimal sessionid).");
			return;
		}
		const nextCookies: TikTokCookieValues = {
			...EMPTY_COOKIE_VALUES,
			username,
			sessionid: igCookie.trim(),
		};
		const nextUser: TikTokUser = {
			uniqueId: username,
			secUid: "",
			nickname: username,
			avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
		};
		setCookieValues(nextCookies);
		setUser(nextUser);
		saveCookieSession(nextCookies, nextUser, {
			platform: "instagram",
			bridge: "cookie",
		});
		setError(null);
		emitConnected(nextUser, "instagram", "cookie");
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Connect Account"
			description="Pilih platform, lalu hubungkan lewat cookie TikTok / Instagram atau Script Browser."
		>
			<TabsNavigation
				className="mb-4"
				items={PLATFORM_TABS}
				value={platform}
				onValueChange={(next) => {
					setPlatform(next);
					setError(null);
					if (next === "instagram") setMode("cookie");
				}}
			/>

			{platform === "tiktok" ? (
				<TabsNavigation
					className="mb-5"
					items={CONNECT_TABS}
					value={mode}
					onValueChange={setMode}
				/>
			) : null}

			{booting ? (
				<p className="text-sm text-slate-400">Memulihkan session…</p>
			) : platform === "instagram" ? (
				<div className="space-y-4">
					<p className="m-0 rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-sm text-pink-900">
						Bridge Cookie Instagram — simpan session untuk akun IG. Tools hapus
						masih fokus TikTok.
					</p>
					<Field>
						<FieldLabel htmlFor="ig-username" required>
							Username Instagram
						</FieldLabel>
						<input
							id="ig-username"
							value={igUsername}
							onChange={(e) => setIgUsername(e.target.value)}
							placeholder="username"
							className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-600"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="ig-cookie" required>
							Cookie Instagram
						</FieldLabel>
						<textarea
							id="ig-cookie"
							value={igCookie}
							onChange={(e) => setIgCookie(e.target.value)}
							placeholder="sessionid=…; ds_user_id=…; csrftoken=…"
							rows={4}
							className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-600"
						/>
					</Field>
					{error ? <FieldError>{error}</FieldError> : null}
					<div className="flex flex-wrap gap-2">
						<Button onClick={onSaveInstagram} size="lg">
							Simpan Cookie Instagram
						</Button>
						{user ? (
							<Button variant="outline" onClick={onClearSession}>
								Hapus Session
							</Button>
						) : null}
					</div>
				</div>
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
