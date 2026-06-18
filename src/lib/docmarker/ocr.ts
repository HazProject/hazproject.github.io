import Tesseract from 'tesseract.js'
import { TextBlock, BoundingBox } from '../../types/docmarker'

let workerInstance: Tesseract.Worker | null = null

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerInstance) {
    workerInstance = await Tesseract.createWorker('eng', 1, {
      logger: () => {}
    })
  }
  return workerInstance
}

export async function ocrPage(
  imageDataUrl: string,
  pageIndex: number,
  onProgress?: (progress: number) => void
): Promise<TextBlock[]> {
  const worker = await getWorker()
  const result = await worker.recognize(imageDataUrl)

  onProgress?.(1)

  const blocks: TextBlock[] = []
  const lines = result.data.lines || []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const bbox = line.bbox

    blocks.push({
      id: `text-${pageIndex}-${i}`,
      text: line.text.trim(),
      bbox: {
        x: bbox.x0,
        y: bbox.y0,
        width: bbox.x1 - bbox.x0,
        height: bbox.y1 - bbox.y0
      },
      pageIndex,
      confidence: line.confidence / 100,
      lineNumber: i
    })
  }

  return blocks.filter(b => b.text.length > 0)
}

export async function terminateOCR(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
