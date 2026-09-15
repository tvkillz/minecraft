export type TutorialTarget =
  | 'none'
  | 'mana'
  | 'hand'
  | 'hero-board'
  | 'battle'
  | 'end-turn'
  | 'controls'
  | 'health'

export type TutorialAdvance = 'manual' | 'auto'

export interface TutorialStep {
  id: string
  title: string
  body: string
  target: TutorialTarget
  advance: TutorialAdvance
  /** Shown on the primary button for manual steps. */
  actionLabel?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the Tutorial',
    body: 'This guided match teaches the basics. You face a bot opponent — reduce their health to zero before they defeat you.',
    target: 'none',
    advance: 'manual',
    actionLabel: 'Begin',
  },
  {
    id: 'mana',
    title: 'Mana',
    body: 'Mana pays for cards. Check the crystals beside your avatar — you start with 5 mana and gain +1 max mana each turn.',
    target: 'mana',
    advance: 'manual',
    actionLabel: 'Next',
  },
  {
    id: 'hand',
    title: 'Your Hand',
    body: 'These are the cards you can play this turn. Each card shows its mana cost, attack, and health in the corners.',
    target: 'hand',
    advance: 'manual',
    actionLabel: 'Next',
  },
  {
    id: 'play_card',
    title: 'Play a Card',
    body: 'Double-click an affordable card (mana cost at or below your current mana) to place it on your board.',
    target: 'hand',
    advance: 'auto',
  },
  {
    id: 'board',
    title: 'Your Board',
    body: 'Units on the board fight during combat. You have four slots — fill them with creatures and effects.',
    target: 'hero-board',
    advance: 'manual',
    actionLabel: 'Next',
  },
  {
    id: 'battle',
    title: 'Battle',
    body: 'Press BATTLE [B] so your units attack first. If you skip this, only the enemy strikes during combat.',
    target: 'battle',
    advance: 'auto',
  },
  {
    id: 'end_turn',
    title: 'End Your Turn',
    body: 'When you are done in the main phase, press END TURN [E]. The enemy plays cards, then combat resolves.',
    target: 'end-turn',
    advance: 'auto',
  },
  {
    id: 'resolution',
    title: 'Combat & Enemy Turn',
    body: 'Watch units trade damage. After the enemy acts, surviving attackers hit the enemy hero. Then it is your turn again.',
    target: 'controls',
    advance: 'auto',
  },
  {
    id: 'finish',
    title: 'You Are Ready',
    body: 'Keep playing cards, battling, and ending turns until you win. Ranked and casual matches work the same way.',
    target: 'none',
    advance: 'manual',
    actionLabel: 'Play on',
  },
]
