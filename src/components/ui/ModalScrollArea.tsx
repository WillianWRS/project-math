import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollEdges {
  top: boolean
  bottom: boolean
}

function readScrollEdges(el: HTMLElement): ScrollEdges {
  const maxScroll = el.scrollHeight - el.clientHeight
  if (maxScroll <= 1) return { top: false, bottom: false }
  return {
    top: el.scrollTop > 6,
    bottom: el.scrollTop < maxScroll - 6,
  }
}

export function ModalScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState<ScrollEdges>({ top: false, bottom: false })

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const next = readScrollEdges(el)
    setEdges((current) =>
      current.top === next.top && current.bottom === next.bottom ? current : next,
    )
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let frameId = 0
    const scheduleSync = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        frameId = 0
        syncEdges()
      })
    }

    scheduleSync()
    const observer = new ResizeObserver(scheduleSync)
    observer.observe(el)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [syncEdges])

  return (
    <div className="game-modal-scroll-shell">
      <div ref={scrollRef} className="game-modal-scroll" onScroll={syncEdges}>
        <div className="game-modal-scroll__content">{children}</div>
      </div>
      <div
        className="game-modal-scroll-fade game-modal-scroll-fade--top"
        data-visible={edges.top || undefined}
        aria-hidden
      />
      <div
        className="game-modal-scroll-fade game-modal-scroll-fade--bottom"
        data-visible={edges.bottom || undefined}
        aria-hidden
      />
    </div>
  )
}
