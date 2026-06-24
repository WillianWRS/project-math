# Profiling em device real (Chrome Performance + GPU)

## Objetivo

Confirmar se o gargalo principal durante a partida vem de:

- **React reconcile/script** (JS/commit)
- **Paint/composite/GPU** (renderizacao visual)

## Preparacao

1. Rodar app em modo producao local:
   - `npm run build`
   - `npm run preview -- --host`
2. Conectar Android via USB e abrir `chrome://inspect` no desktop.
3. Abrir a aba do jogo no device pelo IP da maquina.
4. Fechar outras abas e ativar modo aviao (reduz ruido).

## Coleta 1 — Baseline gameplay

1. Abrir DevTools remoto -> aba **Performance**.
2. Ativar:
   - Screenshots
   - Web Vitals
   - Advanced paint instrumentation (se disponivel)
3. Gravar 20-30s:
   - Entrar em partida normal.
   - Jogar continuamente (input + confirms).
   - Deixar alguns segundos em near-death timer.
4. Parar gravação e salvar trace.

## Coleta 2 — CPU stress

1. Repetir o mesmo fluxo com CPU throttling 4x.
2. Salvar novo trace para comparacao.

## Leitura dos resultados

## A) Se for React/script (reconcile)

Sinais:

- Picos em **Scripting** dominando frame budget.
- Blocos frequentes em funcoes React (render/commit/hook work).
- FPS cai mesmo quando a cena visual esta simples.

Acoes:

- Reduzir assinaturas de estado quente no topo.
- Quebrar arvore para limitar propagacao de re-render.
- Remover objetos inline/props dinamicas em caminho quente.

## B) Se for Paint/composite/GPU

Sinais:

- **Rendering/Paint/Composite Layers** altos com script moderado.
- Queda de FPS em efeitos visuais (glow, shadows, filtros).
- Camadas com muita invalidação visual por frame.

Acoes:

- Simplificar sombras/filtros em gameplay.
- Reduzir opacidade/overlays animados simultaneos.
- Preferir animacao de `transform/opacity` com menos camadas.

## Criterio objetivo para decidir gargalo

- **Script > 50% do tempo total de frame**: priorizar reconcile/componentizacao.
- **Paint+Composite > 50%**: priorizar simplificacao visual/GPU.
- **Misto**: atacar primeiro o maior bloco por frame em p95/p99.

## Checklist de comparacao (antes/depois)

- Tempo medio de frame (ms)
- p95/p99 frame time
- FPS medio
- % de tempo em Scripting
- % de tempo em Rendering/Paint/Composite
- Long tasks (> 50ms) durante gameplay
