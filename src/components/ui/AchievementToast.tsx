import { AnimatePresence, motion } from '../../lib/motion'
import { IconTrophy } from '../game/icons'

interface AchievementToastProps {
  visible: boolean
  message?: string
}

export function AchievementToast({ visible, message = 'Conquista realizada!' }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="achievement-toast"
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
        >
          <span className="achievement-toast__icon" aria-hidden>
            <IconTrophy size={16} />
          </span>
          <span className="achievement-toast__text">{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
