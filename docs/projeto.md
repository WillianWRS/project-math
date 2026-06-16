# Project Math — Plano de Projeto

> **Nomenclatura:** *Project Math* é o nome do **projeto** (repositório, pasta, documentação interna). O **nome oficial do produto** na loja ainda está **TBD** (a definir).

Documento de planejamento: fases, prazos, avaliação de mercado e estratégia de marketing. Complementa [`jogo.md`](./jogo.md) e [`tecnico.md`](./tecnico.md).

---

## 1. Avaliação honesta do plano

### O que está forte

| Ponto | Por quê |
|-------|---------|
| **Core simples e testável** | Loop claro, spec fechada, MVP enxuto — reduz risco de nunca lançar |
| **Flow por tempo, não por matemática** | Diferencial de design; acessível sem ser trivial |
| **Moeda separada do score** | Permite economia, loja e ads sem quebrar o gameplay |
| **Cosméticos via CSS tokens** | Barato de produzir, escala para dezenas de itens |
| **Web + Android com Capacitor** | Um codebase; web funciona como vitrine e canal de aquisição |
| **Monetização em camadas** | Ads (vale conta) + IAP premium + grind coin-only — não depende de um único canal |
| **Roadmap longo de coleção** | Retenção além do loop; motivo para voltar amanhã |

### Riscos reais

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Mercado saturado de "brain training"** | Dificuldade de destaque orgânico | Nicho claro: *flow + cadência*, não "IQ test"; ASO e clipes curtos |
| **Scope creep (laterais, loja, ads)** | Atraso ou qualidade baixa | Fases rígidas; core na loja antes de economia completa |
| **Solo dev / time pequeno** | Prazos estouram 2–3× | M1 jogável em 4–6 semanas; publicar cedo com pouco |
| **CAC alto em mobile** | LTV < custo de aquisição | Web/PWA gratuita; TikTok/Reels orgânico; evitar paid ads no início |
| **AdMob eCPM baixo no BR** | Receita de ads modesta | Ads como conveniência, não pilar; IAP cosmético complementar |
| **Retenção D7 típica baixa em casual** | 15–25% já é ok | Daily ad slot + coleção + recorde pessoal |

### Veredito

O plano é **sólido e executável** para um produto indie/small team. Não é um "unicornio" garantido — é um jogo casual bem desenhado com **monetização madura** e **margem de retenção** acima da média de um quiz matemático genérico.

A aposta certa é: **lançar o core cedo**, medir retenção, só então investir pesado em loja e marketing pago.

---

## 2. Probabilidade de sucesso

Escala usada (produto consumer mobile/web, meta: receita sustentável + base ativa, não necessariamente hit viral):

| Cenário | Prob. | Definição de "deu certo" |
|---------|-------|--------------------------|
| **Fracasso** — abandona ou < 500 downloads | ~25% | Sem retenção; projeto encerra em 6 meses |
| **Hobby** — publicado, comunidade pequena, receita simbólica | ~35% | 500–5k downloads; R$ 200–2k/mês; validação positiva |
| **Sustentável** — produto vivo, receita complementar real | ~28% | 5k–50k downloads; D7 ≥ 20%; R$ 2k–15k/mês |
| **Hit indie** — destaque em loja / viral orgânico | ~10% | 50k+ downloads; imprensa/creators; R$ 15k+/mês |
| **Breakout** — top charts brain/casual | ~2% | 500k+ downloads; requer sorte + marketing excepcional |

**Probabilidade combinada de "dar certo" (sustentável ou melhor): ~38%**  
**Probabilidade de lançar e ter alguma tração (hobby+): ~73%**

Esses números assumem: lançamento real na Play Store, marketing orgânico consistente por 3+ meses, e core polido (não beta eterno).

Fatores que **aumentam** a probabilidade:

- Publicar M1 em ≤ 8 semanas
- Vídeos curtos (gameplay satisfatório: flow, level up, moedas)
- ASO bem feito (pt-BR + en-US)
- Iterar retenção antes de encher loja de skins
- Web jogável compartilhável ("joga no link")

