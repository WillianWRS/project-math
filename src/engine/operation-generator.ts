import type { Operation, Operator } from './types'

const MIN_RESULT = 1
const ALL_OPERATORS: Operator[] = ['+', '-', '×', '÷']

interface LevelRules {
  weights: Record<Operator, number>
  maxResult: number
  /** Nível 1: base + operando não pode passar de 10 */
  maxCombined?: number
}

const LEVEL_RULES: Record<number, LevelRules> = {
  1: {
    weights: { '+': 0.5, '-': 0.5, '×': 0, '÷': 0 },
    maxResult: 30,
    maxCombined: 10,
  },
  2: {
    weights: { '+': 0.45, '-': 0.45, '×': 0.1, '÷': 0 },
    maxResult: 50,
  },
  3: {
    weights: { '+': 0.35, '-': 0.35, '×': 0.2, '÷': 0.1 },
    maxResult: 60,
  },
  4: {
    weights: { '+': 0.3, '-': 0.3, '×': 0.2, '÷': 0.2 },
    maxResult: 70,
  },
  5: {
    weights: { '+': 0.25, '-': 0.25, '×': 0.25, '÷': 0.25 },
    maxResult: 99,
  },
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getLevelRules(level: number): LevelRules {
  const clamped = Math.min(Math.max(level, 1), 5)
  return LEVEL_RULES[clamped]
}

function isValidResult(result: number, maxResult: number): boolean {
  return result >= MIN_RESULT && result <= maxResult
}

function isInverseMultiplyDividePair(current: Operation, previous: Operation): boolean {
  return (
    (previous.operator === '×' &&
      current.operator === '÷' &&
      current.operand === previous.operand) ||
    (previous.operator === '÷' &&
      current.operator === '×' &&
      current.operand === previous.operand)
  )
}

function isSameOperation(a: Operation, b: Operation): boolean {
  return a.operator === b.operator && a.operand === b.operand
}

function isValidOperation(
  operation: Operation,
  previous: Operation | null,
  maxResult: number,
): boolean {
  if (!isValidResult(operation.result, maxResult)) return false
  if (operation.operand < 1) return false
  if (previous && isSameOperation(operation, previous)) return false
  if (previous && isInverseMultiplyDividePair(operation, previous)) return false
  return true
}

function pickOperator(level: number, forceAddSubOnly = false): Operator {
  if (forceAddSubOnly) {
    return Math.random() < 0.5 ? '+' : '-'
  }

  const { weights } = getLevelRules(level)
  const pool = ALL_OPERATORS.filter((op) => weights[op] > 0)
  return weightedPick(pool, weights)
}

function weightedPick(pool: Operator[], weights: Record<Operator, number>): Operator {
  const total = pool.reduce((sum, op) => sum + weights[op], 0)
  let roll = Math.random() * total

  for (const op of pool) {
    roll -= weights[op]
    if (roll <= 0) return op
  }

  return pool[pool.length - 1]
}

function buildAddition(base: number, maxResult: number, maxCombined?: number): Operation {
  const maxOperand = maxResult - base
  const combinedCap = maxCombined !== undefined ? maxCombined - base : maxOperand
  const operand = randomInt(1, Math.max(1, Math.min(maxOperand, combinedCap)))
  return { operator: '+', operand, result: base + operand }
}

function buildSubtraction(base: number, maxCombined?: number): Operation {
  const maxOperand =
    maxCombined !== undefined
      ? Math.min(base - 1, maxCombined - base)
      : base - 1
  const operand = randomInt(1, Math.max(1, maxOperand))
  return { operator: '-', operand, result: base - operand }
}

function buildMultiplication(base: number, maxResult: number): Operation {
  const maxOperand = Math.floor(maxResult / base)
  const operand = randomInt(1, Math.max(1, maxOperand))
  return { operator: '×', operand, result: base * operand }
}

function buildDivision(base: number, maxResult: number): Operation {
  const divisors: number[] = []
  for (let divisor = 2; divisor <= base; divisor += 1) {
    if (base % divisor === 0) {
      const result = base / divisor
      if (isValidResult(result, maxResult)) {
        divisors.push(divisor)
      }
    }
  }

  if (divisors.length === 0) {
    return buildSubtraction(base)
  }

  const operand = divisors[randomInt(0, divisors.length - 1)]
  return { operator: '÷', operand, result: base / operand }
}

function buildOperation(base: number, operator: Operator, rules: LevelRules): Operation {
  const { maxResult, maxCombined } = rules

  switch (operator) {
    case '+':
      return buildAddition(base, maxResult, maxCombined)
    case '-':
      if (base <= 1 || (maxCombined !== undefined && base + 1 > maxCombined)) {
        return buildAddition(base, maxResult, maxCombined)
      }
      return buildSubtraction(base, maxCombined)
    case '×':
      return buildMultiplication(base, maxResult)
    case '÷':
      return base > 1 ? buildDivision(base, maxResult) : buildMultiplication(base, maxResult)
  }
}

export function generateInitialBase(level: number = 1): number {
  if (level <= 1) {
    return randomInt(2, 9)
  }
  return randomInt(5, 25)
}

export interface GenerateOperationOptions {
  forceAddSubOnly?: boolean
}

export function generateOperation(
  base: number,
  level: number,
  previous: Operation | null = null,
  options: GenerateOperationOptions = {},
): Operation {
  const { forceAddSubOnly = false } = options
  const rules = getLevelRules(level)
  const allowedOperators: Operator[] = forceAddSubOnly
    ? ['+', '-']
    : ALL_OPERATORS.filter((op) => rules.weights[op] > 0)

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const operator = pickOperator(level, forceAddSubOnly)
    const operation = buildOperation(base, operator, rules)
    if (isValidOperation(operation, previous, rules.maxResult)) {
      return operation
    }
  }

  for (const operator of allowedOperators) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const operation = buildOperation(base, operator, rules)
      if (isValidOperation(operation, previous, rules.maxResult)) {
        return operation
      }
    }
  }

  const operand = Math.min(5, rules.maxResult - base)
  return { operator: '+', operand: Math.max(1, operand), result: base + Math.max(1, operand) }
}

export function formatOperation(operation: Operation): string {
  return `${operation.operator} ${operation.operand}`
}

export const OPERATOR_COLOR_CLASS: Record<Operator, string> = {
  '+': 'text-emerald-400',
  '-': 'text-rose-400',
  '×': 'text-amber-400',
  '÷': 'text-sky-400',
}

export function evaluateAnswer(_base: number, operation: Operation, answer: number): boolean {
  return answer === operation.result
}
