import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import type { TikTokUser } from "#/types/tiktok";

export type TikTokCookieValues = {
	sessionid: string;
	tt_csrf_token: string;
	msToken: string;
	ttwid: string;
	s_v_web_id: string;
	username: string;
	secUid: string;
};

export const EMPTY_COOKIE_VALUES: TikTokCookieValues = {
	sessionid: "",
	tt_csrf_token: "",
	msToken: "",
	ttwid: "",
	s_v_web_id: "",
	username: "",
	secUid: "",
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
		[Exclude<keyof TikTokCookieValues, "username" | "secUid">, string]
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
	key: Exclude<keyof TikTokCookieValues, "username" | "secUid">;
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
	const disabled = busy === "remove";
	const canVerify =
		Boolean(values.sessionid.trim()) &&
		Boolean(values.msToken.trim()) &&
		Boolean(values.username.trim() || values.secUid.trim()) &&
		busy === "idle";
	const hasAnyValue =
		Boolean(values.sessionid.trim()) ||
		Boolean(values.msToken.trim()) ||
		Boolean(values.username.trim()) ||
		Boolean(user);

	const setField = <K extends keyof TikTokCookieValues>(
		key: K,
		value: TikTokCookieValues[K],
	) => {
		onChange({ ...values, [key]: value });
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
						Isi per-field. Minimal{" "}
						<code className="text-indigo-600">username</code> +{" "}
						<code className="text-indigo-600">sessionid</code> +{" "}
						<code className="text-indigo-600">msToken</code>. Disimpan di
						sessionStorage sampai tab ditutup. Jangan spam verifikasi.
					</p>
				</div>
			) : null}

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="cookie-username" required>
						username
					</FieldLabel>
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
						Wajib saat kena rate-limit. Verifikasi lewat halaman profil, bukan
						API /user/detail.
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
									className="h-8 w-8 rounded-full object-cover"
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
		<section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
			{body}
		</section>
	);
}
