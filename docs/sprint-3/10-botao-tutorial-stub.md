# 10 — Como jogar (stub)

## Objetivo

Botão **Como jogar** no **canto superior direito** do menu, **desabilitado** nesta sprint.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| U1 | Posição: **top-right** fixo, menu com cortina fechada |
| U2 | Label: **Como jogar** |
| U3 | `disabled` + `aria-disabled="true"` |
| U4 | Estilo muted (~50% opacidade) |
| U5 | Simétrico ao botão **Loja** (top-left) |

---

## Wireframe

```
[Loja]                    [Como jogar]
                              (disabled)

              [ Jogar ]

[Jogador]                    [Config]
```

---

## Implementação

| Arquivo | Mudança |
|---------|---------|
| `src/components/game/GameScreen.tsx` | `MenuHowToPlayButton` top-right |

Sem modal ou conteúdo nesta sprint.

---

## Dependências

- **Integra:** 12-menu-layout
