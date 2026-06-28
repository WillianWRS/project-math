# Refatoração do input numérico — fonte única de verdade

> Relatório técnico: como o valor digitável era gerenciado, onde estava o bug,
> qual correção paliativa foi aplicada e como a arquitetura foi consolidada.

---

## Contexto do problema

Durante a partida, o jogador digitava o primeiro dígito de uma resposta (ex.: **4** de **43**)
e, pouco depois, o dígito sumia da tela. Ao confirmar, apenas o segundo dígito (**3**) era
enviado — resposta errada sem explicação aparente na UI.

---

## Arquitetura anterior (dual source of truth)

### Visão geral

O valor exibido no teclado era mantido em **dois lugares** que podiam divergir:

| Camada | Estado | Atualizado quando |
|--------|--------|-------------------|
| **UI (React)** | `inputValue` no reducer de `useGameSession` | Cada tecla via `onInputChange` |
| **Engine** | `session.inputValue` em `GameSession` | Submit, unlock após erro, reset de partida |

Enquanto o jogador digitava, **só a UI mudava**. A sessão da engine permanecia com
`inputValue: ''` até o `onConfirm`.

### Classes / módulos envolvidos

#### `src/hooks/game/useGameSession.ts`

- **Reducer** `sessionReducer` guardava `{ session, inputValue }` — dois campos no mesmo estado React.
- **`onInputChange(value)`** — filtrava dígitos e despachava `{ type: 'input', value }` (só UI).
- **`setInputValue(value)`** — idem, só atualizava `inputValue` React.
- **`setSession(action)`** — atualizava `session` e, via heurística, podia **sobrescrever** `inputValue` UI.

#### `src/lib/session-input-sync.ts`

- **`shouldSyncInputFromSession(previous, next, displayedInputValue)`** — decidía se o display
  deveria ser forçado a `next.inputValue` da sessão.

Heurística original (bugada):

```typescript
return next.inputValue !== previous.inputValue
    || next.inputValue !== displayedInputValue
```

A segunda cláusula tratava “UI ≠ sessão” como estado **stale**. Durante digitação normal isso
é **sempre** verdade (UI `'4'`, sessão `''`), então qualquer `setSession` cosmético apagava o dígito.

#### `src/engine/game-state-machine.ts`

Funções da engine que **alteram** `session.inputValue`:

| Função | Efeito em `inputValue` |
|--------|------------------------|
| `createInitialSession()` | `''` |
| `startGame()` | `''` |
| `setInputValue(session, value)` | Normaliza dígitos (máx. 2) e grava na sessão |
| `submitAnswer()` — acerto | `''` + `answerFlash` |
| `submitAnswer()` — erro | Mantém valor; `isSubmitLocked: true` |
| `unlockSubmit()` | `''` (após ~280 ms do erro) |
| `clearAnswerFlash()` | **Não muda** (só remove flash) |
| `clearLevelUpFlash()` | **Não muda** |

#### `src/hooks/game/useGameActions.ts`

- **`onConfirm()`** → `applyAnswerResult()`:
  1. `setInputValue(current, inputValueRef.current)` — **copiava** ref da UI para a sessão
  2. `submitAnswer(sessionWithInput)`
  3. `setSession(next)`

- **`onAutoCorrect()`** → `runAutoCorrect()` — preenchia resultado via `setInputValue` da engine e submetia.

#### `src/components/game/GameScreen.tsx`

- **`appendDigit(digit)`** — montava `${inputValueRef.current}${digit}` e chamava `onInputChange`.
- **`backspaceDigit()`** — slice local + `onInputChange`.
- **`AnswerDisplay`** — recebia `value={inputValue}` do contexto.

#### `src/hooks/useGame.ts` (orquestrador)

Repassava `inputValue`, `onInputChange`, `inputValueRef` para a UI e `useGameActions`.
Chamava `setInputValue('')` redundante antes de `startGame()` / `returnToMenu()`.

#### Refs duplicados

- `inputValueRef` em **`useGameSession`** (espelho síncrono para submit).
- `inputValueRef` em **`GameScreen`** (montagem de dígitos no keypad antes do dispatch).

---

## Fluxo de eventos (comportamento esperado vs. bug)

### Limpeza legítima do campo

| Evento do jogo | Quem limpa | Mecanismo |
|----------------|------------|-----------|
| Acertar conta | Engine | `submitAnswer` → `inputValue: ''` → sync UI |
| Errar + fim do lock | Engine | `unlockSubmit` → `inputValue: ''` → sync UI |
| Auto-check | Engine | Preenche + submit → mesmo fluxo de acerto |
| Backspace | UI only (antes) | `onInputChange` com string menor |
| Nova partida / menu | Engine | `startGame()` / `createInitialSession()` com `''` |

### O gatilho do bug

