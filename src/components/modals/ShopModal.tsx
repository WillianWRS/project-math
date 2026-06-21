import { THEME_CATALOG } from '../../cosmetics/theme-catalog'
import type { PlayerData } from '../../platform/storage'
import { Modal } from '../ui/Modal'

interface ShopModalProps {
  open: boolean
  onClose: () => void
  player: PlayerData
}

export function ShopModal({ open, onClose, player }: ShopModalProps) {
  return (
    <Modal open={open} title="Loja" onClose={onClose}>
      <div className="space-y-3">
        <div className="game-modal-card flex items-center justify-between px-3 py-2">
          <p className="text-xs uppercase tracking-widest text-charcoal-muted">Saldo</p>
          <p className="font-mono text-lg font-bold text-amber-100">{player.coins} moedas</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {THEME_CATALOG.map((theme) => {
            const owned =
              theme.equippableThemeId !== undefined &&
              player.ownedThemeIds.includes(theme.equippableThemeId)
            const locked = !owned
            return (
              <button
                key={theme.id}
                type="button"
                disabled={locked}
                className="game-modal-card overflow-hidden text-left"
              >
                <div className={`settings-bg-preview ${theme.previewClass}`} aria-hidden />
                <div className="space-y-1 px-3 py-2">
                  <p className="text-sm font-semibold text-stone-100">{theme.name}</p>
                  <p className="text-xs text-charcoal-muted">
                    {owned ? 'Possui' : `${theme.priceCoins} moedas`}
                  </p>
                  {locked && <p className="text-xs text-amber-400">🔒 Em breve</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
