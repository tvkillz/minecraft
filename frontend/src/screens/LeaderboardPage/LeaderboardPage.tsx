'use client'

import { useEffect, useState } from 'react'

import { LandingHeader } from '@/components/landing/resolveLanding'
import { useAuth } from '@/components/providers/AuthProvider'
import { fetchLeaderboard } from '@/lib/leaderboard/api'
import type { LeaderboardEntry, LeaderboardResponse } from '@/lib/leaderboard/types'
import './LeaderboardPage.css'

function formatRank(rank: number): string {
  return `#${rank}`
}

type LeaderboardTableProps = {
  caption: string
  rows: LeaderboardEntry[]
  highlightUserId: string | null
  compact?: boolean
}

function LeaderboardTable({ caption, rows, highlightUserId, compact = false }: LeaderboardTableProps) {
  return (
    <div className={`leaderboard-table-wrap${compact ? ' leaderboard-table-wrap--compact' : ''}`}>
      <table className="leaderboard-table">
        <caption className="leaderboard-table__caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Player</th>
            <th scope="col">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isViewer = highlightUserId != null && row.userId === highlightUserId
            return (
              <tr
                key={`${row.rank}-${row.userId}`}
                className={isViewer ? 'leaderboard-table__row--viewer' : undefined}
                aria-current={isViewer ? 'true' : undefined}
              >
                <td className="leaderboard-table__rank">{formatRank(row.rank)}</td>
                <td className="leaderboard-table__player">
                  {row.username}
                  {isViewer ? <span className="leaderboard-table__you-badge">You</span> : null}
                </td>
                <td className="leaderboard-table__rating">{row.rating}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      const response = await fetchLeaderboard()
      if (cancelled) return
      if (response.error) {
        setError(response.error)
        setData(null)
      } else {
        setData(response)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const viewer = data?.viewer ?? null
  const showNearby = viewer != null && !viewer.inTop && (data?.nearby?.length ?? 0) > 0

  return (
    <div className="leaderboard-page">
      <LandingHeader />
      <main className="leaderboard-page__main">
        <header className="leaderboard-page__hero">
          <p className="leaderboard-page__kicker">Competitive ladder</p>
          <h1 className="leaderboard-page__title">Leaderboard</h1>
          <p className="leaderboard-page__subtitle">
            Ranked Match results feed the realm ladder. Casual battles do not affect your standing.
          </p>
          {viewer ? (
            <p className="leaderboard-page__viewer-summary">
              Your rank: <strong>{formatRank(viewer.rank)}</strong>
              <span aria-hidden="true"> · </span>
              Rating <strong>{viewer.rating}</strong>
              <span aria-hidden="true"> · </span>
              {viewer.wins}W / {viewer.losses}L
            </p>
          ) : !loading && !error ? (
            <p className="leaderboard-page__viewer-summary leaderboard-page__viewer-summary--muted">
              Sign in to see your ladder standing.
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="leaderboard-page__status" role="status" aria-live="polite">
            Summoning rankings…
          </p>
        ) : null}

        {error ? (
          <p className="leaderboard-page__status leaderboard-page__status--error" role="alert">
            Could not load leaderboard ({error}).
          </p>
        ) : null}

        {!loading && !error && data ? (
          <div className="leaderboard-page__tables">
            {data.top.length > 0 ? (
              <LeaderboardTable
                caption="Top 100"
                rows={data.top}
                highlightUserId={viewer?.inTop ? userId : null}
              />
            ) : (
              <p className="leaderboard-page__empty">
                No players on the ladder yet.
              </p>
            )}

            {showNearby && data.nearby ? (
              <LeaderboardTable
                caption="Your standing"
                rows={data.nearby}
                highlightUserId={userId}
                compact
              />
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  )
}