1. Jogador **acerta** → `submitAnswer` limpa sessão; flash “43” aparece.
2. Jogador já digita **4** da próxima conta → UI `'4'`, sessão `''`.
3. ~**560 ms** depois: `useGameSession` dispara `clearAnswerFlash` → `setSession`.
4. `shouldSyncInputFromSession`: sessão não mudou input, mas `'' !== '4'` → **sync forçado** → UI apagada.

Mesmo padrão podia ocorrer com `clearLevelUpFlash` (~1200 ms) ou timeout cosmético no relógio.

### Correção paliativa (sprint anterior)

Restringir sync à **intenção explícita da engine**:

```typescript
return next.inputValue !== previous.inputValue
```

Eliminou o sintoma, mas manteve a dualidade UI/sessão — ainda havia dois estados, refs espelhados
e merge manual no confirm.

---

## Arquitetura nova (fonte única de verdade)

### Princípio

**`session.inputValue` é o único lugar onde o valor digitável existe.**

- Não há mais `inputValue` paralelo no reducer React.
- `inputValue` exportado pelo hook é **alias** de `session.inputValue` (conveniência para a UI).
- Cada tecla chama a engine: `setSession(s => applyInputToSession(s, dígitos))`.

### Mudanças por arquivo

#### `src/hooks/game/useGameSession.ts`

- Reducer guarda **apenas** `GameSession` (não mais `{ session, inputValue }`).
- **`onInputChange`** / **`setInputValue`** → `setSession(current => applyInputToSession(current, value))`.
- **`setSession`** atualiza `sessionRef` e `inputValueRef` **sincronamente** dentro do updater
  (handlers no mesmo tick veem valor atualizado antes do re-render).
- Removida importação de `session-input-sync`.

#### `src/hooks/game/useGameActions.ts`

- **`onConfirm`** chama `submitAnswer(sessionRef.current)` diretamente — input já está na sessão.
- Removido parâmetro `inputValueRef` (não necessário).
- Removido merge `setInputValue(current, inputValueRef.current)` antes do submit.

#### `src/hooks/useGame.ts`

- Removidas chamadas redundantes `setInputValue('')` antes de `startGame()` / `returnToMenu()`
  (a engine já inicializa com `inputValue: ''`).

#### Removidos

- **`src/lib/session-input-sync.ts`** — heurística de sync não é mais necessária.
- **`tests/lib/session-input-sync.test.ts`** — substituído por testes em `useGameSession.test.tsx`.

#### Inalterados (já corretos)

- **`GameScreen`** — continua usando `onInputChange` / `inputValue`; comportamento idêntico na UI.
- **`game-state-machine.setInputValue`** — continua sendo a única função que normaliza dígitos na sessão.
- **`useBenchmark`** — já usava `setInputValue` da engine diretamente na sessão.

---

## Diagrama comparativo

### Antes

```
Tecla → onInputChange → inputValue (React)     ← display
                              ↕ shouldSyncInputFromSession (heurística frágil)
setSession (flash, timer…) → session.inputValue ← engine (atrasada)
Confirm → copia ref UI → session → submitAnswer
```

### Depois

```
Tecla → onInputChange → setSession(applyInputToSession) → session.inputValue ← única fonte
Display ← session.inputValue (alias inputValue)
Confirm → submitAnswer(session)  // input já presente
```

---

## Testes de regressão

Em `src/hooks/game/useGameSession.test.tsx`:

- Dígitos persistem em `session.inputValue` após `onInputChange`.
- `clearAnswerFlash` **não** apaga dígitos já digitados.
- `submitAnswer` (acerto) limpa `session.inputValue` e o alias UI.

Suíte completa: **66 testes** passando após a refatoração.

---

## Benefícios

1. **Impossível** “UI à frente da sessão” — não há segunda fonte para divergir.
2. **Menos código** — removidos sync helper, action `input` do reducer e merge no confirm.
3. **Modelo mental alinhado à engine** — o que você digita *é* o estado da partida.
4. **Refs simplificados** — `inputValueRef` espelha sempre `session.inputValue`; um único caminho de atualização.

---

## Referência rápida de API pós-refatoração

| Export / método | Responsabilidade |
|-----------------|------------------|
| `useGameSession().session` | Estado completo da partida |
| `useGameSession().inputValue` | Alias de `session.inputValue` |
| `useGameSession().onInputChange(v)` | Filtra dígitos → `applyInputToSession` |
| `useGameSession().setInputValue(v)` | Atualização direta via engine |
| `useGameSession().setSession(updater)` | Transições gerais; refs atualizados no act |
| `game-state-machine.setInputValue` | Normalização (só dígitos, máx. 2) |
| `game-state-machine.submitAnswer` | Valida `session.inputValue`; limpa no acerto |
| `useGameActions.onConfirm` | Submit lê input já na sessão |
