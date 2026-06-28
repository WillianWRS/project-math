// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { clearAnswerFlash, submitAnswer, setInputValue, startGame } from '../../engine/game-state-machine'
import { useGameSession } from './useGameSession'

afterEach(() => {
  localStorage.clear()
})

describe('useGameSession', () => {
  it('inicia em idle com input vazio', () => {
    const { result } = renderHook(() => useGameSession())
    expect(result.current.session.phase).toBe('idle')
    expect(result.current.inputValue).toBe('')
    expect(result.current.session.inputValue).toBe('')
  })

  it('onInputChange persiste dígitos em session.inputValue (fonte única)', () => {
    const { result } = renderHook(() => useGameSession())

    act(() => result.current.onInputChange('1a2b'))
    expect(result.current.inputValue).toBe('12')
    expect(result.current.session.inputValue).toBe('12')

    act(() => result.current.onInputChange('98765'))
    expect(result.current.inputValue).toBe('98')
    expect(result.current.session.inputValue).toBe('98')
    expect(result.current.inputValueRef.current).toBe('98')
  })

  it('setInputValue atualiza session.inputValue via engine', () => {
    const { result } = renderHook(() => useGameSession())

    act(() => result.current.setInputValue('7'))
    expect(result.current.inputValue).toBe('7')
    expect(result.current.session.inputValue).toBe('7')
  })

  it('refs espelham session imediatamente após setSession', () => {
    const { result } = renderHook(() => useGameSession())
    act(() => {
      result.current.setSession((current) => ({ ...current, score: 5 }))
    })
    expect(result.current.session.score).toBe(5)
    expect(result.current.sessionRef.current.score).toBe(5)
  })

  it('preserva dígitos quando clearAnswerFlash roda sem mudar inputValue', () => {
    const { result } = renderHook(() => useGameSession())

    act(() => {
      result.current.setSession((current) => ({
        ...current,
        phase: 'playing',
        answerFlash: '12',
        inputValue: '',
      }))
    })

    act(() => result.current.onInputChange('4'))
    expect(result.current.inputValue).toBe('4')

    act(() => {
      result.current.setSession((current) => clearAnswerFlash(current))
    })

    expect(result.current.inputValue).toBe('4')
    expect(result.current.session.inputValue).toBe('4')
  })

  it('limpa input após acerto via submitAnswer na sessão', () => {
    const { result } = renderHook(() => useGameSession())

    act(() => result.current.setSession(() => startGame()))
    const playing = result.current.session
    const answer = String(playing.operation!.result)

    act(() => result.current.onInputChange(answer))
    expect(result.current.inputValue).toBe(answer)

    act(() => {
      const withInput = setInputValue(playing, answer)
      const { session: afterSubmit } = submitAnswer(withInput)
      result.current.setSession(afterSubmit)
    })

    expect(result.current.inputValue).toBe('')
    expect(result.current.session.inputValue).toBe('')
  })
})
