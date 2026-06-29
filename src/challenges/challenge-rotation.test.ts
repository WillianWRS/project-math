import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_ROTATION_ANCHOR_DATE_KEY,
  getActiveChallengeIds,
  getActiveChallengeKitIndex,
} from './challenge-rotation'
import { getDateKey } from '../platform/daily-reset'

describe('challenge-rotation', () => {
  it('usa kit 1 na data âncora', () => {
    const anchor = new Date(`${CHALLENGE_ROTATION_ANCHOR_DATE_KEY}T12:00:00-03:00`)
    expect(getActiveChallengeKitIndex(anchor)).toBe(0)
    expect(getActiveChallengeIds(anchor)).toEqual(['double-coins', 'three-seconds'])
  })

  it('alterna para kit 2 no dia seguinte (SP)', () => {
    const anchor = new Date(`${CHALLENGE_ROTATION_ANCHOR_DATE_KEY}T12:00:00-03:00`)
    const nextDay = new Date(anchor.getTime() + 86_400_000)
    expect(getDateKey(nextDay)).not.toBe(getDateKey(anchor))
    expect(getActiveChallengeKitIndex(nextDay)).toBe(1)
    expect(getActiveChallengeIds(nextDay)).toEqual(['sixty-seconds', 'times-div-only'])
  })

  it('volta ao kit 1 após dois dias', () => {
    const anchor = new Date(`${CHALLENGE_ROTATION_ANCHOR_DATE_KEY}T12:00:00-03:00`)
    const twoDaysLater = new Date(anchor.getTime() + 2 * 86_400_000)
    expect(getActiveChallengeKitIndex(twoDaysLater)).toBe(0)
  })
})
