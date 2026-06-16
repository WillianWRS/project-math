# Project Math — Especificação Técnica

> **Nomenclatura:** *Project Math* é o nome do **projeto** (repositório, pasta, documentação interna). O **nome oficial do produto** na loja ainda está **TBD** (a definir).

Documento complementar ao [`jogo.md`](./jogo.md). Define stack, arquitetura, estrutura de projeto, modelos de dados e integrações de plataforma.

---

## 1. Visão da arquitetura

Aplicação **web first** empacotada para Android via Capacitor. Um único codebase serve browser (PWA), Android (Play Store) e, futuramente, iOS.

```
┌─────────────────────────────────────────────────────────┐
│                    React App (TypeScript)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Gameplay │ │ Economy  │ │  Shop    │ │  Platform  │ │
│  │  engine  │ │  layer   │ │  / Skins │ │  adapters  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   [ Browser / PWA ]  [ Capacitor Android ]  [ iOS futuro ]
   Static hosting     Play Store (AAB)        App Store
   localStorage       Preferences + AdMob     RevenueCat
```

---

## 2. Stack definida

### 2.1 Core

| Camada | Tecnologia | Versão alvo | Justificativa |
|--------|------------|-------------|---------------|
| Linguagem | **TypeScript** | 5.x | Tipagem para engine de jogo, economia e catálogo |
| Framework UI | **React** | 19.x | Ecossistema maduro, componentização de telas/modais |
| Build | **Vite** | 6.x | Dev server rápido, HMR, bundle otimizado |
| Roteamento | **React Router** | 7.x | Rotas mínimas (jogo, loja); útil se web crescer |
| Estado global | **Zustand** | 5.x | Stores separadas: gameplay, player, ui, settings |
| Estilização | **Tailwind CSS** | 4.x | Utility-first + design tokens via CSS variables |
| Animações UI | **Motion** (Framer Motion) | 12.x | Shake, level up, transições de modal |
| Animações perf. | **CSS `@keyframes`** | — | Background scroll sync com nível (GPU-friendly) |

### 2.2 Áudio

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| SFX / música | **Howler.js** | Sprites de áudio, preload, mute por categoria, funciona web + Capacitor |

Categorias de áudio: `sfx-gameplay`, `sfx-ui`, `sfx-economy`, `music-ambient` — cada uma controlável nas configurações.

### 2.3 Persistência

| Plataforma | Tecnologia |
|------------|------------|
| Web | `localStorage` + fallback IndexedDB para catálogo cache |
| Native | **@capacitor/preferences** |
| Abstração | Serviço `StorageService` com interface única |

Dados persistidos: recorde, moedas, inventário, loadout cosmético, contadores diários de ads, configurações, progresso de coleção.

### 2.4 Mobile / Play Store

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Wrapper nativo | **Capacitor** | 7.x — web → Android sem reescrever |
| Anúncios rewarded | **@capacitor-community/admob** | Vale conta e bônus por vídeo |
| Compras in-app | **RevenueCat** (`purchases-capacitor`) | Unifica Play Billing; analytics de receita |
| Splash / ícones | **@capacitor/assets** | Pipeline de assets para loja |
| Status bar / safe area | **@capacitor/status-bar**, CSS `env(safe-area-inset-*)` | Mobile first |

### 2.5 Qualidade e entrega

| Camada | Tecnologia |
|--------|------------|
| Lint | ESLint + typescript-eslint |
| Formatação | Prettier |
| Testes unitários | **Vitest** — engine matemática, economia, level calc |
| Testes E2E (opcional M4+) | **Playwright** — fluxo partida web |
| CI | GitHub Actions — lint, test, build web |
| Hospedagem web | **Cloudflare Pages** ou Vercel (static) |
| Android build | Gradle via Capacitor; assinatura local ou CI |

### 2.6 Futuro (fora do MVP)

| Necessidade | Tecnologia candidata |
|-------------|---------------------|
| Leaderboard global | Firebase Firestore ou Supabase |
| Analytics | PostHog ou Firebase Analytics |
| Remote config (preços, ads) | Firebase Remote Config |
| iOS | Mesmo Capacitor + RevenueCat + AdMob iOS |
| Notificações daily | `@capacitor/local-notifications` |

---

## 3. Estrutura de pastas

