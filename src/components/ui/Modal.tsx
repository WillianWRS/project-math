import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '../../lib/motion'
import { ModalScrollArea } from './ModalScrollArea'

interface ModalProps {
  open: boolean
  title: string
  titleIcon?: ReactNode
  onClose: () => void
  children: ReactNode
  closeOnBackdrop?: boolean
  sheetAnchor?: 'top' | 'bottom'
  showCloseButton?: boolean
  stackLevel?: number
}

export function Modal({
  open,
  title,
  titleIcon,
  onClose,
  children,
  closeOnBackdrop = true,
  sheetAnchor = 'bottom',
  showCloseButton = true,
  stackLevel = 0,
}: ModalProps) {
  const reduceMotion = useReducedMotion()
  const isTopSheet = sheetAnchor === 'top'
  const layerZ = 80 + stackLevel * 10

  if (!open) return null

  const layerPhase = 'game-modal-layer--open'
  const instantClass = reduceMotion ? ' game-modal-layer--instant' : ''

  return createPortal(
    <div
      className={`game-modal-layer ${layerPhase}${instantClass}`}
      style={{ zIndex: layerZ }}
      data-sheet-anchor={isTopSheet ? 'top' : 'bottom'}
    >
      <button
        type="button"
        aria-label="Fechar modal"
        className="game-modal-backdrop fixed inset-0 border-0 p-0"
        style={{ zIndex: 0 }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`game-modal-panel ${
          isTopSheet ? 'game-modal-panel--sheet-top' : 'game-modal-panel--sheet'
        } fixed inset-x-0 ${isTopSheet ? '' : 'bottom-0'} mx-auto flex max-h-[min(88dvh,40rem)] w-full max-w-sm flex-col p-5 ${
          isTopSheet ? '' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
        }`}
        style={{ zIndex: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`mb-4 flex items-center gap-3${showCloseButton ? ' justify-between' : ''}`}
        >
          <h2
            id="modal-title"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-stone-200"
          >
            {titleIcon ? <span className="game-modal-title__icon">{titleIcon}</span> : null}
            <span>{title}</span>
          </h2>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="game-btn-push flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal-elevated text-stone-400 ring-1 ring-stone-700/50 transition hover:text-stone-100"
              aria-label="Fechar"
            >
              ✕
            </button>
          )}
        </div>
        <ModalScrollArea>{children}</ModalScrollArea>
      </div>
    </div>,
    document.body,
  )
}
