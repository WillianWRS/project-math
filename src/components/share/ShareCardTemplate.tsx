interface ShareCardTemplateProps {
  playerName: string
  level: number
  score: number
  durationText: string
}

export function ShareCardTemplate({ playerName, level, score, durationText }: ShareCardTemplateProps) {
  return (
    <div
      id="share-card-template"
      style={{
        width: 1080,
        height: 1350,
        position: 'fixed',
        left: 0,
        top: 0,
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        contentVisibility: 'auto',
        zIndex: -1,
        backgroundColor: '#141210',
        background: 'linear-gradient(180deg, #1f1b18 0%, #141210 100%)',
        color: '#f5f5f4',
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <p style={{ fontSize: 48, letterSpacing: 8, margin: 0 }}>PROJECT MATH</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 52, fontWeight: 700 }}>
        <span>{playerName}</span>
        <span>Nv. {level}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 180, fontWeight: 800 }}>{score}</p>
        <p style={{ margin: 0, fontSize: 44, letterSpacing: 4 }}>PONTOS</p>
      </div>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 48 }}>⏱ {durationText}</p>
    </div>
  )
}
