import { useEffect, useRef, useState } from 'react'
import { Modal } from '../ui/Modal'

interface RewardedAutoCheckModalProps {
  open: boolean
  onClose: () => void
  watchedToday: number
  onWatchAd: () => Promise<'completed' | 'dismissed' | 'limit'>
}

export function RewardedAutoCheckModal({
  open,
  onClose,
  watchedToday,
  onWatchAd,
}: RewardedAutoCheckModalProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const limitReached = watchedToday >= 5

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  function stopProgressTimer() {
    if (progressTimerRef.current === null) return
    window.clearInterval(progressTimerRef.current)
    progressTimerRef.current = null
  }

  function progressColor(ratio: number): string {
    const t = Math.max(0, Math.min(1, ratio))
    const start = { r: 255, g: 255, b: 255 }
    const end = { r: 245, g: 158, b: 11 }
    const r = Math.round(start.r + (end.r - start.r) * t)
    const g = Math.round(start.g + (end.g - start.g) * t)
    const b = Math.round(start.b + (end.b - start.b) * t)
    return `rgb(${r}, ${g}, ${b})`
  }

  async function handleWatch() {
    if (limitReached || loading) return
    setStatusMessage(null)
    setLoading(true)
    setProgress(0)
    const startedAt = performance.now()
    stopProgressTimer()
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      setProgress(Math.min(1, elapsed / 2000))
    }, 16)

    const result = await onWatchAd()
    stopProgressTimer()
    setProgress(1)
    setLoading(false)
    if (result === 'completed') {
      setStatusMessage('Auto-check adicionado! Você pode assistir outro anúncio.')
      return
    }
    if (result === 'limit') {
      setStatusMessage('Limite diário atingido.')
      return
    }
    setStatusMessage('Anúncio fechado antes da recompensa.')
  }

  return (
    <Modal open={open} title="Ganhar auto-check" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-stone-200">
          Assista um anúncio simulado para receber 1 auto-check.
        </p>
        <p className="text-xs uppercase tracking-widest text-charcoal-muted">Hoje: {watchedToday}/5</p>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-charcoal">
            <div
              className="h-full transition-[width,background-color] duration-75 ease-linear"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: progressColor(progress),
              }}
            />
          </div>
          <p className="text-xs text-charcoal-muted">
            {loading ? 'Simulando anúncio (2s)...' : 'Pronto para assistir'}
          </p>
        </div>

        {statusMessage && <p className="text-xs text-emerald-400">{statusMessage}</p>}

        <button
          type="button"
          disabled={limitReached || loading}
          onClick={handleWatch}
          className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 disabled:opacity-60"
        >
          Ver anúncio
        </button>
      </div>
    </Modal>
  )
}
