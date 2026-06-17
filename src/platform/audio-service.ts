const AUDIO_PATHS = {
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  click: '/audio/click.mp3',
  gameOver: '/audio/game-over.mp3',
  gameStart: '/audio/game-start.mp3',
  record: '/audio/record.mp3',
  erase: '/audio/erase.mp3',
  goToMenu: '/audio/go-to-menu.mp3',
} as const

export type SfxId = keyof typeof AUDIO_PATHS

const AMBIENT_PATH = '/audio/ambient.mp3'
const AMBIENT_VOLUME = 0.32
const WRITE_SFX_COUNT = 7

const SFX_VOLUMES: Partial<Record<SfxId, number>> = {
  erase: 0.28,
}

const cache = new Map<SfxId, HTMLAudioElement>()
const writeCache = new Map<number, HTMLAudioElement>()
let ambientAudio: HTMLAudioElement | null = null

function getAmbientAudio(): HTMLAudioElement {
  if (!ambientAudio) {
    ambientAudio = new Audio(AMBIENT_PATH)
    ambientAudio.loop = true
    ambientAudio.preload = 'auto'
    ambientAudio.volume = AMBIENT_VOLUME
  }
  return ambientAudio
}
function getAudio(id: SfxId): HTMLAudioElement {
  let audio = cache.get(id)
  if (!audio) {
    audio = new Audio(AUDIO_PATHS[id])
    audio.preload = 'auto'
    audio.volume = SFX_VOLUMES[id] ?? 1
    cache.set(id, audio)
  }
  return audio
}

function getWriteAudio(index: number): HTMLAudioElement {
  let audio = writeCache.get(index)
  if (!audio) {
    audio = new Audio(`/audio/write-${index}.mp3`)
    audio.preload = 'auto'
    writeCache.set(index, audio)
  }
  return audio
}

export function preloadSfx(): void {
  ;(Object.keys(AUDIO_PATHS) as SfxId[]).forEach((id) => {
    getAudio(id).load()
  })
  for (let index = 1; index <= WRITE_SFX_COUNT; index += 1) {
    getWriteAudio(index).load()
  }
  getAmbientAudio().load()
}

export function playSfx(id: SfxId, enabled: boolean): void {
  if (!enabled) return

  const audio = getAudio(id)
  audio.currentTime = 0
  void audio.play().catch(() => {})
}

export function playRandomWriteSfx(enabled: boolean): void {
  if (!enabled) return

  const index = Math.floor(Math.random() * WRITE_SFX_COUNT) + 1
  const audio = getWriteAudio(index)
  audio.currentTime = 0
  void audio.play().catch(() => {})
}

export function syncAmbient(shouldPlay: boolean): void {
  const audio = getAmbientAudio()

  if (!shouldPlay) {
    if (!audio.paused) audio.pause()
    return
  }

  if (!audio.paused) return
  void audio.play().catch(() => {})
}