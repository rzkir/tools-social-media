import { Cookie, Globe, Instagram, Music2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserScriptPanel } from "#/components/BrowserScriptPanel";
import { useAlertStatus } from "#/components/dialog/alert-status.dialog";
import {
	buildCookieHeader,
	EMPTY_COOKIE_VALUES,
	TikTokCookieForm,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { Field, FieldLabel } from "#/components/ui/field";
import { TabsNavigation } from "#/components/ui/tabs-navigation";
import {
	type AccountBridge,
	type AccountPlatform,
	clearCookieSession,
	loadCookieSession,
	saveCookieSession,
} from "#/lib/session-store";
import { verifySessionFn } from "#/server/tiktok.functions";
import {
	recordConnectResult,
	recordSessionCleared,
} from "#/services/storage.services";
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
	const [speed, setSpeed] = useState<SpeedMode>("safe");
	const [booting, setBooting] = useState(true);
	const hydratedRef = useRef(false);
	const statusAlert = useAlertStatus();

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
				const message =
					result && "error" in result
						? result.error
						: "Server error. Coba refresh halaman.";
				recordConnectResult({ ok: false, platform: "tiktok", error: message });
				statusAlert.error("Verifikasi gagal", message);
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
			recordConnectResult({
				ok: true,
				platform: "tiktok",
				username: result.user.uniqueId,
			});
			statusAlert.success(
				"Akun terhubung",
				`Berhasil connect @${result.user.uniqueId}.`,
			);
			onOpenChange(false);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Gagal verifikasi";
			recordConnectResult({ ok: false, platform: "tiktok", error: message });
			statusAlert.error("Verifikasi gagal", message);
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
		emitConnected(null, platform, mode === "browser" ? "browser" : "cookie");
		recordSessionCleared();
		statusAlert.info(
			"Session dihapus",
			"Cookie & profil akun sudah dibersihkan.",
		);
	};

	const onSaveBrowserProfile = () => {
		const username = cookieValues.username.trim().replace(/^@/, "");
		if (!username) {
			statusAlert.warning("Username wajib", "Isi username TikTok dulu.");
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
		emitConnected(nextUser, "tiktok", "browser");
		recordConnectResult({
			ok: true,
			platform: "tiktok",
			username,
		});
		statusAlert.success(
			"Profil disimpan",
			`Script Browser siap untuk @${username}.`,
		);
		onOpenChange(false);
	};

	const onSaveInstagram = () => {
		const username = igUsername.trim().replace(/^@/, "");
		if (!username) {
			statusAlert.warning("Username wajib", "Isi username Instagram dulu.");
			return;
		}
		if (!igCookie.trim()) {
			statusAlert.warning(
				"Cookie wajib",
				"Tempel cookie Instagram (minimal sessionid).",
			);
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
		emitConnected(nextUser, "instagram", "cookie");
		recordConnectResult({
			ok: true,
			platform: "instagram",
			username,
		});
		statusAlert.success(
			"Instagram tersimpan",
			`Cookie @${username} berhasil disimpan.`,
		);
		onOpenChange(false);
	};

	return (
		<>
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
							Bridge Cookie Instagram — simpan session untuk akun IG. Tools
							hapus masih fokus TikTok.
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
						error={null}
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
						<Button onClick={onSaveBrowserProfile} size="lg">
							Simpan Profil & Tutup
						</Button>
					</div>
				)}
			</Dialog>
			{statusAlert.dialog}
		</>
	);
}
