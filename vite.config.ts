/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const audioManifestPath = join(rootDir, 'public/audio/sfx-manifest.json')

interface AudioClipManifest {
  src?: string
  tier: string
}

interface AudioManifestFile {
  mode: 'files' | 'sprite'
  sprite: string
  spriteSources?: string[]
  ambient: { src: string }
  clips: Record<string, AudioClipManifest>
}

function publicFilePath(urlPath: string): string {
  return join(rootDir, 'public', urlPath.replace(/^\//, ''))
}

function fileRevision(urlPath: string): string {
  const absolutePath = publicFilePath(urlPath)
  if (!existsSync(absolutePath)) {
    throw new Error(`Arquivo de áudio ausente para precache PWA: ${urlPath}`)
  }

  return createHash('md5').update(readFileSync(absolutePath)).digest('hex')
}

function readAudioManifest(): AudioManifestFile | null {
  if (!existsSync(audioManifestPath)) return null
  return JSON.parse(readFileSync(audioManifestPath, 'utf8')) as AudioManifestFile
}

function getAudioPrecacheEntries(): { url: string; revision: string }[] {
  const manifest = readAudioManifest()
  if (!manifest) return []

  const entries = [{ url: '/audio/sfx-manifest.json', revision: fileRevision('/audio/sfx-manifest.json') }]

  if (manifest.mode === 'sprite' && existsSync(publicFilePath(manifest.sprite))) {
    for (const source of manifest.spriteSources ?? [manifest.sprite]) {
      entries.push({ url: source, revision: fileRevision(source) })
    }

    entries.push({ url: manifest.ambient.src, revision: fileRevision(manifest.ambient.src) })
    return entries
  }

  for (const clip of Object.values(manifest.clips)) {
    if (clip.tier === 'critical' && clip.src) {
      entries.push({ url: clip.src, revision: fileRevision(clip.src) })
    }
  }

  return entries
}

function getAudioRuntimeCacheMaxEntries(): number {
  const manifest = readAudioManifest()
  if (!manifest) return 24
  if (manifest.mode === 'sprite') return 8
  return Object.keys(manifest.clips).length + 4
}

const audioPrecacheEntries = getAudioPrecacheEntries()
const audioCacheMaxEntries = getAudioRuntimeCacheMaxEntries()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo-math.png', 'audio/sfx-manifest.json'],
      manifest: {
        name: 'Project Math',
        short_name: 'Math',
        description: 'Jogo de cálculo mental',
        theme_color: '#141210',
        background_color: '#141210',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,webmanifest}'],
        globIgnores: ['**/audio/**'],
        additionalManifestEntries: audioPrecacheEntries,
        navigationPreload: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\/audio\/sfx-manifest\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-audio-manifest-cache',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/audio\/.+\.(?:mp3|webm|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-audio-cache',
              expiration: {
                maxEntries: audioCacheMaxEntries,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/motion')) return 'motion'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules')) return 'vendor'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
