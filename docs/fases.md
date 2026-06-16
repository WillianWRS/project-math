# Project Math — Fases de Desenvolvimento

> **Nomenclatura:** *Project Math* é o nome do **projeto** (repositório, pasta, documentação interna). O **nome oficial do produto** na loja ainda está **TBD** (a definir).

Ordem prática de execução, diferente da numeração M0–M6 de [`projeto.md`](./projeto.md). Aqui a prioridade é **validar o conceito antes de embelezar ou montar o restante da infraestrutura**.

Complementa [`jogo.md`](./jogo.md) (regras) e [`tecnico.md`](./tecnico.md) (stack completa).

---

## Princípio central

```
Tela jogável → Loop completo → Playtest → Só então polish + infra
```

| Fazer cedo | Adiar |
|------------|-------|
| Layout funcional com botões | Tailwind, Motion, fundo animado |
| Engine matemática em TS puro | Capacitor, AdMob, RevenueCat |
| Timer e estados do jogo | CI, deploy, estrutura de pastas completa |
| Recorde em `localStorage` | Loja, moedas, cosméticos |
| `npm run dev` no browser | AAB, ícones, haptics, ASO |

**Regra de ouro:** se o loop não prende em wireframe feio, animação não salva. Medir retenção no protótipo antes de investir em polish e plataforma.

---

## Visão geral

| Fase | Nome | Duração est. | Objetivo |
|------|------|--------------|----------|
| **F0** | Scaffold mínimo | 0,5–1 dia | Rodar no browser com o mínimo instalado |
| **F1** | Tela jogável (wireframe) | 2–3 dias | Ver e clicar todos os elementos da UI |
| **F2** | Core gameplay | 1–2 sem | Partida completa conforme `jogo.md` |
| **F3** | Validação do conceito | 3–5 dias | Playtest + gate de decisão |
| **F4** | Polish visual e sensorial | 1–2 sem | Embelezar só após validação |
| **F5** | Infraestrutura técnica | 1 sem | Estrutura, testes, CI, deploy web |
| **F6** | Android (Capacitor) | 1–2 sem | Empacotar o que já funciona na web |
| **F7** | Economia e loja | 3–4 sem | Meta-game pós-core validado |
| **F8** | Monetização | 2–3 sem | Ads + IAP |
| **F9** | Lançamento | 2 sem | Play Store + marketing inicial |

**Até validação (F0–F3): ~2–3 semanas**  
**Até web polida + deploy (F0–F5): ~4–5 semanas**  
**Até launch completo (F0–F9): ~3–4 meses**

---

## F0 — Scaffold mínimo

**Objetivo:** ter um projeto que abre no browser. Nada além do necessário para a F1.

### Instalar agora

| Pacote | Motivo |
|--------|--------|
| Vite + React + TypeScript | Shell da aplicação |
| ESLint básico | Já vem no template; evitar débito imediato |

### Não instalar ainda

Tailwind, Motion, Zustand, Howler, Capacitor, React Router, Vitest, Prettier (config elaborada), AdMob, RevenueCat.

### Entregas

- [ ] `npm run dev` abre localhost
- [ ] `App.tsx` renderiza placeholder da tela principal
- [ ] README ou comentário com link para este doc

### Critério de done

Projeto roda localmente. Zero preocupação com deploy, CI ou mobile.

---

## F1 — Tela jogável (wireframe)

**Objetivo:** montar a **tela principal inteira** com botões e campos funcionais visualmente — ainda **sem** lógica de jogo real. Queremos sentir o layout e o fluxo de toques antes de codar a engine.

Referência de layout: seção 3.1 de [`jogo.md`](./jogo.md).

### Entregas

