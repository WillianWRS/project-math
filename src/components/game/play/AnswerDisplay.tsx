import { AnimatePresence, motion } from '../../../lib/motion'
import type { ReactNode, RefObject } from 'react'
import { SLIDE_TRANSITION } from '../../../lib/motion-presets'
import { OPERATOR_COLOR_CLASS } from '../../../engine/operation-generator'
import { SUBMIT_LOCK_MS } from '../../../engine/game-state-machine'
import type { Operation } from '../../../engine/types'

const slideTransition = SLIDE_TRANSITION
const answerFlashTransition = { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const }
const wrongAnswerShakeTransition = { duration: SUBMIT_LOCK_MS / 1000, ease: [0.22, 1, 0.36, 1] as const }
const wrongAnswerShakeX = [0, -10, 10, -8, 8, -4, 4, 0]

export function NumberShake({
  active,
  shakeKey,
  children,
}: {
  active: boolean
  shakeKey: number
  children: ReactNode
}) {
  return (
    <motion.div
      key={shakeKey}
      className="relative h-full w-full"
      animate={active ? { x: wrongAnswerShakeX } : { x: 0 }}
      transition={wrongAnswerShakeTransition}
    >
      {children}
    </motion.div>
  )
}

export function SlideValue({
  value,
  className,
  slotClassName,
  shakeActive = false,
  shakeKey = 0,
}: {
  value: string | number
  className?: string
  slotClassName?: string
  shakeActive?: boolean
  shakeKey?: number
}) {
  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <NumberShake active={shakeActive} shakeKey={shakeKey}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.p
            key={value}
            className={`absolute inset-x-0 font-mono tabular-nums ${className ?? ''}`}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={slideTransition}
          >
            {value}
          </motion.p>
        </AnimatePresence>
      </NumberShake>
    </div>
  )
}

export function OperationValue({
  operation,
  className,
  slotClassName,
  waterLight = false,
  sunsetLight = false,
  forestLight = false,
  violetLight = false,
  emberLight = false,
  neonLight = false,
  midnightLight = false,
  retroLight = false,
  fourSecondsLight = false,
  timesDivLight = false,
  plusLight = false,
  minusLight = false,
  shakeActive = false,
  shakeKey = 0,
}: {
  operation: Operation
  className?: string
  slotClassName?: string
  waterLight?: boolean
  sunsetLight?: boolean
  forestLight?: boolean
  violetLight?: boolean
  emberLight?: boolean
  neonLight?: boolean
  midnightLight?: boolean
  retroLight?: boolean
  fourSecondsLight?: boolean
  timesDivLight?: boolean
  plusLight?: boolean
  minusLight?: boolean
  shakeActive?: boolean
  shakeKey?: number
}) {
  const key = `${operation.operator} ${operation.operand}`
  const operandClass = fourSecondsLight
    ? 'text-orange-900'
    : timesDivLight
      ? 'text-blue-900'
      : plusLight
        ? 'text-emerald-900'
        : minusLight
          ? 'text-rose-900'
          : waterLight
            ? 'text-sky-800'
            : sunsetLight
              ? 'text-orange-900'
              : forestLight
                ? 'text-amber-950'
                : violetLight
                  ? 'text-violet-950'
                  : emberLight
                    ? 'text-orange-950'
                    : neonLight
                      ? 'text-sky-100'
                      : midnightLight
                        ? 'text-slate-100'
                        : retroLight
                          ? 'text-amber-950'
                          : 'text-stone-300'

  return (
    <div className={`relative overflow-hidden ${slotClassName ?? ''}`}>
      <NumberShake active={shakeActive} shakeKey={shakeKey}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.p
            key={key}
            className={`absolute inset-x-0 flex items-center justify-center gap-1.5 font-mono tabular-nums tracking-wide ${className ?? ''}`}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              y: '-100%',
              opacity: 0,
              transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <span
              className={`text-4xl font-bold leading-none ${OPERATOR_COLOR_CLASS[operation.operator]}`}
            >
              {operation.operator}
            </span>
            <span className={`text-3xl font-normal leading-none ${operandClass}`}>
              {operation.operand}
            </span>
          </motion.p>
        </AnimatePresence>
      </NumberShake>
    </div>
  )
}

export function AnswerDigitPulse({ value, autoCheck = false }: { value: string; autoCheck?: boolean }) {
  const toneClass = autoCheck ? ' answer-digit-pulse--amber' : ''

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden
    >
      <motion.span
        className={`answer-digit-pulse-ring answer-digit-pulse-ring--inner${toneClass} absolute z-[1] font-mono text-4xl font-bold tabular-nums`}
        initial={{ scale: 1, opacity: 0.95 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={answerFlashTransition}
      >
        {value}
      </motion.span>
      <motion.span
        className={`answer-digit-pulse-ring answer-digit-pulse-ring--outer${toneClass} absolute z-[1] font-mono text-4xl font-bold tabular-nums`}
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.15, opacity: 0 }}
        transition={{ ...answerFlashTransition, duration: 0.62, delay: 0.05 }}
      >
        {value}
      </motion.span>
      <motion.span
        className={`absolute z-[2] font-mono text-4xl font-bold tabular-nums ${
          autoCheck ? 'text-amber-400' : 'text-amber-50'
        }`}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0, opacity: 0 }}
        transition={answerFlashTransition}
        style={{ transformOrigin: 'center center' }}
      >
        {value}
      </motion.span>
    </div>
  )
}

