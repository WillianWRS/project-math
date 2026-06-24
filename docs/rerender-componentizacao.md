# Estrategia de componentizacao para reduzir re-render

## Objetivo

Quebrar a `GameScreen` em componentes com responsabilidades isoladas, evitando que mudancas de alta frequencia (timer) invalidem a arvore inteira.

## Principios

- **Single source de estado quente**: timer fica fora do estado React principal.
- **Assinatura local**: somente componentes que precisam do timer usam `useGameTimer`.
- **Props estaveis**: evitar objetos inline e callbacks recriados sem necessidade.
- **Separacao por frequencia**:
  - **Alta frequencia**: timer, glow, barra.
  - **Media frequencia**: score, operacao, input.
  - **Baixa frequencia**: menu, modais, configuracoes.

## Fronteiras de componentes

- `GameSceneRoot`
  - `TimerDangerOverlay` (unico com `useGameTimer` para glow)
  - `GameSceneBackground`
  - `GameHeader`
  - `GameMainContent`
  - `GameMenuChrome`
  - `GameModalsHost`

### 1) Timer e glow (alta frequencia)

- `TimerDangerOverlay`
  - Calcula glow a partir do timer.
  - Atualiza CSS variables no container raiz (`--timer-danger-strength`).
  - Publica somente `dangerActive` (boolean) para o pai.
- `PlayingTimerBar` e `ElapsedTimeLabel`
  - Continuam com `useGameTimer` local e `memo`.

### 2) Header e HUD (media frequencia)

- `GameHeader`
  - Recebe somente dados de header.
  - Internamente quebrar em:
    - `HeaderLeftDock` (nivel + voltar)
    - `HeaderCenterDock` (tempo ou CTA game over)
    - `HeaderScoreDock` (label + score animado)

### 3) Conteudo principal (media frequencia)

- `GameMainContent`
  - Delega para:
    - `ThemeTestBoard`
    - `StandardGameBoard`
    - `GameOverPanel`
- `PlayFieldsFrame` e `PlayStackWithChangerBg`
  - Usam CSS var de danger; nao recebem intensidade numerica por tick.

### 4) Menu e modais (baixa frequencia)

- `GameMenuChrome` separado do gameplay.
- `GameModalsHost` com `lazy()` para:
  - `PlayerModal`
  - `ShopModal`
  - `SettingsModal`
  - ja existiam: `RewardedAutoCheckModal` e `AutoCheckTimeoutModal`

## Ordem de execucao recomendada

1. Isolar timer/glow (maior ganho imediato).
2. Extrair host de modais + lazy.
3. Extrair header.
4. Extrair boards (theme test e normal).
5. Medir de novo antes de novas micro-otimizacoes.

## Criterio de sucesso

- `GameScreen` nao assina mais `useGameTimer` diretamente.
- Re-render por tick fica concentrado em overlays/timer.
- Menor tempo de commit React durante gameplay.
- Menor custo de script por frame em device real.
