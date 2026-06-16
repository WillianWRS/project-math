const HIGH_SCORE_KEY = 'project-math-high-score'
const SOUND_KEY = 'project-math-sound'

export interface HighScoreRecord {
  score: number
  date: string
}

export function loadHighScore(): HighScoreRecord | null {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HighScoreRecord
    if (typeof parsed.score !== 'number' || typeof parsed.date !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveHighScore(score: number): HighScoreRecord {
  const record: HighScoreRecord = {
    score,
    date: new Date().toISOString(),
  }
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(record))
  return record
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
