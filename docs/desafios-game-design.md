# Relatório de Game Design — Modos de Desafio

Análise dos quatro modos diários implementados no alfa, com foco em economia, curva de dificuldade, retenção e riscos de balanceamento.

---

## Visão geral do sistema

| Modo | Entrada | Nível mín. | Recompensa principal | Limite |
|------|---------|------------|----------------------|--------|
| Moedas em dobro | 25 moedas | 10 | 2× moedas pós-partida (teto 1.000 pts) | 1×/dia |
| 60 segundos | 5 moedas | 10 | XP + moedas pelo score | 1×/dia |
| 3 segundos | 25 moedas | 15 | +25 e +50 moedas fixas | 1×/dia |
| Só X ÷ | 25 moedas | 20 | +70 moedas ao completar 50 rounds | 1×/dia |

**Custo total diário máximo (todos os modos):** 80 moedas  
**Retorno potencial máximo (cenário ideal):** variável por skill + 75 + 70 moedas fixas

---

## 1. Moedas em dobro

### O que funciona bem

- **Proposta clara:** o jogador entende imediatamente o trade-off — paga 25 para tentar converter skill em moedas em dobro.
- **Teto de 1.000 pts** evita sessões infinitas e limita o retorno máximo a ~200 moedas (100 de base × 2), menos a taxa de entrada → **lucro líquido ~175 moedas** no cenário perfeito.
- **Requisito nível 10** alinha com o momento em que o jogador já domina ritmo e game changers ocasionais.
- Complementa a meta diária (+10 moedas): incentiva jogar o modo sem substituir a rotina principal.

### Riscos e sugestões

| Risco | Severidade | Nota |
|-------|------------|------|
| ROI negativo para jogadores casuais | Média | Score ~200 → 20 moedas × 2 = 40 − 25 entrada = +15. Precisa ~125 pts para empatar. |
| Farming com auto-check | Baixa | Auto-check ainda funciona; monitorar se jogadores experientes abusam no teto. |
| Nome vs. regra | Baixa | Modo não limita tempo por operação; só o score. Nome está correto. |

**Veredito:** modo sólido de **sink/risk-reward**. Funciona como “investimento” diário para quem confia no skill. Boa escolha para nível 10.

---

## 2. 60 segundos

### O que funciona bem

- **Entrada barata (5 moedas)** convida experimentação diária — excelente para retenção.
- **Ritmo nível 5 desde o início** cria pressão imediata; diferencia claramente do modo normal.
- **Sem recompensa fixa** mantém o foco em performance pura; XP e moedas escalam com skill.
- Janela curta (60 s) encaixa bem em sessões mobile.

### Riscos e sugestões

| Risco | Severidade | Nota |
|-------|------------|------|
| Retorno baixo para iniciantes no lvl 10 | Média | 5–8 acertos em 60 s → 5–8 moedas − 5 entrada ≈ empate. |
| Pouco “wow factor” vs. modo normal | Média | Falta um bônus simbólico (+5 moedas fixas?) para garantir sensação de vitória. |
| Mesmo requisito que Moedas em dobro | Baixa | Dois modos desbloqueiam juntos; pode saturar escolha no primeiro dia. |

**Projeção de score típico (lvl 10–15, ritmo 5):** 80–250 pts → 8–25 moedas.

**Veredito:** ótimo **modo de engajamento diário barato**. Funciona como “aquecimento” ou desafio de velocidade. Considerar micro-bônus fixo no futuro se a taxa de conclusão cair.

---

## 3. 3 segundos

### O que funciona bem

- **Fantasia forte:** sequência completa dos game changers +99 e descida ao 1 — showcase das mecânicas avançadas.
- **Recompensa fixa escalonada (25 + 50)** dá marcos claros de progresso dentro da partida.
- **Troca seca de BG** reforça transição entre fases sem distrair.
- **Nível 15** garante que o jogador já viu game changers no modo normal.

