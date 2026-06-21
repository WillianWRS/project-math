import type { PlayerData } from './storage'

const DAILY_TIMEZONE = 'America/Sao_Paulo'

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
    },
  }
}
