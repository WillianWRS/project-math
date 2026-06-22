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
    setEdges(readScrollEdges(el))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    syncEdges()
    const observer = new ResizeObserver(syncEdges)
    observer.observe(el)

    return () => observer.disconnect()
  }, [syncEdges, children])

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
