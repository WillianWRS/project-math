const XP_PER_LEVEL = 500

export function xpToLevel(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp))
  return Math.max(1, Math.floor(safeXp / XP_PER_LEVEL) + 1)
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; level: number } {
  const safeXp = Math.max(0, Math.floor(xp))
  const level = xpToLevel(safeXp)
  const baseXp = (level - 1) * XP_PER_LEVEL
  return {
    current: safeXp - baseXp,
    needed: XP_PER_LEVEL,
    level,
  }
}
