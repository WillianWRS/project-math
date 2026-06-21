import type { BackgroundTheme } from '../../platform/storage'
import { THEME_CATALOG } from '../../cosmetics/theme-catalog'
import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
  backgroundTheme: BackgroundTheme
  ownedThemeIds: BackgroundTheme[]
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
}

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundChange,
  backgroundTheme,
  ownedThemeIds,
  onBackgroundThemeChange,
}: SettingsModalProps) {
  const ownedThemes = THEME_CATALOG.filter(
    (theme) =>
      theme.equippableThemeId !== undefined && ownedThemeIds.includes(theme.equippableThemeId),
  )

  return (
    <Modal open={open} title="Configurações" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-stone-200">Fundo do jogo</p>
          <div className="grid grid-cols-2 gap-3">
            {ownedThemes.map((option) => {
              const themeId = option.equippableThemeId as BackgroundTheme
              const selected = backgroundTheme === themeId
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onBackgroundThemeChange(themeId)}
                  className={`game-modal-card settings-theme-card flex flex-col overflow-hidden text-left transition-colors ${
                    selected
                      ? themeId === 'water'
                        ? 'settings-theme-card--selected-water'
                        : 'settings-theme-card--selected-default'
                      : 'hover:border-stone-600/50'
                  }`}
                >
                  <div className={`settings-bg-preview ${option.previewClass}`} aria-hidden />
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-stone-200">{option.name}</p>
                    <p className="text-xs text-charcoal-muted">Tema desbloqueado</p>
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
