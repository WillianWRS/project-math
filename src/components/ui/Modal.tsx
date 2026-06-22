import { AnimatePresence, motion, useReducedMotion } from '../../lib/motion'
import { MODAL_BACKDROP_TRANSITION, MODAL_PANEL_TRANSITION } from '../../lib/motion-transitions'
import type { ReactNode } from 'react'
import { ModalScrollArea } from './ModalScrollArea'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({ open, title, onClose, children, closeOnBackdrop = true }: ModalProps) {
  const reduceMotion = useReducedMotion()

  const panelTransition = reduceMotion ? { duration: 0 } : MODAL_PANEL_TRANSITION
  const backdropTransition = reduceMotion ? { duration: 0 } : MODAL_BACKDROP_TRANSITION
  const panelInitial = reduceMotion ? false : { y: '100%' }
  const panelAnimate = { y: 0 }
  const panelExit = reduceMotion ? undefined : { y: '100%' }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="modal-backdrop"
            type="button"
            aria-label="Fechar modal"
            className="game-modal-backdrop fixed inset-0 z-[70] border-0 bg-charcoal/82 p-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="game-modal-panel game-modal-panel--sheet fixed inset-x-0 bottom-0 z-[71] mx-auto flex max-h-[min(88dvh,40rem)] w-full max-w-sm flex-col p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="modal-title"
                className="text-sm font-bold uppercase tracking-[0.18em] text-stone-200"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="game-btn-push flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal-elevated text-stone-400 ring-1 ring-stone-700/50 transition hover:text-stone-100"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <ModalScrollArea>{children}</ModalScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