Fatores que **diminuem**:

- Adiar lançamento para "loja completa"
- Paid UA sem LTV comprovado
- Gameplay genérico sem identidade visual/sonora
- Ignorar feedback de playtest nos primeiros 100 usuários

---

## 3. Fases do projeto

Estimativas para **1 dev full-time** ou **2 devs part-time (~60% equivalente)**. Buffer de ~20% já incluído nas datas.

### Visão geral

| Fase | Nome | Duração | Entrega principal |
|------|------|---------|-------------------|
| **M0** | Setup | 1 semana | Repo, CI, shell Capacitor, deploy web |
| **M1** | Core jogável | 4–5 semanas | Gameplay completo conforme `jogo.md` |
| **M2** | Polish + Android | 3 semanas | Sons, haptics, AAB, soft launch interno |
| **M3** | Economia base | 3–4 semanas | Moedas, loja, 10–15 cosméticos |
| **M4** | Monetização | 2–3 semanas | AdMob rewarded, RevenueCat, limites diários |
| **M5** | Lançamento | 2 semanas | ASO, store listing, marketing inicial |
| **M6** | Pós-lançamento | contínuo | Bônus laterais, catálogo, eventos, iOS |

**Total até lançamento público (M5): ~15–18 semanas (~4 meses)**

---

### M0 — Setup (Semana 1)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Fundação técnica sem gameplay |
| **Entregas** | Vite + React + TS + Tailwind; Capacitor init; ESLint/Prettier/Vitest; deploy Cloudflare Pages; estrutura de pastas conforme `tecnico.md` |
| **Critério de done** | `npm run dev` roda; build web no ar; APK debug instala |
| **Duração** | 5 dias úteis |

---

### M1 — Core jogável (Semanas 2–6)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Jogo completo jogável no browser |
| **Entregas** | 3 campos + confirmar/Enter; engine de operações (0–99); 5 níveis por score; timer; shake/erro; game over; recorde local; background animado sync nível; modais histórico/config |
| **Testes** | Vitest: gerador de ops, level calc, scoreToLevel |
| **Critério de done** | Partida completa jogável mobile browser; spec `jogo.md` 100% |
| **Duração** | 4–5 semanas |

---

### M2 — Polish + Android (Semanas 7–9)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Sensação de produto; build Android |
| **Entregas** | Howler SFX (acerto, erro, level up, game over); Motion polish; safe areas; ícone/splash; AAB assinado; teste em 3+ devices |
| **Critério de done** | APK/AAB estável; áudio e animações sem jank |
| **Duração** | 3 semanas |

---

### M3 — Economia base (Semanas 10–13)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Meta-game de coleção |
| **Entregas** | Moedas pós-partida; `PlayerData` persistido; loja UI; 10–15 itens cosméticos; equipar/preview; ThemeProvider; % coleção |
| **Critério de done** | Comprar e equipar skin; moedas persistem entre sessões |
| **Duração** | 3–4 semanas |

---

### M4 — Monetização (Semanas 14–16)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Receita e conveniência |
| **Entregas** | AdMob rewarded (vale conta 5/dia); RevenueCat (2–3 IAP); daily reset; adapters web noop; tela "obter vale conta" |
| **Critério de done** | Ad testa em device real; IAP sandbox OK; limites diários funcionam |
| **Duração** | 2–3 semanas |

---

### M5 — Lançamento (Semanas 17–18)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Play Store + primeiros usuários |
| **Entregas** | Store listing (pt + en); screenshots; vídeo curto; política de privacidade; soft launch; post Reddit/Twitter/TikTok |
| **Critério de done** | App publicado; link web live; analytics básico instalado |
| **Duração** | 2 semanas |

---

### M6 — Pós-lançamento (Mês 5+)

