import type { BackgroundTheme } from '../../platform/storage'
import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
  backgroundTheme: BackgroundTheme
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
}

const BACKGROUND_OPTIONS: {
  id: BackgroundTheme
  label: string
  description: string
  previewClass: string
}[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'Fundo escuro com linhas',
    previewClass: 'settings-bg-preview settings-bg-preview--default',
  },
  {
    id: 'water',
    label: 'Água',
    description: 'Fundo azul claro',
    previewClass: 'settings-bg-preview settings-bg-preview--water',
  },
]

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundChange,
  backgroundTheme,
  onBackgroundThemeChange,
}: SettingsModalProps) {
  return (
    <Modal open={open} title="Configurações" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-stone-200">Fundo do jogo</p>
          <div className="grid grid-cols-2 gap-3">
            {BACKGROUND_OPTIONS.map((option) => {
              const selected = backgroundTheme === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onBackgroundThemeChange(option.id)}
                  className={`game-modal-card settings-theme-card flex flex-col overflow-hidden text-left transition-colors ${
                    selected
                      ? option.id === 'water'
                        ? 'settings-theme-card--selected-water'
                        : 'settings-theme-card--selected-default'
                      : 'hover:border-stone-600/50'
                  }`}
                >
                  <div className={option.previewClass} aria-hidden />
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-stone-200">{option.label}</p>
                    <p className="text-xs text-charcoal-muted">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

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
      </div>
    </Modal>
  )
}
