export type TikTokUser = {
  secUid: string
  uniqueId: string
  nickname: string
  avatarUrl?: string
}

export type TikTokRepostItem = {
  id: string
  authorName: string
  desc: string
  url: string
  coverUrl?: string
}

export type TikTokRepostPage = {
  items: TikTokRepostItem[]
  cursor: string | null
  hasMore: boolean
}

export type TikTokApiError = {
  message: string
  statusCode?: number
}
