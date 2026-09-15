import botNicknamesData from '@project/bot-nicknames'
import gameConfig from '@project/game-config'

type GameConfigWithBots = typeof gameConfig & { botNicknames?: string[] }

function listFromConfig(): string[] {
  const fromGameConfig = (gameConfig as GameConfigWithBots).botNicknames
  if (Array.isArray(fromGameConfig) && fromGameConfig.length) return fromGameConfig
  if (Array.isArray(botNicknamesData) && botNicknamesData.length) return botNicknamesData
  return []
}

export function getBotNicknames(): string[] {
  return listFromConfig()
}

export function pickBotNickname(seed?: number): string {
  const list = getBotNicknames()
  if (!list.length) return 'LZQWQ'
  if (seed != null) {
    const index = Math.abs(seed) % list.length
    return list[index] ?? list[0]
  }
  return list[Math.floor(Math.random() * list.length)] ?? list[0]
}
