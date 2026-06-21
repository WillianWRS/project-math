const TOP_SCORES_KEY = 'project-math-top-scores'
const LEGACY_HIGH_SCORE_KEY = 'project-math-high-score'
const SOUND_KEY = 'project-math-sound'
const BACKGROUND_THEME_KEY = 'project-math-background-theme'

export const TOP_SCORES_LIMIT = 5

export type BackgroundTheme = 'default' | 'water'

export interface ScoreRecord {
  score: number
  date: string
  id: string
}

/** @deprecated Use ScoreRecord */
export type HighScoreRecord = ScoreRecord

export interface SaveTopScoreResult {
  scores: ScoreRecord[]
  /** Pontuação entrou no top 5 e foi salva */
  saved: boolean
  /** Nova pontuação é a melhor de todas (top 1) */
  isTop1: boolean
}

function parseScoreRecord(value: unknown): ScoreRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<ScoreRecord>
  if (typeof record.score !== 'number' || typeof record.date !== 'string') return null
  return {
    score: record.score,
    date: record.date,
    id: typeof record.id === 'string' ? record.id : record.date,
  }
}

function createScoreRecord(score: number): ScoreRecord {
  const date = new Date().toISOString()
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${date}-${score}-${Math.random().toString(36).slice(2, 9)}`

  return { score, date, id }
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

export function qualifiesForTopScores(score: number, scores: ScoreRecord[] = loadTopScores()): boolean {
  if (scores.length < TOP_SCORES_LIMIT) return true
  const lowest = scores[TOP_SCORES_LIMIT - 1]?.score ?? 0
  return score >= lowest
}

export function saveTopScore(score: number): SaveTopScoreResult {
  const current = loadTopScores()
  const previousTop1 = current[0]?.score ?? 0

  if (!qualifiesForTopScores(score, current)) {
    return { scores: current, saved: false, isTop1: false }
  }

  const record = createScoreRecord(score)
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

export function loadBackgroundTheme(): BackgroundTheme {
  try {
    const raw = localStorage.getItem(BACKGROUND_THEME_KEY)
    if (raw === 'default' || raw === 'water') return raw
    return 'default'
  } catch {
    return 'default'
  }
}

export function saveBackgroundTheme(theme: BackgroundTheme): void {
  localStorage.setItem(BACKGROUND_THEME_KEY, theme)
}
