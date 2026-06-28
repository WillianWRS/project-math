import { describe, expect, it, vi, afterEach } from 'vitest'

function mockNavigator(partial: Partial<Navigator>) {
  vi.stubGlobal('navigator', {
    userAgent: '',
    platform: 'Win32',
    maxTouchPoints: 0,
    ...partial,
  })
}

describe('device isIOS', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecta iPhone', async () => {
    mockNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })
    const { isIOS } = await import('../../src/platform/device')
    expect(isIOS()).toBe(true)
  })

  it('detecta iPad', async () => {
    mockNavigator({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' })
    const { isIOS } = await import('../../src/platform/device')
    expect(isIOS()).toBe(true)
  })

  it('detecta iPadOS com UA de Mac e touch', async () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    })
    const { isIOS } = await import('../../src/platform/device')
    expect(isIOS()).toBe(true)
  })

  it('não detecta Android', async () => {
    mockNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7)' })
    const { isIOS } = await import('../../src/platform/device')
    expect(isIOS()).toBe(false)
  })
})
