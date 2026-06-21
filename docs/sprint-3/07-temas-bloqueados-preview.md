# 07 — Loja de temas (preview bloqueado)

## Objetivo

Modal **Loja** (top-left do menu) lista **todos** os temas — 2 grátis + 9 locked com cadeado. Compra real disabled nesta sprint. **Configurações** mostra **apenas temas owned** para equipar.

---

## Catálogo

| ID | Nome UI | Loja | Config (equipar) |
|----|---------|------|------------------|
| `default` | Padrão | Grátis | Se owned |
| `water` | Água | Grátis | Se owned |
| `sunset` … `aurora` | 9 nomes | Locked + cadeado | Oculto até owned |

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| TH1 | `THEME_CATALOG` em `src/cosmetics/theme-catalog.ts` |
| TH2 | **Loja:** grid 11 itens; locked = cadeado + preço futuro |
| TH3 | **Config:** grid só `ownedThemeIds` + toggle som |
| TH4 | `ownedThemeIds` inicial: `['default', 'water']` |
| TH5 | Compra por moedas — preparar `priceCoins`, implementar depois |
| TH6 | Preview locked: gradiente + nome (sem background engine completo) |

---

## UI

**Loja** (`ShopModal.tsx`):
- Header com saldo de moedas
- Grid 2 colunas, scroll
- Locked: toast "Em breve" ou "Desbloqueie em breve"

**Config** (`SettingsModal.tsx`):
- Remover temas locked
- Manter só owned (default, water inicialmente)

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/cosmetics/theme-catalog.ts` | Catálogo |
| `src/components/modals/ShopModal.tsx` | Novo |
| `src/components/modals/SettingsModal.tsx` | Filtrar owned |
| `src/components/game/GameScreen.tsx` | Botão Loja top-left |

---

## Testes manuais

- [ ] Loja: 9 cadeados visíveis
- [ ] Config: só 2 temas
- [ ] Equipar water/default funciona

---

## Dependências

- **Integra:** 12-menu-layout, 06-moedas