```
project-math/
├── android/                    # Gerado pelo Capacitor
├── public/
│   ├── sounds/                 # Sprites Howler (.mp3 / .ogg)
│   └── icons/
├── src/
│   ├── app/                    # Bootstrap, providers, router
│   ├── components/
│   │   ├── game/               # Campos, timer, confirmar
│   │   ├── modals/             # Histórico, config, loja
│   │   ├── shop/               # Catálogo, preview
│   │   └── ui/                 # Botões, badges, shake wrapper
│   ├── engine/
│   │   ├── operation-generator.ts
│   │   ├── level-system.ts
│   │   ├── timer.ts
│   │   └── game-state-machine.ts
│   ├── economy/
│   │   ├── currency.ts         # Conversão score → moedas
│   │   ├── daily-limits.ts     # Reset ads 5/dia
│   │   └── shop-logic.ts
│   ├── cosmetics/
│   │   ├── catalog.json        # Ou .ts tipado
│   │   ├── theme-provider.tsx  # Injeta CSS variables
│   │   └── types.ts
│   ├── platform/
│   │   ├── storage.ts
│   │   ├── ads.ts              # Adapter AdMob / noop web
│   │   ├── iap.ts              # Adapter RevenueCat / noop web
│   │   └── haptics.ts          # Capacitor Haptics (opcional)
│   ├── stores/
│   │   ├── game-store.ts
│   │   ├── player-store.ts
│   │   └── settings-store.ts
│   ├── hooks/
│   ├── assets/
│   └── main.tsx
├── docs/
│   ├── jogo.md
│   ├── tecnico.md
│   └── projeto.md
├── capacitor.config.ts
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 4. Modelos de dados

### 4.1 Gameplay (sessão — volátil)

```typescript
type GamePhase = "idle" | "playing" | "game_over";

interface GameSession {
  phase: GamePhase;
  score: number;
  level: number;              // derivado do score
  timerMs: number;
  timerMaxMs: number;
  baseNumber: number;
  operation: Operation;
  inputValue: string;
  isSubmitLocked: boolean;    // durante animação de erro
}

interface Operation {
  operator: "+" | "-" | "×" | "÷";
  operand: number;
  result: number;             // pré-calculado na geração
}
```

### 4.2 Player (persistente)

```typescript
interface PlayerData {
  coins: number;
  highScore: number;
  highScoreDate: string | null;   // ISO 8601
  ownedItemIds: string[];
  equipped: EquippedCosmetics;
  daily: DailyCounters;
  stats: PlayerStats;
}

interface EquippedCosmetics {
  backgroundId: string;
  paletteId: string;
  fontId: string;
  sfxPackId: string;
  fieldFrameId: string;
  levelBadgeId: string;
}

interface DailyCounters {
  lastResetDate: string;          // YYYY-MM-DD local
  valeContaAdsWatched: number;      // máx. 5
  coinBoostAdsWatched: number;      // máx. 3
  valeContaInventory: number;       // consumíveis ganhos
}

interface PlayerStats {
  totalGames: number;
  totalCorrectAnswers: number;
  collectionPercent: number;        // derivado
}
```

### 4.3 Economia

```typescript
// Conversão pós-partida (score ≠ moeda)
function scoreToCoins(score: number): number {
  // Exemplo: 1 moeda a cada 10 pts + bônus por faixa
  return Math.floor(score / 10);
}

interface ShopItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  priceCoins: number | null;
  priceIAP: string | null;          // product id RevenueCat
  exclusivity: "coin-only" | "iap-only" | "both";
  rarity: "comum" | "incomum" | "raro" | "lendário";
  tokens: Record<string, string>;   // CSS variables
  previewAsset?: string;
}

type CosmeticCategory =
  | "background"
  | "palette"
  | "font"
  | "sfx-pack"
  | "field-frame"
  | "level-badge"
  | "game-over-screen";
```

### 4.4 Máquina de estados do jogo

```
idle ──[Iniciar]──► playing ──[timeout]──► game_over
  ▲                    │                        │
  │                    │ [acerto / erro]        │
  └────[Iniciar]───────┘                        │
  └──────────────────[Iniciar]─────────────────┘
