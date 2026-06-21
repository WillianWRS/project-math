# 02 — Nível do jogador (XP)

## Objetivo

**Score final da partida → XP 1:1** (confirmado). Exibir **nível do jogador** durante a partida e **barra de progresso** no modal Jogador. Tabela oficial de níveis TBD — usar stub.

**Rhythm level** (timer 1–5 interno): renomear no código, **nunca mostrar na UI** — pressão sentida via timer, fundo e moldura.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| X1 | Game over: `PlayerData.xp += session.score` (**1:1**) |
| X2 | `playerLevel = xpToLevel(xp)` em `src/engine/player-level.ts` |
| X3 | HUD in-game: badge **Nível {n}** do jogador (não rhythm level) |
| X4 | Modal Jogador: nível + **barra de progresso** até próximo nível |
| X5 | Meta diária: **+1000 XP** extra na partida que completa a meta |
| X6 | Refactor: `session.level` → `session.rhythmLevel` (ver 12-menu-layout) |

---

## Rhythm level (código only)

| Atual | Novo |
|-------|------|
| `session.level` | `session.rhythmLevel` |
| `scoreToLevel(score)` | `scoreToRhythmLevel(score)` |
| `levelTimerMs(level)` | `rhythmLevelTimerMs(rhythmLevel)` |

Sem labels "Ritmo" ou nível de timer na interface.

---

## Stub de tabela de níveis

```typescript
const XP_PER_LEVEL = 500 // placeholder

export function xpToLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1)
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; level: number } {
  const level = xpToLevel(xp)
  const base = (level - 1) * XP_PER_LEVEL
  return { current: xp - base, needed: XP_PER_LEVEL, level }
}
```

---

## Fluxo pós-partida

```
game over
  → xp += session.score
  → se meta completada nesta partida: xp += 1000
  → save PlayerData
  → game over UI: "+{score} XP" (opcional level-up toast)
```

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/engine/player-level.ts` | Novo |
| `src/engine/level-system.ts` | Renomear exports rhythm (ou `rhythm-level.ts`) |
| `src/engine/types.ts` | `rhythmLevel`, `rhythmLevelUpFlash` |
| `src/hooks/useGame.ts` | Aplicar XP pós-partida |
| `src/components/game/GameScreen.tsx` | Badge nível jogador in-game |
| `src/components/modals/PlayerModal.tsx` | Nível + progress bar |

---

## Testes manuais

- [ ] 80 pts → +80 XP
- [ ] Barra progride corretamente no modal Jogador
- [ ] HUD in-game mostra nível do jogador
- [ ] Nenhum texto de rhythm level na UI
- [ ] Timer/fundo ainda escalam com rhythm level internamente

---

## Dependências

- **Integra:** 12-menu-layout, 03-metas, 09-share
