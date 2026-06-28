import { describe, expect, it } from 'vitest'
import { env } from './env'

describe('config/env', () => {
  it('expõe showGodModeToggle como booleano', () => {
    expect(typeof env.showGodModeToggle).toBe('boolean')
  })

  it('mantém o toggle de god mode desativado por padrão', () => {
    // .env do projeto define VITE_SHOW_GOD_MODE_TOGGLE=false
    expect(env.showGodModeToggle).toBe(false)
  })
})
