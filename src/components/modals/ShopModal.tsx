import { useState } from 'react'
import type { BackgroundTheme, BadgeVariant } from '../../platform/storage'
import { THEME_CATALOG, getThemePurchasePrice, type ThemeCatalogEntry } from '../../cosmetics/theme-catalog'
import { BADGE_CATALOG, type BadgeCatalogEntry } from '../../cosmetics/badge-catalog'
import { SHOP_AUTO_CHECK_OFFER } from '../../cosmetics/shop-catalog'
import type { PlayerData } from '../../platform/storage'
import { IconAutoCheck } from '../game/icons'
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
  onBuyAutoCheck: (priceDiamonds: number, amount: number) => boolean
}

type PendingPurchase =
  | { kind: 'theme'; item: ThemeCatalogEntry; priceCoins: number }
  | { kind: 'badge'; item: BadgeCatalogEntry; priceCoins: number }
  | { kind: 'autoCheck'; priceDiamonds: number; amount: number }

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

function IconDiamond() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7.5 7.5L12 21 4.5 10.5 12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 10.5h15M8.5 10.5L12 3l3.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
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
  onBuyAutoCheck,
}: ShopModalProps) {
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null)
  const autoCheckPriceDiamonds = SHOP_AUTO_CHECK_OFFER.priceDiamonds
  const autoCheckAmount = SHOP_AUTO_CHECK_OFFER.amount
  const canBuyAutoCheck = player.diamonds >= autoCheckPriceDiamonds

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

    if (pendingPurchase.kind === 'autoCheck') {
      onBuyAutoCheck(pendingPurchase.priceDiamonds, pendingPurchase.amount)
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
          <div className="inline-flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"
                aria-label="Saldo em diamantes"
              >
                <IconDiamond />
              </span>
              <p className="font-mono text-sm font-bold text-sky-100">{player.diamonds}</p>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-300"
                aria-label="Saldo em moedas"
              >
                <IconCoin />
              </span>
              <p className="font-mono text-sm font-bold text-amber-100">{player.coins}</p>
            </div>
          </div>
        }
        onClose={handleClose}
        closeOnBackdrop={!pendingPurchase}
      >
        <div className="space-y-3">
          <p className="text-center text-lg font-extrabold uppercase tracking-[0.22em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            Auto Check
          </p>

          <button
            type="button"
            onClick={() => {
              if (!canBuyAutoCheck) return
              setPendingPurchase({
                kind: 'autoCheck',
                priceDiamonds: autoCheckPriceDiamonds,
                amount: autoCheckAmount,
              })
            }}
            className="shop-theme-row game-modal-card w-full text-left"
          >
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-100">
                <span className="shop-autocheck-offer__icon" aria-hidden>
                  <IconAutoCheck />
                </span>
                <span className="font-mono">{autoCheckAmount}</span>
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-sky-200">
                <span className="text-sky-300">
                  <IconDiamond />
                </span>
                <span className="font-mono text-sm font-bold">{autoCheckPriceDiamonds}</span>
              </p>
            </div>
            {!canBuyAutoCheck ? (
              <p className="border-t border-stone-700/45 px-3 py-2 text-right text-xs text-rose-300">
                Diamantes insuficientes
              </p>
            ) : (
              <p className="border-t border-stone-700/45 px-3 py-2 text-xs text-sky-300">
                Toque pra comprar
              </p>
            )}
          </button>

          <p className="pt-2 text-center text-lg font-extrabold uppercase tracking-[0.22em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
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
                        Toque pra comprar
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
                        Toque pra comprar
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
              ) : pendingPurchase.kind === 'badge' ? (
                <div className="shop-badge-preview" aria-hidden>
                  <span
                    className={`shop-badge-sample game-player-level-badge game-player-level-badge--${pendingPurchase.item.badgeId}`}
                  >
                    Nível 1
                  </span>
                </div>
              ) : (
                <div className="shop-autocheck-offer-preview" aria-hidden>
                  <span className="shop-autocheck-offer__icon shop-autocheck-offer__icon--preview">
                    <IconAutoCheck />
                  </span>
                  <span className="font-mono text-lg font-bold text-stone-100">{pendingPurchase.amount}</span>
                </div>
              )}
              <div className="space-y-1 px-3 py-2">
                <p className="text-sm font-semibold text-stone-100">
                  {pendingPurchase.kind === 'theme'
                    ? pendingPurchase.item.name
                    : pendingPurchase.kind === 'badge'
                      ? pendingPurchase.item.name
                      : 'Auto Check'}
                </p>
                <p className="text-xs text-charcoal-muted">
                  {pendingPurchase.kind === 'autoCheck'
                    ? `${pendingPurchase.priceDiamonds} diamantes`
                    : `${pendingPurchase.priceCoins} moedas`}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-200">
              {pendingPurchase.kind === 'autoCheck' ? (
                <>
                  Deseja comprar{' '}
                  <span className="font-semibold text-amber-100">
                    {pendingPurchase.amount} auto check
                  </span>{' '}
                  por{' '}
                  <span className="font-mono font-semibold text-sky-100">
                    {pendingPurchase.priceDiamonds}
                  </span>{' '}
                  diamantes?
                </>
              ) : (
                <>
                  Deseja comprar {pendingPurchase.kind === 'theme' ? 'o tema' : 'a tag de nível'}{' '}
                  <span className="font-semibold text-amber-100">{pendingPurchase.item.name}</span> por{' '}
                  <span className="font-mono font-semibold text-amber-100">{pendingPurchase.priceCoins}</span> moedas?
                </>
              )}
            </p>
            <p className="text-xs text-charcoal-muted">
              Saldo após a compra:{' '}
              <span className="font-mono text-stone-300">
                {pendingPurchase.kind === 'autoCheck'
                  ? `${Math.max(0, player.diamonds - pendingPurchase.priceDiamonds)} diamantes`
                  : `${Math.max(0, player.coins - pendingPurchase.priceCoins)} moedas`}
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
