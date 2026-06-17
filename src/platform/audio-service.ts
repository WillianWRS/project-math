const AUDIO_PATHS = {
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  click: '/audio/click.mp3',
  gameOver: '/audio/game-over.mp3',
} as const

const AMBIENT_PATH = '/audio/ambient.mp3'
const AMBIENT_VOLUME = 0.32

export type SfxId = keyof typeof AUDIO_PATHS

const cache = new Map<SfxId, HTMLAudioElement>()
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
    cache.set(id, audio)
  }
  return audio
}

export function preloadSfx(): void {
  ;(Object.keys(AUDIO_PATHS) as SfxId[]).forEach((id) => {
    getAudio(id).load()
  })
  getAmbientAudio().load()
}

export function playSfx(id: SfxId, enabled: boolean): void {
  if (!enabled) return

  const audio = getAudio(id)
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