### Riscos e sugestões

| Risco | Severidade | Nota |
|-------|------------|------|
| Nome confuso | Alta | “3 segundos” sugere timer de 3 s; o modo é maratona +99/−1. Renomear para algo como “Até 99” ou “Subida e descida” reduziria fricção. |
| Entrada 25 vs. retorno 75 | Baixa | Lucro líquido ~50 moedas no sucesso — justo para desafio skill-based longo (~98+98 operações no pior caso). |
| Frustração em falha tardia | Média | Errar na fase − após ganhar +25 pode parecer punição severa. Feedback visual do progresso (ex.: “Fase 2/2”) ajudaria. |
| Duração longa | Média | Pode levar vários minutos; desalinhado com “sessão rápida” dos outros modos. |

**Veredito:** o modo mais **memorável e diferenciado**, mas o nome é o maior problema de UX. Mecânica sólida para jogadores dedicados; retorno econômico equilibrado se completarem.

---

## 4. Só X ÷

### O que funciona bem

- **Recompensa fixa generosa (+70)** vs. entrada 25 → lucro líquido **+45** garantido ao completar.
- **50 rounds ×÷** treina a operação mais difícil do jogo — reforço pedagógico real.
- **Nível 20** posiciona como desafio endgame da progressão de desafios (10 → 10 → 15 → 20).
- Resultado binário (completou ou não) simplifica expectativa de recompensa.

### Riscos e sugestões

| Risco | Severidade | Nota |
|-------|------------|------|
| Único modo com ROI positivo garantido | Média | Jogadores lvl 20+ podem priorizá-lo sempre; os outros ficam secundários. |
| Duração (~3–5 min) | Baixa | Aceitável para recompensa fixa alta. |
| Falha sem retorno | Média | Perder 25 moedas após 40 rounds pode frustrar; parcial progress reward seria opção futura. |

**Veredito:** melhor **modo econômico** da rotação diária para jogadores maduros. Funciona como recompensa confiável e teste de maestria em ×÷.

---

## Economia diária consolidada

### Cenário jogador dedicado (completa os 4 modos)

| Modo | Entrada | Retorno estimado | Líquido |
|------|---------|------------------|---------|
| Moedas em dobro | −25 | +120 (600 pts × 2/10) | +95 |
| 60 segundos | −5 | +16 (160 pts) | +11 |
| 3 segundos | −25 | +75 fixo | +50 |
| Só X ÷ | −25 | +70 fixo | +45 |
| **Total** | **−80** | **~281** | **~+201** |

Isso representa **~201 moedas líquidas/dia** para um jogador acima da média — equivalente a ~20 partidas normais medianas. **Não quebra** a progressão do cenário B de preços (temas ~160–320, badges ~130–200), mas acelera jogadores daily-active.

### Recomendações de balanceamento (futuro)

1. **Renomear “3 segundos”** para evitar expectativa errada.
2. **Micro-bônus no 60 segundos** (+5 moedas ao terminar) para reforçar hábito.
3. **Indicador de fase** no modo +99/−1 (1/2, 2/2).
4. **Monitorar taxa de conclusão** de Só X ÷ — se >90%, considerar reduzir recompensa para 55–60 ou subir entrada para 30.
5. **Ordem de desbloqueio** (10, 10, 15, 20) cria rampa boa; evitar adicionar 5º modo antes do beta.

---

## Conclusão

Os quatro modos cobrem três papéis distintos:

- **Investimento skill-based:** Moedas em dobro  
- **Engajamento rápido:** 60 segundos  
- **Showcase / mastery:** 3 segundos  
- **Recompensa confiável endgame:** Só X ÷  

O limite de **uma tentativa por dia** com cobrança na entrada cria rotina saudável sem substituir o loop principal (“Jogar”). A implementação isola regras na engine de desafios, preservando o modo normal — boa decisão técnica para evoluir no beta (ex.: desafios semanais, multijogador).
