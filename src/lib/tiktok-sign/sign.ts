import { encode as encodeGnarly } from './gnarly-encode.js'
import { generateXBogus } from './xbogus'

export const TIKTOK_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * Append X-Bogus + X-Gnarly to a TikTok web API URL.
 * Query must already include msToken when available; must NOT include signatures yet.
 */
export function signTikTokUrl(
  url: string,
  options?: {
    userAgent?: string
    body?: string
    ubcode?: number
    /** When true, only append X-Bogus (no X-Gnarly). */
    bogusOnly?: boolean
  },
): string {
  const userAgent = options?.userAgent ?? TIKTOK_USER_AGENT
  const body = options?.body ?? ''
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''

  const xBogus = generateXBogus(query, userAgent, body)

  // X-Bogus alphabet includes `/` and `=` — encode for query safety
  let signed = `${url}${url.includes('?') ? '&' : '?'}X-Bogus=${encodeURIComponent(xBogus)}`

  if (!options?.bogusOnly) {
    const xGnarly = encodeGnarly(
      query,
      body,
      userAgent,
      { totalXHRRequests: 3, totalFetchRequests: 1 },
      // webmssdk default for many /api/* routes is 4
      { ubcode: options?.ubcode ?? 4 },
    )
    signed += `&X-Gnarly=${encodeURIComponent(xGnarly)}`
  }

  return signed
}

