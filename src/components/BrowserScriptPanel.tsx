import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { buildTikTokBrowserScript } from "#/lib/browser-script";

type SpeedMode = "fast" | "normal" | "safe";

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
	fast: 800,
	normal: 1500,
	safe: 3000,
};

type BrowserScriptPanelProps = {
	username: string;
	secUid: string;
	onUsernameChange: (value: string) => void;
	onSecUidChange: (value: string) => void;
	speed: SpeedMode;
	onSpeedChange: (value: SpeedMode) => void;
	variant?: "card" | "plain";
};

export function BrowserScriptPanel({
	username,
	secUid,
	onUsernameChange,
	onSecUidChange,
	speed,
	onSpeedChange,
	variant = "card",
}: BrowserScriptPanelProps) {
	const [copied, setCopied] = useState(false);

	const script = useMemo(
		() =>
			buildTikTokBrowserScript({
				uniqueId: username,
				secUid,
				delayMs: SPEED_DELAY_MS[speed],
			}),
		[username, secUid, speed],
	);

	const onCopy = async () => {
		await navigator.clipboard.writeText(script);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	const profileUrl = username.trim()
		? `https://www.tiktok.com/@${username.trim().replace(/^@/, "")}`
		: "https://www.tiktok.com";

	const body = (
		<>
			{variant === "card" ? (
				<div className="mb-4">
					<p className="mb-1 text-xs font-bold tracking-widest text-indigo-600 uppercase">
						Mode andal
					</p>
					<h2 className="m-0 text-xl font-semibold text-slate-900">
						Script Browser (disarankan)
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Request dari server sering ditolak TikTok (respons kosong). Script
						ini jalan di tab tiktok.com — sama seperti extension — jadi cookie
						&amp; anti-bot browser dipakai otomatis.
					</p>
				</div>
			) : (
				<p className="mb-4 text-sm text-slate-400">
					Simpan username di session, lalu salin script untuk hapus repost di
					Console TikTok.
				</p>
			)}

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="browser-username" required>
						username
					</FieldLabel>
					<Input
						id="browser-username"
						value={username}
						onChange={(e) => onUsernameChange(e.target.value)}
						placeholder="tanpa @ — contoh: rzkir.20"
						className="font-sans"
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="browser-secuid">secUid (opsional)</FieldLabel>
					<Input
						id="browser-secuid"
						value={secUid}
						onChange={(e) => onSecUidChange(e.target.value)}
						placeholder="MS4wLjABAAAA… — kosongkan jika script cari sendiri"
					/>
					<FieldDescription>
						Kalau kosong, script membaca secUid dari halaman profil.
					</FieldDescription>
				</Field>

				<Field orientation="horizontal" className="items-center gap-2">
					<FieldLabel htmlFor="browser-speed" className="text-xs">
						Kecepatan
					</FieldLabel>
					<select
						id="browser-speed"
						value={speed}
						onChange={(e) => onSpeedChange(e.target.value as SpeedMode)}
						className="rounded-xl border-0 bg-white px-2 py-1.5 text-sm text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-600"
					>
						<option value="fast">Cepat (~0.8s)</option>
						<option value="normal">Normal (~1.5s)</option>
						<option value="safe">Aman (~3s)</option>
					</select>
				</Field>

				<ol className="m-0 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
					<li>
						Buka profilmu:{" "}
						<a
							href={profileUrl}
							target="_blank"
							rel="noreferrer"
							className="font-semibold text-indigo-600"
						>
							{profileUrl}
						</a>{" "}
						(harus login).
					</li>
					<li>
						Tekan F12 → tab <strong className="text-slate-700">Console</strong>.
					</li>
					<li>
						Klik <strong className="text-slate-700">Salin Script</strong> di
						bawah, paste di Console, Enter.
					</li>
					<li>Panel hitam muncul di pojok kanan — tunggu sampai selesai.</li>
				</ol>

				<Field orientation="horizontal" className="flex-wrap pt-1">
					<Button onClick={onCopy} size="lg">
						{copied ? "Tersalin!" : "Salin Script"}
					</Button>
					<a
						href={profileUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-100"
					>
						Buka TikTok
					</a>
				</Field>

				<pre className="m-0 max-h-40 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[10px] leading-4 text-slate-400">
					{script.slice(0, 500)}…
				</pre>
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
