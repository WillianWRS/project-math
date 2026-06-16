# Project Math — Especificação do Jogo

> **Nomenclatura:** *Project Math* é o nome do **projeto** (repositório, pasta, documentação interna). O **nome oficial do produto** na loja ainda está **TBD** (a definir).

Documento de design focado exclusivamente no **funcionamento**, **regras** e **telas** do jogo. Decisões de stack, arquitetura e implementação técnica ficam para documentação separada.

---

## 1. Visão geral

**Project Math** é um jogo de cálculo mental para **mobile first**, com uma única tela principal onde toda a partida acontece. O objetivo é resolver operações matemáticas em cadeia: cada resultado correto se torna o número base da próxima conta.

O jogo prioriza **exercício cerebral** e **estado de flow** — não é voltado a cálculo veloz extremo. A dificuldade cresce pelo **tempo disponível por operação**, não pela complexidade das contas.

---

## 2. Conceito central

O jogador vê uma coluna com três campos:

1. **Número base** — valor inicial da partida; a partir daí, o resultado correto da operação anterior.
2. **Operação** — operador matemático e um número para compor a conta (somente leitura).
3. **Resposta** — campo onde o jogador digita o resultado de `base operação número`.

Ao **acertar** e confirmar, o resultado vai para o campo 1, o campo 3 é limpo, uma nova operação é gerada e o timer reinicia. Ao **estourar o tempo**, a partida termina.

```
Ciclo 1:  [ 9 ]  +  [ + 2 ]  →  jogador digita 11  →  confirma  ✓
Ciclo 2:  [ 11 ] +  [ × 3 ]  →  jogador digita 33  →  confirma  ✓
Ciclo 3:  [ 33 ] +  [ ... ]  →  ...
```

---

## 3. Telas e estados da interface

### 3.1 Tela principal (única tela do jogo)

A tela principal concentra todo o gameplay e os controles de navegação. Possui três **estados visuais**:

| Estado | Descrição |
|--------|-----------|
| **Idle** | Partida parada. Campos visíveis, timer parado, score zerado ou exibindo valor da sessão anterior até reinício. Botão **Iniciar** disponível. |
| **Playing** | Partida em andamento. Timer ativo, input habilitado, animação de fundo em movimento. |
| **Game Over** | Timeout em uma operação. Partida encerrada. Exibe score final e comparação com recorde. Opção implícita de tocar **Iniciar** para nova partida. |

#### Layout da tela principal

```
┌─────────────────────────────────────┐
│  Score          Nível X             │  ← cabeçalho
│                                     │
│         ┌───────────────┐           │
│         │  Número base  │           │  ← campo 1 (somente leitura)
│         ├───────────────┤           │
│         │   Operação    │           │  ← campo 2 (somente leitura)
│         ├───────────────┤           │
│         │ [ Resposta ] [✓]│         │  ← campo 3 + botão Confirmar
│         └───────────────┘           │
│              ▓▓▓▓▓░░░░░             │  ← barra ou indicador de timer
│                                     │
│  [ Histórico ] [ Iniciar ] [ Config ]│  ← barra de ações
└─────────────────────────────────────┘
        ↑ fundo animado (scroll vertical)
```

#### Elementos permanentes

| Elemento | Comportamento |
|----------|---------------|
| **Score** | Pontuação da partida atual. Inicia em 0 a cada nova partida. |
| **Nível** | Indicador do nível de dificuldade atual (1 a 5), derivado do score. |
| **Campo 1 — Número base** | Somente leitura. Exibe valor inicial ou último resultado correto. |
| **Campo 2 — Operação** | Somente leitura. Exibe operador e operando (ex.: `+ 2`, `× 3`). |
| **Campo 3 — Resposta** | Entrada numérica do jogador. Aceita apenas inteiros. |
| **Botão Confirmar** | Valida a resposta digitada. Fica ao lado do campo 3. |
| **Indicador de timer** | Barra decrescente, countdown numérico ou equivalente. Deve ser legível em mobile. |
| **Fundo animado** | Padrão visual deslizando de cima para baixo. Velocidade proporcional ao nível. |
| **Histórico** | Abre modal de recorde. Disponível em qualquer estado. |
| **Iniciar** | Inicia ou reinicia a partida. Disponível em idle e após game over. |
| **Configurações** | Abre modal de configurações. Disponível em qualquer estado. |

#### Comportamento do botão Iniciar

- Em **idle** ou **game over**: inicia uma **nova partida do zero** (score 0, nível 1, timer do nível 1, novo número base).
- Durante **playing**: comportamento a definir na implementação — recomenda-se desabilitar ou exigir confirmação para evitar reinício acidental.

---

### 3.2 Modal — Histórico

Modal sobreposto à tela principal. Exibe apenas o **recorde pessoal**:

| Campo | Descrição |
|-------|-----------|
| **Melhor score** | Maior pontuação já alcançada pelo jogador. |
| **Data** | Data em que o recorde foi estabelecido (opcional, mas recomendado). |

Se não houver recorde anterior, exibir mensagem indicando que nenhuma partida foi registrada ainda.

