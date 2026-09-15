import type { HandDeckEntry } from '@/lib/decks/buildHand'

export type GameProps = {
  deckEntries: HandDeckEntry[]
  deckId: string
  mode?: string
  resumeMatchId?: string | null
  onNewGame?: () => void
  onMenu?: () => void
}
