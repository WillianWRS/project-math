import { useState } from 'react'
import type { BackgroundTheme, BadgeVariant } from '../../platform/storage'
import { THEME_CATALOG, getThemePurchasePrice, type ThemeCatalogEntry } from '../../cosmetics/theme-catalog'
import { BADGE_CATALOG, type BadgeCatalogEntry } from '../../cosmetics/badge-catalog'
import type { PlayerData } from '../../platform/storage'
import { Modal } from '../ui/Modal'

interface ShopModalProps {
  open: boolean
  onClose: () => void
  player: PlayerData
  godModeEnabled: boolean
  onBuyTheme: (theme: BackgroundTheme, priceCoins: number) => boolean
  onEquipTheme: (theme: BackgroundTheme) => void
  onBuyBadge: (badge: BadgeVariant, priceCoins: number) => boolean
  onEquipBadge: (badge: BadgeVariant) => void
}

type PendingPurchase =
  | { kind: 'theme'; item: ThemeCatalogEntry; priceCoins: number }
  | { kind: 'badge'; item: BadgeCatalogEntry; priceCoins: number }

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

function IconCoin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v8M9.5 10.5h5M9.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCheckSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12.5l3.5 3.5L18 8"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconLockSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ShopModal({
  open,
  onClose,
  player,
  godModeEnabled,
  onBuyTheme,
  onEquipTheme,
  onBuyBadge,
  onEquipBadge,
}: ShopModalProps) {
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null)

  const handleClose = () => {
    setPendingPurchase(null)
    onClose()
  }

  const getPrice = (priceCoins: number) => getThemePurchasePrice(priceCoins, godModeEnabled)

  const handleConfirmPurchase = () => {
    if (!pendingPurchase) return
    if (pendingPurchase.kind === 'theme') {
      const themeId = pendingPurchase.item.equippableThemeId
      if (!themeId) return
      const purchased = onBuyTheme(themeId, pendingPurchase.item.priceCoins)
      if (purchased) onEquipTheme(themeId)
      setPendingPurchase(null)
      return
    }

    const purchased = onBuyBadge(pendingPurchase.item.badgeId, pendingPurchase.priceCoins)
    if (purchased) onEquipBadge(pendingPurchase.item.badgeId)
    setPendingPurchase(null)
  }

  return (
    <>
      <Modal
        open={open}
        title="Loja"
        titleIcon={<IconShop />}
        headerRight={
          <div className="inline-flex items-center gap-2">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-300"
              aria-label="Saldo em moedas"
            >
              <IconCoin />
            </span>
            <p className="font-mono text-sm font-bold text-amber-100">{player.coins}</p>
          </div>
        }
        onClose={handleClose}
        closeOnBackdrop={!pendingPurchase}
      >
        <div className="space-y-3">
          <p className="text-center text-lg font-extrabold uppercase tracking-[0.22em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            Temas
          </p>

          <div className="space-y-2">
            {THEME_CATALOG.map((theme) => {
              const themeId = theme.equippableThemeId
              const canOwn = themeId !== undefined
              const owned = canOwn && player.ownedThemeIds.includes(themeId)
              const selected = owned && themeId === player.equippedThemeId
              const purchasable = canOwn && !owned
              const priceCoins = getPrice(theme.priceCoins)
              const canBuy = purchasable && player.coins >= priceCoins
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    if (themeId === undefined) return
                    if (owned) {
                      onEquipTheme(themeId)
                      return
                    }
                    if (!canBuy) return
                    setPendingPurchase({ kind: 'theme', item: theme, priceCoins })
                  }}
                  className={`shop-theme-row game-modal-card w-full text-left ${
                    selected ? 'shop-theme-row--selected' : ''
                  }`}
                >
                  <div className={`settings-bg-preview ${theme.previewClass}`} aria-hidden />
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <p className="text-sm font-semibold text-stone-100">{theme.name}</p>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300'
                          : !owned
                            ? 'border-stone-600/70 bg-charcoal text-stone-300'
                            : 'border-transparent bg-transparent text-transparent'
                      }`}
                      aria-hidden
                    >
                      {selected ? <IconCheckSmall /> : !owned ? <IconLockSmall /> : null}
                    </span>
                  </div>
                  {!owned && canOwn ? (
                    <div className="flex items-center justify-between gap-3 border-t border-stone-700/45 px-3 py-2">
                      <p className="inline-flex items-center gap-1.5 text-xs text-amber-200">
                        <span className="text-amber-300">
                          <IconCoin />
                        </span>
                        <span className="font-mono">{priceCoins}</span>
                      </p>
                      <p className={`text-xs ${canBuy ? 'text-amber-300' : 'text-rose-300'}`}>
                        toque pra comprar
                      </p>
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>

          <p className="pt-2 text-center text-lg font-extrabold uppercase tracking-[0.22em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            Tag de Nível
          </p>
          <div className="space-y-2">
            {BADGE_CATALOG.map((badge) => {
              const owned = player.ownedBadgeIds.includes(badge.badgeId)
              const selected = owned && badge.badgeId === player.equippedBadgeId
              const priceCoins = getPrice(badge.priceCoins)
              const canBuy = !owned && player.coins >= priceCoins
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => {
                    if (owned) {
                      onEquipBadge(badge.badgeId)
                      return
                    }
                    if (!canBuy) return
                    setPendingPurchase({ kind: 'badge', item: badge, priceCoins })
                  }}
                  className={`shop-theme-row game-modal-card w-full text-left ${
                    selected ? 'shop-theme-row--selected' : ''
                  }`}
                >
                  <div className="shop-badge-preview" aria-hidden>
                    <span className={`shop-badge-sample game-player-level-badge game-player-level-badge--${badge.badgeId}`}>
                      Nível 1
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <p className="text-sm font-semibold text-stone-100">{badge.name}</p>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300'
                          : !owned
                            ? 'border-stone-600/70 bg-charcoal text-stone-300'
                            : 'border-transparent bg-transparent text-transparent'
                      }`}
                      aria-hidden
                    >
                      {selected ? <IconCheckSmall /> : !owned ? <IconLockSmall /> : null}
                    </span>
                  </div>
                  {!owned ? (
                    <div className="flex items-center justify-between gap-3 border-t border-stone-700/45 px-3 py-2">
                      <p className="inline-flex items-center gap-1.5 text-xs text-amber-200">
                        <span className="text-amber-300">
                          <IconCoin />
                        </span>
                        <span className="font-mono">{priceCoins}</span>
                      </p>
                      <p className={`text-xs ${canBuy ? 'text-amber-300' : 'text-rose-300'}`}>
                        toque pra comprar
                      </p>
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </Modal>

      <Modal
        open={pendingPurchase !== null}
        title="Confirmar compra"
        onClose={() => setPendingPurchase(null)}
        stackLevel={1}
      >
        {pendingPurchase && (
          <div className="space-y-4">
            <div className="game-modal-card overflow-hidden">
              {pendingPurchase.kind === 'theme' ? (
                <div className={`settings-bg-preview ${pendingPurchase.item.previewClass}`} aria-hidden />
              ) : (
                <div className="shop-badge-preview" aria-hidden>
                  <span
                    className={`shop-badge-sample game-player-level-badge game-player-level-badge--${pendingPurchase.item.badgeId}`}
                  >
                    Nível 1
                  </span>
                </div>
              )}
              <div className="space-y-1 px-3 py-2">
                <p className="text-sm font-semibold text-stone-100">{pendingPurchase.item.name}</p>
                <p className="text-xs text-charcoal-muted">{pendingPurchase.priceCoins} moedas</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-200">
              Deseja comprar {pendingPurchase.kind === 'theme' ? 'o tema' : 'a tag de nível'}{' '}
              <span className="font-semibold text-amber-100">{pendingPurchase.item.name}</span> por{' '}
              <span className="font-mono font-semibold text-amber-100">{pendingPurchase.priceCoins}</span> moedas?
            </p>
            <p className="text-xs text-charcoal-muted">
              Saldo após a compra:{' '}
              <span className="font-mono text-stone-300">
                {Math.max(0, player.coins - pendingPurchase.priceCoins)} moedas
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
              onClick={() => setPendingPurchase(null)}
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
