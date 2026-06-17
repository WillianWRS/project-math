import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const source = join(publicDir, 'logo-math.png')

function roundedMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`,
  )
}

async function resizeRounded(input, size) {
  const radius = Math.round(size * 0.18)
  const resized = await sharp(input).resize(size, size, { fit: 'cover', position: 'center' }).png().toBuffer()

  return sharp(resized)
    .composite([{ input: roundedMask(size, radius), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

const pwaSizes = [192, 512]

for (const size of pwaSizes) {
  const rounded = await resizeRounded(source, size)
  await sharp(rounded).toFile(join(publicDir, `pwa-${size}x${size}.png`))
}

const faviconRounded = await resizeRounded(source, 32)
await sharp(faviconRounded).toFile(join(publicDir, 'favicon.png'))

const maskableSize = 512
const iconSize = Math.round(maskableSize * 0.72)
const maskableIcon = await resizeRounded(source, iconSize)

await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 20, g: 18, b: 16, alpha: 1 },
  },
})
  .composite([{ input: maskableIcon, gravity: 'center' }])
  .png()
  .toFile(join(publicDir, 'pwa-512-maskable.png'))

console.log('PWA icons generated from public/logo-math.png (rounded corners)')