**Fechamento:** toque fora do modal, botão de fechar ou gesto equivalente.

---

### 3.3 Modal — Configurações

Modal sobreposto à tela principal. No escopo do core, contém preferências mínimas que não alteram as regras centrais do jogo:

| Configuração | Descrição |
|--------------|-----------|
| **Som** | Liga/desliga efeitos sonoros do jogo (feedback de acerto, erro, level up, game over). |

Outras opções (modos alternativos, acessibilidade, etc.) podem ser adicionadas em versões futuras.

**Fechamento:** toque fora do modal, botão de fechar ou gesto equivalente.

---

## 4. Regras de gameplay

### 4.1 Confirmação da resposta

O jogador confirma a resposta de **duas formas**:

1. Toque no botão **Confirmar**.
2. Tecla **Enter** (teclado físico ou virtual).

**Não há auto-submit.** A resposta só é validada após confirmação explícita — fluxo intencional, similar a confirmar uma jogada no xadrez.

Durante a animação de erro (~500 ms), novas confirmações devem ser ignoradas para evitar validações duplicadas.

---

### 4.2 Resposta correta

Quando o valor confirmado é igual ao resultado matemático correto:

1. **+10 pontos** no score.
2. Resultado correto passa para o **campo 1** (novo número base).
3. **Campo 3 é limpo.**
4. Nova **operação** é gerada no campo 2.
5. **Timer reinicia** com a duração do nível atual.
6. Verifica se o score cruzou um limiar de **level up** (ver seção 5).

Feedback visual breve de acerto (opcional no core: flash verde, incremento animado do score).

---

### 4.3 Resposta incorreta

Quando o valor confirmado difere do resultado correto:

1. **Campo 3 mantém o valor digitado** — o jogador pode corrigir apenas parte do número (ex.: trocar a dezena de `52` para `42`).
2. **Animação de shake** horizontal no input (~300–400 ms).
3. **Borda vermelha pisca** 2–3 vezes (~600 ms).
4. **Foco permanece no input**, cursor posicionado no final do valor.
5. **Timer continua** — não pausa, não reinicia.
6. O jogador pode editar e confirmar novamente até acertar ou estourar o tempo.

**Erro não encerra a partida.** Apenas o **timeout** encerra.

---

### 4.4 Timeout

Quando o timer de uma operação chega a zero antes de uma resposta correta:

1. Partida **encerra** (estado **Game Over**).
2. Score final é exibido.
3. Se o score supera o recorde, **histórico é atualizado** (novo melhor score + data).
4. Jogador pode iniciar nova partida com **Iniciar**.

---

## 5. Sistema de pontuação e níveis

### 5.1 Pontuação

| Regra | Valor |
|-------|-------|
| Acerto confirmado | **+10 pontos** |
| Erro | **0 pontos** (sem penalidade) |
| Score mínimo | 0 |
| Score na partida | Sem teto — quanto mais acertos, maior a pontuação até o timeout |

---

### 5.2 Níveis de dificuldade

Existem **5 níveis**. A dificuldade é **exclusivamente temporal** — as operações não ficam mais complexas com o nível; o tempo por operação diminui, incentivando flow e velocidade crescente.

| Nível | Score necessário | Timer por operação |
|-------|------------------|--------------------|
| 1 | 0 – 49 | **12 segundos** |
| 2 | 50 – 99 | **11 segundos** |
| 3 | 100 – 149 | **10 segundos** |
| 4 | 150 – 199 | **9 segundos** |
| 5 | 200 ou mais | **7 segundos** |

**Cálculo do nível:**

```
nível = mínimo(5, floor(score ÷ 50) + 1)
```

Cada **50 pontos** (equivalente a **5 acertos**) avança um nível. A partir do nível 5, o timer permanece fixo em 7 segundos.

---

### 5.3 Level up — feedback

Ao cruzar um limiar de score (50, 100, 150, 200):

1. Badge de **Nível** atualiza.
2. Pulso breve no indicador de nível e/ou timer (~1 s).
3. Texto momentâneo opcional (ex.: *Nível 3 — 10s*).
4. **Próxima operação** já usa o novo timer.
5. **Velocidade do fundo animado** aumenta suavemente (~800 ms de transição).

A partida **não pausa** durante o level up.

---

## 6. Regras matemáticas

### 6.1 Restrições numéricas

| Regra | Detalhe |
|-------|---------|
| Tipo de números | Apenas **inteiros** |
| Resultado válido | Sempre entre **0 e 99**, inclusive |
| Operadores disponíveis | Adição (`+`), subtração (`−`), multiplicação (`×`), divisão (`÷`) |

Não há decimais, frações ou resultados negativos.

---

### 6.2 Número base inicial

Ao iniciar uma partida, o campo 1 recebe um valor aleatório dentro de uma faixa confortável para aquecimento — recomendado entre **5 e 25**.

---

### 6.3 Geração inteligente de operações

O sistema gera operações garantindo que o **resultado final** esteja sempre em `[0, 99]`. A lógica considera o **número base atual** para manter o jogo equilibrado:

