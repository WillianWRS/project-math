import {
  clipsForTier,
  isFileClipDef,
  WRITE_SFX_IDS,
  type AudioTier,
  type ClipId,
  type SfxManifest,
} from './audio-types'

const MANIFEST_PATH = '/audio/sfx-manifest.json'
const MAX_WRITE_OVERLAP = 6

type AudioContextConstructor = typeof AudioContext

let manifestPromise: Promise<SfxManifest> | null = null
let manifestCache: SfxManifest | null = null
let audioUnlocked = false
let audioContext: AudioContext | null = null
let sfxGain: GainNode | null = null
let iosUnlockPrimed = false

const bufferCache = new Map<ClipId, AudioBuffer>()
const rawBytesCache = new Map<string, ArrayBuffer>()
const clipLoadPromises = new Map<ClipId, Promise<void>>()
const tierLoadPromises = new Map<AudioTier, Promise<void>>()
const MENU_AUDIO_TIERS: AudioTier[] = ['critical', 'gameplay']
let menuAudioPrefetchPromise: Promise<void> | null = null
let menuAudioPreparePromise: Promise<void> | null = null

let spriteBuffer: AudioBuffer | null = null
let spriteLoadPromise: Promise<void> | null = null

const activeWriteSources = new Set<AudioBufferSourceNode>()

function getAudioContextConstructor(): AudioContextConstructor {
  const extendedWindow = window as Window & { webkitAudioContext?: AudioContextConstructor }
  const ctor = window.AudioContext ?? extendedWindow.webkitAudioContext
  if (!ctor) {
    throw new Error('Web Audio API unavailable')
  }
  return ctor
}

function ensureContextSync(): AudioContext | null {
  if (!audioUnlocked) return null

  if (!audioContext) {
    const AudioContextCtor = getAudioContextConstructor()
    audioContext = new AudioContextCtor()
    const masterGain = audioContext.createGain()
    sfxGain = audioContext.createGain()
    sfxGain.connect(masterGain)
    masterGain.connect(audioContext.destination)
  }

  return audioContext
}

function primeIosAudioUnlock(context: AudioContext): void {
  if (iosUnlockPrimed) return
  iosUnlockPrimed = true

  const buffer = context.createBuffer(1, 1, context.sampleRate)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  try {
    source.start(0)
  } catch {
    /* already started or context blocked */
  }
}

async function loadManifest(): Promise<SfxManifest> {
  if (manifestCache) return manifestCache

  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_PATH)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${MANIFEST_PATH}`)
        return response.json() as Promise<SfxManifest>
      })
      .then((manifest) => {
        manifestCache = manifest
        return manifest
      })
      .catch((error) => {
        manifestPromise = null
        throw error
      })
  }

  return manifestPromise
}

function warmManifestFetch(): void {
  void loadManifest().catch(() => {})
}

async function fetchAudioBytes(url: string): Promise<ArrayBuffer> {
  const cached = rawBytesCache.get(url)
  if (cached) return cached

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch audio: ${url}`)
  const data = await response.arrayBuffer()
  rawBytesCache.set(url, data)
  return data
}

async function decodeAudio(url: string): Promise<AudioBuffer> {
  const context = ensureContextSync()
  if (!context) throw new Error('AudioContext is locked until user gesture')

  const data = await fetchAudioBytes(url)
  return context.decodeAudioData(data.slice(0))
}

async function ensureSpriteBuffer(manifest: SfxManifest): Promise<void> {
  if (spriteBuffer || manifest.mode !== 'sprite') return
  if (!spriteLoadPromise) {
    spriteLoadPromise = decodeSpriteAudio(manifest)
      .then((buffer) => {
        spriteBuffer = buffer
      })
      .catch((error) => {
        spriteLoadPromise = null
        throw error
      })
  }
  await spriteLoadPromise
}

