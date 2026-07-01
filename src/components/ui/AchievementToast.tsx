import { AnimatePresence, motion } from '../../lib/motion'
import { IconGear, IconTrophy } from '../game/icons'

export type AchievementToastVariant = 'achievement' | 'coming-soon'

interface AchievementToastProps {
  visible: boolean
  message?: string
  variant?: AchievementToastVariant
}

export function AchievementToast({
  visible,
  message,
  variant = 'achievement',
}: AchievementToastProps) {
  const resolvedMessage =
    message ?? (variant === 'coming-soon' ? 'Em breve' : 'Conquista realizada!')

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={`achievement-toast${
            variant === 'coming-soon' ? ' achievement-toast--coming-soon' : ''
          }`}
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
        >
          <span className="achievement-toast__icon" aria-hidden>
            {variant === 'coming-soon' ? <IconGear size={16} /> : <IconTrophy size={16} />}
          </span>
          <span className="achievement-toast__text">{resolvedMessage}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
