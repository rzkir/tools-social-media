import { Cookie, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	useExtensionInstalled,
	useFetchTikTokCookies,
} from "#/hooks/use-extension";
import { hasExtensionMarker } from "#/lib/extension-bridge";
import {
	downloadExtensionZip,
	EXTENSION_INSTALL_HINT,
} from "#/lib/extension-install";
import type { TikTokUser } from "#/types/tiktok";

export type TikTokCookieValues = {
	sessionid: string;
	tt_csrf_token: string;
	msToken: string;
	ttwid: string;
	s_v_web_id: string;
	username: string;
	secUid: string;
	/** Not a cookie — avatar hint from extension autofill */
	avatarUrl?: string;
};

export const EMPTY_COOKIE_VALUES: TikTokCookieValues = {
	sessionid: "",
	tt_csrf_token: "",
	msToken: "",
	ttwid: "",
	s_v_web_id: "",
	username: "",
	secUid: "",
	avatarUrl: "",
};

/** Decode values that were copied URL-encoded from DevTools (e.g. ttwid with %7C). */
function decodeCookieValue(raw: string): string {
	const value = raw.trim();
	if (!value || !/%[0-9A-Fa-f]{2}/.test(value)) return value;
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/** Build Cookie header from separate fields (values only, without key=). */
export function buildCookieHeader(values: TikTokCookieValues): string {
	const pairs: Array<
		[Exclude<keyof TikTokCookieValues, "username" | "secUid" | "avatarUrl">, string]
	> = [
		["sessionid", values.sessionid],
		["tt_csrf_token", values.tt_csrf_token],
		["msToken", values.msToken],
		["ttwid", values.ttwid],
		["s_v_web_id", values.s_v_web_id],
	];

	return pairs
		.map(([key, raw]) => {
			let value = decodeCookieValue(raw);
			if (!value) return null;
			if (
				value.includes("=") &&
				value.toLowerCase().startsWith(key.toLowerCase())
			) {
				const eq = value.indexOf("=");
				value = decodeCookieValue(value.slice(eq + 1));
				return `${key}=${value}`;
			}
			return `${key}=${value}`;
		})
		.filter(Boolean)
		.join("; ");
}

type TikTokCookieFormProps = {
	values: TikTokCookieValues;
	onChange: (values: TikTokCookieValues) => void;
	onVerify: () => void;
	onClearSession?: () => void;
	busy: "idle" | "verify" | "load" | "remove";
	user: TikTokUser | null;
	error: string | null;
	variant?: "card" | "plain";
	verifyLabel?: string;
};

const COOKIE_FIELDS: Array<{
	key: Exclude<keyof TikTokCookieValues, "username" | "secUid" | "avatarUrl">;
	label: string;
	required?: boolean;
	description: string;
	placeholder: string;
}> = [
	{
		key: "sessionid",
		label: "sessionid",
		required: true,
		description: "Wajib. Cookies → tiktok.com → sessionid → Value.",
		placeholder: "Tempel nilai sessionid saja",
	},
	{
		key: "msToken",
		label: "msToken",
		required: true,
		description:
			"Wajib & harus FRESH. Kalau respons kosong, ambil ulang dari DevTools.",
		placeholder: "Tempel nilai msToken terbaru",
	},
	{
		key: "ttwid",
		label: "ttwid",
		description: "Disarankan. Cookie perangkat/web ID.",
		placeholder: "Tempel ttwid",
	},
	{
		key: "s_v_web_id",
		label: "s_v_web_id",
		description: "Disarankan (verifyFp). Bantu lolos anti-bot.",
		placeholder: "verify_xxxxx...",
	},
	{
		key: "tt_csrf_token",
		label: "tt_csrf_token",
		description: "Disarankan untuk request hapus repost.",
		placeholder: "Opsional, tapi disarankan",
	},
];

export function TikTokCookieForm({
	values,
	onChange,
	onVerify,
	onClearSession,
	busy,
	user,
	error,
	variant = "card",
	verifyLabel = "Verifikasi & Connect",
}: TikTokCookieFormProps) {
	const [autofillHint, setAutofillHint] = useState<string | null>(null);
	const fetchCookies = useFetchTikTokCookies();
	const { refetch: refetchExt } = useExtensionInstalled();
	const autofilling = fetchCookies.isPending;
	const disabled = busy === "remove" || autofilling;
	const canVerify =
		Boolean(values.sessionid.trim()) &&
		Boolean(values.msToken.trim()) &&
		busy === "idle" &&
		!autofilling;
	const hasAnyValue =
		Boolean(values.sessionid.trim()) ||
		Boolean(values.msToken.trim()) ||
		Boolean(values.username.trim()) ||
		Boolean(user);

	const handle = values.username.trim().replace(/^@/, "");
	const tiktokUrl = handle
		? `https://www.tiktok.com/@${handle}`
		: "https://www.tiktok.com";

	const setField = <K extends keyof TikTokCookieValues>(
		key: K,
		value: TikTokCookieValues[K],
	) => {
		onChange({ ...values, [key]: value });
	};

	const onAutofill = () => {
		setAutofillHint(null);
		void (async () => {
			const marker = hasExtensionMarker();
			const { data: pinged } = marker ? { data: true } : await refetchExt();
			if (!marker && !pinged) {
				setAutofillHint(
					"Ekstensi belum terdeteksi. Klik Pasang Ekstensi, lalu hard refresh (Ctrl+Shift+R).",
				);
				return;
			}

			fetchCookies.mutate(
				{ uniqueId: values.username.trim() || undefined },
				{
					onSuccess: (result) => {
						if (!result.ok || !result.values) {
							setAutofillHint(
								result.error ||
									"Gagal mengambil cookie. Login di tiktok.com dulu, lalu coba lagi.",
							);
							return;
						}

						const next: TikTokCookieValues = {
							...values,
							sessionid: result.values.sessionid || values.sessionid,
							tt_csrf_token:
								result.values.tt_csrf_token || values.tt_csrf_token,
							msToken: result.values.msToken || values.msToken,
							ttwid: result.values.ttwid || values.ttwid,
							s_v_web_id: result.values.s_v_web_id || values.s_v_web_id,
							username: result.values.username || values.username,
							secUid: result.values.secUid || values.secUid,
							avatarUrl: result.values.avatarUrl || values.avatarUrl || "",
						};
						onChange(next);

						if (result.warning) {
							setAutofillHint(result.warning);
						} else if (!next.secUid.trim()) {
							setAutofillHint(
								"Cookie terisi. Buka profil TikTok kamu (tiktok.com/@username) di tab lain, lalu Ambil lagi agar secUid ikut terisi.",
							);
						} else {
							setAutofillHint(
								"Cookie + username + secUid berhasil diambil dari viewport TikTok. Klik Verifikasi & Connect.",
							);
						}
					},
					onError: (err) => {
						setAutofillHint(
							err instanceof Error
								? err.message
								: "Gagal mengambil cookie dari ekstensi.",
						);
					},
				},
			);
		})();
	};

	const onInstallExtension = () => {
		downloadExtensionZip();
		setAutofillHint(EXTENSION_INSTALL_HINT);
	};

	const body = (
		<>
			{variant === "card" ? (
				<div className="mb-4">
					<p className="mb-1 text-xs font-bold tracking-widest text-indigo-600 uppercase">
						Autentikasi
					</p>
					<h2 className="m-0 text-xl font-semibold text-slate-900">
						Cookie TikTok
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Klik{" "}
						<strong className="font-medium text-slate-600">
							Pasang Ekstensi
						</strong>{" "}
						(sekali),{" "}
						<strong className="font-medium text-slate-600">Buka TikTok</strong>{" "}
						untuk login, lalu{" "}
						<strong className="font-medium text-slate-600">
							Ambil dari Browser
						</strong>
						. Minimal <code className="text-indigo-600">username</code> +{" "}
						<code className="text-indigo-600">sessionid</code> +{" "}
						<code className="text-indigo-600">msToken</code>.
					</p>
				</div>
			) : (
				<p className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
					<strong>1.</strong> Klik <strong>Buka TikTok</strong> → login di tab
					itu. <strong>2.</strong> Kembali ke sini → isi username jika perlu →{" "}
					<strong>Ambil dari Browser</strong>. Cookie +{" "}
					<code className="text-indigo-700">secUid</code> diambil dari viewport
					tab itu.
				</p>
			)}

			<FieldGroup>
				<div className="flex flex-wrap items-center gap-2 pb-1">
					<a
						href={tiktokUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white no-underline hover:bg-slate-800"
					>
						<ExternalLink className="h-4 w-4" />
						{handle ? `Buka @${handle}` : "Buka TikTok"}
					</a>
					<Button
						type="button"
						variant="secondary"
						onClick={onInstallExtension}
						size="lg"
					>
						<Download className="h-4 w-4" />
						Pasang Ekstensi
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onAutofill}
						disabled={disabled || busy !== "idle"}
						size="lg"
					>
						<Cookie className="h-4 w-4" />
						{autofilling ? "Mengambil cookie…" : "Ambil dari Browser"}
					</Button>
					{autofillHint ? (
						<p
							className={`m-0 text-sm ${
								autofillHint.includes("berhasil diambil")
									? "text-emerald-700"
									: "text-amber-800"
							}`}
						>
							{autofillHint}
						</p>
					) : null}
				</div>

				<Field>
					<FieldLabel htmlFor="cookie-username">username</FieldLabel>
					<Input
						id="cookie-username"
						name="username"
						autoComplete="off"
						spellCheck={false}
						value={values.username}
						onChange={(e) => setField("username", e.target.value)}
						placeholder="tanpa @ — contoh: johndoe"
						disabled={disabled}
						className="font-sans"
					/>
					<FieldDescription>
						Disarankan. Auto-fill mengisi dari tab tiktok.com / homepage. Kalau
						kosong, Verifikasi tetap bisa deteksi dari cookie.
					</FieldDescription>
				</Field>

				<Field>
					<FieldLabel htmlFor="cookie-secUid">secUid (opsional)</FieldLabel>
					<Input
						id="cookie-secUid"
						name="secUid"
						autoComplete="off"
						spellCheck={false}
						value={values.secUid}
						onChange={(e) => setField("secUid", e.target.value)}
						placeholder="MS4wLjABAAAA..."
						disabled={disabled}
					/>
					<FieldDescription>
						Opsional. Kalau HTML/API kena limit, isi manual dari page source.
						Lebih baik kosongkan dulu — app ambil sendiri dari profil.
					</FieldDescription>
				</Field>

				{COOKIE_FIELDS.map((field) => (
					<Field key={field.key}>
						<FieldLabel
							htmlFor={`cookie-${field.key}`}
							required={field.required}
						>
							{field.label}
						</FieldLabel>
						<Input
							id={`cookie-${field.key}`}
							name={field.key}
							autoComplete="off"
							spellCheck={false}
							value={values[field.key]}
							onChange={(e) => setField(field.key, e.target.value)}
							placeholder={field.placeholder}
							disabled={disabled}
						/>
						<FieldDescription>{field.description}</FieldDescription>
					</Field>
				))}

				<Field orientation="horizontal" className="flex-wrap pt-1">
					<Button onClick={onVerify} disabled={!canVerify} size="lg">
						{busy === "verify"
							? "Memverifikasi…"
							: busy === "load"
								? "Memuat…"
								: verifyLabel}
					</Button>

					{onClearSession && hasAnyValue ? (
						<Button
							variant="outline"
							onClick={onClearSession}
							disabled={busy !== "idle" || autofilling}
						>
							Hapus Session
						</Button>
					) : null}

					{user && (
						<div className="flex items-center gap-2 text-sm text-slate-800">
							{user.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt=""
									referrerPolicy="no-referrer"
									className="h-8 w-8 rounded-full object-cover"
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							) : null}
							<span>
								@{user.uniqueId}
								{user.nickname !== user.uniqueId ? ` · ${user.nickname}` : ""}
							</span>
						</div>
					)}
				</Field>

				<FieldError>{error}</FieldError>
			</FieldGroup>
		</>
	);

	if (variant === "plain") {
		return <div>{body}</div>;
	}

	return (
		<section className="mt-6 rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
			{body}
		</section>
	);
}
