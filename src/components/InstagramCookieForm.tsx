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
	useFetchInstagramCookies,
} from "#/hooks/use-extension";
import { hasExtensionMarker } from "#/lib/extension-bridge";
import {
	downloadExtensionZip,
	EXTENSION_INSTALL_HINT,
} from "#/lib/extension-install";
import type { TikTokUser } from "#/types/tiktok";

export type InstagramCookieValues = {
	sessionid: string;
	ds_user_id: string;
	csrftoken: string;
	mid: string;
	ig_did: string;
	datr: string;
	username: string;
	avatarUrl?: string;
};

export const EMPTY_INSTAGRAM_COOKIE_VALUES: InstagramCookieValues = {
	sessionid: "",
	ds_user_id: "",
	csrftoken: "",
	mid: "",
	ig_did: "",
	datr: "",
	username: "",
	avatarUrl: "",
};

/** Build Cookie header from separate fields (values only, without key=). */
export function buildInstagramCookieHeader(
	values: InstagramCookieValues,
): string {
	const pairs: Array<
		[Exclude<keyof InstagramCookieValues, "username" | "avatarUrl">, string]
	> = [
		["sessionid", values.sessionid],
		["ds_user_id", values.ds_user_id],
		["csrftoken", values.csrftoken],
		["mid", values.mid],
		["ig_did", values.ig_did],
		["datr", values.datr],
	];

	return pairs
		.map(([key, raw]) => {
			const value = raw.trim();
			if (!value) return null;
			let normalized = value;
			if (
				value.includes("=") &&
				value.toLowerCase().startsWith(key.toLowerCase())
			) {
				const eq = value.indexOf("=");
				normalized = value.slice(eq + 1).trim();
			}
			try {
				if (/%[0-9A-Fa-f]{2}/.test(normalized)) {
					normalized = decodeURIComponent(normalized);
				}
			} catch {
				// keep original
			}
			return `${key}=${normalized}`;
		})
		.filter(Boolean)
		.join("; ");
}

type InstagramCookieFormProps = {
	values: InstagramCookieValues;
	onChange: (values: InstagramCookieValues) => void;
	onVerify: () => void;
	onClearSession?: () => void;
	busy: "idle" | "verify" | "load" | "remove";
	user: TikTokUser | null;
	error: string | null;
	variant?: "card" | "plain";
	verifyLabel?: string;
};

const COOKIE_FIELDS: Array<{
	key: Exclude<keyof InstagramCookieValues, "username" | "avatarUrl">;
	label: string;
	required?: boolean;
	description: string;
	placeholder: string;
}> = [
	{
		key: "sessionid",
		label: "sessionid",
		required: true,
		description: "Wajib. Cookies → instagram.com → sessionid → Value.",
		placeholder: "Tempel nilai sessionid saja",
	},
	{
		key: "ds_user_id",
		label: "ds_user_id",
		required: true,
		description: "Wajib. ID numerik akun Instagram kamu.",
		placeholder: "Tempel nilai ds_user_id",
	},
	{
		key: "csrftoken",
		label: "csrftoken",
		required: true,
		description: "Wajib untuk request API Instagram.",
		placeholder: "Tempel nilai csrftoken",
	},
	{
		key: "mid",
		label: "mid",
		description: "Disarankan. Ikut saat export cookie lengkap.",
		placeholder: "Tempel nilai mid (opsional)",
	},
	{
		key: "ig_did",
		label: "ig_did",
		description: "Disarankan untuk stabilitas session.",
		placeholder: "Tempel nilai ig_did (opsional)",
	},
	{
		key: "datr",
		label: "datr",
		description: "Opsional — biasanya ikut di export cookie.",
		placeholder: "Tempel nilai datr (opsional)",
	},
];