- [ ] **Cabeçalho:** score e nível (valores estáticos ou mock)
- [ ] **Campo 1 — Número base** (somente leitura)
- [ ] **Campo 2 — Operação** (somente leitura, ex.: `+ 2`)
- [ ] **Campo 3 — Resposta** + botão **Confirmar**
- [ ] **Indicador de timer** (barra ou countdown mock)
- [ ] **Barra de ações:** Histórico · Iniciar · Config
- [ ] **Estados visuais** alternáveis (idle / playing / game over) — pode ser com state local simples
- [ ] **Modal Histórico** (abre/fecha, conteúdo mock)
- [ ] **Modal Config** (toggle de som mock)
- [ ] CSS mínimo inline ou um único `App.css` — legível no mobile (DevTools), sem design system

### Comportamento esperado nesta fase

| Ação | Resultado |
|------|-----------|
| Iniciar | Muda visual para *playing*; timer mock anima |
| Confirmar | Log no console ou flash visual simples |
| Histórico / Config | Abre modal; fecha ao tocar fora ou botão fechar |
| Game over (simulado) | Botão ou atalho de dev para ver estado |

### Critério de done

Qualquer pessoa abre o link local, entende a tela em **≤ 5 segundos** e consegue tocar todos os botões sem confusão. Mobile browser testado (375px).

### Duração

2–3 dias.

---

## F2 — Core gameplay

**Objetivo:** conectar a UI da F1 à **engine real**. Partida jogável de ponta a ponta, ainda feia.

Spec completa: [`jogo.md`](./jogo.md) seções 4–8.

### Instalar agora (se necessário)

Nenhuma dependência externa obrigatória — engine em TypeScript puro dentro de `src/engine/` (ou colocated até a F5).

Opcional: **Zustand** se o state local ficar verboso; preferir `useState` + funções puras até sentir dor.

### Módulos da engine (sem React)

| Módulo | Responsabilidade |
|--------|------------------|
| `operation-generator.ts` | Gera ops válidas 0–99 conforme regras da seção 6 |
| `level-system.ts` | `scoreToLevel`, duração do timer por nível |
| `timer.ts` | Countdown por operação; callback no timeout |
| `game-state-machine.ts` | Transições idle → playing → game_over |

### Entregas

- [ ] Iniciar: score 0, nível 1, base aleatória 5–25, timer 12s, primeira operação
- [ ] Confirmar (botão + Enter): validação correta/incorreta conforme spec
- [ ] Acerto: +10, nova base, nova op, timer reinicia
- [ ] Erro: shake simples (CSS `@keyframes` basta), valor mantido, timer continua
- [ ] Timeout → game over; score final; atualiza recorde se aplicável
- [ ] Level up nos limiares 50 / 100 / 150 / 200
- [ ] Persistência: recorde + data em `localStorage`
- [ ] Modais Histórico e Config funcionais com dados reais (recorde; mute preparado)

### Fora de escopo nesta fase

- Fundo animado
- SFX / Howler
- Motion / Framer
- Capacitor
- Testes automatizados (vêm na F5)
- Economia, moedas, loja

### Critério de done

Uma partida completa jogável no browser mobile: idle → playing → vários acertos/erros → game over → novo recorde opcional → Iniciar de novo. Comportamento 100% alinhado a `jogo.md`.

### Duração

1–2 semanas.

---

## F3 — Validação do conceito ⚠️ GATE

**Objetivo:** decidir se o jogo **merece** polish e infraestrutura. Não escrever código novo salvo correções de gameplay.

### Playtest

| Item | Meta |
|------|------|
| Participantes | 5–10 pessoas (mix mobile e desktop) |
| Observação | Pedir para jogar 3+ partidas sem explicar regras |
| Pergunta-chave | *"Quer jogar mais uma?"* após game over |
| Métrica informal | ≥ 60% jogam 2ª partida espontaneamente |

### Checklist de validação

- [ ] Regras entendidas sem tutorial escrito
- [ ] Timer gera tensão, não frustração cega
- [ ] Erro preservado + shake = feedback claro
- [ ] Level up perceptível (mesmo sem animação fancy)
- [ ] Sessão média ≥ 2 minutos
- [ ] Nenhum bug bloqueante (crash, input travado, ops inválidas)

### Possíveis ajustes (ainda sem polish)

