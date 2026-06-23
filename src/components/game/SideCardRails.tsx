import { AnimatePresence, motion } from '../../lib/motion'
import { SideCardPulse } from '../motion/SideCardPulse'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import {
  RightSideCardCatalog,
  type RightCardVariant,
} from './side-card-types'

const SIDE_CARD_COUNT = RightSideCardCatalog.cardCount

const SIDE_CYCLE_BUTTON_SIZE = 40
const AUTO_CYCLE_ENTER_OFFSET_X = -80
const FOUR_SECONDS_ENTER_OFFSET_X = 80
const SIDE_CYCLE_EXIT_OFFSET_Y = 20

interface SideCycleMergeKeyframes {
  startLeft: number
  startTop: number
  targetLeft: number
  targetTop: number
}

type RightCycleVariant = 'timer' | 'mult-div' | 'cap-up' | 'cap-down'

const sideCardTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }
const layerParallaxTransition = { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const }

interface PlayFieldsSideLayoutProps {
  autoCheckCycleStep?: number | null
  fourSecondsCycleStep?: number | null
  fourSecondsGameChangerRemaining?: number
  timesDivCycleStep?: number | null
  timesDivGameChangerRemaining?: number
  plusCycleStep?: number | null
  plusGameChangerActive?: boolean
  minusCycleStep?: number | null
  minusGameChangerActive?: boolean
  answerFieldRef?: RefObject<HTMLDivElement | null>
  parallaxActive?: boolean
  children: ReactNode
}

function IconCheckSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 12.5l3.5 3.5L18 8"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5l6 7H6l6-7z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19l6-7H6l6 7z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RightCardIcon({ variant }: { variant: RightCardVariant }) {
  const iconClass = `game-side-card__icon game-side-card__icon--${variant}`

  if (variant === 'cap-up') {
    return (
      <span className={iconClass}>
        <IconArrowUp />
      </span>
    )
  }
  if (variant === 'cap-down') {
    return (
      <span className={iconClass}>
        <IconArrowDown />
      </span>
    )
  }
  if (variant === 'timer') {
    return (
      <span className={iconClass}>
        <IconClock />
      </span>
    )
  }
  return <span className={`${iconClass} game-side-card__icon--glyph`}>×÷</span>
}

function useSideSlotTops(sideCount: number) {
  const playRowRef = useRef<HTMLDivElement>(null)
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)
  const rightSlotRefs = useRef<(HTMLDivElement | null)[]>([])
  const [slotTops, setSlotTops] = useState<number[] | null>(null)

  const measureRafRef = useRef(0)

  const measure = useCallback(() => {
    const leftColumn = leftColumnRef.current
    if (!leftColumn) return

    const leftTop = leftColumn.getBoundingClientRect().top
    const next = Array.from({ length: sideCount }, (_, index) => {
      const slot = rightSlotRefs.current[index]
      if (!slot) return 0
      const rect = slot.getBoundingClientRect()
      return rect.top - leftTop + (rect.height - SIDE_CYCLE_BUTTON_SIZE) / 2
    })

    if (!rightSlotRefs.current.every(Boolean)) return

    setSlotTops((current) => {
      if (current && current.every((value, index) => Math.abs(value - next[index]) < 0.5)) {
        return current
      }
      return next
    })
  }, [sideCount])

  const scheduleMeasure = useCallback(() => {
    cancelAnimationFrame(measureRafRef.current)
    measureRafRef.current = requestAnimationFrame(measure)
  }, [measure])

  useLayoutEffect(() => {
    scheduleMeasure()
    const onResize = () => scheduleMeasure()
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(measureRafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [scheduleMeasure])

  const setRightSlotRef = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      rightSlotRefs.current[index] = element
      scheduleMeasure()
    },
    [scheduleMeasure],
  )

  return { playRowRef, leftColumnRef, rightColumnRef, setRightSlotRef, slotTops }
}

