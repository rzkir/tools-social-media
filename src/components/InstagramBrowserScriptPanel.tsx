import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { buildInstagramRepostScript } from "#/lib/browser-script";

type SpeedMode = "fast" | "normal" | "safe";

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
	fast: 800,
	normal: 1500,
	safe: 3000,
};

type InstagramBrowserScriptPanelProps = {
	username: string;
	userId: string;
	onUsernameChange: (value: string) => void;
	speed: SpeedMode;
	onSpeedChange: (value: SpeedMode) => void;
	variant?: "card" | "plain";
};

export function InstagramBrowserScriptPanel({
	username,
	userId,
	onUsernameChange,
	speed,
	onSpeedChange,
	variant = "card",
}: InstagramBrowserScriptPanelProps) {
	const [copied, setCopied] = useState(false);
	const [copiedAllow, setCopiedAllow] = useState(false);

	const script = useMemo(
		() =>
			buildInstagramRepostScript({
				username,
				userId,
				delayMs: SPEED_DELAY_MS[speed],
			}),
		[username, userId, speed],
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
		? `https://www.instagram.com/${handle}/`
		: "https://www.instagram.com";
	const canCopy = Boolean(handle);

	const body = (
		<>
			<div className="mb-5">
				<p className="mb-1 text-xs font-bold tracking-widest text-pink-600 uppercase">
					Cara kerja
				</p>
				<h2 className="m-0 text-xl font-semibold text-slate-900">
					Jalankan di Console Instagram
				</h2>
				<p className="mt-1 text-sm text-slate-400">
					Instagram memblokir hapus repost dari server. Yang berfungsi: salin
					script dari sini, lalu jalankan di tab instagram.com yang sudah login.
				</p>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="ig-script-username">Username</FieldLabel>
					<Input
						id="ig-script-username"
						value={username}
						onChange={(e) =>
							onUsernameChange(e.target.value.replace(/^@/, ""))
						}
						placeholder="rizverse2025"
					/>
					<FieldDescription>
						Harus sama dengan akun yang login di tab Instagram.
					</FieldDescription>
				</Field>

				<Field>
					<FieldLabel htmlFor="ig-script-speed">Kecepatan</FieldLabel>
					<select
						id="ig-script-speed"
						value={speed}
						onChange={(e) => onSpeedChange(e.target.value as SpeedMode)}
						className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none"
					>
						<option value="fast">Cepat (~0.8s)</option>
						<option value="normal">Normal (~1.5s)</option>
						<option value="safe">Aman (~3s)</option>
					</select>
				</Field>
			</FieldGroup>

			<ol className="my-5 list-decimal space-y-2 pl-5 text-sm text-slate-600">
				<li>
					Buka{" "}
					<a
						href={profileUrl}
						target="_blank"
						rel="noreferrer"
						className="font-semibold text-pink-600"
					>
						{profileUrl}
					</a>{" "}
					— pastikan sudah login.
				</li>
				<li>
					Tekan <kbd className="rounded bg-slate-100 px-1.5 py-0.5">F12</kbd> →
					tab Console.
				</li>
				<li>
					Ketik <code className="text-pink-600">allow pasting</code> lalu Enter
					(jika Chrome memblokir paste).
				</li>
				<li>Salin script di bawah → paste di Console → Enter.</li>
			</ol>

			<div className="mb-3 flex flex-wrap gap-2">
				<Button onClick={() => void onCopy()} disabled={!canCopy}>
					{copied ? "Tersalin!" : "Salin Script"}
				</Button>
				<Button variant="secondary" onClick={() => void onCopyAllowPasting()}>
					{copiedAllow ? "Tersalin!" : 'Salin "allow pasting"'}
				</Button>
			</div>

			<pre className="max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">
				{script}
			</pre>
		</>
	);

	if (variant === "plain") return body;

	return (
		<section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
			{body}
		</section>
	);
}
