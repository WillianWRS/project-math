import { describe, expect, it } from 'vitest'
import { clearAnswerFlash, setInputValue, startGame, submitAnswer } from '../../src/engine/game-state-machine'
import { shouldSyncInputFromSession } from '../../src/lib/session-input-sync'

describe('shouldSyncInputFromSession', () => {
  it('does not sync when session update leaves inputValue unchanged', () => {
    const session = startGame()
    const afterFlash = clearAnswerFlash({ ...session, answerFlash: '12', inputValue: '' })

    expect(shouldSyncInputFromSession(session, afterFlash, '')).toBe(false)
  })

  it('syncs when submit clears input after a correct answer', () => {
    const session = startGame()
    const correctAnswer = String(session.operation!.result)
    const withInput = setInputValue(session, correctAnswer)
    const { session: afterSubmit } = submitAnswer(withInput)

    expect(shouldSyncInputFromSession(withInput, afterSubmit, correctAnswer)).toBe(true)
    expect(afterSubmit.inputValue).toBe('')
  })

  it('syncs when session keeps empty input but UI is stale', () => {
    const session = startGame()
    const unchanged = { ...session, answerFlash: '7', inputValue: '' }

    expect(shouldSyncInputFromSession(session, unchanged, '7')).toBe(true)
  })
})
