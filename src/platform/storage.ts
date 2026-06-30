import type { ChallengeModeId } from '../engine/types'

const TOP_SCORES_KEY = 'project-math-top-scores'
const LEGACY_HIGH_SCORE_KEY = 'project-math-high-score'
const SOUND_KEY = 'project-math-sound'
const DEV_MODE_KEY = 'project-math-dev-mode'
const GOD_MODE_KEY = 'project-math-god-mode'
const BACKGROUND_THEME_KEY = 'project-math-background-theme'
const PLAYER_KEY = 'project-math-player'
const BADGE_OWNERSHIP_MIGRATED_KEY = 'project-math-badge-ownership-migrated-v1'
const DAILY_REWARDED_ADS_LIMIT = 2

export const TOP_SCORES_LIMIT = 5

export type BackgroundTheme =
  | 'default'
  | 'water'
  | 'sunset'
  | 'forest'
  | 'violet'
  | 'ember'
  | 'neon'
  | 'midnight'
  | 'retro'
  | 'ice'
  | 'aurora'

export type BadgeVariant = 'default-ring' | 'double-ring' | 'shield' | 'ruler'

export interface ScoreRecord {
  score: number
  date: string
  id: string
  durationMs: number
}

export interface PlayerDailyData {
  dateKey: string
  scoreAccumulated: number
  goalClaimed: boolean
  rewardedAdsWatched: number
  challengesPlayed: ChallengeModeId[]
  challengeAttemptsUsed: Partial<Record<ChallengeModeId, number>>
}

export interface PlayerData {
  displayName: string
  avatarDataUrl: string | null
  xp: number
  coins: number
  diamonds: number
  walletAutoChecks: number
  ownedThemeIds: BackgroundTheme[]
  equippedThemeId: BackgroundTheme
  ownedBadgeIds: BadgeVariant[]
  equippedBadgeId: BadgeVariant
  daily: PlayerDailyData
  tutorial: {
    completed: boolean
    rewardsClaimed: boolean
  }
}

export interface SaveTopScoreResult {
  scores: ScoreRecord[]
  saved: boolean
  isTop1: boolean
}

function clampNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function isBackgroundTheme(value: unknown): value is BackgroundTheme {
  return (
    value === 'default' ||
    value === 'water' ||
    value === 'sunset' ||
    value === 'forest' ||
    value === 'violet' ||
    value === 'ember' ||
    value === 'neon' ||
    value === 'midnight' ||
    value === 'retro' ||
    value === 'ice' ||
    value === 'aurora'
  )
}

const CHALLENGE_MODE_IDS: ChallengeModeId[] = [
  'double-coins',
  'sixty-seconds',
  'three-seconds',
  'times-div-only',
]

function isChallengeModeId(value: unknown): value is ChallengeModeId {
  return typeof value === 'string' && CHALLENGE_MODE_IDS.includes(value as ChallengeModeId)
}

function isBadgeVariant(value: unknown): value is BadgeVariant {
  return value === 'default-ring' || value === 'double-ring' || value === 'shield' || value === 'ruler'
}

function createDailyDefaults(): PlayerDailyData {
  return {
    dateKey: '',
    scoreAccumulated: 0,
    goalClaimed: false,
    rewardedAdsWatched: 0,
    challengesPlayed: [],
    challengeAttemptsUsed: {},
  }
}

function parseChallengeAttemptsUsed(value: unknown): Partial<Record<ChallengeModeId, number>> {
  if (!value || typeof value !== 'object') return {}

  const result: Partial<Record<ChallengeModeId, number>> = {}
  for (const [key, rawCount] of Object.entries(value)) {
    if (!isChallengeModeId(key)) continue
    if (typeof rawCount !== 'number' || !Number.isFinite(rawCount)) continue
    const count = Math.max(0, Math.floor(rawCount))
    if (count > 0) result[key] = count
  }

  return result
}

export function createDefaultPlayerData(): PlayerData {
  return {
    displayName: 'Jogador',
    avatarDataUrl: null,
    xp: 0,
    coins: 0,
    diamonds: 0,
    walletAutoChecks: 0,
    ownedThemeIds: ['default', 'water'],
    equippedThemeId: 'default',
    ownedBadgeIds: ['default-ring'],
    equippedBadgeId: 'default-ring',
    daily: createDailyDefaults(),
    tutorial: {
      completed: false,
      rewardsClaimed: false,
    },
  }
}