| Item | Detalhe |
|------|---------|
| **Objetivo** | Retenção e conteúdo |
| **Entregas** | Bônus lateral esquerda/direita; expandir catálogo (40–80 itens); daily login bonus; metas semanais; iOS se métricas OK; leaderboard opcional |
| **Ritmo** | Release a cada 2–3 semanas |
| **Duração** | Contínuo |

---

### Timeline visual

```
M0   M1────────────── M2───── M3──────── M4──── M5── ▶ Launch
│    │                │       │          │      │
S1   S2──S3──S4──S5──S6  S7─S8─S9  S10─S13  S14─16 S17-18
     └─ core ─────────┘  polish  economy  $$    store
```

**Marco alternativo (lean):** publicar na Play Store ao fim de **M2** (só core + recorde), economia em update 1.0.1 — aumenta chance de feedback real mais cedo.

---

## 4. Métricas de sucesso (KPIs)

Medir desde M5; revisar semanalmente no primeiro mês.

| Métrica | Meta M1 (30 dias pós-launch) | Meta M6 (6 meses) |
|---------|------------------------------|-------------------|
| Downloads | 500+ | 10k+ |
| D1 retenção | ≥ 35% | ≥ 40% |
| D7 retenção | ≥ 18% | ≥ 22% |
| Sessões/usuário/dia | ≥ 1.5 | ≥ 2 |
| Partidas/sessão | ≥ 2 | ≥ 3 |
| % usuários que abrem loja | ≥ 25% | ≥ 40% |
| Ad opt-in rate (vale conta) | ≥ 15% of DAU | ≥ 20% |
| IAP conversion | ≥ 1% | ≥ 2–3% |
| Rating Play Store | ≥ 4.0 | ≥ 4.3 |

Se D7 < 12% após 30 dias: **pausar conteúdo de loja** e iterar core (timer, feedback, onboarding).

---

## 5. Marketing — o que similares fizeram

Referências: *2048*, *Threes*, *Elevate*, *Peak*, *Mental Math*, *Quick Brain*, *Nerdle*, jogos hyper-casual com loop satisfatório (*Flappy Bird*, *Crossy Road*), e títulos com meta-progression (*Duolingo*, *Wordle*).

### 5.1 Padrões que funcionaram

| Tática | Quem fez | Aplicação para Project Math |
|--------|----------|----------------------------|
| **Simplicidade visual em screenshot** | 2048, Wordle | Store: uma coluna, número grande, timer visível — entendimento em 2 s |
| **Vídeo de 15–30 s ASMR/satisfação** | Hyper-casual TikTok | Clip: acertos em sequência, level up, fundo acelerando, *ding* de moeda |
| **Web jogável + compartilhar score** | Wordle, 2048 | PWA free; "Fiz 340 no Project Math" (imagem/card) |
| **ASO long-tail pt-BR** | Apps BR de matemática | "cálculo mental", "treino cerebral", "jogo de conta", "matemática rápida" |
| **Onboarding zero** | 2048, Flappy Bird | Primeira partida em ≤ 3 toques; regras implícitas |
| **Daily habit hook** | Duolingo, Wordle | 5 vale-conta/dia + daily moedas (M6) |
| **Creator seeding micro** | Indie hits 2023–24 | 10–20 micro-influencers edu/games BR (50k–200k) — key grátis, sem paid post inicial |
| **Reddit / comunidades** | Vários indies | r/brasil, r/androidapps, r/WebGames, r/incremental_games — post honesto "fiz um jogo" |
| **Soft launch geo** | Supercell, etc. | BR primeiro (CPI menor, idioma nativo); en-US se retenção OK |
| **Update-driven featuring** | Play Store indie | Update a cada 2–3 sem com "Novos temas" na changelog — sinal de app vivo |
| **Identidade forte** | Threes, Duolingo | Nome + visual distintivo + paleta consistente; não parecer clone de quiz genérico |

### 5.2 O que evitar (erros comuns dos similares que falharam)