async function decodeSpriteAudio(manifest: SfxManifest): Promise<AudioBuffer> {
  const sources = manifest.spriteSources ?? [manifest.sprite]
  let lastError: unknown = null

  for (const source of sources) {
    try {
      return await decodeAudio(source)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to decode sprite audio')
}

async function loadClipBuffer(id: ClipId): Promise<void> {
  if (bufferCache.has(id)) return

  const pending = clipLoadPromises.get(id)
  if (pending) {
    await pending
    return
  }

  const promise = (async () => {
    const manifest = await loadManifest()
    const clip = manifest.clips[id]
    if (!clip) return

    if (manifest.mode === 'sprite' && !isFileClipDef(clip)) {
      await ensureSpriteBuffer(manifest)
      if (spriteBuffer) bufferCache.set(id, spriteBuffer)
      return
    }

    if (isFileClipDef(clip)) {
      const buffer = await decodeAudio(clip.src)
      bufferCache.set(id, buffer)
    }
  })()

  clipLoadPromises.set(id, promise)
  try {
    await promise
  } catch {
    clipLoadPromises.delete(id)
  }
}

function trimWritePool(): void {
  while (activeWriteSources.size >= MAX_WRITE_OVERLAP) {
    const oldest = activeWriteSources.values().next().value
    if (!oldest) break
    activeWriteSources.delete(oldest)
    try {
      oldest.stop(0)
    } catch {
      /* already stopped */
    }
  }
}

function playBufferClip(id: ClipId, manifest: SfxManifest, enabled: boolean): void {
  if (!enabled || !audioContext || !sfxGain) return

  const clip = manifest.clips[id]
  const buffer = bufferCache.get(id)
  if (!clip || !buffer) return

  const source = audioContext.createBufferSource()
  source.buffer = buffer

  const gain = audioContext.createGain()
  gain.gain.value = clip.volume ?? 1
  source.connect(gain)
  gain.connect(sfxGain)

  if (clip.pool === 'write') {
    trimWritePool()
    activeWriteSources.add(source)
    source.onended = () => activeWriteSources.delete(source)
  }

  if (manifest.mode === 'sprite' && !isFileClipDef(clip)) {
    const offset = clip.start / 1000
    const duration = clip.duration / 1000
    source.start(0, offset, duration)
    return
  }

  source.start(0)
}

function tryPlayClipSync(id: ClipId, enabled: boolean): boolean {
  if (!enabled || !manifestCache || !bufferCache.has(id)) return false
  if (!audioContext || !sfxGain) return false

  try {
    playBufferClip(id, manifestCache, enabled)
    return true
  } catch {
    return false
  }
}

export function unlockAudioContextSync(): void {
  audioUnlocked = true
  const context = ensureContextSync()
  if (!context) return

  primeIosAudioUnlock(context)
  warmManifestFetch()

  if (context.state === 'suspended') {
    void context.resume()
  }
}

export async function unlockAudioContext(): Promise<void> {
  unlockAudioContextSync()
  const context = ensureContextSync()
  if (!context) return

  if (context.state === 'suspended') {
    await context.resume()
  }
}

export async function preloadAudioTier(tier: AudioTier): Promise<void> {
  if (!audioUnlocked) return

  const pending = tierLoadPromises.get(tier)
  if (pending) {
    await pending
    return
  }

  const promise = (async () => {
    await unlockAudioContext()
    const manifest = await loadManifest()

    if (manifest.mode === 'sprite') {
      await ensureSpriteBuffer(manifest)
    }

    const clipIds = clipsForTier(manifest, tier)
    await Promise.all(clipIds.map((id) => loadClipBuffer(id)))
  })()

  tierLoadPromises.set(tier, promise)
  try {
    await promise
  } catch {
    tierLoadPromises.delete(tier)
  }
}

export function preloadAudioTierIdle(tier: AudioTier): void {
  const run = () => {
    void preloadAudioTier(tier)
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 })
    return
  }

  globalThis.setTimeout(run, 800)
}

export function playClip(id: ClipId, enabled: boolean): void {
  if (!enabled || !audioUnlocked) return

  unlockAudioContextSync()
  if (tryPlayClipSync(id, enabled)) return

  void (async () => {
    await unlockAudioContext()
    const manifest = await loadManifest()
    await loadClipBuffer(id)
    playBufferClip(id, manifest, enabled)
  })()
}

export function playRandomWriteClip(enabled: boolean): void {
  if (!enabled) return

  const index = Math.floor(Math.random() * WRITE_SFX_IDS.length)
  playClip(WRITE_SFX_IDS[index], enabled)
}

async function prefetchClipBytes(manifest: SfxManifest, id: ClipId): Promise<void> {
  const clip = manifest.clips[id]
  if (!clip) return

  if (manifest.mode === 'sprite' && !isFileClipDef(clip)) return

  if (isFileClipDef(clip)) {
    await fetchAudioBytes(clip.src)
  }
}

async function prefetchSpriteBytes(manifest: SfxManifest): Promise<void> {
  if (manifest.mode !== 'sprite') return

  const sources = manifest.spriteSources ?? [manifest.sprite]
  await Promise.all(sources.map((source) => fetchAudioBytes(source)))
}

export async function prefetchMenuAudioBytes(): Promise<void> {
  if (!menuAudioPrefetchPromise) {
    menuAudioPrefetchPromise = (async () => {
      const manifest = await loadManifest()
      await prefetchSpriteBytes(manifest)

      for (const tier of MENU_AUDIO_TIERS) {
        const clipIds = clipsForTier(manifest, tier)
        await Promise.all(clipIds.map((id) => prefetchClipBytes(manifest, id)))
      }
    })().catch((error) => {
      menuAudioPrefetchPromise = null
      throw error
    })
  }

  await menuAudioPrefetchPromise
}

export function isMenuAudioReady(): boolean {
  if (!audioUnlocked || !manifestCache) return false

  const clipIds = MENU_AUDIO_TIERS.flatMap((tier) => clipsForTier(manifestCache!, tier))
  return clipIds.every((id) => bufferCache.has(id))
}

export async function prepareMenuAudio(): Promise<void> {
  if (menuAudioPreparePromise) {
    await menuAudioPreparePromise
    return
  }

  menuAudioPreparePromise = (async () => {
    await prefetchMenuAudioBytes()
    await unlockAudioContext()
    await Promise.all(MENU_AUDIO_TIERS.map((tier) => preloadAudioTier(tier)))
  })().catch((error) => {
    menuAudioPreparePromise = null
    throw error
  })

  try {
    await menuAudioPreparePromise
  } catch {
    menuAudioPreparePromise = null
  }
}

export function resetAudioEngineForTests(): void {
  audioContext?.close().catch(() => {})
  audioContext = null
  sfxGain = null
  audioUnlocked = false
  manifestCache = null
  manifestPromise = null
  iosUnlockPrimed = false
  bufferCache.clear()
  rawBytesCache.clear()
  clipLoadPromises.clear()
  tierLoadPromises.clear()
  menuAudioPrefetchPromise = null
  menuAudioPreparePromise = null
  spriteBuffer = null
  spriteLoadPromise = null
  activeWriteSources.clear()
}
