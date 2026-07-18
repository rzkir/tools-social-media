import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserScriptPanel } from '#/components/BrowserScriptPanel'
import {
  EMPTY_COOKIE_VALUES,
  TikTokCookieForm,
  buildCookieHeader,
  type TikTokCookieValues,
} from '#/components/TikTokCookieForm'
import { Button } from '#/components/ui/button'
import { Field, FieldLabel } from '#/components/ui/field'
import {
  clearCookieSession,
  loadCookieSession,
  saveCookieSession,
} from '#/lib/session-store'
import {
  listAllRepostsFn,
  removeRepostFn,
  verifySessionFn,
} from '#/server/tiktok.functions'
import type { TikTokRepostItem, TikTokUser } from '#/types/tiktok'

export const Route = createFileRoute('/')({ component: App })

type SpeedMode = 'fast' | 'normal' | 'safe'
type Mode = 'browser' | 'cookie'

const SPEED_DELAY_MS: Record<SpeedMode, number> = {
  fast: 800,
  normal: 1500,
  safe: 3000,
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function App() {
  const [mode, setMode] = useState<Mode>('browser')
  const [cookieValues, setCookieValues] =
    useState<TikTokCookieValues>(EMPTY_COOKIE_VALUES)
  const [user, setUser] = useState<TikTokUser | null>(null)
  const [items, setItems] = useState<TikTokRepostItem[]>([])
  const [speed, setSpeed] = useState<SpeedMode>('safe')
  const [busy, setBusy] = useState<'idle' | 'verify' | 'load' | 'remove'>('idle')
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 })
  const stopRef = useRef(false)
  const hydratedRef = useRef(false)

  const cookies = useMemo(
    () => buildCookieHeader(cookieValues),
    [cookieValues],
  )

  useEffect(() => {
    const stored = loadCookieSession()
    if (stored) {
      setCookieValues(stored.cookies)
      setUser(stored.user)
      if (stored.user) {
        setLog([`Session dipulihkan: @${stored.user.uniqueId}`])
      }
    }
    hydratedRef.current = true
    setBooting(false)
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    saveCookieSession(cookieValues, user)
  }, [cookieValues, user])

  const pushLog = (line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 80))
  }

  const loadReposts = async (
    cookieHeader: string,
    secUid: string,
    baseCookies: TikTokCookieValues = cookieValues,
  ): Promise<boolean> => {
    setBusy('load')
    try {
      const result = await listAllRepostsFn({
        data: { cookies: cookieHeader, secUid },
      })
      if (!result?.ok) {
        setError(
          result && 'error' in result
            ? result.error
            : 'Gagal memuat repost (server error).',
        )
        return false
      }

      if (result.refreshed?.msToken || result.refreshed?.ttwid) {
        const next: TikTokCookieValues = {
          ...baseCookies,
          ...(result.refreshed.msToken
            ? { msToken: result.refreshed.msToken }
            : {}),
          ...(result.refreshed.ttwid ? { ttwid: result.refreshed.ttwid } : {}),
        }
        setCookieValues(next)
        saveCookieSession(next, user)
      }

      setItems(result.items)
      pushLog(
        result.items.length > 0
          ? `Ditemukan ${result.items.length} repost`
          : 'Tidak ada repost (0). Cek tab Repost di profil TikTok.',
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat repost')
      return false
    } finally {
      setBusy('idle')
    }
  }

  const onVerify = async () => {
    setError(null)
    setBusy('verify')
    setUser(null)
    setItems([])
    try {
      const result = await verifySessionFn({
        data: {
          cookies,
          uniqueId: cookieValues.username.trim() || undefined,
          secUid: cookieValues.secUid.trim() || undefined,
        },
      })
      if (!result?.ok) {
        setError(
          result && 'error' in result
            ? result.error
            : 'Verifikasi gagal (server error). Coba refresh halaman.',
        )
        setBusy('idle')
        return
      }

      const nextCookies: TikTokCookieValues = {
        ...cookieValues,
        username: result.user.uniqueId,
        secUid: result.user.secUid,
      }
      setCookieValues(nextCookies)
      setUser(result.user)
      saveCookieSession(nextCookies, result.user)
      pushLog(`Login sebagai @${result.user.uniqueId}`)

      await loadReposts(
        buildCookieHeader(nextCookies),
        result.user.secUid,
        nextCookies,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal verifikasi')
      setBusy('idle')
    }
  }

  const onLoad = async () => {
    if (!user) return
    setError(null)
    await loadReposts(cookies, user.secUid)
  }

  const onClearSession = () => {
    clearCookieSession()
    setCookieValues(EMPTY_COOKIE_VALUES)
    setUser(null)
    setItems([])
    setError(null)
    setLog([])
    setProgress({ done: 0, failed: 0, total: 0 })
    pushLog('Session dibersihkan')
  }

  const onRemoveAll = async () => {
    if (!items.length) return
    stopRef.current = false
    setError(null)
    setBusy('remove')

    const queue = [...items]
    setProgress({ done: 0, failed: 0, total: queue.length })

    let done = 0
    let failed = 0
    const failedItems: TikTokRepostItem[] = []
    const delay = SPEED_DELAY_MS[speed]

    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) {
        const leftover = queue.slice(i)
        setItems([...failedItems, ...leftover])
        pushLog('Dijeda oleh pengguna')
        setBusy('idle')
        return
      }

      const item = queue[i]
      const result = await removeRepostFn({
        data: { cookies, itemId: item.id },
      })

      if (result?.ok) {
        done += 1
        pushLog(`Dihapus ${item.authorName}`)
        setItems((prev) => prev.filter((x) => x.id !== item.id))
      } else {
        failed += 1
        failedItems.push(item)
        const msg =
          result && 'error' in result ? result.error : 'server error'
        pushLog(`Gagal ${item.id}: ${msg}`)
      }

      setProgress({ done, failed, total: queue.length })
      await sleep(delay)
    }

    setItems(failedItems)
    pushLog(`Selesai. Berhasil ${done}, gagal ${failed}`)
    setBusy('idle')
  }

  const onRemoveOne = async (item: TikTokRepostItem) => {
    setError(null)
    const result = await removeRepostFn({
      data: { cookies, itemId: item.id },
    })
    if (!result?.ok) {
      const msg =
        result && 'error' in result ? result.error : 'server error'
      setError(msg)
      pushLog(`Gagal ${item.id}: ${msg}`)
      return
    }
    setItems((prev) => prev.filter((x) => x.id !== item.id))
    pushLog(`Dihapus ${item.authorName}`)
  }

  const pct =
    progress.total > 0
      ? Math.round(((progress.done + progress.failed) / progress.total) * 100)
      : 0

  return (
    <main className="page-wrap px-4 pb-10 pt-10">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-9 sm:px-10">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <p className="island-kicker mb-3">Bulk remove · Browser-first</p>
        <h1 className="display-title mb-3 max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Remove Repost TikTok
        </h1>
        <p className="m-0 max-w-2xl text-base text-[var(--sea-ink-soft)]">
          Mode cookie dari server sering kena anti-bot (respons kosong). Pakai{' '}
          <strong className="text-[var(--sea-ink)]">Script Browser</strong> —
          jalan di tab TikTok, andal.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant={mode === 'browser' ? 'primary' : 'secondary'}
            onClick={() => setMode('browser')}
          >
            Script Browser
          </Button>
          <Button
            variant={mode === 'cookie' ? 'primary' : 'secondary'}
            onClick={() => setMode('cookie')}
          >
            Cookie (eksperimental)
          </Button>
        </div>
      </section>

      {mode === 'browser' ? (
        <BrowserScriptPanel
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
      ) : booting ? (
        <section className="island-shell mt-6 rounded-2xl p-6">
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            Memulihkan session…
          </p>
        </section>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Mode cookie memanggil TikTok dari server. TikTok sering balas body
            kosong meski cookie valid. Jika gagal terus, kembali ke{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => setMode('browser')}
            >
              Script Browser
            </button>
            .
          </div>

          <TikTokCookieForm
            values={cookieValues}
            onChange={setCookieValues}
            onVerify={onVerify}
            onClearSession={onClearSession}
            busy={busy}
            user={user}
            error={error}
          />

          {user && (
            <section className="island-shell mt-6 rounded-2xl p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="island-kicker mb-1">Repost</p>
                  <h2 className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                    {busy === 'load'
                      ? 'Memuat repost…'
                      : `${items.length} video terdeteksi`}
                  </h2>
                </div>

                <Field orientation="horizontal" className="gap-2">
                  <FieldLabel htmlFor="speed-mode" className="text-xs">
                    Kecepatan
                  </FieldLabel>
                  <select
                    id="speed-mode"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value as SpeedMode)}
                    disabled={busy === 'remove'}
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm text-[var(--sea-ink)]"
                  >
                    <option value="fast">Cepat (~0.8s)</option>
                    <option value="normal">Normal (~1.5s)</option>
                    <option value="safe">Aman (~3s)</option>
                  </select>

                  <Button
                    variant="secondary"
                    onClick={onLoad}
                    disabled={busy !== 'idle'}
                  >
                    {busy === 'load' ? 'Memuat…' : 'Muat Ulang'}
                  </Button>

                  {busy === 'remove' ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        stopRef.current = true
                      }}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={onRemoveAll}
                      disabled={busy !== 'idle' || items.length === 0}
                    >
                      Hapus Semua
                    </Button>
                  )}
                </Field>
              </div>

              {busy === 'remove' && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-[var(--sea-ink-soft)]">
                    <span>
                      Progress {progress.done + progress.failed}/{progress.total}
                    </span>
                    <span>
                      OK {progress.done} · Gagal {progress.failed}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[rgba(23,58,64,0.12)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#56c6be,#328f97)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="mt-5 grid max-h-[28rem] list-none gap-2 overflow-y-auto p-0 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  >
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt=""
                        className="h-12 w-10 flex-shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-10 flex-shrink-0 rounded-md bg-[rgba(79,184,178,0.2)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
                        {item.authorName}
                      </p>
                      <p className="m-0 truncate text-xs text-[var(--sea-ink-soft)]">
                        {item.desc || item.id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOne(item)}
                      disabled={busy !== 'idle'}
                    >
                      Hapus
                    </Button>
                  </li>
                ))}
                {items.length === 0 && busy === 'idle' && (
                  <li className="col-span-full py-8 text-center text-sm text-[var(--sea-ink-soft)]">
                    Mode cookie gagal / kosong? Gunakan Script Browser.
                  </li>
                )}
              </ul>
            </section>
          )}

          {log.length > 0 && (
            <section className="island-shell mt-6 rounded-2xl p-6">
              <p className="island-kicker mb-3">Log</p>
              <ul className="m-0 max-h-48 list-none space-y-1 overflow-y-auto p-0 font-mono text-xs text-[var(--sea-ink-soft)]">
                {log.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}
