import { motion, useReducedMotion } from '../../lib/motion'
import { pulseRepeat } from '../../lib/motion-presets'

interface WaterSceneLayerProps {
  paused?: boolean
}

export function WaterSceneLayer({ paused = false }: WaterSceneLayerProps) {
  const reduceMotion = useReducedMotion()
  const motionOff = reduceMotion || paused

  return (
    <div className="game-water-layer pointer-events-none absolute inset-0 z-0" aria-hidden>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 35%, rgba(30, 100, 150, 0.08) 100%)',
        }}
        animate={motionOff ? false : { opacity: [0.45, 0.7, 0.45] }}
        transition={motionOff ? { duration: 0 } : pulseRepeat(5)}
      />
    </div>
  )
}
