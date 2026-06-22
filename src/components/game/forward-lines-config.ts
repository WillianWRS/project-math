export interface ForwardLine {
  id: number
  height: number
  left: number
  delay: number
  duration: number
  opacity: number
}

function createForwardLines(count: number): ForwardLine[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    height: 10 + ((i * 37 + 13) % 51),
    left: 2 + ((i * 41 + 7) % 93),
    delay: (i * 0.53) % 9,
    duration: 2 + (i % 7) * 0.45,
    opacity: 0.05 + (i % 6) * 0.018,
  }))
}

export const FORWARD_LINES = createForwardLines(10)
