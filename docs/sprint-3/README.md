# Sprint 3 — Meta-game, retenção e monetização leve

> **Objetivo:** introduzir identidade do jogador, progressão persistente (XP/nível, moedas), retenção diária, auto-check como recurso valioso, recordes enriquecidos e primeiros passos de economia — sem Capacitor/AdMob real ainda.

**Estado base:** commit ~e9e27e4 — core polido, `autoCheckCharges` só in-run (será unificado na carteira), `ScoreRecord` = score + data, temas `default` | `water` grátis.

---

## Escopo da sprint (11 tarefas)

| # | Arquivo | Resumo |
|---|---------|--------|
| 01 | [01-nome-jogador.md](./01-nome-jogador.md) | Nome editável no modal Jogador; default "Jogador" |
| 02 | [02-nivel-jogador-xp.md](./02-nivel-jogador-xp.md) | XP 1:1 pós-partida; nível in-game + barra no modal Jogador |
| 03 | [03-metas-diarias.md](./03-metas-diarias.md) | Meta: 1000 score/dia → +1000 XP + 1 auto-check |
| 04 | [04-auto-check-persistente.md](./04-auto-check-persistente.md) | Carteira de auto-check entre partidas |
| 05 | [05-modal-auto-check-timeout.md](./05-modal-auto-check-timeout.md) | Pause ao zerar timer se tiver auto-check |
| 06 | [06-moedas-pos-partida.md](./06-moedas-pos-partida.md) | Moedas = floor(score / 10) |
| 07 | [07-temas-bloqueados-preview.md](./07-temas-bloqueados-preview.md) | Loja: +9 temas cadeado; Config só owned |
| 08 | [08-timer-partida-recordes.md](./08-timer-partida-recordes.md) | Timer de sessão no HUD + recordes |
| 09 | [09-compartilhar-placar.md](./09-compartilhar-placar.md) | Card imagem + botão share pós-partida |
| 10 | [10-botao-tutorial-stub.md](./10-botao-tutorial-stub.md) | "Como jogar" top-right, disabled |
| 11 | [11-ganhar-auto-check-anuncio.md](./11-ganhar-auto-check-anuncio.md) | Modal ad simulado 5/dia |
| 12 | [12-menu-layout.md](./12-menu-layout.md) | Menu: Jogador, Loja, Como jogar, Config |

---

## Fundação transversal (implementar antes ou junto da tarefa 01)

Novo blob persistido `PlayerData` em `localStorage` (chave sugerida: `project-math-player`):

```typescript
interface PlayerData {
  displayName: string           // default "Jogador"
  xp: number                    // acumulado
  coins: number
  walletAutoChecks: number      // persistente entre partidas
  ownedThemeIds: string[]       // ex.: ['default', 'water']
  equippedThemeId: string
  daily: {
    dateKey: string             // YYYY-MM-DD America/Sao_Paulo
    scoreAccumulated: number    // soma dos scores de partidas do dia
    goalClaimed: boolean
    rewardedAdsWatched: number  // máx. 5
  }
}
```

Migração: ler chaves legadas (`project-math-top-scores`, som, tema) sem quebrar saves existentes.

---

## Ordem de implementação recomendada

```
PlayerData + storage
    ├── 01 nome
    ├── 04 auto-check wallet
    ├── 06 moedas (+ hook pós game over)
    ├── 02 XP / nível jogador
    ├── 08 timer sessão + recordes
    ├── 03 metas diárias (usa score do dia + XP + wallet)
    ├── 05 modal timeout (usa wallet + engine)
    ├── 07 temas locked (+ compra futura via moedas)
    ├── 11 ad simulado → wallet
    ├── 09 share (depende nome, nível, timer, score)
    └── 10 tutorial stub (independente)
```

**Estimativa realista:** 3–5 dias dev solo para qualidade alinhada ao polish atual; “hoje” cabe fundação + 2–3 tarefas se priorizar.

---

## Decisões confirmadas (product)

| # | Decisão |
|---|---------|
| D1 | Meta diária = **soma do score das runs do dia** |
| D2 | XP = **score 1:1** ao fim de cada partida (+ bônus 1000 XP da meta) |
| D3 | **Rhythm level** (timer 1–5): renomear no código (`rhythmLevel`); **nunca exibir** na UI — só sentir |
| D4 | Auto-check: **carteira única** — ciclo lateral, meta e ad somam em `walletAutoChecks`; ver 04 |
| D5 | Auto-check no timeout → timer reinicia como acerto normal |
| D6 | Share card **1080×1350** (Stories) |
| D7 | Menu: **Loja** (top-left), **Como jogar** disabled (top-right), **Jogador** (footer), **Config** (footer) |
| D8 | Nome, nível+barra, moedas, meta, top 5 → modal **Jogador**; temas locked → **Loja** |

---

## Fora de escopo desta sprint

- AdMob / IAP real
- Implementação visual dos 9 temas locked (só placeholder)
- Tabela completa de níveis do jogador (stub linear ok)
- Tutorial interativo (só botão disabled)
- Leaderboard online

---

## Critério de done da sprint

- [ ] `PlayerData` persiste e migra saves antigos
- [ ] Partida → game over aplica XP, moedas, meta diária, timer no recorde
- [ ] Auto-check da carteira sobrevive entre partidas e aparece no modal de timeout
- [ ] Modal Jogador: nome, nível+barra, moedas, meta, top 5
- [ ] Loja: 11 temas (9 locked); Config: só owned + som
- [ ] Menu: Loja, Como jogar (disabled), Jogador, Config; ganhar auto-check (5/dia)
- [ ] Game over: card com tempo + botão compartilhar imagem
