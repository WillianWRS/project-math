export const MODAL_STAGE_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }

export function modalStageItem(index: number, x = 0, y = 10) {
  const delay = Math.min(0.03 + index * 0.02, 0.1)

  return {
    initial: { opacity: 0, x, y, scale: 0.99 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { ...MODAL_STAGE_TRANSITION, delay },
    },
  } as const
}
