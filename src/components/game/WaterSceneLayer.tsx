import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'

export function WaterSceneLayer() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="game-water-layer pointer-events-none absolute inset-0 z-0" aria-hidden>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 35%, rgba(30, 100, 150, 0.08) 100%)',
        }}
        animate={reduceMotion ? undefined : { opacity: [0.45, 0.7, 0.45] }}
        transition={pulseRepeat(5)}
      />
    </div>
  )
}
