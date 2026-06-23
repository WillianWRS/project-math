import { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from '../../lib/motion'
import { Modal } from '../ui/Modal'

const AUTO_DECLINE_MS = 5000

interface AutoCheckTimeoutModalProps {
  open: boolean
  walletAutoChecks: number
  onUse: () => void
  onDecline: () => void
}

export function AutoCheckTimeoutModal({
  open,
  walletAutoChecks,
  onUse,
  onDecline,
}: AutoCheckTimeoutModalProps) {
  const reduceMotion = useReducedMotion()
  const resolvedRef = useRef(false)

  const resolveOnce = useCallback(
    (action: () => void) => {
      if (resolvedRef.current) return
      resolvedRef.current = true
      action()
    },
    [],
  )

  useEffect(() => {
    if (!open) {
      resolvedRef.current = false
      return
    }

    resolvedRef.current = false
    const timeoutId = window.setTimeout(() => {
      resolveOnce(onDecline)
    }, AUTO_DECLINE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [open, onDecline, resolveOnce])

  return (
    <Modal
      open={open}
      title="Tempo esgotado!"
      onClose={() => resolveOnce(onDecline)}
      closeOnBackdrop={false}
      sheetAnchor="top"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-stone-200">
          Você tem {walletAutoChecks} auto-check(s). Usar um para continuar?
        </p>
        <button
          type="button"
          onClick={() => resolveOnce(onUse)}
          className="game-btn-push game-btn-push-amber w-full rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-amber-950"
        >
          Usar auto-check
        </button>
        <button
          type="button"
          onClick={() => resolveOnce(onDecline)}
          className="autocheck-timeout-decline game-btn-push game-btn-push-amber relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold"
        >
          <span
            className={`autocheck-timeout-decline__fill${
              reduceMotion ? ' autocheck-timeout-decline__fill--instant' : ''
            }`}
            aria-hidden
          />
          <span className="autocheck-timeout-decline__label relative z-[1]">Encerrar partida</span>
        </button>
      </div>
    </Modal>
  )
}
