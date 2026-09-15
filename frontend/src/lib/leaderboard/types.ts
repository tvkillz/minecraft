export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  rating: number
  wins: number
  losses: number
}

export type LeaderboardViewer = LeaderboardEntry & {
  inTop: boolean
}

export type LeaderboardResponse = {
  top: LeaderboardEntry[]
  viewer: LeaderboardViewer | null
  nearby: LeaderboardEntry[] | null
  totalRanked: number
  error?: string
}

export type LeaderboardAction = { type: 'get' }
