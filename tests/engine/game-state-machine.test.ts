import { describe, expect, it } from 'vitest'
import {
  createInitialSession,
  setInputValue,
  startGame,
  submitAnswer,
  tickTimer,
} from '../../src/engine/game-state-machine'
import type { GameSession } from '../../src/engine/types'

describe('createInitialSession', () => {
  it('inicia em idle com estado zerado', () => {
    const session = createInitialSession()
    expect(session.phase).toBe('idle')
    expect(session.score).toBe(0)
    expect(session.operation).toBeNull()
  })
})

describe('startGame', () => {
  it('entra em playing com operação e timer configurados', () => {
    const session = startGame()
    expect(session.phase).toBe('playing')
    expect(session.rhythmLevel).toBe(1)
    expect(session.operation).not.toBeNull()
    expect(session.timerMs).toBe(session.timerMaxMs)
  })
})

describe('tickTimer', () => {
  it('reduz o timer durante o jogo', () => {
    const session = startGame()
    const updated = tickTimer(session, 1_000)
    expect(updated.timerMs).toBe(session.timerMs - 1_000)
  })

  it('encerra a partida quando o timer chega a zero', () => {
    const session: GameSession = {
      ...startGame(),
      timerMs: 500,
    }
    const updated = tickTimer(session, 500)
    expect(updated.phase).toBe('game_over')
    expect(updated.timerMs).toBe(0)
  })

  it('ignora ticks fora da fase playing', () => {
    const session = createInitialSession()
    expect(tickTimer(session, 1_000)).toBe(session)
  })
})

describe('submitAnswer', () => {
  it('rejeita envio com input vazio', () => {
    const session = startGame()
    const { result } = submitAnswer(session)
    expect(result).toBe('empty')
  })

  it('marca resposta errada e bloqueia novo envio', () => {
    const session = {
      ...startGame(),
      inputValue: '0',
    }
    const { session: updated, result } = submitAnswer(session)
    expect(result).toBe('wrong')
    expect(updated.isSubmitLocked).toBe(true)
  })

  it('avança pontuação e gera próxima operação ao acertar', () => {
    const session = startGame()
    const correctAnswer = String(session.operation!.result)
    const { session: updated, result } = submitAnswer({
      ...session,
      inputValue: correctAnswer,
    })

    expect(result).toBe('correct')
    expect(updated.score).toBe(10)
    expect(updated.baseNumber).toBe(session.operation!.result)
    expect(updated.operation).not.toEqual(session.operation)
    expect(updated.inputValue).toBe('')
  })
})

describe('setInputValue', () => {
  it('aceita apenas até dois dígitos numéricos', () => {
    const session = createInitialSession()
    expect(setInputValue(session, '12a3').inputValue).toBe('12')
    expect(setInputValue(session, '999').inputValue).toBe('99')
  })
})