function AutoCheckCycleTraveler({
  step,
  slotTops,
}: {
  step: number
  slotTops: number[]
}) {
  const top = slotTops[step - 1] ?? slotTops[0]
  const exitTop = (slotTops[3] ?? top) + SIDE_CYCLE_EXIT_OFFSET_Y

  return (
    <motion.div
      key="auto-check-cycle-traveler"
      className="game-side-card game-side-card--legendary game-side-card--auto-cycle game-side-auto-cycle-traveler"
      initial={{ x: AUTO_CYCLE_ENTER_OFFSET_X, y: slotTops[0], opacity: 0 }}
      animate={{ x: 0, y: top, opacity: 1 }}
      exit={{ x: 0, y: exitTop, opacity: 0 }}
      transition={sideCardTransition}
    >
      <SideCardPulse iconPulse="scale">
        <span className="game-side-card__label game-side-card__label--legendary">AUTO</span>
        <span className="game-side-card__icon game-side-card__icon--legendary">
          <IconCheckSmall />
        </span>
      </SideCardPulse>
    </motion.div>
  )
}

function FourSecondsPreCycleTraveler({
  step,
  slotTops,
}: {
  step: number
  slotTops: number[]
}) {
  const top = slotTops[step - 1] ?? slotTops[0]
  const exitTop = (slotTops[3] ?? top) + SIDE_CYCLE_EXIT_OFFSET_Y

  return (
    <motion.div
      key="four-seconds-pre-cycle-traveler"
      className="game-side-card game-side-card--timer game-side-card--auto-cycle game-side-auto-cycle-traveler game-side-auto-cycle-traveler--right"
      initial={{ x: FOUR_SECONDS_ENTER_OFFSET_X, y: slotTops[0], opacity: 0 }}
      animate={{ x: 0, y: top, opacity: 1 }}
      exit={{ x: 0, y: exitTop, opacity: 0 }}
      transition={sideCardTransition}
    >
      <SideCardPulse iconPulse="scale">
        <RightCardIcon variant="timer" />
        <span className="game-side-card__label game-side-card__label--timer">4s</span>
      </SideCardPulse>
    </motion.div>
  )
}

function TimesDivPreCycleTraveler({
  step,
  slotTops,
}: {
  step: number
  slotTops: number[]
}) {
  const top = slotTops[step - 1] ?? slotTops[0]
  const exitTop = (slotTops[3] ?? top) + SIDE_CYCLE_EXIT_OFFSET_Y

  return (
    <motion.div
      key="times-div-pre-cycle-traveler"
      className="game-side-card game-side-card--mult-div game-side-card--auto-cycle game-side-auto-cycle-traveler game-side-auto-cycle-traveler--right"
      initial={{ x: FOUR_SECONDS_ENTER_OFFSET_X, y: slotTops[0], opacity: 0 }}
      animate={{ x: 0, y: top, opacity: 1 }}
      exit={{ x: 0, y: exitTop, opacity: 0 }}
      transition={sideCardTransition}
    >
      <SideCardPulse iconPulse="glyph">
        <RightCardIcon variant="mult-div" />
      </SideCardPulse>
    </motion.div>
  )
}

function PlusPreCycleTraveler({
  step,
  slotTops,
}: {
  step: number
  slotTops: number[]
}) {
  const top = slotTops[step - 1] ?? slotTops[0]
  const exitTop = (slotTops[3] ?? top) + SIDE_CYCLE_EXIT_OFFSET_Y

  return (
    <motion.div
      key="plus-pre-cycle-traveler"
      className="game-side-card game-side-card--cap-up game-side-card--auto-cycle game-side-auto-cycle-traveler game-side-auto-cycle-traveler--right"
      initial={{ x: FOUR_SECONDS_ENTER_OFFSET_X, y: slotTops[0], opacity: 0 }}
      animate={{ x: 0, y: top, opacity: 1 }}
      exit={{ x: 0, y: exitTop, opacity: 0 }}
      transition={sideCardTransition}
    >
      <SideCardPulse iconPulse="up">
        <RightCardIcon variant="cap-up" />
        <span className="game-side-card__label game-side-card__label--cap-up">99</span>
      </SideCardPulse>
    </motion.div>
  )
}

