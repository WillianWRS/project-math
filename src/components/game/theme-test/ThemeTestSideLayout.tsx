import { AnimatePresence, motion } from '../../../lib/motion'
import type { ReactNode } from 'react'
import { RightSideCardCatalog, type RightCardVariant } from '../side-card-types'
import { SideCardActivateBurst } from '../../motion/SideCardActivateBurst'
import { IconCheckSmall, RightCardIcon } from '../icons'

const layerParallaxTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }

export function ThemeTestSideLayout({
  activeChanger,
  changerBurst,
  changerBurstToken,
  autoCheckEnabled,
  onToggleAutoCheck,
  onToggleChanger,
  onChangerBurstComplete,
  parallaxActive,
  children,
}: {
  activeChanger: RightCardVariant | null
  changerBurst: RightCardVariant | null
  changerBurstToken: number
  autoCheckEnabled: boolean
  onToggleAutoCheck: () => void
  onToggleChanger: (variant: RightCardVariant) => void
  onChangerBurstComplete: () => void
  parallaxActive: boolean
  children: ReactNode
}) {
  return (
    <div className="game-play-row">
      <motion.div
        className="relative z-[1]"
        initial={{ x: -16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: -16, y: 10, opacity: 0.95 }}
        transition={layerParallaxTransition}
      >
        <div className="game-side-cards game-side-cards--left !pointer-events-auto">
          {Array.from({ length: RightSideCardCatalog.cardCount }, (_, index) => (
            <div key={`left-slot-${index}`} className="game-side-card-slot">
              {index === 0 ? (
                <button
                  type="button"
                  onClick={onToggleAutoCheck}
                  className={`game-side-card game-side-card--legendary game-side-card--auto-cycle transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                    autoCheckEnabled ? '' : 'opacity-55 saturate-50'
                  }`}
                  aria-pressed={autoCheckEnabled}
                  aria-label={`Auto-check ${autoCheckEnabled ? 'ativado' : 'desativado'}`}
                >
                  <span className="game-side-card__content">
                    <span className="game-side-card__label game-side-card__label--legendary">AUTO</span>
                    <span className="game-side-card__icon game-side-card__icon--legendary">
                      <IconCheckSmall />
                    </span>
                  </span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="game-play-row__center"
        initial={{ x: 0, y: 14, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 0, y: 14, opacity: 0.96 }}
        transition={layerParallaxTransition}
      >
        {children}
      </motion.div>

      <motion.div
        className="relative z-[1]"
        initial={{ x: 16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 16, y: 10, opacity: 0.95 }}
        transition={layerParallaxTransition}
      >
        <div className="game-side-cards game-side-cards--right !pointer-events-auto">
          {RightSideCardCatalog.cards.map((card) => {
            const active = activeChanger === card.variant
            const changerLocked = activeChanger !== null && !active

            return (
              <div key={card.id} className="game-side-card-slot game-side-card-slot--burst-host">
                <button
                  type="button"
                  disabled={changerLocked}
                  onClick={() => onToggleChanger(card.variant)}
                  className={`game-side-card ${card.styleClass} transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${
                    active ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-charcoal' : ''
                  }${changerLocked ? ' opacity-45 saturate-50 cursor-not-allowed' : ''}`}
                  aria-pressed={active}
                  aria-disabled={changerLocked || undefined}
                  aria-label={`Alternar preview do game changer ${card.id}`}
                >
                  <span className="game-side-card__content">
                    <RightCardIcon variant={card.variant} />
                    {card.label ? (
                      <span className={`game-side-card__label ${card.labelClass ?? ''}`}>{card.label}</span>
                    ) : null}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {changerBurst === card.variant && (
                    <div
                      key={`theme-test-changer-burst-${changerBurstToken}`}
                      className="game-side-activate-burst-slot-overlay"
                      aria-hidden
                    >
                      <SideCardActivateBurst
                        variant={card.variant}
                        onComplete={onChangerBurstComplete}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
