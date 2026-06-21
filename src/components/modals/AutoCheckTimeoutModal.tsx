import { Modal } from '../ui/Modal'

interface AutoCheckTimeoutModalProps {
  open: boolean
  walletAutoChecks: number
  onUse: () => void
  onDecline: () => void
}

export function AutoCheckTimeoutModal({
  open,
  walletAutoChecks,
  onUse,
  onDecline,
}: AutoCheckTimeoutModalProps) {
  return (
    <Modal open={open} title="Tempo esgotado!" onClose={onDecline} closeOnBackdrop={false}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-stone-200">
          Você tem {walletAutoChecks} auto-check(s). Usar um para continuar?
        </p>
        <button
          type="button"
          onClick={onUse}
          className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950"
        >
          Usar auto-check
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
        >
          Encerrar partida
        </button>
      </div>
    </Modal>
  )
}
