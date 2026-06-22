import { describe, expect, it } from 'vitest'
import {
  clearAllSideCycles,
  computeFrameStats,
  isBenchmarkPhaseComplete,
  nextBenchmarkPhase,
  shouldInjectBenchmarkCycle,
  startBenchmarkCycle,
} from '../../src/engine/benchmark-driver'
import { createInitialSession } from '../../src/engine/game-state-machine'

describe('benchmark-driver', () => {
  it('starts benchmark cycles on a clean session', () => {
    const session = createInitialSession()
    const plus = startBenchmarkCycle(session, 'plus')
    expect(plus.plusCycleStep).toBe(1)
    expect(plus.minusCycleStep).toBeNull()
    expect(plus.autoCheckCycleStep).toBeNull()
  })

  it('advances benchmark phases in order', () => {
    expect(nextBenchmarkPhase('ritmo-l5')).toBe('auto-check-ciclo')
    expect(nextBenchmarkPhase('gc-mult-div')).toBeNull()
  })

  it('detects rhythm phase completion', () => {
    const session = { ...createInitialSession(), rhythmLevel: 5, score: 200 }
    expect(
      isBenchmarkPhaseComplete('ritmo-l5', session, {
        autoCheckUseDone: false,
        plusGcStarted: false,
        minusGcStarted: false,
        fourSecondsGcStarted: false,
        timesDivGcStarted: false,
      }),
    ).toBe(true)
  })

  it('injects cycles only once per phase', () => {
    const session = startBenchmarkCycle(createInitialSession(), 'plus')
    expect(shouldInjectBenchmarkCycle('gc-plus', session, false)).toBe(false)
    expect(shouldInjectBenchmarkCycle('gc-plus', createInitialSession(), false)).toBe(true)
  })

  it('clears side cycles', () => {
    const session = startBenchmarkCycle(createInitialSession(), 'autoCheck')
    const cleared = clearAllSideCycles(session)
    expect(cleared.autoCheckCycleStep).toBeNull()
  })

  it('computes frame stats', () => {
    const stats = computeFrameStats([16, 18, 20, 40, 12])
    expect(stats.samples).toBe(5)
    expect(stats.jankFrames).toBe(1)
    expect(stats.estimatedFps).toBeGreaterThan(0)
  })
})
