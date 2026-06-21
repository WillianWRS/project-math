import { describe, expect, it } from 'vitest'
import {
  backgroundScrollDuration,
  crossedScoreMilestoneBurst,
  levelTimerMs,
  levelTimerSeconds,
  scoreToLevel,
} from '../../src/engine/level-system'

describe('scoreToLevel', () => {
  it('começa no nível 1 com pontuação zero', () => {
    expect(scoreToLevel(0)).toBe(1)
    expect(scoreToLevel(49)).toBe(1)
  })

  it('sobe um nível a cada 50 pontos', () => {
    expect(scoreToLevel(50)).toBe(2)
    expect(scoreToLevel(100)).toBe(3)
    expect(scoreToLevel(200)).toBe(5)
  })

  it('limita no nível 5', () => {
    expect(scoreToLevel(500)).toBe(5)
  })
})

describe('levelTimerMs', () => {
  it('reduz o tempo conforme o nível sobe', () => {
    expect(levelTimerMs(1)).toBe(12_000)
    expect(levelTimerMs(3)).toBe(10_000)
    expect(levelTimerMs(5)).toBe(7_000)
  })

  it('mantém valores dentro do intervalo 1–5', () => {
    expect(levelTimerMs(0)).toBe(12_000)
    expect(levelTimerMs(99)).toBe(7_000)
  })
})

describe('levelTimerSeconds', () => {
  it('converte milissegundos em segundos', () => {
    expect(levelTimerSeconds(1)).toBe(12)
    expect(levelTimerSeconds(5)).toBe(7)
  })
})

describe('backgroundScrollDuration', () => {
  it('acelera a animação em níveis mais altos', () => {
    expect(backgroundScrollDuration(1)).toBeGreaterThan(backgroundScrollDuration(5))
  })
})

describe('crossedScoreMilestoneBurst', () => {
  it('não dispara abaixo de 300 pontos', () => {
    expect(crossedScoreMilestoneBurst(0, 299)).toBe(false)
  })

  it('dispara ao cruzar 300 pontos', () => {
    expect(crossedScoreMilestoneBurst(290, 300)).toBe(true)
  })

  it('dispara a cada 100 pontos após 300', () => {
    expect(crossedScoreMilestoneBurst(350, 400)).toBe(true)
    expect(crossedScoreMilestoneBurst(400, 450)).toBe(false)
  })
})
