# 09 — Compartilhar placar (imagem)

## Objetivo

Botão **Compartilhar** no card pós game over gera **imagem retangular** com: nome, nível do jogador, tempo de jogo, score — pronta para salvar ou share nativo.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| S1 | Botão no `game-over-card` ao lado ou abaixo do score |
| S2 | Conteúdo da imagem: **nome**, **nível jogador**, **tempo**, **score**, branding mínimo (logo/título) |
| S3 | Proporção **1080×1350** (Stories / vertical) — confirmado |
| S4 | Web Share API com `files` quando disponível; fallback download PNG |
| S5 | Gerar client-side (sem backend) |
| S6 | Estética alinhada ao jogo (fundo charcoal/gradiente, mono nos números)

---

## Layout do card (wireframe — 1080×1350)

```
┌──────────────────────┐
│   PROJECT MATH       │
│                      │
│   Maria      Nv. 12  │
│                      │
│        340           │
│       pontos         │
│                      │
│   ⏱ 2:34             │
│                      │
└──────────────────────┘
```

Dimensões de capture: **1080×1350 px** (ratio 4:5).

---

## Implementação sugerida

### Abordagem técnica

1. Componente off-screen `ShareCardTemplate.tsx` (fixed, left -9999px ou scale 0)
2. Lib **`html-to-image`** (`toPng`) ou Canvas manual
3. `src/utils/share-score-card.ts` — `buildShareImage(props): Promise<Blob>`

| Arquivo | Mudança |
|---------|---------|
| `src/components/share/ShareCardTemplate.tsx` | Layout estático para capture |
| `src/utils/share-score-card.ts` | Export PNG |
| `src/components/game/GameScreen.tsx` | Botão + handler |
| `package.json` | `html-to-image` (devDep ou dep) |

### Share handler

```typescript
async function shareScore(props: ShareCardProps) {
  const blob = await buildShareImage(props)
  const file = new File([blob], 'project-math-score.png', { type: 'image/png' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Project Math' })
  } else {
    downloadBlob(file)
  }
}
```

---

## Dados necessários no game over

| Campo | Fonte |
|-------|-------|
| nome | `PlayerData.displayName` |
| nível | `xpToLevel(PlayerData.xp)` após crédito da partida |
| tempo | `formatDuration(session.elapsedMs)` |
| score | `session.score` |

> Aplicar recompensas XP **antes** de renderizar nível no card se quiser nível pós-partida atualizado.

---

## Testes manuais

- [ ] Imagem gerada legível em mobile
- [ ] Share sheet abre no Android Chrome / iOS Safari
- [ ] Fallback download funciona desktop
- [ ] Nome default "Jogador" ok

---

## Dependências

- **Depende de:** 01-nome, 02-nível, 08-timer
- **Independe de:** moedas, temas

---

## Notas de game design

Canal orgânico gratuito (estratégia `projeto.md`). Imagem bonita > texto puro. Considerar watermark URL PWA futura — fora do escopo v1.

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| html-to-image pesado | Lazy import no clique |
| iOS share files limitado | Fallback download + toast "Salve e compartilhe" |
| Fontes custom na imagem | Usar system-ui / embed mínimo |