- Calibrar tempos por nível (12/11/10/9/7s)
- Ajustar faixa de número base inicial
- Pequenas mudanças no gerador de operações
- Copy mínima (ex.: hint no primeiro idle)

### Decisão ao fim da F3

| Resultado | Próximo passo |
|-----------|---------------|
| **Validado** — loop prende | Avançar F4 (polish) |
| **Inconclusivo** — 3–4 playtesters ok | Iterar F2 2–3 dias, repetir playtest |
| **Reprovado** — ninguém rejoga | Pivotar mecânica ou encerrar antes de investir em infra |

**Não avançar para F4+ sem passar por este gate.**

### Duração

3–5 dias (inclui playtests e micro-iterações).

---

## F4 — Polish visual e sensorial

**Objetivo:** transformar o protótipo validado em algo que **parece um produto**. Só começa após gate da F3.

### Instalar agora

| Pacote | Motivo |
|--------|--------|
| **Tailwind CSS** | Layout responsivo, tokens, mobile first |
| **Motion** | Shake refinado, level up, transições de modal |
| **Howler.js** | SFX: acerto, erro, level up, game over |

### Entregas

- [ ] Design mobile first: tipografia, espaçamento, contraste
- [ ] Fundo animado (scroll vertical sync com nível — seção 7 de `jogo.md`)
- [ ] Feedback de acerto (flash / score animado)
- [ ] Shake e borda vermelha conforme spec (~300–600 ms)
- [ ] Pulso de level up + aceleração suave do fundo (~800 ms)
- [ ] Modais com animação de entrada/saída
- [ ] Toggle de som funcional (Howler mute)
- [ ] Safe area básica (`viewport-fit=cover`, padding inferior)
- [ ] Botões ≥ 44×44 px; `inputMode="numeric"` no campo resposta

### Critério de done

Alguém que já validou na F3 diz que *"agora parece um jogo de verdade"*. Lighthouse Performance ≥ 85 (web).

### Duração

1–2 semanas.

---

## F5 — Infraestrutura técnica

**Objetivo:** organizar o código para escalar e automatizar entrega web. O jogo já funciona e está polido; aqui entra o "resto técnico" de [`tecnico.md`](./tecnico.md).

### Instalar agora

| Pacote / ferramenta | Motivo |
|---------------------|--------|
| **Vitest** | Testes da engine |
| **Prettier** | Formatação consistente |
| **React Router** (se necessário) | Rotas futuras loja/config |
| **Zustand** (se ainda não adotado) | Stores: game, player, settings |

### Entregas

- [ ] Estrutura de pastas conforme `tecnico.md` (refatorar sem mudar comportamento)
- [ ] Engine isolada em `src/engine/` — zero import de React nos módulos puros
- [ ] Stores Zustand: `game-store`, `settings-store`, `player-store` (recorde mínimo)
- [ ] `StorageService` abstrato (localStorage; interface pronta para Capacitor Preferences)
- [ ] Vitest: gerador de ops, level calc, scoreToLevel, casos limite (base 0, 99, divisão exata)
- [ ] ESLint + Prettier configurados; script `npm test`
- [ ] GitHub Actions: lint + test + build web
- [ ] Deploy estático (Cloudflare Pages ou Vercel) — URL pública para compartilhar
- [ ] PWA básica (manifest + ícone placeholder) — opcional mas recomendado

### Critério de done

CI verde; deploy web acessível por URL; testes cobrem lógica crítica; código organizado para receber Capacitor e economia.

### Duração

~1 semana.

---

## F6 — Android (Capacitor)

**Objetivo:** empacotar a web app validada e polida. Capacitor entra **depois** do jogo estar bom no browser.

### Instalar agora

| Pacote | Motivo |
|--------|--------|
| **Capacitor 7** + CLI | Wrapper Android |
| **@capacitor/preferences** | Persistência nativa |
| **@capacitor/status-bar** | Safe area / status bar |
| **@capacitor/assets** | Ícone e splash |

### Entregas

