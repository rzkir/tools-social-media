declare module './gnarly-encode.js' {
  export function encode(
    queryString: string,
    body: string,
    userAgent: string,
    counters?: {
      totalXHRRequests?: number
      totalFetchRequests?: number
      interceptedXHRRequests?: number
      interceptedFetchRequests?: number
    },
    options?: {
      ubcode?: number
      sdkVersion?: string
      timestampMs?: number
    },
  ): string
}
