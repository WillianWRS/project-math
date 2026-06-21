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

export async function shareScoreCardFromElement(
  element: HTMLElement,
  options: ShareImageOptions = {},
): Promise<void> {
  const { toBlob } = await import('html-to-image')
  const blob = await toBlob(element, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    backgroundColor: '#141210',
  })
  if (!blob) return

  const filename = options.filename ?? 'project-math-score.png'
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Project Math' })
    return
  }
  downloadBlob(blob, filename)
}
