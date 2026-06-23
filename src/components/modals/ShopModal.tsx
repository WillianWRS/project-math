import { THEME_CATALOG } from '../../cosmetics/theme-catalog'
import { motion } from '../../lib/motion'
import type { PlayerData } from '../../platform/storage'
import { Modal } from '../ui/Modal'

interface ShopModalProps {
  open: boolean
  onClose: () => void
  player: PlayerData
}

const stageTransition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }

function stageItem(delay: number, x: number, y: number) {
  return {
    initial: { opacity: 0, x, y, scale: 0.985 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { ...stageTransition, delay },
    },
  } as const
}

export function ShopModal({ open, onClose, player }: ShopModalProps) {
  return (
    <Modal open={open} title="Loja" onClose={onClose}>
      <div className="space-y-3">
        <motion.div
          className="game-modal-card flex items-center justify-between px-3 py-2"
          {...stageItem(0.05, 0, 12)}
        >
          <p className="text-xs uppercase tracking-widest text-charcoal-muted">Saldo</p>
          <p className="font-mono text-lg font-bold text-amber-100">{player.coins} moedas</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {THEME_CATALOG.map((theme, index) => {
            const owned =
              theme.equippableThemeId !== undefined &&
              player.ownedThemeIds.includes(theme.equippableThemeId)
            const locked = !owned
            return (
              <motion.button
                key={theme.id}
                type="button"
                disabled={locked}
                className="game-modal-card overflow-hidden text-left"
                {...stageItem(0.12 + index * 0.06, index % 2 === 0 ? -9 : 9, 14)}
              >
                <div className={`settings-bg-preview ${theme.previewClass}`} aria-hidden />
                <div className="space-y-1 px-3 py-2">
                  <p className="text-sm font-semibold text-stone-100">{theme.name}</p>
                  <p className="text-xs text-charcoal-muted">
                    {owned ? 'Possui' : `${theme.priceCoins} moedas`}
                  </p>
                  {locked && <p className="text-xs text-amber-400">🔒 Em breve</p>}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
