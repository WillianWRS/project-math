import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { loadTopScores, type ScoreRecord } from '../../platform/storage'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function HistoryModal({ open, onClose }: HistoryModalProps) {
  const [topScores, setTopScores] = useState<ScoreRecord[]>([])

  useEffect(() => {
    if (!open) return
    setTopScores(loadTopScores())
  }, [open])

  return (
    <Modal open={open} title="Recordes" onClose={onClose}>
      {topScores.length > 0 ? (
        <ol className="space-y-2">
          {topScores.map((record, index) => (
            <li
              key={record.id}
              className={`game-modal-card flex items-center justify-between gap-3 p-3 ${
                index === 0 ? 'ring-1 ring-amber-400/35' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                    index === 0
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-stone-800/80 text-stone-400'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xl font-bold text-amber-100">{record.score}</p>
                  <p className="truncate text-xs text-charcoal-muted">{formatDate(record.date)}</p>
                </div>
              </div>
              {index === 0 && (
                <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-widest text-amber-400/90">
                  Top 1
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-charcoal-muted">
          Nenhuma partida registrada ainda. Jogue uma partida para entrar no top 5.
        </p>
      )}
    </Modal>
  )
}
