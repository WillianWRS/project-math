import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '../../lib/motion'
import { ModalScrollArea } from './ModalScrollArea'

interface ModalProps {
  open: boolean
  title: string
  titleIcon?: ReactNode
  headerRight?: ReactNode
  onClose: () => void
  children: ReactNode
  closeOnBackdrop?: boolean
  sheetAnchor?: 'top' | 'bottom'
  showCloseButton?: boolean
  stackLevel?: number
}

const MODAL_CLOSE_ANIMATION_MS = 140

export function Modal({
  open,
  title,
  titleIcon,
  headerRight,
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
  const [phase, setPhase] = useState<'open' | 'closing' | 'closed'>(open ? 'open' : 'closed')
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let frame = 0
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (open) {
      frame = window.requestAnimationFrame(() => setPhase('open'))
      return () => window.cancelAnimationFrame(frame)
    }

    if (phase === 'closed') return
    if (reduceMotion) {
      frame = window.requestAnimationFrame(() => setPhase('closed'))
      return () => window.cancelAnimationFrame(frame)
    }

    frame = window.requestAnimationFrame(() => setPhase('closing'))
    closeTimerRef.current = window.setTimeout(() => {
      setPhase('closed')
      closeTimerRef.current = null
    }, MODAL_CLOSE_ANIMATION_MS)
    return () => window.cancelAnimationFrame(frame)
  }, [open, phase, reduceMotion])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  if (phase === 'closed') return null

  const layerPhase = phase === 'closing' ? 'game-modal-layer--closing' : 'game-modal-layer--open'
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
        <div className={`mb-4 flex items-center gap-3${showCloseButton ? ' justify-between' : ''}`}>
          <h2
            id="modal-title"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-stone-200"
          >
            {titleIcon ? <span className="game-modal-title__icon">{titleIcon}</span> : null}
            <span>{title}</span>
          </h2>
          <div className="ml-auto flex items-center gap-2">
            {headerRight}
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
        </div>
        <ModalScrollArea>{children}</ModalScrollArea>
      </div>
    </div>,
    document.body,
  )
}
