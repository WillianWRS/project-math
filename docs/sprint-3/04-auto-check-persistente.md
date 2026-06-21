# 04 — Auto-check persistente (carteira única)

## Objetivo

**Toda** carga de auto-check vai para **`PlayerData.walletAutoChecks`** — ciclo lateral in-run, meta diária, anúncio e (futuro) loja. Uma única carteira, persistida entre partidas e sessões.

---

## Decisão confirmada (D4)

| Fonte | Ao ganhar | Destino |
|-------|-----------|---------|
| Ciclo lateral (4 acertos) | Imediato | `walletAutoChecks += 1` + save |
| Meta diária | Ao completar | `walletAutoChecks += 1` |
| Anúncio simulado | Após 2 s | `walletAutoChecks += 1` |
| (Futuro) Loja | Compra | `walletAutoChecks += n` |

**Não há pilha separada in-run.** O que o jogador ganha na partida **já é dele** — se perder depois, mantém o saldo (menos o que consumiu).

---

## Uso e exibição

```
botão AUTO (badge) = walletAutoChecks
```

| Ação | Comportamento |
|------|---------------|
| Usar AUTO (teclado ou modal timeout) | `walletAutoChecks -= 1` + save |
| `walletAutoChecks === 0` | Botão AUTO desabilitado |
| Game over | Carteira **não** zera |

---

## Refactor do código atual

Hoje `game-changer-cycles.ts` faz `autoCheckCharges: session.autoCheckCharges + 1` in-run e `tickTimer` zera no game over.

**Mudança:**

1. Remover (ou deprecar) `session.autoCheckCharges` de `GameSession`.
2. Ao completar ciclo lateral → callback/hook `grantAutoCheck(1)` em `usePlayer`.
3. `submitAnswer` / `onAutoCorrect` validam e debitam `walletAutoChecks` via `usePlayer`.
4. `NumericKeypad` recebe `autoCheckCharges={walletAutoChecks}` do hook player (nome do prop pode manter por compat).

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/platform/storage.ts` | `walletAutoChecks` |
| `src/hooks/usePlayer.ts` | `grantAutoCheck(n)`, `spendAutoCheck(): boolean` |
| `src/hooks/useGame.ts` | Integrar wallet; ciclo lateral chama grant |
| `src/engine/game-changer-cycles.ts` | Retornar sinal `autoCheckGranted: true` em vez de mutar session |
| `src/engine/game-state-machine.ts` | Remover `autoCheckCharges` de session / game over clear |
| `src/engine/types.ts` | Remover `autoCheckCharges` (ou manter deprecated 1 sprint) |
| `src/components/game/NumericKeypad.tsx` | Badge = wallet |

### Fluxo ao completar ciclo lateral

```
acerto → advanceSideCyclesOnCorrect
  → ciclo auto-check completa (step 4→reward)
  → useGame detecta grant
  → grantAutoCheck(1) + savePlayerData
  → UI keypad atualiza badge
```

---

## Testes manuais

- [ ] Completar ciclo lateral → +1 wallet; **perder partida** → saldo mantido
- [ ] Usar AUTO → -1 wallet
- [ ] Meta diária + ciclo na mesma sessão acumulam
- [ ] Reload browser mantém saldo
- [ ] Nova partida começa com saldo da carteira (não zera)

---

## Dependências

- **Bloqueia:** 05-modal-timeout, 11-ad-simulado
- **Relaciona:** 03-metas-diarias (grant wallet)

---

## Notas de game design

Modelo único é **mais simples de entender** ("auto-checks são seus") e evita frustrar quem completou ciclo e morreu logo after. Cuidado com inflação: ciclo lateral + meta + 5 ads/dia — cap máximo na carteira (ex.: 10) pode ser útil no futuro.
