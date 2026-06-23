import type { BackgroundTheme } from '../../platform/storage'
import { getShareCardThemeStyle } from '../../lib/share-card-theme'

interface ShareCardTemplateProps {
  theme: BackgroundTheme
  playerName: string
  level: number
  score: number
  durationText: string
  xpGained: number
  coinsGained: number
  goalCompleted: boolean
}

function ShareIconTrophy() {
  return (
    <svg className="share-card__icon share-card__icon--primary" width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h12v2a4 4 0 01-4 4h-.5A4 4 0 0110 6V4M8 20h8M12 14v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6 6H4a2 2 0 002 3M18 6h2a2 2 0 01-2 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShareIconPerson() {
  return (
    <svg className="share-card__icon share-card__icon--muted" width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShareIconClock() {
  return (
    <svg className="share-card__icon share-card__icon--muted" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShareCardDecor({ theme }: { theme: BackgroundTheme }) {
  if (theme === 'water') {
    return (
      <>
        <div className="share-card__water-blob share-card__water-blob--one" aria-hidden />
        <div className="share-card__water-blob share-card__water-blob--two" aria-hidden />
        <div className="share-card__water-blob share-card__water-blob--three" aria-hidden />
      </>
    )
  }

  return (
    <>
      <div className="share-card__line share-card__line--one" aria-hidden />
      <div className="share-card__line share-card__line--two" aria-hidden />
      <div className="share-card__line share-card__line--three" aria-hidden />
      <div className="share-card__line share-card__line--four" aria-hidden />
      <div className="share-card__glow" aria-hidden />
    </>
  )
}

export function ShareCardTemplate({
  theme,
  playerName,
  level,
  score,
  durationText,
  xpGained,
  coinsGained,
  goalCompleted,
}: ShareCardTemplateProps) {
  const themeStyle = getShareCardThemeStyle(theme)

  return (
    <div
      id="share-card-template"
      className={`share-card ${themeStyle.rootClass}`}
      data-capture-background={themeStyle.captureBackground}
    >
      <ShareCardDecor theme={theme} />

      <p className="share-card__brand">Project Math</p>

      <div className={`share-card__panel ${themeStyle.panelClass}`}>
        <p className="share-card__label">
          <ShareIconTrophy />
          <span>Resultado</span>
        </p>

        <div className="share-card__score">
          <p className="share-card__score-value">{score}</p>
          <p className="share-card__score-suffix">pontos</p>
        </div>

        <p className="share-card__duration">
          <ShareIconClock />
          <span>{durationText}</span>
        </p>

        <p className="share-card__rewards">
          <span className="share-card__reward-xp">+{xpGained} XP</span>
          <span className="share-card__reward-sep"> • </span>
          <span className="share-card__reward-coins">+{coinsGained} moedas</span>
        </p>

        {goalCompleted ? (
          <p className="share-card__highlight share-card__highlight--goal">
            Meta diária completa! <span className="share-card__reward-xp">+1000 XP</span> e +1 auto-check
          </p>
        ) : null}

        <div className="share-card__player-row">
          <span className="share-card__player-name">
            <ShareIconPerson />
            <span>{playerName}</span>
          </span>
          <span className="share-card__player-level">Nv. {level}</span>
        </div>
      </div>
    </div>
  )
}
