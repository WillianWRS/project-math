const TOP_SCORES_KEY = 'project-math-top-scores'
const LEGACY_HIGH_SCORE_KEY = 'project-math-high-score'
const SOUND_KEY = 'project-math-sound'
const DEV_MODE_KEY = 'project-math-dev-mode'
const GOD_MODE_KEY = 'project-math-god-mode'
const BACKGROUND_THEME_KEY = 'project-math-background-theme'
const PLAYER_KEY = 'project-math-player'

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
}

export interface PlayerData {
  displayName: string
  xp: number
  coins: number
  walletAutoChecks: number
  ownedThemeIds: BackgroundTheme[]
  equippedThemeId: BackgroundTheme
  daily: PlayerDailyData
}

/** @deprecated Use ScoreRecord */
export type HighScoreRecord = ScoreRecord

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

function createDailyDefaults(): PlayerDailyData {
  return {
    dateKey: '',
    scoreAccumulated: 0,
    goalClaimed: false,
    rewardedAdsWatched: 0,
  }
}

export function createDefaultPlayerData(): PlayerData {
  return {
    displayName: 'Jogador',
    xp: 0,
    coins: 0,
    walletAutoChecks: 0,
    ownedThemeIds: ['default', 'water'],
    equippedThemeId: 'default',
    daily: createDailyDefaults(),
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

export function getTopScore(): ScoreRecord | null {
  return loadTopScores()[0] ?? null
}

/** @deprecated Use getTopScore */
export function loadHighScore(): ScoreRecord | null {
  return getTopScore()
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

/** @deprecated Use saveTopScore */
export function saveHighScore(score: number): ScoreRecord {
  const result = saveTopScore(score)
  if (result.saved) {
    return result.scores.find((entry) => entry.score === score) ?? result.scores[0]
  }
  return createScoreRecord(score)
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

  const dailyRaw = raw.daily
  const daily =
    dailyRaw && typeof dailyRaw === 'object'
      ? {
          dateKey: typeof dailyRaw.dateKey === 'string' ? dailyRaw.dateKey : '',
          scoreAccumulated: clampNonNegative(dailyRaw.scoreAccumulated),
          goalClaimed: Boolean(dailyRaw.goalClaimed),
          rewardedAdsWatched: Math.min(5, clampNonNegative(dailyRaw.rewardedAdsWatched)),
        }
      : createDailyDefaults()

  return {
    displayName:
      typeof raw.displayName === 'string' && raw.displayName.trim().length > 0
        ? raw.displayName
        : defaults.displayName,
    xp: clampNonNegative(raw.xp),
    coins: clampNonNegative(raw.coins),
    walletAutoChecks: clampNonNegative(raw.walletAutoChecks),
    ownedThemeIds: normalizedOwnedThemeIds,
    equippedThemeId:
      isBackgroundTheme(raw.equippedThemeId) &&
      normalizedOwnedThemeIds.includes(raw.equippedThemeId)
        ? raw.equippedThemeId
        : defaults.equippedThemeId,
    daily,
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

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    if (raw) {
      const parsed = parsePlayerData(JSON.parse(raw))
      if (parsed) return parsed
    }
  } catch {
    // no-op
  }

  const migrated = migrateLegacyPlayerData(createDefaultPlayerData())
  savePlayerData(migrated)
  return migrated
}

export function savePlayerData(player: PlayerData): void {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player))
}

export function loadBackgroundTheme(): BackgroundTheme {
  return loadPlayerData().equippedThemeId
}

export function saveBackgroundTheme(theme: BackgroundTheme): void {
  const player = loadPlayerData()
  if (!player.ownedThemeIds.includes(theme)) return
  savePlayerData({ ...player, equippedThemeId: theme })
}
