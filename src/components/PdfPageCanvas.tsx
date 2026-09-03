import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
// Vite resolves this to a static URL for the worker script.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

type Props = {
  fileUrl: string
  scale: number
  pageNumber?: number
  onDocLoaded?: (numPages: number) => void
}

// Renders a single PDF page onto a canvas at the given scale, so annotated
// IFU documents can share the same pan/zoom canvas interaction as label images.
export default function PdfPageCanvas({ fileUrl, scale, pageNumber = 1, onDocLoaded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    pdfjsLib.getDocument(fileUrl).promise
      .then(pdf => {
        if (cancelled) return
        pdfRef.current = pdf
        onDocLoaded?.(pdf.numPages)
        return renderCurrentPage()
      })
      .catch(() => { if (!cancelled) setError(true) })

    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
      pdfRef.current?.destroy?.()
      pdfRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl])

  useEffect(() => {
    if (!pdfRef.current) return
    renderCurrentPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, pageNumber])

  async function renderCurrentPage() {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return
    try {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      renderTaskRef.current?.cancel()
      const task = page.render({ canvasContext: ctx, viewport })
      renderTaskRef.current = task
      await task.promise
    } catch {
      // Render cancellations throw — safe to ignore, a newer render supersedes it.
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-[#5F6368] italic">
        Unable to load document
      </div>
    )
  }

  return <canvas ref={canvasRef} className="block shadow-sm rounded-lg bg-white" />
}