```

Lógica de gameplay isolada em `engine/` — **sem dependência de React** nos módulos puros (testáveis com Vitest).

---

## 5. Sistema de cosméticos (implementação)

### 5.1 Theming via CSS variables

```css
:root {
  --bg-pattern: url(...);
  --bg-scroll-speed: 8px;
  --color-base-field: #dbeafe;
  --color-op-field: #93c5fd;
  --color-input-border: #64748b;
  --color-accent: #3b82f6;
  --font-numbers: "JetBrains Mono", monospace;
  --field-radius: 12px;
}
```

`ThemeProvider` lê o item equipado do catálogo e injeta variables no `:root`. Background scroll speed continua controlado pelo level system em runtime.

### 5.2 Preview na loja

Componente `CosmeticPreview` renderiza miniatura da coluna de jogo com tokens do item — sem iniciar partida.

---

## 6. Integrações de plataforma

### 6.1 Adapter pattern

Cada capacidade nativa tem interface + implementação noop (web) e real (Capacitor):

```typescript
interface AdsAdapter {
  showRewarded(placement: "vale-conta" | "coin-boost"): Promise<"completed" | "dismissed" | "failed">;
  isAvailable(): boolean;
}

interface IAPAdapter {
  purchase(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<void>;
  getProducts(): Promise<Product[]>;
}
```

Web: `NoopAdsAdapter` (botão desabilitado ou mensagem "disponível no app"). Android: implementações reais.

### 6.2 AdMob — placements

| Placement | Recompensa | Limite diário |
|-----------|------------|---------------|
| `vale-conta` | +1 vale conta consumível | 5 |
| `coin-boost` | ×2 moedas da última partida | 3 |

Reset de contadores: meia-noite no fuso `America/Sao_Paulo` (configurável).

### 6.3 RevenueCat — produtos sugeridos

| Tipo | Exemplo | Conteúdo |
|------|---------|----------|
| Consumable | `coins_500` | 500 moedas |
| Consumable | `coins_2000` | 2000 moedas |
| Non-consumable | `skin_bg_legendary_01` | Background exclusivo |
| Non-consumable | `bundle_starter` | Pack inicial cosmético |

Itens `coin-only` **não** possuem `priceIAP` — só grind e ads.

---

## 7. Áudio — implementação

```typescript
// Exemplo de registro Howler
const sfx = new Howl({
  src: ["/sounds/game.sprites.mp3"],
  sprite: {
    correct: [0, 400],
    wrong: [500, 350],
    levelUp: [1000, 800],
    coin: [1900, 300],
    gameOver: [2300, 1200],
  },
});
```

Pack de SFX cosmético troca o arquivo sprite ou mapeamento de IDs — mesma interface `AudioService.play("correct")`.

---

## 8. Performance (mobile)

| Área | Diretriz |
|------|----------|
| Background | `transform: translateY()` + `will-change`; evitar repaints no layout |
| Input | `<input inputMode="numeric" pattern="[0-9]*">` para teclado numérico |
| Bundle | Code-split loja/modal; lazy load Howler |
| Touch | Botões mín. 44×44 px; safe area insets |
| Capacitor | `android: hardwareAccelerated=true` |

Meta: **Lighthouse Performance ≥ 90** na web; cold start Android **< 3 s** em mid-range.

---

## 9. Segurança e anti-fraude (MVP pragmático)

| Risco | Mitigação MVP |
|-------|---------------|
| Moedas editadas no localStorage | Ofuscação leve + checksum; validação server-side só se leaderboard global |
| IAP falsificado | RevenueCat valida server-side |
| Ads farm | Limite diário hardcoded + timestamp de reset |

Anti-fraude robusta exige backend — adiar até leaderboard ou economia competitiva.

---

## 10. Variáveis de ambiente

```env
# .env.production
VITE_APP_ENV=production
VITE_ADMOB_REWARDED_VALE_CONTA=ca-app-pub-xxx/yyy
VITE_ADMOB_REWARDED_COIN_BOOST=ca-app-pub-xxx/zzz
VITE_REVENUECAT_API_KEY=goog_xxx
VITE_ENABLE_ADS=true
VITE_ENABLE_IAP=true
```

Web dev: flags `false` + adapters noop.

---

## 11. Dependências principais (package.json alvo)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0",
    "motion": "^12.0.0",
    "howler": "^2.2.4",
    "@capacitor/core": "^7.0.0",
    "@capacitor/preferences": "^7.0.0",
    "@capacitor-community/admob": "^7.0.0",
    "@revenuecat/purchases-capacitor": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "vitest": "^3.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

Versões ajustadas no momento do bootstrap do projeto.

---

## 12. Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [`jogo.md`](./jogo.md) | Regras, telas, gameplay core |
| [`projeto.md`](./projeto.md) | Fases, prazos, mercado, marketing |
| `tecnico.md` (este) | Stack, arquitetura, dados, integrações |

Features das laterais (bônus esquerda/direita) entram após M1 — módulos `engine/bonus/` e `components/bonus/` reservados na estrutura.

---

*Documento versão 1.0 — stack e arquitetura.*
