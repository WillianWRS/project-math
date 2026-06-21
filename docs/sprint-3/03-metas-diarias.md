# 03 — Metas diárias

## Objetivo

Introduzir **meta diária** simples: atingir **1000 de score** (ver definição abaixo) no dia → recompensa **1000 XP** + **1 auto-check** na carteira.

---

## Definição da meta (decisão D1)

**Recomendado:** score **acumulado no dia**, somando o score final de cada partida.

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Soma do dia ✓ | Acessível; incentiva 2–3 runs | Menos "hero moment" |
| Uma partida ≥1000 | Prestígio alto | ~100 acertos; exclui casual |

Implementação: `PlayerData.daily.scoreAccumulated += session.score` a cada game over.

Reset: meia-noite **America/Sao_Paulo** (alinhado a `projeto.md` / `tecnico.md`).

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| M1 | Contador `daily.scoreAccumulated` incrementa a cada game over |
| M2 | Meta = 1000; progresso visível em algum lugar (HUD mínimo ou menu) |
| M3 | Ao cruzar 1000 pela 1ª vez no dia: `goalClaimed = true`, recompensas |
| M4 | Recompensa: +1000 XP (tarefa 02) + +1 `walletAutoChecks` (tarefa 04) |
| M5 | Não repetir recompensa no mesmo dia |
| M6 | Reset automático ao detectar `dateKey` diferente |

---

## UI mínima (sprint)

Opções (escolher uma):

1. **Barra fina no menu** — "Meta diária 340/1000"
2. **Chip no header in-game** — discreto, toque abre tooltip
3. **Só no game over** — "Meta diária: 780/1000 (+220 para recompensa)"

Recomendação confirmada: **modal Jogador** (barra principal) + resumo opcional no game over.

Feedback ao completar: toast/modal curto "Meta diária completa! +1000 XP, +1 Auto-check".

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/platform/daily-reset.ts` | `getDateKey()`, `ensureDailyFresh(player)` |
| `src/hooks/useGame.ts` | Após game over: update daily + claim |
| `src/components/game/GameScreen.tsx` | UI progresso (menu/game over) |

```typescript
function onGameOverRewards(player: PlayerData, sessionScore: number) {
  ensureDailyFresh(player)
  player.daily.scoreAccumulated += sessionScore

  if (!player.daily.goalClaimed && player.daily.scoreAccumulated >= 1000) {
    player.daily.goalClaimed = true
    player.xp += 1000
    player.walletAutoChecks += 1
    return { goalCompleted: true }
  }
  return { goalCompleted: false }
}
```

---

## Testes manuais

- [ ] Duas partidas 600 + 400 no mesmo dia → meta completa na 2ª
- [ ] Meta completa → terceira partida no dia não dá recompensa de novo
- [ ] Mudança de `dateKey` (mock) → contador zera, meta disponível

---

## Dependências

- **Depende de:** PlayerData, XP (02), wallet auto-check (04)
- **Não depende de:** ads, temas

---

## Notas de game design

Meta diária é o **primeiro gancho de retorno D1** real da sprint — mais impacto que moedas sozinhas. 1000/dia ≈ 3–5 partidas medianas; calibrar depois com analytics.
