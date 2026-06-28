// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPlayerData, type BackgroundTheme, type PlayerData } from '../../platform/storage'
import { useGameCosmetics } from './useGameCosmetics'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

function setup(overrides?: Partial<Parameters<typeof useGameCosmetics>[0]>) {
  let player: PlayerData = loadPlayerData()
  const commitPlayer = vi.fn((updater: (current: PlayerData) => PlayerData) => {
    player = updater(player)
    return player
  })
  const setEquippedTheme = vi.fn<(theme: BackgroundTheme) => void>()
  const purchaseTheme = vi.fn<(theme: BackgroundTheme, price: number) => boolean>(() => true)

  const view = renderHook(() =>
    useGameCosmetics({ commitPlayer, setEquippedTheme, purchaseTheme, ...overrides }),
  )
  return { view, commitPlayer, setEquippedTheme, purchaseTheme, getPlayer: () => player }
}

describe('useGameCosmetics', () => {
  it('persiste o toggle de god mode', () => {
    const { view } = setup()
    expect(view.result.current.godModeEnabled).toBe(false)

    act(() => view.result.current.toggleGodMode(true))
    expect(view.result.current.godModeEnabled).toBe(true)
  })

  it('concede recompensa de tutorial apenas uma vez', () => {
    const { view } = setup()

    let first!: ReturnType<typeof view.result.current.completeTutorial>
    act(() => {
      first = view.result.current.completeTutorial()
    })
    expect(first.rewardsGranted).toBe(true)
    expect(first.xpGained).toBe(200)
    expect(first.coinsGained).toBe(200)

    let second!: ReturnType<typeof view.result.current.completeTutorial>
    act(() => {
      second = view.result.current.completeTutorial()
    })
    expect(second.rewardsGranted).toBe(false)
    expect(second.xpGained).toBe(0)
    expect(second.coinsGained).toBe(0)
  })

  it('equipa tema direto via setEquippedTheme quando god mode está desligado', () => {
    const { view, setEquippedTheme } = setup()
    act(() => view.result.current.setBackgroundTheme('water'))
    expect(setEquippedTheme).toHaveBeenCalledWith('water')
  })

  it('delega compra de tema para purchaseTheme', () => {
    const { view, purchaseTheme } = setup()
    let ok = false
    act(() => {
      ok = view.result.current.buyTheme('water', 100)
    })
    expect(ok).toBe(true)
    expect(purchaseTheme).toHaveBeenCalledTimes(1)
    expect(purchaseTheme.mock.calls[0][0]).toBe('water')
  })
})