- [ ] `capacitor.config.ts`; projeto `android/` gerado
- [ ] `StorageService` usa Preferences no native, localStorage na web
- [ ] APK debug instala e joga igual ao browser
- [ ] AAB assinado para teste interno
- [ ] Ícone e splash mínimos (não precisa ser arte final)
- [ ] Teste em 3+ devices Android
- [ ] Haptics opcional no acerto/erro

### Critério de done

Build Android estável; gameplay idêntico à web; cold start aceitável (< 4s em mid-range).

### Duração

1–2 semanas.

---

## F7 — Economia e loja

**Objetivo:** meta-game de coleção. Só após core + plataforma estáveis.

Ver [`tecnico.md`](./tecnico.md) seções 4.2, 4.3, 5 e [`projeto.md`](./projeto.md) M3.

### Entregas

- [ ] Moedas pós-partida (`scoreToCoins` por faixas)
- [ ] `PlayerData` persistido
- [ ] Loja UI + 10–15 cosméticos
- [ ] Equipar / preview; `ThemeProvider` com CSS variables
- [ ] % de coleção

### Critério de done

Comprar e equipar item; moedas persistem; visual muda na partida.

### Duração

3–4 semanas.

---

## F8 — Monetização

**Objetivo:** receita e conveniência. Corresponde a M4 de [`projeto.md`](./projeto.md).

### Instalar agora

| Pacote | Motivo |
|--------|--------|
| **@capacitor-community/admob** | Rewarded ads |
| **@revenuecat/purchases-capacitor** | IAP |

### Entregas

- [ ] Adapters noop na web; reais no Android
- [ ] Vale conta rewarded (5/dia); coin boost (3/dia)
- [ ] 2–3 IAP cosméticos / pacotes moeda
- [ ] Reset diário `America/Sao_Paulo`
- [ ] Tela "obter vale conta"

### Critério de done

Ad testa em device real; IAP sandbox OK; limites diários funcionam.

### Duração

2–3 semanas.

---

## F9 — Lançamento

**Objetivo:** Play Store + primeiros usuários. Corresponde a M5 de [`projeto.md`](./projeto.md).

### Entregas

- [ ] Store listing pt-BR (en-US opcional / M6)
- [ ] Screenshots e vídeo curto (15–30 s)
- [ ] Política de privacidade
- [ ] Soft launch; posts orgânicos (Reddit, TikTok devlog)
- [ ] Analytics básico (PostHog ou Firebase — decidir na F5/F6)

### Critério de done

App publicado; link web live; KPIs da seção 4 de `projeto.md` monitorados.

### Duração

2 semanas.

---

## Timeline visual

```
F0   F1──── F2────────── F3── F4──────── F5─── F6──── F7──────── F8─── F9
│    │      │            │    │          │     │      │          │     │
scaf wire   core gameplay ▲   polish     infra android economy    $$   store
                          │
                    VALIDAR CONCEITO
                    (gate — não pular)
```

---

## Mapa: fases deste doc ↔ fases de `projeto.md`

| Este doc | projeto.md | Nota |
|----------|------------|------|
| F0 + F1 | M0 parcial | Setup mínimo; UI antes de infra |
| F2 | M1 | Core gameplay |
| F3 | — | Gate extra; não existia explícito |
| F4 | M2 parcial | Polish antes de Android |
| F5 | M0 restante | CI, deploy, estrutura |
| F6 | M2 restante | Capacitor + AAB |
| F7 | M3 | Economia |
| F8 | M4 | Monetização |
| F9 | M5 | Lançamento |
| pós-F9 | M6 | Retenção contínua, iOS, catálogo expandido |

---

## Próximo passo imediato

Com o scaffold Vite + React já existente (**F0 parcialmente feito**), iniciar **F1 — Tela jogável (wireframe)**:

1. Montar layout da tela principal com todos os botões e campos.
2. Alternar estados idle / playing / game over com state local.
3. Abrir modais Histórico e Config (conteúdo mock).
4. Testar no mobile browser (375px).
5. Só então partir para a engine na **F2**.

---

*Documento versão 1.0 — ordem lean de desenvolvimento.*
