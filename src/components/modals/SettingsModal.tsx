import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
}

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundChange,
}: SettingsModalProps) {
  return (
    <Modal open={open} title="Configurações" onClose={onClose}>
      <label className="game-modal-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="font-medium text-stone-200">Som</p>
          <p className="text-xs text-charcoal-muted">Efeitos de acerto, erro e level up</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          onClick={() => onSoundChange(!soundEnabled)}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            soundEnabled ? 'bg-amber-500' : 'bg-charcoal-elevated ring-1 ring-stone-700/50'
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-stone-100 shadow transition-transform ${
              soundEnabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </label>
    </Modal>
  )
}
