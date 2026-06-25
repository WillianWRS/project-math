import { useState } from 'react'
import type { BackgroundTheme } from '../../platform/storage'
import { THEME_CATALOG, getThemePurchasePrice, type ThemeCatalogEntry } from '../../cosmetics/theme-catalog'
import { motion } from '../../lib/motion'
import type { PlayerData } from '../../platform/storage'
import { Modal } from '../ui/Modal'

interface ShopModalProps {
  open: boolean
  onClose: () => void
  player: PlayerData
  godModeEnabled: boolean
  onBuyTheme: (theme: BackgroundTheme, priceCoins: number) => boolean
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

function IconShop() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10h16L18.5 5.5H5.5L4 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9h12v-9M9 19v-4h6v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10V7.5M12 10V7M15.5 10V7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ShopModal({ open, onClose, player, godModeEnabled, onBuyTheme }: ShopModalProps) {
  const [pendingTheme, setPendingTheme] = useState<ThemeCatalogEntry | null>(null)

  const handleClose = () => {
    setPendingTheme(null)
    onClose()
  }

  const getPrice = (priceCoins: number) => getThemePurchasePrice(priceCoins, godModeEnabled)
  const pendingPrice = pendingTheme ? getPrice(pendingTheme.priceCoins) : 0

  const handleConfirmPurchase = () => {
    if (!pendingTheme?.equippableThemeId) return
    onBuyTheme(pendingTheme.equippableThemeId, pendingTheme.priceCoins)
    setPendingTheme(null)
  }

  return (
    <>
      <Modal
        open={open}
        title="Loja"
        titleIcon={<IconShop />}
        onClose={handleClose}
        closeOnBackdrop={!pendingTheme}
      >
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
              const themeId = theme.equippableThemeId
              const canOwn = themeId !== undefined
              const owned = canOwn && player.ownedThemeIds.includes(themeId)
              const purchasable = canOwn && !owned
              const priceCoins = getPrice(theme.priceCoins)
              const canBuy = purchasable && player.coins >= priceCoins
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  disabled={!canBuy}
                  onClick={() => {
                    if (!canBuy || themeId === undefined) return
                    setPendingTheme(theme)
                  }}
                  className="game-modal-card overflow-hidden text-left"
                  {...stageItem(0.12 + index * 0.06, index % 2 === 0 ? -9 : 9, 14)}
                >
                  <div className={`settings-bg-preview ${theme.previewClass}`} aria-hidden />
                  <div className="space-y-1 px-3 py-2">
                    <p className="text-sm font-semibold text-stone-100">{theme.name}</p>
                    <p className="text-xs text-charcoal-muted">
                      {owned ? 'Possui' : canOwn ? `${priceCoins} moedas` : 'Em breve'}
                    </p>
                    {owned && <p className="text-xs text-emerald-400">Desbloqueado</p>}
                    {!owned && canOwn && (
                      <p className={`text-xs ${canBuy ? 'text-amber-300' : 'text-rose-300'}`}>
                        {canBuy ? 'Toque para comprar' : 'Moedas insuficientes'}
                      </p>
                    )}
                    {!canOwn && <p className="text-xs text-amber-400">🔒 Em breve</p>}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </Modal>

      <Modal
        open={open && pendingTheme !== null}
        title="Confirmar compra"
        onClose={() => setPendingTheme(null)}
        stackLevel={1}
      >
        {pendingTheme && (
          <div className="space-y-4">
            <div className="game-modal-card overflow-hidden">
              <div className={`settings-bg-preview ${pendingTheme.previewClass}`} aria-hidden />
              <div className="space-y-1 px-3 py-2">
                <p className="text-sm font-semibold text-stone-100">{pendingTheme.name}</p>
                <p className="text-xs text-charcoal-muted">{pendingPrice} moedas</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-200">
              Deseja comprar o tema <span className="font-semibold text-amber-100">{pendingTheme.name}</span> por{' '}
              <span className="font-mono font-semibold text-amber-100">{pendingPrice}</span> moedas?
            </p>
            <p className="text-xs text-charcoal-muted">
              Saldo após a compra:{' '}
              <span className="font-mono text-stone-300">
                {Math.max(0, player.coins - pendingPrice)} moedas
              </span>
            </p>
            <button
              type="button"
              onClick={handleConfirmPurchase}
              className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950"
            >
              Comprar
            </button>
            <button
              type="button"
              onClick={() => setPendingTheme(null)}
              className="game-btn-push game-btn-push-secondary w-full rounded-xl bg-charcoal-elevated px-4 py-3 text-sm font-semibold text-stone-100"
            >
              Cancelar
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
