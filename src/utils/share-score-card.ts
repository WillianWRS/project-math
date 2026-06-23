interface ShareImageOptions {
  filename?: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function prepareElementForCapture(element: HTMLElement) {
  const previous = {
    left: element.style.left,
    top: element.style.top,
    opacity: element.style.opacity,
    visibility: element.style.visibility,
    pointerEvents: element.style.pointerEvents,
    zIndex: element.style.zIndex,
  }
  element.style.left = '0'
  element.style.top = '0'
  element.style.opacity = '1'
  element.style.visibility = 'visible'
  element.style.pointerEvents = 'none'
  element.style.zIndex = '-1'
  return previous
}

function restoreElementAfterCapture(element: HTMLElement, previous: ReturnType<typeof prepareElementForCapture>) {
  element.style.left = previous.left
  element.style.top = previous.top
  element.style.opacity = previous.opacity
  element.style.visibility = previous.visibility
  element.style.pointerEvents = previous.pointerEvents
  element.style.zIndex = previous.zIndex
}

async function captureElementAsBlob(element: HTMLElement): Promise<Blob | null> {
  const { toBlob } = await import('html-to-image')
  const backgroundColor = element.dataset.captureBackground ?? '#141210'
  const previousStyle = prepareElementForCapture(element)
  try {
    return await toBlob(element, {
      width: 1080,
      height: 1350,
      pixelRatio: 1,
      backgroundColor,
      cacheBust: true,
    })
  } finally {
    restoreElementAfterCapture(element, previousStyle)
  }
}

export async function shareScoreCardFromElement(
  element: HTMLElement,
  options: ShareImageOptions = {},
): Promise<void> {
  const blob = await captureElementAsBlob(element)
  if (!blob) return

  const filename = options.filename ?? 'project-math-score.png'
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Project Math' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      throw error
    }
    return
  }
  downloadBlob(blob, filename)
}
