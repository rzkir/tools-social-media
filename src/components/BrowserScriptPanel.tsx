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
	const [copiedAllow, setCopiedAllow] = useState(false);

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

	const onCopyAllowPasting = async () => {
		await navigator.clipboard.writeText("allow pasting");
		setCopiedAllow(true);
		window.setTimeout(() => setCopiedAllow(false), 2000);
	};

	const handle = username.trim().replace(/^@/, "");
	const profileUrl = handle
		? `https://www.tiktok.com/@${handle}`
		: "https://www.tiktok.com";
	const canCopy = Boolean(handle);

	const body = (
		<>
			<div className="mb-5">
				<p className="mb-1 text-xs font-bold tracking-widest text-indigo-600 uppercase">
					Cara kerja
				</p>
				<h2 className="m-0 text-xl font-semibold text-slate-900">
					Jalankan di Console TikTok
				</h2>
				<p className="mt-1 text-sm text-slate-400">
					TikTok memblokir hapus dari server. Yang berfungsi: salin script dari
					sini → paste di Console tab profilmu. Panel hitam di pojok kanan
					menunjukkan progress.
				</p>
			</div>

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
						placeholder="MS4wLjABAAAA… — biasanya otomatis"
					/>
					<FieldDescription>
						Kosongkan saja jika sudah pernah verifikasi / script baca dari
						profil.
					</FieldDescription>
				</Field>

				<Field orientation="horizontal" className="items-center gap-2">
					<FieldLabel htmlFor="browser-speed" className="text-xs">
						Kecepatan hapus
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

				<ol className="m-0 space-y-3 list-none p-0">
					<li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
						<p className="m-0 text-xs font-bold tracking-widest text-indigo-600 uppercase">
							1 · Buka profil
						</p>
						<p className="mt-1 mb-2 text-sm text-slate-600">
							Login TikTok, buka halaman profilmu (bukan For You).
						</p>
						<a
							href={profileUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline ring-1 ring-slate-200 hover:bg-slate-100"
						>
							Buka {handle ? `@${handle}` : "TikTok"}
						</a>
					</li>
					<li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
						<p className="m-0 text-xs font-bold tracking-widest text-indigo-600 uppercase">
							2 · Izinkan paste
						</p>
						<p className="mt-1 mb-2 text-sm text-slate-600">
							F12 → tab Console. Kalau muncul warning, ketik{" "}
							<code className="rounded bg-white px-1 font-mono text-xs">
								allow pasting
							</code>{" "}
							lalu Enter.
						</p>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => void onCopyAllowPasting()}
						>
							{copiedAllow ? "Tersalin!" : "Salin “allow pasting”"}
						</Button>
					</li>
					<li className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
						<p className="m-0 text-xs font-bold tracking-widest text-indigo-600 uppercase">
							3 · Jalankan script
						</p>
						<p className="mt-1 mb-2 text-sm text-slate-600">
							Salin script → paste di Console → Enter. Jangan tutup tab sampai
							status “Selesai”.
						</p>
						<Button onClick={() => void onCopy()} size="lg" disabled={!canCopy}>
							{copied ? "Tersalin! Paste di Console" : "Salin Script"}
						</Button>
						{!canCopy ? (
							<p className="mt-2 mb-0 text-xs text-orange-700">
								Isi username dulu.
							</p>
						) : null}
					</li>
					<li className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
						<p className="m-0 text-xs font-bold tracking-widest text-emerald-700 uppercase">
							4 · Tunggu panel hitam
						</p>
						<p className="mt-1 mb-0 text-sm text-emerald-900">
							“Memuat …” = sedang list. “Hapus 12/770 …” = sedang hapus. Selesai
							kalau tertulis “Selesai. Berhasil …”.
						</p>
					</li>
				</ol>
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
