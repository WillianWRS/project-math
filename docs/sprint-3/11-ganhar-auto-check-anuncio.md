# 11 — Ganhar auto-check (anúncio simulado)

## Objetivo

Botão **Ganhar auto-check** no menu abre modal com oferta **Ver anúncio (1/5 por dia)**; ao confirmar, barra de progresso **2 s** simula ad → +1 `walletAutoChecks`.

---

## Requisitos funcionais

| ID | Requisito |
|----|-----------|
| AD1 | Entrada: botão dentro do modal **Jogador** (ou rodapé — preferir Jogador) |
| AD2 | Modal: título, explicação, contador **{n}/5** usos hoje |
| AD3 | Botão "Ver anúncio" disabled se `rewardedAdsWatched >= 5` |
| AD4 | Ao clicar: UI loading 2 s (progress bar determinística) |
| AD5 | Após 2 s: `walletAutoChecks += 1`, `rewardedAdsWatched += 1`, save |
| AD6 | Reset diário com `dateKey` America/Sao_Paulo (mesmo de meta diária) |
| AD7 | Feedback: toast "Auto-check adicionado!" + fechar modal |
| AD8 | Preparar interface `AdsAdapter` noop para trocar por AdMob depois |

---

## UI do modal

```
┌─────────────────────────────┐
│  Ganhar auto-check          │
│                             │
│  Assista um anúncio e       │
│  receba 1 auto-check.       │
│                             │
│  Hoje: 2/5                  │
│                             │
│  [████████░░] 2s            │  ← só durante load
│                             │
│  [ Ver anúncio ]            │
│  [ Cancelar ]               │
└─────────────────────────────┘
```

---

## Implementação sugerida

| Arquivo | Mudança |
|---------|---------|
| `src/components/modals/RewardedAutoCheckModal.tsx` | Novo |
| `src/platform/ads.ts` | `RewardedAdsAdapter` interface + `SimulatedRewardedAds` |
| `src/platform/storage.ts` | `daily.rewardedAdsWatched` |
| `src/components/game/GameScreen.tsx` | Botão menu + estado modal |
| `src/hooks/usePlayer.ts` | `watchSimulatedAd(): Promise<'completed'|'limit'>` |

```typescript
export interface RewardedAdsAdapter {
  getRemainingToday(): number
  showRewardedAutoCheck(): Promise<'completed' | 'dismissed' | 'limit'>
}
```

Simulação:

```typescript
async showRewardedAutoCheck() {
  if (remaining <= 0) return 'limit'
  await sleep(2000) // UI progress
  grantAutoCheck(1)
  incrementAdsWatched()
  return 'completed'
}
```

---

## Testes manuais

- [ ] 5 usos no dia → botão disabled / mensagem limite
- [ ] 6º dia (mock date) → contador reset
- [ ] Auto-check aparece na próxima partida (carteira)
- [ ] Cancelar durante progress → não grant (se permitir cancel)

---

## Dependências

- **Depende de:** 04-auto-check-persistente, daily reset (03)
- **Futuro:** substituir `SimulatedRewardedAds` por `@capacitor-community/admob`

---

## Notas de game design

5/dia espelha `projeto.md` (vale conta). Simulação honesta — copy "Simulação" em dev? Opcional banner debug. **Não** usar interstitial; rewarded opt-in preserva flow.

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Farm infinito em dev | Limite 5 hardcoded |
| Jogador confunde simulação com ad real | Label "Em breve: anúncios reais no app" em build web |