function MinusPreCycleTraveler({
  step,
  slotTops,
}: {
  step: number
  slotTops: number[]
}) {
  const top = slotTops[step - 1] ?? slotTops[0]
  const exitTop = (slotTops[3] ?? top) + SIDE_CYCLE_EXIT_OFFSET_Y

  return (
    <motion.div
      key="minus-pre-cycle-traveler"
      className="game-side-card game-side-card--cap-down game-side-card--auto-cycle game-side-auto-cycle-traveler game-side-auto-cycle-traveler--right"
      initial={{ x: FOUR_SECONDS_ENTER_OFFSET_X, y: slotTops[0], opacity: 0 }}
      animate={{ x: 0, y: top, opacity: 1 }}
      exit={{ x: 0, y: exitTop, opacity: 0 }}
      transition={sideCardTransition}
    >
      <SideCardPulse iconPulse="down">
        <RightCardIcon variant="cap-down" />
        <span className="game-side-card__label game-side-card__label--cap-down">1</span>
      </SideCardPulse>
    </motion.div>
  )
}

function RightCycleMergeTraveler({
  variant,
  keyframes,
  onComplete,
}: {
  variant: RightCycleVariant
  keyframes: SideCycleMergeKeyframes
  onComplete: () => void
}) {
  const styleClass =
    variant === 'timer'
      ? 'game-side-card--timer'
      : variant === 'mult-div'
        ? 'game-side-card--mult-div'
        : variant === 'cap-up'
          ? 'game-side-card--cap-up'
          : 'game-side-card--cap-down'

  return (
    <motion.div
      className={`game-side-card ${styleClass} game-side-card--auto-cycle game-side-merge-traveler`}
      style={{ left: keyframes.startLeft, top: keyframes.startTop }}
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
      }}
      animate={{
        x: keyframes.targetLeft - keyframes.startLeft,
        y: keyframes.targetTop - keyframes.startTop,
        opacity: 0,
        scale: 0.72,
      }}
      transition={sideCardTransition}
      onAnimationComplete={onComplete}
    >
      <div className="game-side-card__content">
        {variant === 'timer' ? (
          <>
            <RightCardIcon variant="timer" />
            <span className="game-side-card__label game-side-card__label--timer">4s</span>
          </>
        ) : variant === 'mult-div' ? (
          <RightCardIcon variant="mult-div" />
        ) : variant === 'cap-up' ? (
          <>
            <RightCardIcon variant="cap-up" />
            <span className="game-side-card__label game-side-card__label--cap-up">99</span>
          </>
        ) : (
          <>
            <RightCardIcon variant="cap-down" />
            <span className="game-side-card__label game-side-card__label--cap-down">1</span>
          </>
        )}
      </div>
    </motion.div>
  )
}

