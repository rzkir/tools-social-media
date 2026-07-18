import {
  EMPTY_COOKIE_VALUES,
  type TikTokCookieValues,
} from '#/components/TikTokCookieForm'
import type { TikTokUser } from '#/types/tiktok'

const STORAGE_KEY = 'tt_repost_cookie_session'

export type StoredCookieSession = {
  cookies: TikTokCookieValues
  user: TikTokUser | null
}

function isCookieValues(value: unknown): value is TikTokCookieValues {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.sessionid === 'string' &&
    typeof v.msToken === 'string' &&
    typeof v.username === 'string' &&
    typeof v.secUid === 'string'
  )
}

export function loadCookieSession(): StoredCookieSession | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredCookieSession>
    if (!isCookieValues(parsed.cookies)) return null
    const user =
      parsed.user &&
      typeof parsed.user === 'object' &&
      typeof parsed.user.secUid === 'string' &&
      typeof parsed.user.uniqueId === 'string'
        ? (parsed.user as TikTokUser)
        : null
    return {
      cookies: { ...EMPTY_COOKIE_VALUES, ...parsed.cookies },
      user,
    }
  } catch {
    return null
  }
}

export function saveCookieSession(
  cookies: TikTokCookieValues,
  user: TikTokUser | null,
): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const payload: StoredCookieSession = { cookies, user }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function clearCookieSession(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
