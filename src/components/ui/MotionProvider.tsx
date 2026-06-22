import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'
import { APP_EASE } from '../../lib/motion-transitions'

interface MotionProviderProps {
  children: ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.28, ease: APP_EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
