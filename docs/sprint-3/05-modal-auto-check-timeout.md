# 05 — Modal de auto-check no timeout (pause)

## Objetivo

Quando o **timer da operação chegar a 0** e `walletAutoChecks >= 1`, **não** ir direto para game over — pausar com modal in-game oferecendo usar auto-check ou desistir.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| T1 | Condição: `timerMs <= 0` AND `walletAutoChecks >= 1` AND `phase === 'playing'` |
| T2 | Entrar em sub-estado **`paused_timeout_choice`** (ou flag `session.awaitingAutoCheckChoice`) |
| T3 | Modal: título claro, ex. "Tempo esgotado!" |
| T4 | Copy: "Você tem {n} auto-check(s). Usar um para continuar?" |
| T5 | Botão primário: **Usar auto-check** → consome 1, aplica acerto automático, reinicia timer (D5) |
| T6 | Botão secundário: **Encerrar partida** → game over normal |
| T7 | Timer de operação **congelado** enquanto modal aberto |
| T8 | Se `walletAutoChecks === 0`: fluxo atual (game over imediato) |
| T9 | SFX distinto opcional ao abrir modal |

---

## Fluxo

```
timer → 0
  ├─ walletAutoChecks >= 1 → paused + AutoCheckTimeoutModal
  │     ├─ Usar → spendAutoCheck + submitAnswer(autoCheck) + unpause
  │     └─ Desistir → phase = game_over
  └─ walletAutoChecks === 0 → game_over
```

---

## Implementação sugerida

### Engine / hook

Em `useGame.ts`, no tick quando `timerMsRef <= 0`:

```typescript
// Pseudocódigo
if (walletAutoChecks > 0 && !session.awaitingAutoCheckChoice) {
  setSession({ ...session, timerMs: 0, awaitingAutoCheckChoice: true })
  return // não chama tickTimer → game_over ainda
}
```

Handlers:

- `onUseAutoCheckAtTimeout()` → `onAutoCorrect()` existente + `awaitingAutoCheckChoice: false`
- `onDeclineAutoCheck()` → `tickTimer` / `phase: game_over`

### UI

| Arquivo | Mudança |
|---------|---------|
| `src/components/modals/AutoCheckTimeoutModal.tsx` | Novo |
| `src/engine/types.ts` | `awaitingAutoCheckChoice?: boolean` |
| `src/components/game/GameScreen.tsx` | Render modal; bloquear keypad |

Modal **não** fecha ao tocar fora — escolha explícita.

---

## Edge cases

| Caso | Comportamento |
|------|---------------|
| Saldo 1+ na carteira | Modal oferece usar |
| Operação null | Fallback game over |
| Duplo tick timer | Guard com flag `awaitingAutoCheckChoice` |
| Usar AUTO | Mesmo efeito que teclado: flash amber, +10 score, nova op |

---

## Testes manuais

- [ ] Timer 0 com 1 wallet AUTO → modal aparece, partida não acaba
- [ ] Usar → continua, timer reinicia, saldo -1
- [ ] Desistir → game over, score preservado
- [ ] 0 AUTO → game over sem modal

---

## Dependências

- **Depende de:** 04-auto-check-persistente
- **Relaciona:** lógica existente `onAutoCorrect` em `useGame.ts`

---

## Notas de game design

Excelente **momento de tensão + escolha** — converte auto-check em **salva-vidas** dramático. Ciclo lateral, meta e ads alimentam a mesma carteira — jogador entende um único recurso.
