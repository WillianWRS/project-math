# 06 — Moedas pós-partida

## Objetivo

Conceder **moedas** persistentes ao fim de cada partida: `moedas = floor(score / 10)`. Moedas compram temas (tarefa 07, compra real depois).

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| C1 | Fórmula: `Math.floor(session.score / 10)` — partida 0 pts = 0 moedas |
| C2 | Creditar em `PlayerData.coins` no game over (uma vez por partida) |
| C3 | Exibir no card game over: "+{n} moedas" |
| C4 | Saldo total visível em Config ou menu (chip discreto) |
| C5 | Não duplicar crédito em reload / re-render do efeito game over |
| C6 | Moedas **independentes** de XP (XP 1:1, moedas ÷10) |

---

## Exemplos

| Score | Moedas |
|-------|--------|
| 95 | 9 |
| 100 | 10 |
| 340 | 34 |
| 1000 | 100 |

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/engine/rewards.ts` | `scoreToCoins(score: number)` puro |
| `src/platform/storage.ts` | `coins` em PlayerData |
| `src/hooks/useGame.ts` | Hook único `applyPostGameRewards()` com guard ref (já existe padrão `gameOverFxHandledRef`) |
| `src/components/game/GameScreen.tsx` | Linha no game-over-card |

```typescript
export function scoreToCoins(score: number): number {
  return Math.floor(score / 10)
}
```

Integrar no mesmo bloco que XP e meta diária:

```
game over (once)
  → coins += scoreToCoins(score)
  → xp += score
  → daily += score
  → saveTopScore(...)
  → savePlayerData()
```

---

## Testes manuais

- [ ] Partida 95 pts → +9 moedas
- [ ] Reload na tela game over não credita de novo
- [ ] Saldo persiste entre sessões

---

## Dependências

- **Depende de:** PlayerData
- **Bloqueia:** compra de temas (07, fase 2)

---

## Notas de game design

Moedas ÷10 desacopla economia do score bruto — evita inflação vs XP. Partida típica 150–300 pts → 15–30 moedas; calibrar preços de tema depois (sugestão: 200–500 moedas tema comum).
