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

let manifestPromise: Promise<SfxManifest> | null = null
let audioContext: AudioContext | null = null
let sfxGain: GainNode | null = null
let ambientGain: GainNode | null = null

const bufferCache = new Map<ClipId, AudioBuffer>()
const clipLoadPromises = new Map<ClipId, Promise<void>>()
const tierLoadPromises = new Map<AudioTier, Promise<void>>()

let spriteBuffer: AudioBuffer | null = null
let spriteLoadPromise: Promise<void> | null = null
let ambientBuffer: AudioBuffer | null = null
let ambientLoadPromise: Promise<void> | null = null
let ambientSource: AudioBufferSourceNode | null = null

const activeWriteSources = new Set<AudioBufferSourceNode>()

async function loadManifest(): Promise<SfxManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_PATH)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${MANIFEST_PATH}`)
        return response.json() as Promise<SfxManifest>
      })
      .catch((error) => {
        manifestPromise = null
        throw error
      })
  }
  return manifestPromise
}

async function getContext(): Promise<AudioContext> {
  if (!audioContext) {
    audioContext = new AudioContext()
    const masterGain = audioContext.createGain()
    sfxGain = audioContext.createGain()
    ambientGain = audioContext.createGain()
    sfxGain.connect(masterGain)
    ambientGain.connect(masterGain)
    masterGain.connect(audioContext.destination)
  }
  return audioContext
}

async function decodeAudio(url: string): Promise<AudioBuffer> {
  const context = await getContext()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch audio: ${url}`)
  const data = await response.arrayBuffer()
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

async function loadAmbientBuffer(): Promise<void> {
  if (ambientBuffer) return
  if (!ambientLoadPromise) {
    ambientLoadPromise = (async () => {
      const manifest = await loadManifest()
      ambientBuffer = await decodeAudio(manifest.ambient.src)
      if (ambientGain) ambientGain.gain.value = manifest.ambient.volume
    })().catch((error) => {
      ambientLoadPromise = null
      throw error
    })
  }
  await ambientLoadPromise
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

export async function unlockAudioContext(): Promise<void> {
  const context = await getContext()
  if (context.state === 'suspended') {
    await context.resume()
  }
}

export async function preloadAudioTier(tier: AudioTier): Promise<void> {
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

    if (tier === 'idle') {
      await loadAmbientBuffer()
    }
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
  if (!enabled) return

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

export function syncAmbientPlayback(shouldPlay: boolean): void {
  void (async () => {
    await unlockAudioContext()
    await loadAmbientBuffer()

    if (!shouldPlay) {
      if (ambientSource) {
        try {
          ambientSource.stop(0)
        } catch {
          /* already stopped */
        }
        ambientSource.disconnect()
        ambientSource = null
      }
      return
    }

    if (ambientSource || !audioContext || !ambientGain || !ambientBuffer) return

    const source = audioContext.createBufferSource()
    source.buffer = ambientBuffer
    source.loop = true
    source.connect(ambientGain)
    source.start(0)
    ambientSource = source
  })()
}

export function resetAudioEngineForTests(): void {
  if (ambientSource) {
    try {
      ambientSource.stop(0)
    } catch {
      /* noop */
    }
    ambientSource.disconnect()
  }

  audioContext?.close().catch(() => {})
  audioContext = null
  sfxGain = null
  ambientGain = null
  manifestPromise = null
  bufferCache.clear()
  clipLoadPromises.clear()
  tierLoadPromises.clear()
  spriteBuffer = null
  spriteLoadPromise = null
  ambientBuffer = null
  ambientLoadPromise = null
  ambientSource = null
  activeWriteSources.clear()
}