function useSideCycleMergeExit(
  cycleStep: number | null,
  gameChangerRemaining: number,
  slotTops: number[] | null,
  playRowRef: RefObject<HTMLDivElement | null>,
  leftColumnRef: RefObject<HTMLDivElement | null>,
  rightColumnRef: RefObject<HTMLDivElement | null>,
  answerFieldRef: RefObject<HTMLDivElement | null>,
) {
  const prevStepRef = useRef(cycleStep)
  const [mergeExit, setMergeExit] = useState<SideCycleMergeKeyframes | null>(null)
  const mergeFrameRef = useRef(0)

  useEffect(() => {
    const prevStep = prevStepRef.current
    prevStepRef.current = cycleStep

    if (prevStep !== 4 || cycleStep !== null || gameChangerRemaining <= 0 || !slotTops) {
      return
    }

    mergeFrameRef.current = requestAnimationFrame(() => {
      const playRow = playRowRef.current
      const answerField = answerFieldRef.current
      const rightColumn = rightColumnRef.current
      const leftColumn = leftColumnRef.current
      if (!playRow || !answerField || !rightColumn || !leftColumn) return

      const playRowRect = playRow.getBoundingClientRect()
      const answerRect = answerField.getBoundingClientRect()
      const rightColumnRect = rightColumn.getBoundingClientRect()
      const columnTop = leftColumn.getBoundingClientRect().top - playRowRect.top
      const half = SIDE_CYCLE_BUTTON_SIZE / 2

      setMergeExit({
        startLeft: rightColumnRect.left - playRowRect.left,
        startTop: columnTop + slotTops[3],
        targetLeft: answerRect.left + answerRect.width / 2 - playRowRect.left - half,
        targetTop: answerRect.top + answerRect.height / 2 - playRowRect.top - half,
      })
    })

    return () => {
      cancelAnimationFrame(mergeFrameRef.current)
    }
  }, [
    cycleStep,
    gameChangerRemaining,
    slotTops,
    playRowRef,
    leftColumnRef,
    rightColumnRef,
    answerFieldRef,
  ])

  const clearMergeExit = useCallback(() => setMergeExit(null), [])

  return { mergeExit, clearMergeExit }
}

function LeftAutoCheckColumn({
  autoCheckCycleStep,
  slotTops,
  columnRef,
}: {
  autoCheckCycleStep: number | null
  slotTops: number[] | null
  columnRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={columnRef} className="game-side-cards game-side-cards--left game-side-auto-cycle-column">
      <AnimatePresence initial={false}>
        {autoCheckCycleStep !== null && slotTops && (
          <AutoCheckCycleTraveler step={autoCheckCycleStep} slotTops={slotTops} />
        )}
      </AnimatePresence>
    </div>
  )
}

