export type AudioTier = 'critical' | 'gameplay' | 'idle'

export type AudioPool = 'write'

export type SfxId =
  | 'success'
  | 'autoCheck'
  | 'gameChanger'
  | 'error'
  | 'click'
  | 'clickClose'
  | 'gameOver'
  | 'gameStart'
  | 'record'
  | 'erase'
  | 'goToMenu'

export type WriteSfxId = 'write1' | 'write2' | 'write3' | 'write4' | 'write5' | 'write6' | 'write7'

export type ClipId = SfxId | WriteSfxId

export interface SpriteClipDef {
  start: number
  duration: number
  tier: AudioTier
  volume?: number
  pool?: AudioPool
}

export interface FileClipDef {
  src: string
  tier: AudioTier
  volume?: number
  pool?: AudioPool
}

export interface SfxManifest {
  mode: 'files' | 'sprite'
  sprite: string
  spriteSources?: string[]
  clips: Record<ClipId, FileClipDef | SpriteClipDef>
}

export const WRITE_SFX_IDS: WriteSfxId[] = [
  'write1',
  'write2',
  'write3',
  'write4',
  'write5',
  'write6',
  'write7',
]

export function isFileClipDef(clip: FileClipDef | SpriteClipDef): clip is FileClipDef {
  return 'src' in clip
}

export function clipsForTier(manifest: SfxManifest, tier: AudioTier): ClipId[] {
  return (Object.entries(manifest.clips) as [ClipId, FileClipDef | SpriteClipDef][])
    .filter(([, clip]) => clip.tier === tier)
    .map(([id]) => id)
}
