import { existsSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const audioDir = join(rootDir, 'public', 'audio')
const manifestPath = join(audioDir, 'sfx-manifest.json')
const spritePath = join(audioDir, 'sfx-sprite.mp3')
const spriteWebmPath = join(audioDir, 'sfx-sprite.webm')
const CLIP_ORDER = [
  ['click', 'click.mp3', 'critical', 1],
  ['erase', 'erase.mp3', 'critical', 0.28],
  ['error', 'error.mp3', 'critical', 1],
  ['success', 'success.mp3', 'critical', 1],
  ['write1', 'write-1.mp3', 'critical', 1, 'write'],
  ['write2', 'write-2.mp3', 'critical', 1, 'write'],
  ['write3', 'write-3.mp3', 'critical', 1, 'write'],
  ['write4', 'write-4.mp3', 'critical', 1, 'write'],
  ['write5', 'write-5.mp3', 'critical', 1, 'write'],
  ['write6', 'write-6.mp3', 'critical', 1, 'write'],
  ['write7', 'write-7.mp3', 'critical', 1, 'write'],
  ['gameStart', 'game-start.mp3', 'gameplay', 1],
  ['autoCheck', 'auto-check.mp3', 'gameplay', 1],
  ['gameChanger', 'game-changer.mp3', 'gameplay', 1],
  ['gameOver', 'game-over.mp3', 'idle', 1],
  ['record', 'record.mp3', 'idle', 1],
  ['goToMenu', 'go-to-menu.mp3', 'idle', 1],
] 

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(checker, [command], { shell: true, stdio: 'ignore' })
  return result.status === 0
}
function probeDurationMs(filePath) {
  const output = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { encoding: 'utf8' },
  ).trim()

  const seconds = Number.parseFloat(output)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Invalid duration for ${filePath}`)
  }

  return Math.ceil(seconds * 1000) + 40
}

function encodeSpriteWebm() {
  if (!existsSync(spritePath)) return null

  execFileSync(
    'ffmpeg',
    ['-y', '-i', spritePath, '-c:a', 'libopus', '-b:a', '96k', spriteWebmPath],
    { stdio: 'inherit' },
  )

  return '/audio/sfx-sprite.webm'
}

function buildFilesManifest() {  const clips = Object.fromEntries(
    CLIP_ORDER.map(([id, file, tier, volume, pool]) => {
      const entry = {
        src: `/audio/${file}`,
        tier,
        volume,
        ...(pool ? { pool } : {}),
      }
      return [id, entry]
    }),
  )

  return {
    mode: 'files',
    sprite: '/audio/sfx-sprite.mp3',
    clips,
  }
}

function buildSpriteManifest() {
  let cursor = 0
  const clips = {}
  const concatLines = []

  for (const [id, file, tier, volume, pool] of CLIP_ORDER) {
    const inputPath = join(audioDir, file)
    const durationMs = probeDurationMs(inputPath)

    clips[id] = {
      start: cursor,
      duration: durationMs,
      tier,
      volume,
      ...(pool ? { pool } : {}),
    }

    cursor += durationMs
    concatLines.push(`file '${inputPath.replace(/\\/g, '/')}'`)
  }

  const listPath = join(audioDir, 'sfx-sprite-list.txt')
  writeFileSync(listPath, `${concatLines.join('\n')}\n`, 'utf8')

  execFileSync(
    'ffmpeg',
    ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', spritePath],
    { stdio: 'inherit' },
  )

  const spriteWebm = encodeSpriteWebm()
  const spriteSources = spriteWebm
    ? [spriteWebm, '/audio/sfx-sprite.mp3']
    : ['/audio/sfx-sprite.mp3']

  return {
    mode: 'sprite',
    sprite: '/audio/sfx-sprite.mp3',
    spriteSources,
    clips,
  }
}

function main() {
  const hasFfmpeg = commandExists('ffmpeg') && commandExists('ffprobe')
  const manifest = hasFfmpeg ? buildSpriteManifest() : buildFilesManifest()

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  if (hasFfmpeg) {
    console.log(`Sprite gerado em ${spritePath}`)
    if (existsSync(spriteWebmPath)) {
      console.log(`Sprite WebM gerado em ${spriteWebmPath}`)
    }
  } else {    console.log('ffmpeg/ffprobe não encontrados — manifest em modo "files" (Web Audio com buffers individuais).')
  }

  console.log(`Manifest atualizado em ${manifestPath}`)
}

main()