function RightSideCardColumn({
  fourSecondsCycleStep,
  timesDivCycleStep,
  plusCycleStep,
  minusCycleStep,
  slotTops,
  columnRef,
  setSlotRef,
}: {
  fourSecondsCycleStep: number | null
  timesDivCycleStep: number | null
  plusCycleStep: number | null
  minusCycleStep: number | null
  slotTops: number[] | null
  columnRef: RefObject<HTMLDivElement | null>
  setSlotRef: (index: number) => (element: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={columnRef}
      className="game-side-cards game-side-cards--right game-side-auto-cycle-column"
      aria-hidden
    >
      {RightSideCardCatalog.cards.map((card, index) => (
        <div key={card.id} ref={setSlotRef(index)} className="game-side-card-slot" />
      ))}

      <AnimatePresence initial={false}>
        {fourSecondsCycleStep !== null && slotTops && (
          <FourSecondsPreCycleTraveler step={fourSecondsCycleStep} slotTops={slotTops} />
        )}
        {timesDivCycleStep !== null && slotTops && (
          <TimesDivPreCycleTraveler step={timesDivCycleStep} slotTops={slotTops} />
        )}
        {plusCycleStep !== null && slotTops && (
          <PlusPreCycleTraveler step={plusCycleStep} slotTops={slotTops} />
        )}
        {minusCycleStep !== null && slotTops && (
          <MinusPreCycleTraveler step={minusCycleStep} slotTops={slotTops} />
        )}
      </AnimatePresence>
    </div>
  )
}

export const PlayFieldsSideLayout = memo(function PlayFieldsSideLayout({
  autoCheckCycleStep = null,
  fourSecondsCycleStep = null,
  fourSecondsGameChangerRemaining = 0,
  timesDivCycleStep = null,
  timesDivGameChangerRemaining = 0,
  plusCycleStep = null,
  plusGameChangerActive = false,
  minusCycleStep = null,
  minusGameChangerActive = false,
  answerFieldRef,
  parallaxActive = true,
  children,
}: PlayFieldsSideLayoutProps) {
  const { playRowRef, leftColumnRef, rightColumnRef, setRightSlotRef, slotTops } =
    useSideSlotTops(SIDE_CARD_COUNT)

  const emptyAnswerRef = { current: null } as RefObject<HTMLDivElement | null>
  const resolvedAnswerRef = answerFieldRef ?? emptyAnswerRef

  const { mergeExit: fourSecondsMergeExit, clearMergeExit: clearFourSecondsMergeExit } =
    useSideCycleMergeExit(
      fourSecondsCycleStep,
      fourSecondsGameChangerRemaining,
      slotTops,
      playRowRef,
      leftColumnRef,
      rightColumnRef,
      resolvedAnswerRef,
    )

  const { mergeExit: timesDivMergeExit, clearMergeExit: clearTimesDivMergeExit } =
    useSideCycleMergeExit(
      timesDivCycleStep,
      timesDivGameChangerRemaining,
      slotTops,
      playRowRef,
      leftColumnRef,
      rightColumnRef,
      resolvedAnswerRef,
    )

  const { mergeExit: plusMergeExit, clearMergeExit: clearPlusMergeExit } = useSideCycleMergeExit(
    plusCycleStep,
    plusGameChangerActive ? 1 : 0,
    slotTops,
    playRowRef,
    leftColumnRef,
    rightColumnRef,
    resolvedAnswerRef,
  )

  const { mergeExit: minusMergeExit, clearMergeExit: clearMinusMergeExit } = useSideCycleMergeExit(
    minusCycleStep,
    minusGameChangerActive ? 1 : 0,
    slotTops,
    playRowRef,
    leftColumnRef,
    rightColumnRef,
    resolvedAnswerRef,
  )

  return (
    <div ref={playRowRef} className="game-play-row">
      <motion.div
        className="relative z-[1]"
        initial={{ x: -16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: -14, y: 10, opacity: 0.96 }}
        transition={layerParallaxTransition}
      >
        <LeftAutoCheckColumn
          autoCheckCycleStep={autoCheckCycleStep}
          slotTops={slotTops}
          columnRef={leftColumnRef}
        />
      </motion.div>
      <motion.div
        className="game-play-row__center"
        initial={{ x: 0, y: 14, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 0, y: 12, opacity: 0.96 }}
        transition={layerParallaxTransition}
      >
        {children}
      </motion.div>
      <motion.div
        className="relative z-[1]"
        initial={{ x: 16, y: 10, opacity: 0 }}
        animate={parallaxActive ? { x: 0, y: 0, opacity: 1 } : { x: 14, y: 10, opacity: 0.96 }}
        transition={layerParallaxTransition}
      >
        <RightSideCardColumn
          fourSecondsCycleStep={fourSecondsCycleStep}
          timesDivCycleStep={timesDivCycleStep}
          plusCycleStep={plusCycleStep}
          minusCycleStep={minusCycleStep}
          slotTops={slotTops}
          columnRef={rightColumnRef}
          setSlotRef={setRightSlotRef}
        />
      </motion.div>

      <AnimatePresence>
        {fourSecondsMergeExit && (
          <RightCycleMergeTraveler
            key="four-seconds-merge-traveler"
            variant="timer"
            keyframes={fourSecondsMergeExit}
            onComplete={clearFourSecondsMergeExit}
          />
        )}
        {timesDivMergeExit && (
          <RightCycleMergeTraveler
            key="times-div-merge-traveler"
            variant="mult-div"
            keyframes={timesDivMergeExit}
            onComplete={clearTimesDivMergeExit}
          />
        )}
        {plusMergeExit && (
          <RightCycleMergeTraveler
            key="plus-merge-traveler"
            variant="cap-up"
            keyframes={plusMergeExit}
            onComplete={clearPlusMergeExit}
          />
        )}
        {minusMergeExit && (
          <RightCycleMergeTraveler
            key="minus-merge-traveler"
            variant="cap-down"
            keyframes={minusMergeExit}
            onComplete={clearMinusMergeExit}
          />
        )}
      </AnimatePresence>
    </div>
  )
})
