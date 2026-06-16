import { Modal } from '../ui/Modal'
import type { HighScoreRecord } from '../../platform/storage'

interface HistoryModalProps {
  open: boolean
  onClose: () => void
  highScore: HighScoreRecord | null
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function HistoryModal({ open, onClose, highScore }: HistoryModalProps) {
  return (
    <Modal open={open} title="Histórico" onClose={onClose}>
      {highScore ? (
        <div className="space-y-3 rounded-xl bg-slate-800/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Melhor score</p>
            <p className="font-mono text-3xl font-bold text-sky-300">{highScore.score}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Data</p>
            <p className="text-sm text-slate-200">{formatDate(highScore.date)}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-slate-400">
          Nenhuma partida registrada ainda. Jogue uma partida para estabelecer seu recorde.
        </p>
      )}
    </Modal>
  )
}
