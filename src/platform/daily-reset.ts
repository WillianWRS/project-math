import type { PlayerData } from './storage'

const DAILY_TIMEZONE = 'America/Sao_Paulo'

export { DAILY_TIMEZONE }

export function getDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

export function ensureDailyFresh(player: PlayerData, date = new Date()): PlayerData {
  const dateKey = getDateKey(date)
  if (player.daily.dateKey === dateKey) return player

  return {
    ...player,
    daily: {
      dateKey,
      scoreAccumulated: 0,
      goalClaimed: false,
      rewardedAdsWatched: 0,
      challengesPlayed: [],
      challengeAttemptsUsed: {},
    },
  }
}

export function getMsUntilDailyReset(now = new Date()): number {
  const currentKey = getDateKey(now)
  let lo = now.getTime()
  let hi = lo + 48 * 60 * 60 * 1000

  while (getDateKey(new Date(hi)) === currentKey) {
    hi += 24 * 60 * 60 * 1000
  }

  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2)
    if (getDateKey(new Date(mid)) === currentKey) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return Math.max(0, hi - now.getTime())
}

export function formatDailyResetCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
