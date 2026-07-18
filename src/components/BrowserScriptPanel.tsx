import { useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { buildTikTokBrowserScript } from '#/lib/browser-script'

type SpeedMode = 'fast' | 'normal' | 'safe'

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
  fast: 800,
  normal: 1500,
  safe: 3000,
}

type BrowserScriptPanelProps = {
  username: string
  secUid: string
  onUsernameChange: (value: string) => void
  onSecUidChange: (value: string) => void
  speed: SpeedMode
  onSpeedChange: (value: SpeedMode) => void
}

export function BrowserScriptPanel({
  username,
  secUid,
  onUsernameChange,
  onSecUidChange,
  speed,
  onSpeedChange,
}: BrowserScriptPanelProps) {
  const [copied, setCopied] = useState(false)

  const script = useMemo(
    () =>
      buildTikTokBrowserScript({
        uniqueId: username,
        secUid,
        delayMs: SPEED_DELAY_MS[speed],
      }),
    [username, secUid, speed],
  )

  const onCopy = async () => {
    await navigator.clipboard.writeText(script)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const profileUrl = username.trim()
    ? `https://www.tiktok.com/@${username.trim().replace(/^@/, '')}`
    : 'https://www.tiktok.com'

  return (
    <section className="island-shell mt-6 rounded-2xl p-6">
      <div className="mb-4">
        <p className="island-kicker mb-1">Mode andal</p>
        <h2 className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
          Script Browser (disarankan)
        </h2>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Request dari server sering ditolak TikTok (respons kosong). Script ini
          jalan di tab tiktok.com — sama seperti extension — jadi cookie &amp;
          anti-bot browser dipakai otomatis.
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
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm text-[var(--sea-ink)]"
          >
            <option value="fast">Cepat (~0.8s)</option>
            <option value="normal">Normal (~1.5s)</option>
            <option value="safe">Aman (~3s)</option>
          </select>
        </Field>

        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
          <li>
            Buka profilmu:{' '}
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--lagoon-deep)]"
            >
              {profileUrl}
            </a>{' '}
            (harus login).
          </li>
          <li>
            Tekan F12 → tab <strong>Console</strong>.
          </li>
          <li>
            Klik <strong>Salin Script</strong> di bawah, paste di Console, Enter.
          </li>
          <li>Panel hitam muncul di pojok kanan — tunggu sampai selesai.</li>
        </ol>

        <Field orientation="horizontal" className="flex-wrap pt-1">
          <Button onClick={onCopy} size="lg">
            {copied ? 'Tersalin!' : 'Salin Script'}
          </Button>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(50,143,151,0.35)] bg-[rgba(79,184,178,0.12)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
          >
            Buka TikTok
          </a>
        </Field>

        <pre className="m-0 max-h-40 overflow-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[10px] leading-4 text-[var(--sea-ink-soft)]">
          {script.slice(0, 500)}…
        </pre>
      </FieldGroup>
    </section>
  )
}
