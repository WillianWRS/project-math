import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packageJsonPath = join(rootDir, 'package.json')

const VALID_BUMPS = new Set(['patch', 'minor', 'major'])
const bump = process.argv[2] ?? 'patch'

if (!VALID_BUMPS.has(bump)) {
  console.error('Uso: npm run bump -- [patch|minor|major]')
  console.error('Exemplo: npm run bump -- patch  →  0.0.25 → 0.0.26')
  process.exit(1)
}

const before = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version

execSync(`npm version ${bump} --no-git-tag-version --ignore-scripts`, {
  cwd: rootDir,
  stdio: 'inherit',
})

const after = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version

console.log(`Versão atualizada: ${before} → ${after}`)
