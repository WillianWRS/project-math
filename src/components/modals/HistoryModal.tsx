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
    <Modal open={open} title="Recorde" onClose={onClose}>
      {highScore ? (
        <div className="game-modal-card space-y-3 p-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Melhor pontuação</p>
            <p className="font-mono text-3xl font-bold text-amber-300">{highScore.score}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-charcoal-muted">Data</p>
            <p className="text-sm text-stone-300">{formatDate(highScore.date)}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-charcoal-muted">
          Nenhuma partida registrada ainda. Jogue uma partida para estabelecer seu recorde.
        </p>
      )}
    </Modal>
  )
}
