import type { ChallengeModeId } from '../engine/types'

export interface ChallengeDefinition {
  id: ChallengeModeId
  name: string
  entryCostCoins: number
  requiredLevel: number
  description: string
  rewardHint: string
}

export const CHALLENGE_CATALOG: ChallengeDefinition[] = [
  {
    id: 'double-coins',
    name: 'Moedas em dobro',
    entryCostCoins: 25,
    requiredLevel: 10,
    description: 'Partida normal com teto de 1.000 pontos. Moedas do pós-jogo em dobro.',
    rewardHint: '2× moedas no pós-jogo',
  },
  {
    id: 'sixty-seconds',
    name: '60 segundos',
    entryCostCoins: 5,
    requiredLevel: 10,
    description: 'Começa no ritmo nível 5. A partida termina aos 60 segundos.',
    rewardHint: 'XP e moedas pelo score',
  },
  {
    id: 'three-seconds',
    name: '3 segundos',
    entryCostCoins: 25,
    requiredLevel: 15,
    description: 'Sobe de 1 até 99 só com +, depois desce até 1 só com −.',
    rewardHint: '+25 e +50 moedas por fase',
  },
  {
    id: 'times-div-only',
    name: 'Só × ÷',
    entryCostCoins: 25,
    requiredLevel: 20,
    description: '50 rounds apenas de multiplicação e divisão.',
    rewardHint: '+70 moedas ao completar',
  },
]

export function getChallengeDefinition(id: ChallengeModeId): ChallengeDefinition {
  const found = CHALLENGE_CATALOG.find((entry) => entry.id === id)
  if (!found) throw new Error(`Desafio desconhecido: ${id}`)
  return found
}
