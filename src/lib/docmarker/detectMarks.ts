import { DetectedMark, BoundingBox, DetectionSettings } from '../../types/docmarker'

export async function detectMarks(
  imageData: ImageData,
  pageIndex: number,
  settings: DetectionSettings
): Promise<DetectedMark[]> {
  const { width, height, data } = imageData
  const gray = toGrayscale(data)
  const binary = otsuThreshold(gray, width, height)
  const labels = connectedComponents(binary, width, height)

  const blobs = extractBlobs(labels, width, height)
  const marks: DetectedMark[] = []

  for (const blob of blobs) {
    const area = blob.width * blob.height
    if (area < settings.minMarkSize * settings.minMarkSize) continue
    if (area > settings.maxMarkSize * settings.maxMarkSize * 4) continue

    const aspectRatio = blob.width / blob.height
    if (aspectRatio < 0.3 || aspectRatio > 3.0) continue

    const density = computeBlobDensity(binary, blob, width)
    const type = classifyMark(density, aspectRatio, blob, binary, width)
    const confidence = estimateConfidence(density, type)

    if (confidence < settings.confidenceThreshold) continue

    marks.push({
      id: `mark-${pageIndex}-${marks.length}`,
      bbox: { x: blob.x, y: blob.y, width: blob.width, height: blob.height },
      confidence,
      type,
      pageIndex,
      isMarked: confidence > 0.6
    })
  }

  return marks
}

function toGrayscale(data: Uint8ClampedArray): Uint8Array {
  const gray = new Uint8Array(data.length / 4)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  }
  return gray
}

function otsuThreshold(gray: Uint8Array, width: number, height: number): Uint8Array {
  const histogram = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++

  const total = width * height
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0, wB = 0, maxVariance = 0, threshold = 0
  for (let i = 0; i < 256; i++) {
    wB += histogram[i]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break

    sumB += i * histogram[i]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const variance = wB * wF * (mB - mF) * (mB - mF)

    if (variance > maxVariance) {
      maxVariance = variance
      threshold = i
    }
  }

  const binary = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0
  }
  return binary
}

interface Blob {
  x: number
  y: number
  width: number
  height: number
  pixelCount: number
}

function connectedComponents(binary: Uint8Array, width: number, height: number): Int32Array {
  const labels = new Int32Array(width * height)
  let currentLabel = 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (binary[idx] === 0 || labels[idx] !== 0) continue

      const queue = [idx]
      labels[idx] = currentLabel

      while (queue.length > 0) {
        const cur = queue.pop()!
        const cx = cur % width
        const cy = Math.floor(cur / width)

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = cx + dx
            const ny = cy + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const nIdx = ny * width + nx
            if (binary[nIdx] === 1 && labels[nIdx] === 0) {
              labels[nIdx] = currentLabel
              queue.push(nIdx)
            }
          }
        }
      }
      currentLabel++
    }
  }
  return labels
}

function extractBlobs(labels: Int32Array, width: number, height: number): Blob[] {
  const blobMap = new Map<number, { minX: number; minY: number; maxX: number; maxY: number; count: number }>()

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labels[y * width + x]
      if (label === 0) continue

      const existing = blobMap.get(label)
      if (existing) {
        existing.minX = Math.min(existing.minX, x)
        existing.minY = Math.min(existing.minY, y)
        existing.maxX = Math.max(existing.maxX, x)
        existing.maxY = Math.max(existing.maxY, y)
        existing.count++
      } else {
        blobMap.set(label, { minX: x, minY: y, maxX: x, maxY: y, count: 1 })
      }
    }
  }

  const blobs: Blob[] = []
  for (const [, b] of blobMap) {
    blobs.push({
      x: b.minX,
      y: b.minY,
      width: b.maxX - b.minX + 1,
      height: b.maxY - b.minY + 1,
      pixelCount: b.count
    })
  }
  return blobs
}

function computeBlobDensity(binary: Uint8Array, blob: BinaryBlob, imgWidth: number): number {
  let filled = 0
  const total = blob.width * blob.height
  for (let y = blob.y; y < blob.y + blob.height; y++) {
    for (let x = blob.x; x < blob.x + blob.width; x++) {
      if (binary[y * imgWidth + x] === 1) filled++
    }
  }
  return filled / total
}

interface BinaryBlob extends Blob {}

function classifyMark(
  density: number,
  aspectRatio: number,
  blob: Blob,
  binary: Uint8Array,
  imgWidth: number
): DetectedMark['type'] {
  const innerDensity = computeInnerDensity(binary, blob, imgWidth)

  if (density > 0.15 && density < 0.45 && innerDensity < 0.05 && aspectRatio > 0.7 && aspectRatio < 1.4) {
    return 'checkbox'
  }
  if (density > 0.05 && density < 0.3 && innerDensity > 0.02) {
    return 'checkmark'
  }
  if (density > 0.08 && density < 0.35) {
    return 'xmark'
  }
  if (density > 0.1 && aspectRatio > 0.7 && aspectRatio < 1.3) {
    return 'circle'
  }
  return 'unknown'
}

function computeInnerDensity(binary: Uint8Array, blob: Blob, imgWidth: number): number {
  const margin = Math.max(2, Math.floor(Math.min(blob.width, blob.height) * 0.2))
  let filled = 0
  let total = 0

  for (let y = blob.y + margin; y < blob.y + blob.height - margin; y++) {
    for (let x = blob.x + margin; x < blob.x + blob.width - margin; x++) {
      total++
      if (binary[y * imgWidth + x] === 1) filled++
    }
  }
  return total > 0 ? filled / total : 0
}

function estimateConfidence(density: number, type: DetectedMark['type']): number {
  let base = 0.5
  if (type === 'checkmark' && density > 0.08 && density < 0.25) base = 0.8
  else if (type === 'xmark' && density > 0.1 && density < 0.3) base = 0.75
  else if (type === 'checkbox' && density > 0.15 && density < 0.45) base = 0.85
  else if (type === 'circle' && density > 0.1) base = 0.7
  else if (type === 'unknown') base = 0.4

  return Math.min(0.99, base + density * 0.3)
}
