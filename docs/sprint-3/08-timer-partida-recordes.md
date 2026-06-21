# 08 — Timer de partida e recordes

## Objetivo

Mostrar **tempo total da sessão** (partida) de forma discreta no topo central; persistir duração nos **recordes**; exibir no card de game over.

---

## Definição

- **Timer de partida:** elapsed desde `startGame()` até `game_over` (inclui pausa do modal auto-check? **Sim — pausa congela elapsed**)
- **Formato display:** `m:ss` (ex.: `2:34`); fonte pequena, centro superior
- **Não confundir** com timer por operação (barra existente)

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| R1 | `session.elapsedMs` incrementa em playing (rAF ou delta no loop existente) |
| R2 | Pausa quando `awaitingAutoCheckChoice` (tarefa 05) |
| R3 | HUD: texto centro-superior, `text-xs`, cor muted |
| R4 | Game over card: "Tempo: {m:ss}" |
| R5 | `ScoreRecord` ganha campo `durationMs: number` |
| R6 | `HistoryModal` lista tempo ao lado de score/data |
| R7 | Ordenação recordes **continua por score** (não por tempo) |

---

## Modelo de dados

```typescript
interface ScoreRecord {
  score: number
  date: string
  id: string
  durationMs: number  // novo — default 0 em migração
}
```

Migração: records antigos sem `durationMs` → exibir "—" ou omitir.

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/engine/types.ts` | `elapsedMs` em GameSession |
| `src/hooks/useGame.ts` | Acumular elapsed no loop timer; passar ao saveTopScore |
| `src/platform/storage.ts` | Estender ScoreRecord + parse |
| `src/components/game/GameScreen.tsx` | `SessionTimer` componente header |
| `src/components/modals/HistoryModal.tsx` | Coluna tempo |

Helper:

```typescript
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
```

Layout header sugerido:

```
        [ 2:34 ]          ← session timer (centro)
Pontuação          [menu]
   340
```

---

## Testes manuais

- [ ] Timer sobe durante playing
- [ ] Modal timeout pausa elapsed
- [ ] Novo recorde salva durationMs
- [ ] Histórico mostra tempo formatado

---

## Dependências

- **Relaciona:** 05-modal (pausa), 09-share (tempo no card)

---

## Notas de game design

Tempo no recorde adiciona **segunda dimensão** de mastery (score alto em tempo curto) — futuro badge "speed run". HUD discreto evita competir com timer por operação (tensão principal).
