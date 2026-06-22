import { motion, useReducedMotion } from '../../lib/motion'
import { CURTAIN_TRANSITION } from '../../lib/motion-presets'

interface CurtainOverlayProps {
  open: boolean
  initialOpen?: boolean
}

function CurtainPanel({
  side,
  open,
  initialOpen,
}: {
  side: 'left' | 'right'
  open: boolean
  initialOpen: boolean
}) {
  const reduceMotion = useReducedMotion()
  const closedX = '0%'
  const openX = side === 'left' ? '-100%' : '100%'
  const transition = reduceMotion ? { duration: 0 } : CURTAIN_TRANSITION

  return (
    <motion.div
      className={`curtain-panel curtain-panel-${side}`}
      initial={initialOpen ? { x: openX } : { x: closedX }}
      animate={{ x: open ? openX : closedX }}
      transition={transition}
      aria-hidden
    >
      <div className="curtain-panel__surface" />
      <div className="curtain-panel__finisher" />
      <div className="curtain-panel__seam" />
    </motion.div>
  )
}

export function CurtainOverlay({ open, initialOpen = false }: CurtainOverlayProps) {
  return (
    <>
      <CurtainPanel side="left" open={open} initialOpen={initialOpen} />
      <CurtainPanel side="right" open={open} initialOpen={initialOpen} />
    </>
  )
}