| Anti-padrão | Por quê falha |
|-------------|---------------|
| Anúncios intersticiais agressivos | D1 cai drasticamente; brain games precisam de flow |
| Paywall antes da 1ª partida | Wordle nunca fez isso; primeira sessão é sagrada |
| Paid UA antes de D7 comprovado | Queima caixa; indie não compete com LTV de hyper-casual studio |
| Store listing genérico | "Math game fun!!!" — não converte; mostrar loop real |
| Lançar sem web | Perde canal grátis de compartilhamento e teste |
| Tradução automática en-US | Review negativo; traduzir ou focar pt-BR primeiro |

### 5.3 Plano de marketing por fase

| Fase | Ações | Budget |
|------|-------|--------|
| **Pré-launch (M1–M4)** | Conta TikTok/Reels devlog; 2–3 clipes/semana; landing simples; lista email/WhatsApp opcional | R$ 0 |
| **Launch (M5)** | Post em 5–8 comunidades; Product Hunt (web); press kit mini; pedir review a 50 beta testers | R$ 0–500 |
| **M5–M6** | ASO iterativo; A/B screenshots; 1 creator/semana orgânico; Reddit posts mensais | R$ 0–1k/mês |
| **Se D7 ≥ 20%** | Teste Google App Campaign R$ 30–50/dia por 14 dias; medir LTV | R$ 1–2k teste |
| **Se D7 < 15%** | Zero paid; só iterar produto | R$ 0 |

### 5.4 Mensagem de posicionamento

**Não competir como:** "mais um app de matemática / QI".

**Competir como:** *"Entre no flow — contas em cadeia, ritmo que acelera, seu recorde e sua coleção te esperam amanhã."*

Pilares de copy:

1. **Flow** — o jogo acelera com você  
2. **Cadência** — uma coluna, uma conta, confirmar  
3. **Seu progresso** — recorde + coleção + moedas  

---

## 6. Modelo de receita (expectativa realista)

Estimativa conservadora — **6 meses pós-launch**, cenário "sustentável" (10k downloads, 800 MAU):

| Fonte | Premissa | Receita mensal est. |
|-------|----------|---------------------|
| Rewarded ads | 800 MAU × 20% opt-in × 2 views/dia × eCPM R$ 8 | R$ 800–1.500 |
| IAP cosmético | 800 MAU × 2% conv × ticket R$ 15 | R$ 200–400 |
| Pacotes moeda | 800 MAU × 0.5% × R$ 10 | R$ 40–80 |
| **Total** | | **R$ 1.000–2.000/mês** |

Cenário **hit indie** (50k MAU): escala ~5–10×. Não bankar nisso no plano.

---

## 7. Decisões em aberto (resolver antes de M3)

| # | Decisão | Recomendação |
|---|---------|--------------|
| 1 | Lançar na M2 (lean) ou M5 (completo)? | **M2 lean** se solo dev; M5 se quer primeira impressão "premium" |
| 2 | Nome final e domínio | Registrar cedo; verificar Play Store |
| 3 | pt-BR only no launch? | **Sim** — ASO e copy nativos; en-US em M6 |
| 4 | Backend para leaderboard? | **Não no MVP** — recorde local basta |
| 5 | Score → moedas: linear ou tabela? | Tabela por faixas — recompensa partidas boas sem inflacionar |

---

## 8. Resumo executivo

| Aspecto | Avaliação |
|---------|-----------|
| **Plano de produto** | Forte — core claro, meta-game com propósito |
| **Plano técnico** | Adequado — Capacitor + React escala bem |
| **Prazo realista** | 4 meses até launch completo; 2–2.5 meses launch lean |
| **Chance hobby+** | ~73% se lançar de fato |
| **Chance sustentável+** | ~38% com marketing orgânico consistente |
| **Maior risco** | Nunca lançar por scope creep |
| **Maior alavanca** | Core viciante + clipes curtos + web compartilhável |

**Recomendação final:** aprovar o plano; executar M0→M1 imediatamente; decidir lean vs full launch após M1 com base em playtests (5–10 pessoas, observar se pedem "mais uma").

---

*Documento versão 1.0 — plano de projeto e mercado.*
