import { useCallback, useEffect, useRef, useState } from 'react'

const ACHIEVEMENT_TOAST_DURATION_MS = 2800

export function useAchievementToast() {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const onHiddenRef = useRef<(() => void) | null>(null)

  const hideAchievementToast = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
    onHiddenRef.current = null
  }, [])

  const showAchievementToast = useCallback((onHidden?: () => void) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    onHiddenRef.current = onHidden ?? null
    setVisible(true)
    timerRef.current = window.setTimeout(() => {
      setVisible(false)
      timerRef.current = null
      onHiddenRef.current?.()
      onHiddenRef.current = null
    }, ACHIEVEMENT_TOAST_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      hideAchievementToast()
    }
  }, [hideAchievementToast])

  return {
    achievementToastVisible: visible,
    showAchievementToast,
    hideAchievementToast,
  }
}
