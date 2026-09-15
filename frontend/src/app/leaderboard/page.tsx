'use client'

import AuthGate from '@/components/auth/AuthGate'
import LeaderboardPage from '@/screens/LeaderboardPage/LeaderboardPage'

export default function LeaderboardRoute() {
  return (
    <AuthGate>
      <LeaderboardPage />
    </AuthGate>
  )
}