export function PerfectAnswerBadge({ token }: { token: number }) {
  return (
    <motion.div
      key={`perfect-${token}`}
      className="pointer-events-none absolute left-1/2 top-1 z-[5] -translate-x-1/2"
      initial={{ opacity: 0, y: 16, scale: 0.84 }}
      animate={{
        opacity: [0, 1, 0],
        y: [16, -4, -30],
        scale: [0.84, 1, 0.95],
      }}
      transition={{ duration: 1, times: [0, 0.28, 1], ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <motion.span
        className="game-perfect-badge__trail game-perfect-badge__trail--inner"
        initial={{ opacity: 0.82, scaleX: 0.72 }}
        animate={{ opacity: [0.82, 0], scaleX: [0.72, 1.34] }}
        transition={{ duration: 1, times: [0, 1], ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="game-perfect-badge__trail game-perfect-badge__trail--outer"
        initial={{ opacity: 0.58, scaleX: 0.66 }}
        animate={{ opacity: [0.58, 0], scaleX: [0.66, 1.52] }}
        transition={{ duration: 1, times: [0, 1], ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="game-perfect-badge">PERFEITO</span>
    </motion.div>
  )
}

export function AnswerDisplay({
  value,
  disabled,
  shake,
  shakeKey = 0,
  answerFlash,
  answerFlashAuto,
  flashKey,
  perfectAnswerToken,
  waterLight = false,
  sunsetLight = false,
  forestLight = false,
  violetLight = false,
  emberLight = false,
  neonLight = false,
  midnightLight = false,
  retroLight = false,
  fourSecondsLight = false,
  timesDivLight = false,
  plusLight = false,
  minusLight = false,
  pulse = false,
  slotRef,
}: {
  value: string
  disabled: boolean
  shake: boolean
  shakeKey?: number
  answerFlash: string | null
  answerFlashAuto: boolean
  flashKey: number
  perfectAnswerToken: number
  waterLight?: boolean
  sunsetLight?: boolean
  forestLight?: boolean
  violetLight?: boolean
  emberLight?: boolean
  neonLight?: boolean
  midnightLight?: boolean
  retroLight?: boolean
  fourSecondsLight?: boolean
  timesDivLight?: boolean
  plusLight?: boolean
  minusLight?: boolean
  pulse?: boolean
  slotRef?: RefObject<HTMLDivElement | null>
}) {
  const displayValue = answerFlash ? '' : value || '·'
  const gameChangerActive = fourSecondsLight || timesDivLight || plusLight || minusLight

  return (
    <div
      className={`relative overflow-visible px-3 py-3${
        waterLight
          ? ' game-answer-row--water'
          : sunsetLight
            ? ' game-answer-row--sunset'
            : forestLight
              ? ' game-answer-row--forest'
              : violetLight
                ? ' game-answer-row--violet'
                : emberLight
                  ? ' game-answer-row--ember'
                  : neonLight
                    ? ' game-answer-row--neon'
                    : midnightLight
                      ? ' game-answer-row--midnight'
                      : retroLight
                        ? ' game-answer-row--retro'
                        : ''
      }${gameChangerActive ? ' game-answer-row--game-changer' : ''}${
        pulse ? ' game-tutorial-field-pulse' : ''
      }`}
    >
      {perfectAnswerToken > 0 && <PerfectAnswerBadge token={perfectAnswerToken} />}
      <AnimatePresence>
        {answerFlash && (
          <AnswerDigitPulse
            key={`${flashKey}-${answerFlash}`}
            value={answerFlash}
            autoCheck={answerFlashAuto}
          />
        )}
      </AnimatePresence>
      <div>
        <div
          ref={slotRef}
          role="status"
          aria-live="polite"
          aria-label={`Resposta: ${value || 'vazio'}`}
          className={`game-answer-slot flex h-16 w-full items-center justify-center bg-transparent text-center font-mono text-4xl font-bold tabular-nums ${
            answerFlash
              ? 'text-transparent'
              : shake
                ? 'text-rose-400'
                : value
                  ? fourSecondsLight
                    ? 'text-orange-950'
                    : timesDivLight
                      ? 'text-blue-950'
                      : plusLight
                        ? 'text-emerald-950'
                        : minusLight
                          ? 'text-rose-950'
                          : waterLight
                            ? 'text-sky-900'
                            : sunsetLight
                              ? 'text-orange-950'
                              : forestLight
                                ? 'text-amber-950'
                                : violetLight
                                  ? 'text-violet-950'
                                  : emberLight
                                    ? 'text-orange-950'
                                    : neonLight
                                      ? 'text-sky-100'
                                      : midnightLight
                                        ? 'text-slate-100'
                                        : retroLight
                                          ? 'text-amber-950'
                                          : 'text-amber-50'
                  : fourSecondsLight
                    ? 'text-orange-800/35'
                    : timesDivLight
                      ? 'text-blue-800/35'
                      : plusLight
                        ? 'text-emerald-800/35'
                        : minusLight
                          ? 'text-rose-800/35'
                          : waterLight
                            ? 'text-sky-700/35'
                            : sunsetLight
                              ? 'text-orange-900/35'
                              : forestLight
                                ? 'text-amber-900/35'
                                : violetLight
                                  ? 'text-violet-900/35'
                                  : emberLight
                                    ? 'text-orange-900/35'
                                    : neonLight
                                      ? 'text-sky-200/40'
                                      : midnightLight
                                        ? 'text-slate-300/40'
                                        : retroLight
                                          ? 'text-amber-900/35'
                                          : 'text-charcoal-muted/50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <NumberShake active={shake} shakeKey={shakeKey}>
            <span>{displayValue}</span>
          </NumberShake>
        </div>
      </div>
    </div>
  )
}
