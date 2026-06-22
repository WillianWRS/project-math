import type { BackgroundTheme } from '../../platform/storage'
import { THEME_CATALOG } from '../../cosmetics/theme-catalog'
import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'
import { Modal } from '../ui/Modal'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  soundEnabled: boolean
  onSoundChange: (enabled: boolean) => void
  devModeEnabled: boolean
  onDevModeChange: (enabled: boolean) => void
  backgroundTheme: BackgroundTheme
  ownedThemeIds: BackgroundTheme[]
  onBackgroundThemeChange: (theme: BackgroundTheme) => void
}

function ThemeSelectionRing({ water }: { water: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={`pointer-events-none absolute inset-0 rounded-[0.875rem] border-2 ${
        water ? 'border-sky-400/80' : 'border-amber-400/80'
      }`}
      animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [1, 1.015, 1] }}
      transition={pulseRepeat(2.2)}
      aria-hidden
    />
  )
}

export function SettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundChange,
  devModeEnabled,
  onDevModeChange,
  backgroundTheme,
  ownedThemeIds,
  onBackgroundThemeChange,
}: SettingsModalProps) {
  const reduceMotion = useReducedMotion()
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
                  className={`game-modal-card settings-theme-card relative flex flex-col overflow-hidden text-left ${
                    selected ? '' : 'hover:border-stone-600/50'
                  }`}
                >
                  {selected && <ThemeSelectionRing water={themeId === 'water'} />}
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
          <motion.button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            onClick={() => onSoundChange(!soundEnabled)}
            className={`relative h-8 w-14 rounded-full ${
              soundEnabled ? 'bg-amber-500' : 'bg-charcoal-elevated ring-1 ring-stone-700/50'
            }`}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            <motion.span
              className="absolute top-1 h-6 w-6 rounded-full bg-stone-100 shadow"
              animate={{ left: soundEnabled ? '1.75rem' : '0.25rem' }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.button>
        </label>

        <label className="game-modal-card flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-medium text-stone-200">Dev Mode</p>
            <p className="text-xs text-charcoal-muted">Exibe botões Benchmark e Theme Test no menu</p>
          </div>
          <motion.button
            type="button"
            role="switch"
            aria-checked={devModeEnabled}
            onClick={() => onDevModeChange(!devModeEnabled)}
            className={`relative h-8 w-14 rounded-full ${
              devModeEnabled ? 'bg-amber-500' : 'bg-charcoal-elevated ring-1 ring-stone-700/50'
            }`}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          >
            <motion.span
              className="absolute top-1 h-6 w-6 rounded-full bg-stone-100 shadow"
              animate={{ left: devModeEnabled ? '1.75rem' : '0.25rem' }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.button>
        </label>
      </div>
    </Modal>
  )
}
