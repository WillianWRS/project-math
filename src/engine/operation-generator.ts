import type { Operation, Operator } from './types'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOperator(base: number): Operator {
  if (base === 0) {
    return Math.random() < 0.5 ? '+' : '×'
  }

  if (base <= 30) {
    const roll = Math.random()
    if (roll < 0.25) return '+'
    if (roll < 0.5) return '-'
    if (roll < 0.8) return '×'
    return '÷'
  }

  if (base <= 70) {
    const roll = Math.random()
    if (roll < 0.35) return '+'
    if (roll < 0.7) return '-'
    if (roll < 0.95) return '×'
    return '÷'
  }

  const roll = Math.random()
  if (roll < 0.4) return '-'
  if (roll < 0.8) return '÷'
  if (roll < 0.9) return '+'
  return '×'
}

function buildAddition(base: number): Operation {
  const operand = randomInt(1, 99 - base)
  return { operator: '+', operand, result: base + operand }
}

function buildSubtraction(base: number): Operation {
  const operand = randomInt(1, base)
  return { operator: '-', operand, result: base - operand }
}

function buildMultiplication(base: number): Operation {
  const maxOperand = base === 0 ? randomInt(1, 99) : Math.floor(99 / base)
  const operand = randomInt(1, Math.max(1, maxOperand))
  return { operator: '×', operand, result: base * operand }
}

function buildDivision(base: number): Operation {
  if (base === 0) {
    return buildAddition(base)
  }

  const divisors: number[] = []
  for (let d = 2; d <= base; d += 1) {
    if (base % d === 0 && base / d <= 99) {
      divisors.push(d)
    }
  }

  if (divisors.length === 0) {
    return buildSubtraction(base)
  }

  const operand = divisors[randomInt(0, divisors.length - 1)]
  return { operator: '÷', operand, result: base / operand }
}

function buildOperation(base: number, operator: Operator): Operation {
  switch (operator) {
    case '+':
      return buildAddition(base)
    case '-':
      return base > 0 ? buildSubtraction(base) : buildAddition(base)
    case '×':
      return buildMultiplication(base)
    case '÷':
      return buildDivision(base)
  }
}

export function generateInitialBase(): number {
  return randomInt(5, 25)
}

export function generateOperation(base: number): Operation {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const operator = pickOperator(base)
    const operation = buildOperation(base, operator)
    if (operation.result >= 0 && operation.result <= 99) {
      return operation
    }
  }

  return buildAddition(Math.min(base, 50))
}

export function formatOperation(operation: Operation): string {
  return `${operation.operator} ${operation.operand}`
}

export function evaluateAnswer(_base: number, operation: Operation, answer: number): boolean {
  return answer === operation.result
}
