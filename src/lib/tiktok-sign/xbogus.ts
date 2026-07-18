import { createHash } from 'node:crypto'

/** TikTok custom Base64 alphabet (shifted from standard). */
const CUSTOM_B64 =
  'Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe='
const STANDARD_B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

const UA_RC4_KEY = [0x00, 0x01, 0x0e]
const PAYLOAD_RC4_KEY = [0xff]
const MAGIC_CONSTANT = 0x4a41279f
const LEADING_BYTE = 0x40

function md5Hex(data: string | Uint8Array): string {
  return createHash('md5').update(data).digest('hex')
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/** Double MD5 → 16 raw bytes (hash hex → bytes → hash again). */
function doubleMd5(data: string | Uint8Array): Uint8Array {
  const firstHex = md5Hex(data)
  const firstBytes = hexToBytes(firstHex)
  const secondHex = md5Hex(firstBytes)
  return hexToBytes(secondHex)
}

function rc4(key: number[], data: Uint8Array): Uint8Array {
  const s = new Array<number>(256)
  for (let i = 0; i < 256; i++) s[i] = i

  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256
    const tmp = s[i]
    s[i] = s[j]
    s[j] = tmp
  }

  const out = new Uint8Array(data.length)
  let i = 0
  j = 0
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) % 256
    j = (j + s[i]) % 256
    const tmp = s[i]
    s[i] = s[j]
    s[j] = tmp
    out[k] = data[k] ^ s[(s[i] + s[j]) % 256]
  }
  return out
}

function standardBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  // btoa is available in Workers; Buffer fallback for Node
  if (typeof btoa === 'function') {
    return btoa(binary)
  }
  return Buffer.from(bytes).toString('base64')
}

function customBase64Encode(data: Uint8Array): string {
  const standard = standardBase64(data)
  let out = ''
  for (const ch of standard) {
    const idx = STANDARD_B64.indexOf(ch)
    out += idx >= 0 ? CUSTOM_B64[idx] : ch
  }
  return out
}

function packUint32BE(value: number): Uint8Array {
  const v = value >>> 0
  return Uint8Array.of(
    (v >>> 24) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,
  )
}

/**
 * Pure X-Bogus (no jsvmp). Works in Cloudflare Workers with nodejs_compat.
 * @param queryString URL query without leading `?`
 */
export function generateXBogus(
  queryString: string,
  userAgent: string,
  body = '',
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const paramsMd5 = doubleMd5(queryString)
  const bodyMd5 = doubleMd5(body)
  const uaEncrypted = rc4(UA_RC4_KEY, new TextEncoder().encode(userAgent))
  const uaMd5 = hexToBytes(md5Hex(standardBase64(uaEncrypted)))

  const payload = new Uint8Array(19)
  let o = 0
  payload[o++] = LEADING_BYTE
  payload[o++] = UA_RC4_KEY[0]
  payload[o++] = UA_RC4_KEY[1]
  payload[o++] = UA_RC4_KEY[2]
  payload[o++] = paramsMd5[14]
  payload[o++] = paramsMd5[15]
  payload[o++] = bodyMd5[14]
  payload[o++] = bodyMd5[15]
  payload[o++] = uaMd5[14]
  payload[o++] = uaMd5[15]
  payload.set(packUint32BE(timestamp), o)
  o += 4
  payload.set(packUint32BE(MAGIC_CONSTANT), o)
  o += 4

  let xor = 0
  for (let i = 0; i < 18; i++) xor ^= payload[i]
  payload[18] = xor & 0xff

  const encrypted = rc4(PAYLOAD_RC4_KEY, payload)
  const final = new Uint8Array(2 + encrypted.length)
  final[0] = 0x02
  final[1] = 0xff
  final.set(encrypted, 2)

  return customBase64Encode(final)
}