| Base (n) | Operações permitidas | Objetivo |
|----------|----------------------|----------|
| **0** | Apenas `+` e `×` | Evitar resultado negativo e divisão inválida |
| **1 – 30** | Todas (`+`, `−`, `×`, `÷`) | Variedade com contas leves |
| **31 – 70** | Preferência por `+`, `−`, `×` | Menos divisões complicadas |
| **71 – 99** | Prioridade para `−` e `÷` | Reduzir o número base quando próximo do teto |

#### Regras por operador

**Adição (`+`):**  
Operando sorteado de forma que `base + operando ≤ 99`.

**Subtração (`−`):**  
Operando entre `1` e `base`, garantindo `base − operando ≥ 0`.

**Multiplicação (`×`):**  
Operando sorteado de forma que `base × operando ≤ 99`.

**Divisão (`÷`):**  
- Divisor sempre **maior que 1**.  
- Divisor deve ser **divisor exato** de `base` (`base % divisor === 0`).  
- Resultado inteiro em `[0, 99]`.

#### Exemplos

| Base | Operação | Resultado |
|------|----------|-----------|
| 9 | `+ 2` | 11 |
| 11 | `× 3` | 33 |
| 99 | `− 47` | 52 |
| 99 | `÷ 3` | 33 |
| 99 | `÷ 11` | 9 |

Operações inválidas (ex.: `99 + 5`, `99 × 2`, `7 ÷ 3`) **nunca são geradas**.

---

## 7. Animação de fundo

O fundo da tela principal exibe um **padrão visual contínuo** deslizando **de cima para baixo**. A animação reforça visualmente o ritmo do jogo e o level up.

| Aspecto | Comportamento |
|---------|---------------|
| **Direção** | Vertical, top → bottom, em loop |
| **Velocidade** | Proporcional ao **nível atual** — quanto maior o nível, mais rápido o scroll |
| **Transição de nível** | Aceleração suave (~800 ms), sem salto abrupto |
| **Contraste** | Padrão sutil, baixa opacidade — não deve competir com os campos de jogo |
| **Estado idle** | Animação parada ou em velocidade mínima |
| **Modais abertos** | Animação pausada ou desacelerada |
| **Game over** | Animação pausada ou desacelerada |

### Velocidade referencial por nível

Valores finos serão calibrados na implementação. A proporção desejada:

| Nível | Sensação |
|-------|----------|
| 1 | Quase parado, calmo |
| 2 | Movimento perceptível |
| 3 | Ritmo constante |
| 4 | Pressão visual moderada |
| 5 | Flow — sensação de aceleração |

---

## 8. Fluxo completo da partida

```
[Idle]
   │
   ▼  toque em Iniciar
[Playing] ─── score 0, nível 1, timer 12s, número base sorteado
   │
   ├─► Operação exibida, timer inicia
   │
   ├─► Jogador digita resposta
   │
   ├─► Confirma (botão ou Enter)
   │      │
   │      ├─► Correto ──► +10 pts, resultado → base, nova operação, timer reinicia
   │      │                  │
   │      │                  ├─► Score cruzou limiar? ──► Level up + fundo acelera
   │      │                  │
   │      │                  └─► Volta ao ciclo
   │      │
   │      └─► Errado ──► shake + borda vermelha, valor mantido, timer segue
   │                         │
   │                         └─► Jogador tenta novamente
   │
   └─► Timer = 0 ──► [Game Over]
                          │
                          ├─► Score final exibido
                          ├─► Recorde atualizado se aplicável
                          │
                          └─► Iniciar ──► nova partida [Idle/Playing]
```

---

## 9. Persistência de dados

No escopo do core, apenas um dado é persistido entre sessões:

| Dado | Descrição |
|------|-----------|
| **Recorde** | Maior score alcançado + data de conquista |

Nenhum histórico completo de partidas no escopo inicial.

---

## 10. Princípios de design

Estas diretrizes orientam decisões futuras e devem ser preservadas ao polir o jogo:

1. **Mobile first** — uma tela, interação com uma mão, teclado numérico nativo.
2. **Flow por tempo, não por matemática** — contas permanecem no universo 0–99; a pressão vem do timer.
3. **Confirmação intencional** — digitar e confirmar; sem auto-submit.
4. **Erro como feedback, não como punição** — shake e vermelho, valor preservado, partida continua.
5. **Timeout como única condição de derrota.**
6. **Clareza visual** — campos, timer, score e nível sempre legíveis sobre o fundo animado.
7. **Sessões curtas** — partidas cabem em pausas; recorde incentivam replay.

---

## 11. Fora do escopo deste documento

Os itens abaixo foram discutidos como evoluções futuras e **não fazem parte do core** descrito aqui. Serão especificados em versão posterior do documento ou em extensão dedicada:

- Recompensas na lateral esquerda (bônus condicionais por acerto).
- Game changers na lateral direita (modos especiais ativados por evento).
- Modo zen ou configurações avançadas de timer.
- Histórico completo de partidas.
- Stack tecnológica, arquitetura e detalhes de implementação.

---

*Documento versão 1.0 — core do jogo.*
