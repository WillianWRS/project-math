# 12 — Layout do menu principal e modais

## Objetivo

Reorganizar o **menu principal** (cortina fechada): hub **Jogador** no lugar de Recordes, **Loja** no canto superior esquerdo, **Como jogar** no canto superior direito (disabled). Configurações mantém só **temas desbloqueados** + som.

---

## Wireframe do menu

```
┌─────────────────────────────────────┐
│ [Loja]              [Como jogar]    │  ← topo fixo (como jogar disabled)
│                                     │
│                                     │
│            [ Jogar ]                │  ← centro (existente)
│                                     │
│                                     │
│ [Jogador]              [Config]     │  ← rodapé (substitui Recordes)
└─────────────────────────────────────┘
```

Botão **Ganhar auto-check** (tarefa 11): dentro do modal **Jogador** ou segunda linha no rodapé — ver seção abaixo.

---

## Modal — Jogador

Substitui `HistoryModal` como entrada principal de perfil + recordes.

| Seção | Conteúdo |
|-------|----------|
| Nome | Exibição + input editável (inline ou "Editar") |
| Nível | **Nível {n}** + barra de progresso até próximo nível (`xpProgressInLevel`) |
| Moedas | Ícone + saldo atual |
| Meta diária | Barra `scoreAccumulated / 1000` + estado claimed/pendente |
| Top 5 | Lista igual ao `HistoryModal` atual (+ tempo quando tarefa 08 pronta) |
| Ganhar auto-check | Link/botão secundário → abre modal tarefa 11 |

**Título do modal:** "Jogador" ou nome do player (`Maria`).

---

## Modal — Loja

| Seção | Conteúdo |
|-------|----------|
| Grid | **Todos** os temas do catálogo (2 grátis + 9 locked) |
| Grátis / owned | Preço "Grátis" ou "Possui"; equipar opcional aqui **ou** só comprar |
| Locked | Cadeado + preço em moedas (compra disabled nesta sprint) |
| Saldo | Moedas no header da loja |

> **Configurações** mostra **apenas** temas em `ownedThemeIds` para **equipar/trocar** — não mostra locked.

---

## Modal — Configurações (ajustado)

| Mantém | Remove / move |
|--------|----------------|
| Toggle som | Nome → modal Jogador |
| Grid temas **owned only** | Temas locked → Loja |

---

## Modal — Como jogar (futuro)

Botão canto **superior direito**, `disabled` nesta sprint (`10-botao-tutorial-stub.md`).

---

## In-game — o que aparece no HUD

| Elemento | Visível? |
|----------|----------|
| Nível do **jogador** | **Sim** — durante partida (tarefa 02) |
| **Rhythm level** (timer 1–5) | **Não** — só sentido via timer/fundo/moldura |
| Timer de sessão | Sim, centro-superior, fonte pequena (tarefa 08) |
| Score | Sim |

---

## Refactor de código — rhythm level

Renomear conceito interno para evitar colisão com nível do jogador:

| Atual | Novo (sugestão) |
|-------|-----------------|
| `session.level` | `session.rhythmLevel` |
| `scoreToLevel()` em `level-system.ts` | `scoreToRhythmLevel()` |
| `levelTimerMs(level)` | `rhythmLevelTimerMs(rhythmLevel)` |
| `levelUpFlash` | `rhythmLevelUpFlash` (opcional nesta sprint) |

Arquivo pode permanecer `level-system.ts` ou renomear para `rhythm-level.ts` — decisão de implementação.

**Nenhum label "Ritmo" ou "Nível X" de timer na UI.**

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/modals/PlayerModal.tsx` | Novo — hub jogador |
| `src/components/modals/ShopModal.tsx` | Novo — loja temas |
| `src/components/modals/HistoryModal.tsx` | Remover ou fundir em PlayerModal |
| `src/components/modals/SettingsModal.tsx` | Só owned themes + som |
| `src/components/game/GameScreen.tsx` | Layout menu 4 cantos |

---

## Testes manuais

- [ ] Recordes sumiu do footer; Jogador abre hub completo
- [ ] Loja mostra 11 temas; locked com cadeado
- [ ] Config só mostra default/water (owned)
- [ ] Como jogar visível top-right, disabled
- [ ] Jogar central inalterado

---

## Dependências

- Agrega: 01, 02, 03, 06, 07, 08, 10, 11
- Implementar após `PlayerData` + modais base
