import * as pdfjs from 'pdfjs-dist'
import { ProcessedPage, DetectedMark, TextBlock, TableRow, TableCell, BoundingBox } from '../../types/docmarker'

export async function loadImageFile(file: File): Promise<ProcessedPage[]> {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  return [{
    pageIndex: 0,
    width: canvas.width,
    height: canvas.height,
    imageData: dataUrl,
    marks: [],
    textBlocks: [],
    rows: []
  }]
}

export async function loadPdfFile(file: File): Promise<ProcessedPage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages: ProcessedPage[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const scale = 3.0 // Increased for better OCR/detection
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    const dataUrl = canvas.toDataURL('image/png')

    pages.push({
      pageIndex: i - 1,
      width: canvas.width,
      height: canvas.height,
      imageData: dataUrl,
      marks: [],
      textBlocks: [],
      rows: []
    })
  }

  return pages
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