function parseScoreRecord(value: unknown): ScoreRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<ScoreRecord>
  if (typeof record.score !== 'number' || typeof record.date !== 'string') return null

  return {
    score: Math.max(0, Math.floor(record.score)),
    date: record.date,
    id: typeof record.id === 'string' ? record.id : record.date,
    durationMs: clampNonNegative(record.durationMs),
  }
}

function createScoreRecord(score: number, durationMs = 0): ScoreRecord {
  const date = new Date().toISOString()
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${date}-${score}-${Math.random().toString(36).slice(2, 9)}`

  return { score, date, id, durationMs: clampNonNegative(durationMs) }
}

function compareScoreRecords(a: ScoreRecord, b: ScoreRecord): number {
  if (b.score !== a.score) return b.score - a.score
  return b.date.localeCompare(a.date)
}

function sortAndTrimScores(scores: ScoreRecord[]): ScoreRecord[] {
  return [...scores].sort(compareScoreRecords).slice(0, TOP_SCORES_LIMIT)
}

function migrateLegacyHighScore(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(LEGACY_HIGH_SCORE_KEY)
    if (!raw) return []
    const parsed = parseScoreRecord(JSON.parse(raw))
    if (!parsed) return []
    localStorage.removeItem(LEGACY_HIGH_SCORE_KEY)
    return [{ ...parsed, id: parsed.id || parsed.date }]
  } catch {
    return []
  }
}

export function loadTopScores(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(TOP_SCORES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return sortAndTrimScores(
        parsed.map(parseScoreRecord).filter((record): record is ScoreRecord => record !== null),
      )
    }

    const migrated = migrateLegacyHighScore()
    if (migrated.length > 0) {
      localStorage.setItem(TOP_SCORES_KEY, JSON.stringify(migrated))
    }
    return migrated
  } catch {
    return []
  }
}

export function qualifiesForTopScores(
  score: number,
  scores: ScoreRecord[] = loadTopScores(),
): boolean {
  if (scores.length < TOP_SCORES_LIMIT) return true
  const lowest = scores[TOP_SCORES_LIMIT - 1]?.score ?? 0
  return score >= lowest
}

export function saveTopScore(score: number, durationMs = 0): SaveTopScoreResult {
  const current = loadTopScores()
  const previousTop1 = current[0]?.score ?? 0

  if (!qualifiesForTopScores(score, current)) {
    return { scores: current, saved: false, isTop1: false }
  }

  const record = createScoreRecord(score, durationMs)
  const scores = sortAndTrimScores([...current, record])
  localStorage.setItem(TOP_SCORES_KEY, JSON.stringify(scores))

  const isTop1 = score > previousTop1
  return { scores, saved: true, isTop1 }
}

export function loadSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  localStorage.setItem(SOUND_KEY, String(enabled))
}

export function loadDevModeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(DEV_MODE_KEY)
    if (raw === null) return false
    return raw === 'true'
  } catch {
    return false
  }
}

export function saveDevModeEnabled(enabled: boolean): void {
  localStorage.setItem(DEV_MODE_KEY, String(enabled))
}

export function loadGodModeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GOD_MODE_KEY)
    if (raw === null) return false
    return raw === 'true'
  } catch {
    return false
  }
}

export function saveGodModeEnabled(enabled: boolean): void {
  localStorage.setItem(GOD_MODE_KEY, String(enabled))
}

function parsePlayerData(value: unknown): PlayerData | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<PlayerData>
  const defaults = createDefaultPlayerData()

  const ownedThemeIds = Array.isArray(raw.ownedThemeIds)
    ? raw.ownedThemeIds.filter(isBackgroundTheme)
    : defaults.ownedThemeIds

  const normalizedOwnedThemeIds =
    ownedThemeIds.length > 0
      ? Array.from(new Set<BackgroundTheme>(['default', 'water', ...ownedThemeIds]))
      : defaults.ownedThemeIds

  const ownedBadgeIds = Array.isArray(raw.ownedBadgeIds)
    ? raw.ownedBadgeIds.filter(isBadgeVariant)
    : defaults.ownedBadgeIds

  const normalizedOwnedBadgeIds =
    ownedBadgeIds.length > 0
      ? Array.from(
          new Set<BadgeVariant>([
            'default-ring',
            ...ownedBadgeIds,
          ]),
        )
      : defaults.ownedBadgeIds

  const dailyRaw = raw.daily
  const challengesPlayed = Array.isArray(dailyRaw?.challengesPlayed)
    ? dailyRaw.challengesPlayed.filter(isChallengeModeId)
    : []
  const challengeAttemptsUsed = parseChallengeAttemptsUsed(dailyRaw?.challengeAttemptsUsed)
  const daily =
    dailyRaw && typeof dailyRaw === 'object'
      ? {
          dateKey: typeof dailyRaw.dateKey === 'string' ? dailyRaw.dateKey : '',
          scoreAccumulated: clampNonNegative(dailyRaw.scoreAccumulated),
          goalClaimed: Boolean(dailyRaw.goalClaimed),
          rewardedAdsWatched: Math.min(DAILY_REWARDED_ADS_LIMIT, clampNonNegative(dailyRaw.rewardedAdsWatched)),
          challengesPlayed,
          challengeAttemptsUsed,
        }
      : createDailyDefaults()

  const tutorialRaw = raw.tutorial
  const tutorial =
    tutorialRaw && typeof tutorialRaw === 'object'
      ? {
          completed: Boolean(tutorialRaw.completed),
          rewardsClaimed: Boolean(tutorialRaw.rewardsClaimed),
        }
      : {
          completed: false,
          rewardsClaimed: false,
        }

  return {
    displayName:
      typeof raw.displayName === 'string' && raw.displayName.trim().length > 0
        ? raw.displayName
        : defaults.displayName,
    avatarDataUrl: typeof raw.avatarDataUrl === 'string' && raw.avatarDataUrl.length > 0 ? raw.avatarDataUrl : null,
    xp: clampNonNegative(raw.xp),
    coins: clampNonNegative(raw.coins),
    diamonds: clampNonNegative(raw.diamonds),
    walletAutoChecks: clampNonNegative(raw.walletAutoChecks),
    ownedThemeIds: normalizedOwnedThemeIds,
    equippedThemeId:
      isBackgroundTheme(raw.equippedThemeId) &&
      normalizedOwnedThemeIds.includes(raw.equippedThemeId)
        ? raw.equippedThemeId
        : defaults.equippedThemeId,
    ownedBadgeIds: normalizedOwnedBadgeIds,
    equippedBadgeId:
      isBadgeVariant(raw.equippedBadgeId) && normalizedOwnedBadgeIds.includes(raw.equippedBadgeId)
        ? raw.equippedBadgeId
        : defaults.equippedBadgeId,
    daily,
    tutorial,
  }
}

function migrateLegacyPlayerData(defaults: PlayerData): PlayerData {
  const migrated = { ...defaults }

  const legacyTheme = localStorage.getItem(BACKGROUND_THEME_KEY)
  if (isBackgroundTheme(legacyTheme)) {
    migrated.equippedThemeId = legacyTheme
  }

  return migrated
}

function migrateBadgeOwnershipOnce(player: PlayerData): PlayerData {
  try {
    const migrated = localStorage.getItem(BADGE_OWNERSHIP_MIGRATED_KEY) === 'true'
    if (migrated) return player
    localStorage.setItem(BADGE_OWNERSHIP_MIGRATED_KEY, 'true')
  } catch {
    // no-op: keep migration conservative if storage is unavailable
  }

  return {
    ...player,
    ownedBadgeIds: ['default-ring'],
    equippedBadgeId: 'default-ring',
  }
}

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    if (raw) {
      const parsed = parsePlayerData(JSON.parse(raw))
      if (parsed) return migrateBadgeOwnershipOnce(parsed)
    }
  } catch {
    // no-op
  }

  const migrated = migrateBadgeOwnershipOnce(migrateLegacyPlayerData(createDefaultPlayerData()))
  savePlayerData(migrated)
  return migrated
}

export function savePlayerData(player: PlayerData): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
}
