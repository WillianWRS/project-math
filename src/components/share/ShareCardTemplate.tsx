import type { BackgroundTheme } from '../../platform/storage'
import { getShareCardThemeStyle } from '../../lib/share-card-theme'
import { xpProgressInLevel } from '../../engine/player-level'

interface ShareCardTemplateProps {
  theme: BackgroundTheme
  playerName: string
  level: number
  xp: number
  avatarDataUrl: string | null
  score: number
  durationText: string
  xpGained: number
  coinsGained: number
  goalCompleted: boolean
}

function avatarBorderLevelFromPlayerLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level >= 50) return 5
  if (level >= 30) return 4
  if (level >= 20) return 3
  if (level >= 10) return 2
  return 1
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

function ShareCardDecor() {
  return (
    <>
      <div className="share-card__glow" aria-hidden />
    </>
  )
}

export function ShareCardTemplate({
  theme,
  playerName,
  level,
  xp,
  avatarDataUrl,
  score,
  durationText,
  xpGained,
  coinsGained,
  goalCompleted,
}: ShareCardTemplateProps) {
  const themeStyle = getShareCardThemeStyle(theme)
  const avatarBorderLevel = avatarBorderLevelFromPlayerLevel(level)
  const progress = xpProgressInLevel(xp)
  const ratio = progress.needed > 0 ? progress.current / progress.needed : 0
  const ringSize = 57
  const ringStroke = 3.4
  const radius = (ringSize - ringStroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, ratio)))

  return (
    <div
      id="share-card-template"
      className={`share-card ${themeStyle.rootClass}`}
      data-capture-background={themeStyle.captureBackground}
    >
      <ShareCardDecor />

      <p className="share-card__brand">Project Math</p>

      <div className={`share-card__panel ${themeStyle.panelClass}`}>
        <div className="share-card__player-head">
          <div className="share-card__player-avatar-wrap">
            <p className="share-card__player-name-badge">{playerName}</p>
            <div className={`share-card__player-avatar share-card__player-avatar--lvl-${avatarBorderLevel}`}>
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="" className="share-card__player-avatar-photo" draggable={false} />
              ) : (
                <span className="share-card__player-avatar-icon">
                  <ShareIconPerson />
                </span>
              )}
            </div>
            <div className="share-card__player-level-chip" aria-hidden>
              <svg className="share-card__player-level-chip-ring" width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <circle
                  className="share-card__player-level-chip-track"
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={ringStroke}
                  stroke="rgba(251, 191, 36, 0.32)"
                />
                <circle
                  className="share-card__player-level-chip-progress"
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={ringStroke}
                  stroke="#fbbf24"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                />
                <text
                  className="share-card__player-level-chip-value"
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="30"
                  fontWeight="800"
                  fill="#fbbf24"
                  stroke="rgba(0, 0, 0, 0.6)"
                  strokeWidth="1.5"
                  paintOrder="stroke"
                >
                  {level}
                </text>
              </svg>
            </div>
          </div>
        </div>

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
            Meta diária completa! <span className="share-card__reward-xp">+200 XP</span> e +10 moedas
          </p>
        ) : null}
      </div>
    </div>
  )
}
