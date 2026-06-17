/** Variante visual de um card lateral direito (game changer). */
export type RightCardVariant = 'cap-up' | 'cap-down' | 'timer' | 'mult-div'

/** Definição completa de um slot/card da coluna direita. */
export interface RightSideCardDefinition {
  /** Identificador estável do card. */
  id: string
  /** Variante de estilo e ícone. */
  variant: RightCardVariant
  /** Texto numérico ou rótulo exibido no card (quando aplicável). */
  label?: string
  /** Passo lateral (1–4) alinhado verticalmente a este slot (auto-check e four-seconds). */
  sideCycleStep: number
  /** Descrição da mecânica prevista para recriação futura da UI. */
  mechanic: string
  /** Classe CSS do modifier (`game-side-card--*`). */
  styleClass: `game-side-card--${RightCardVariant}`
  /** Classe CSS do ícone (`game-side-card__icon--*`). */
  iconClass: `game-side-card__icon--${RightCardVariant}`
  /** Classe CSS do rótulo (`game-side-card__label--*`), se houver label. */
  labelClass?: `game-side-card__label--${RightCardVariant}`
}

/**
 * Catálogo dos cards da coluna direita.
 * Mantém todos os metadados para reexibir os botões no futuro.
 */
export class RightSideCardCatalog {
  static readonly cardCount = 4

  static readonly cards: readonly RightSideCardDefinition[] = [
    {
      id: 'cap-up',
      variant: 'cap-up',
      label: '99',
      sideCycleStep: 1,
      mechanic: 'Game changer plus-cycle: + com operando 1–9 até resultado 99 (nível 5+).',
      styleClass: 'game-side-card--cap-up',
      iconClass: 'game-side-card__icon--cap-up',
      labelClass: 'game-side-card__label--cap-up',
    },
    {
      id: 'cap-down',
      variant: 'cap-down',
      label: '1',
      sideCycleStep: 2,
      mechanic: 'Game changer minus-cycle: − com operando 1–9 até resultado 1 (nível 5+).',
      styleClass: 'game-side-card--cap-down',
      iconClass: 'game-side-card__icon--cap-down',
      labelClass: 'game-side-card__label--cap-down',
    },
    {
      id: 'timer',
      variant: 'timer',
      label: '4s',
      sideCycleStep: 3,
      mechanic: 'Game changer 4s: +/− com operando 1–9 por 10 acertos (nível 5+).',
      styleClass: 'game-side-card--timer',
      iconClass: 'game-side-card__icon--timer',
      labelClass: 'game-side-card__label--timer',
    },
    {
      id: 'mult-div',
      variant: 'mult-div',
      sideCycleStep: 4,
      mechanic: 'Game changer ×÷: multiplicação/divisão inteira por 10 acertos (nível 5+).',
      styleClass: 'game-side-card--mult-div',
      iconClass: 'game-side-card__icon--mult-div',
    },
  ] as const

  static bySideCycleStep(step: number): RightSideCardDefinition | undefined {
    return RightSideCardCatalog.cards.find((card) => card.sideCycleStep === step)
  }

  static byVariant(variant: RightCardVariant): RightSideCardDefinition | undefined {
    return RightSideCardCatalog.cards.find((card) => card.variant === variant)
  }
}
