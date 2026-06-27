import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
  devModeEnabled: boolean
  onDevModeChange: (enabled: boolean) => void
  godModeEnabled: boolean
  onGodModeChange: (enabled: boolean) => void
  showGodModeToggle: boolean
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19 12a7.2 7.2 0 00.1-1l2-1.5-2-3.5-2.3 1a7 7 0 00-1.7-1L15 3h-6l-.1 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.5 2 1.5a7.2 7.2 0 00.1 1 7.2 7.2 0 00-.1 1l-2 1.5 2 3.5 2.3-1a7 7 0 001.7 1L9 21h6l.1-2.5a7 7 0 001.7-1l2.3 1 2-3.5-2-1.5a7.2 7.2 0 00-.1-1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full ${
        checked ? 'bg-amber-500' : 'bg-charcoal-elevated ring-1 ring-stone-700/50'
      }`}
    >
      <span
        className="absolute top-1 h-6 w-6 rounded-full bg-stone-100 shadow transition-[left] duration-200 ease-out"
        style={{ left: checked ? '1.75rem' : '0.25rem' }}
      />
    </button>
  )
}

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundChange,
  devModeEnabled,
  onDevModeChange,
  godModeEnabled,
  onGodModeChange,
  showGodModeToggle,
}: SettingsModalProps) {
  return (
    <Modal open={open} title="Configurações" titleIcon={<IconGear />} onClose={onClose}>
      <div className="space-y-4">
        <label className="game-modal-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-medium text-stone-200">Som</p>
            <p className="text-xs text-charcoal-muted">Efeitos de acerto, erro e level up</p>
          </div>
          <SettingsToggle checked={soundEnabled} onChange={onSoundChange} />
        </label>

        <label className="game-modal-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-medium text-stone-200">Dev Mode</p>
            <p className="text-xs text-charcoal-muted">Exibe botões Benchmark e Theme Test no menu</p>
          </div>
          <SettingsToggle checked={devModeEnabled} onChange={onDevModeChange} />
        </label>

        {showGodModeToggle && (
          <label className="game-modal-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-stone-200">God Mode</p>
              <p className="text-xs text-charcoal-muted">Libera todos os temas feitos na configuração</p>
            </div>
            <SettingsToggle checked={godModeEnabled} onChange={onGodModeChange} />
          </label>
        )}
      </div>
    </Modal>
  )
}
