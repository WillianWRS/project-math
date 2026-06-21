import { describe, expect, it } from 'vitest'
import {
  evaluateAnswer,
  formatOperation,
  generateFourSecondsOperation,
  generateMinusCycleOperation,
  generateMinusPreCycleFinalOperation,
  generatePlusCycleOperation,
  generatePlusPreCycleFinalOperation,
  MINUS_CYCLE_TARGET_RESULT,
  PLUS_CYCLE_MAX_RESULT,
} from '../../src/engine/operation-generator'
import type { Operation } from '../../src/engine/types'

describe('evaluateAnswer', () => {
  it('aceita apenas o resultado exato da operação', () => {
    const operation: Operation = { operator: '+', operand: 3, result: 8 }
    expect(evaluateAnswer(5, operation, 8)).toBe(true)
    expect(evaluateAnswer(5, operation, 7)).toBe(false)
  })
})

describe('formatOperation', () => {
  it('formata operador e operando', () => {
    expect(formatOperation({ operator: '×', operand: 4, result: 20 })).toBe('× 4')
  })
})

describe('generatePlusPreCycleFinalOperation', () => {
  it('leva a base ao resultado 1 quando possível', () => {
    const operation = generatePlusPreCycleFinalOperation(5)
    expect(operation).toEqual({ operator: '-', operand: 4, result: 1 })
  })

  it('evita repetir a operação anterior', () => {
    const previous: Operation = { operator: '-', operand: 4, result: 1 }
    const operation = generatePlusPreCycleFinalOperation(5, previous)
    expect(operation).not.toEqual(previous)
  })
})

describe('generateMinusPreCycleFinalOperation', () => {
  it('leva a base ao resultado 99 quando abaixo do alvo', () => {
    const operation = generateMinusPreCycleFinalOperation(80)
    expect(operation).toEqual({ operator: '+', operand: 19, result: 99 })
  })

  it('leva a base ao resultado 99 quando acima do alvo', () => {
    const operation = generateMinusPreCycleFinalOperation(110)
    expect(operation).toEqual({ operator: '-', operand: 11, result: 99 })
  })
})

describe('generatePlusCycleOperation', () => {
  it('gera somas com operando entre 1 e 9 e resultado até 99', () => {
    for (let base = 10; base <= 90; base += 10) {
      const operation = generatePlusCycleOperation(base)
      expect(operation.operator).toBe('+')
      expect(operation.operand).toBeGreaterThanOrEqual(1)
      expect(operation.operand).toBeLessThanOrEqual(9)
      expect(operation.result).toBe(base + operation.operand)
      expect(operation.result).toBeLessThanOrEqual(PLUS_CYCLE_MAX_RESULT)
    }
  })
})

describe('generateMinusCycleOperation', () => {
  it('gera subtrações com operando entre 1 e 9 e resultado mínimo 1', () => {
    for (let base = 10; base <= 50; base += 10) {
      const operation = generateMinusCycleOperation(base)
      expect(operation.operator).toBe('-')
      expect(operation.operand).toBeGreaterThanOrEqual(1)
      expect(operation.operand).toBeLessThanOrEqual(9)
      expect(operation.result).toBe(base - operation.operand)
      expect(operation.result).toBeGreaterThanOrEqual(MINUS_CYCLE_TARGET_RESULT)
    }
  })
})

describe('generateFourSecondsOperation', () => {
  it('gera operações de +/− com operando entre 1 e 9', () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const operation = generateFourSecondsOperation(25)
      expect(['+', '-']).toContain(operation.operator)
      expect(operation.operand).toBeGreaterThanOrEqual(1)
      expect(operation.operand).toBeLessThanOrEqual(9)
    }
  })
})
