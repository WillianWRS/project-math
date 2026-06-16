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
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-800/60 px-4 py-3">
        <div>
          <p className="font-medium text-white">Som</p>
          <p className="text-xs text-slate-400">Efeitos de acerto, erro e level up</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          onClick={() => onSoundChange(!soundEnabled)}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            soundEnabled ? 'bg-sky-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              soundEnabled ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </label>
    </Modal>
  )
}
