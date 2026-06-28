/**
 * Configuração derivada de variáveis de ambiente (Vite injeta apenas as com prefixo VITE_).
 * Centralizar a leitura aqui evita espalhar `import.meta.env` pela base e dá um ponto
 * único, tipado e testável para feature flags.
 */

function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export const env = {
  /** Exibe o toggle de "God Mode" no modal de Configurações. */
  showGodModeToggle: readBooleanEnv(import.meta.env.VITE_SHOW_GOD_MODE_TOGGLE, false),
} as const

export type AppEnv = typeof env