export function InstagramCookieForm({
	values,
	onChange,
	onVerify,
	onClearSession,
	busy,
	user,
	error,
	variant = "card",
	verifyLabel = "Verifikasi & Connect",
}: InstagramCookieFormProps) {
	const [autofillHint, setAutofillHint] = useState<string | null>(null);
	const { data: extInstalled = false } = useExtensionInstalled();
	const { refetch: refetchExt } = useExtensionInstalled();
	const fetchCookies = useFetchInstagramCookies();

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
				{ username: values.username.trim() || undefined },
				{
					onSuccess: (result) => {
						if (!result.ok || !result.values) {
							setAutofillHint(
								result.error ||
									"Gagal mengambil cookie. Login di instagram.com dulu, lalu coba lagi.",
							);
							return;
						}

						const next: InstagramCookieValues = {
							...values,
							sessionid: result.values.sessionid || values.sessionid,
							ds_user_id: result.values.ds_user_id || values.ds_user_id,
							csrftoken: result.values.csrftoken || values.csrftoken,
							mid: result.values.mid || values.mid,
							ig_did: result.values.ig_did || values.ig_did,
							datr: result.values.datr || values.datr,
							username: result.values.username || values.username,
							avatarUrl: result.values.avatarUrl || values.avatarUrl || "",
						};
						onChange(next);

						if (result.warning) {
							setAutofillHint(result.warning);
						} else if (!next.username.trim()) {
							setAutofillHint(
								"Cookie terisi. Isi username Instagram lalu klik Verifikasi & Connect.",
							);
						} else {
							setAutofillHint(
								"Cookie Instagram berhasil diambil dari browser. Klik Verifikasi & Connect.",
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
					<p className="mb-1 text-xs font-bold tracking-widest text-pink-600 uppercase">
						Autentikasi
					</p>
					<h2 className="m-0 text-xl font-semibold text-slate-900">
						Cookie Instagram
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Login di instagram.com, lalu ambil cookie dari DevTools atau
						ekstensi.
					</p>
				</div>
			) : (
				<p className="mb-4 rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-sm text-pink-900">
					<strong>1.</strong> Klik <strong>Buka Instagram</strong> → login di tab
					itu. <strong>2.</strong> Kembali ke sini → isi username jika perlu →{" "}
					<strong>Ambil dari Browser</strong>. Cookie diambil dari browser yang
					sudah login.
				</p>
			)}

			<FieldGroup>
				<div className="flex flex-wrap items-center gap-2 pb-1">
					<a
						href={
							values.username.trim()
								? `https://www.instagram.com/${values.username.trim().replace(/^@/, "")}/`
								: "https://www.instagram.com"
						}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white no-underline hover:bg-slate-800"
					>
						<ExternalLink className="h-4 w-4" />
						{values.username.trim()
							? `Buka @${values.username.trim().replace(/^@/, "")}`
							: "Buka Instagram"}
					</a>
					{!extInstalled ? (
						<Button
							type="button"
							variant="secondary"
							onClick={onInstallExtension}
							size="lg"
						>
							<Download className="h-4 w-4" />
							Pasang Ekstensi
						</Button>
					) : null}
					<Button
						type="button"
						variant="outline"
						onClick={onAutofill}
						disabled={busy !== "idle" || fetchCookies.isPending}
						size="lg"
					>
						<Cookie className="h-4 w-4" />
						{fetchCookies.isPending
							? "Mengambil cookie…"
							: "Ambil dari Browser"}
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
					<FieldLabel htmlFor="ig-username" required>
						Username Instagram
					</FieldLabel>
					<Input
						id="ig-username"
						value={values.username}
						onChange={(e) =>
							onChange({
								...values,
								username: e.target.value.replace(/^@/, ""),
							})
						}
						placeholder="username"
					/>
				</Field>

				{COOKIE_FIELDS.map((field) => (
					<Field key={field.key}>
						<FieldLabel htmlFor={`ig-${field.key}`} required={field.required}>
							{field.label}
						</FieldLabel>
						<Input
							id={`ig-${field.key}`}
							value={values[field.key]}
							onChange={(e) =>
								onChange({ ...values, [field.key]: e.target.value })
							}
							placeholder={field.placeholder}
						/>
						<FieldDescription>{field.description}</FieldDescription>
					</Field>
				))}

				<Field orientation="horizontal" className="flex-wrap pt-1">
					<Button onClick={onVerify} size="lg" disabled={busy !== "idle"}>
						{busy === "verify" ? "Memverifikasi…" : verifyLabel}
					</Button>
					{onClearSession && user ? (
						<Button
							variant="outline"
							onClick={onClearSession}
							disabled={busy !== "idle"}
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
