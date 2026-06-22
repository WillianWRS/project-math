import { AnimatePresence, motion } from '../../lib/motion'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({ open, title, onClose, children, closeOnBackdrop = true }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <div className="absolute inset-0 bg-charcoal/82" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="game-modal-panel relative flex max-h-[min(90dvh,42rem)] w-full max-w-sm flex-col p-5"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
