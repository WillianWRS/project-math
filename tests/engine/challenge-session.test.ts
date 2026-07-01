import { describe, expect, it } from 'vitest'
import {
  isSixtySecondsChallengeCompleted,
  SIXTY_SECONDS_LIMIT_MS,
  startChallengeGame,
  tickChallengeTimer,
} from '../../src/engine/challenge-session'
import { tickTimer } from '../../src/engine/game-state-machine'

describe('sixty-seconds challenge completion', () => {
  it('só conclui após sobreviver os 60 segundos inteiros', () => {
    const playing = startChallengeGame('sixty-seconds')
    expect(isSixtySecondsChallengeCompleted({ ...playing, elapsedMs: 59_999 })).toBe(false)

    let session = {
      ...playing,
      elapsedMs: SIXTY_SECONDS_LIMIT_MS - 100,
      timerMs: 5_000,
    }
    session = tickChallengeTimer(session, 100)

    expect(session.phase).toBe('game_over')
    expect(session.elapsedMs).toBe(SIXTY_SECONDS_LIMIT_MS)
    expect(isSixtySecondsChallengeCompleted(session)).toBe(true)
  })

  it('não conclui quando a partida termina por timeout antes dos 60s', () => {
    let session = {
      ...startChallengeGame('sixty-seconds'),
      elapsedMs: 10_000,
      timerMs: 1_000,
    }
    session = tickChallengeTimer(session, 1_000)

    expect(session.phase).toBe('game_over')
    expect(session.elapsedMs).toBeLessThan(SIXTY_SECONDS_LIMIT_MS)
    expect(isSixtySecondsChallengeCompleted(session)).toBe(false)
  })

  it('não conclui quando o timeout da operação encerra a partida', () => {
    let session = startChallengeGame('sixty-seconds')
    session = tickTimer(session, session.timerMs)

    expect(session.phase).toBe('game_over')
    expect(isSixtySecondsChallengeCompleted(session)).toBe(false)
  })
})
