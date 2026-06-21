# 01 — Nome do jogador

## Objetivo

Permitir que o jogador defina um **nome de exibição**, usado no card de compartilhamento e no modal **Jogador**. Valor padrão: **Jogador**.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| N1 | Campo editável no modal **Jogador** (não em Config) |
| N2 | Default `"Jogador"` para saves novos e migração |
| N3 | Persistir em `PlayerData.displayName` |
| N4 | Trim + limite de caracteres (sugestão: **2–16**) |
| N5 | Caracteres permitidos: letras (incl. acentos), números, espaço — sem emoji na v1 |
| N6 | Fallback para `"Jogador"` se string vazia após trim |
| N7 | Nome disponível para **09-compartilhar-placar** |

---

## UI/UX

- Modal **Jogador** (footer): seção nome no topo — label + input ou modo edição inline.
- Salvar **on blur** ou botão "Salvar" discreto.
- Footer menu: botão **Jogador** (substitui Recordes) abre este modal.

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/platform/storage.ts` | `displayName` em PlayerData |
| `src/hooks/usePlayer.ts` | `updateDisplayName` |
| `src/components/modals/PlayerModal.tsx` | Input nome (novo — ver 12-menu-layout) |
| `src/components/game/GameScreen.tsx` | Botão footer Jogador |

```typescript
function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().slice(0, 16)
  if (trimmed.length < 2) return 'Jogador'
  return trimmed.replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'Jogador'
}
```

---

## Testes manuais

- [ ] Footer "Jogador" abre modal com nome editável
- [ ] Alterar para "Maria" → reload → mantém
- [ ] String vazia / 1 char → volta "Jogador"
- [ ] Nome aparece no share card

---

## Dependências

- **Bloqueia:** 09-compartilhar-placar
- **Integra:** 12-menu-layout
- **Depende de:** PlayerData
