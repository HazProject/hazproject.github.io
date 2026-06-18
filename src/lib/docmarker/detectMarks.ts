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
    if (blob.pixelCount < 40) continue
    if (blob.width < settings.minMarkSize || blob.height < settings.minMarkSize) continue
    if (blob.width > settings.maxMarkSize * 3 || blob.height > settings.maxMarkSize * 3) continue

    const aspectRatio = blob.width / blob.height
    if (aspectRatio < 0.25 || aspectRatio > 4.0) continue

    const elongation = Math.max(blob.width, blob.height) / Math.max(1, Math.min(blob.width, blob.height))
    if (elongation > 5) continue

    const density = computeBlobDensity(binary, blob, width)
    if (density < 0.08) continue

    const compactness = computeCompactness(blob, binary, width)
    const innerDensity = computeInnerDensity(binary, blob, width)

    const type = classifyMark(density, innerDensity, compactness, aspectRatio, elongation, blob)
    if (type === 'unknown') continue

    const confidence = estimateConfidence(density, innerDensity, compactness, type, blob)

    if (confidence < settings.confidenceThreshold) continue

    marks.push({
      id: `mark-${pageIndex}-${marks.length}`,
      bbox: { x: blob.x, y: blob.y, width: blob.width, height: blob.height },
      confidence,
      type,
      pageIndex,
      isMarked: confidence > 0.65
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

function computeBlobDensity(binary: Uint8Array, blob: Blob, imgWidth: number): number {
  let filled = 0
  const total = blob.width * blob.height
  for (let y = blob.y; y < blob.y + blob.height; y++) {
    for (let x = blob.x; x < blob.x + blob.width; x++) {
      if (binary[y * imgWidth + x] === 1) filled++
    }
  }
  return filled / total
}

function computeCompactness(blob: Blob, binary: Uint8Array, imgWidth: number): number {
  let perimeter = 0
  const fillRatio = blob.pixelCount / (blob.width * blob.height)

  for (let y = blob.y; y < blob.y + blob.height; y++) {
    for (let x = blob.x; x < blob.x + blob.width; x++) {
      if (binary[y * imgWidth + x] !== 1) continue
      let isEdge = false
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < blob.x || nx >= blob.x + blob.width || ny < blob.y || ny >= blob.y + blob.height) {
          isEdge = true; break
        }
        if (binary[ny * imgWidth + nx] === 0) { isEdge = true; break }
      }
      if (isEdge) perimeter++
    }
  }

  const area = Math.max(1, blob.pixelCount)
  const rawCompactness = (perimeter * perimeter) / area
  return fillRatio * Math.min(1, 10 / Math.max(1, rawCompactness))
}

function computeInnerDensity(binary: Uint8Array, blob: Blob, imgWidth: number): number {
  const margin = Math.max(3, Math.floor(Math.min(blob.width, blob.height) * 0.25))
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

function classifyMark(
  density: number,
  innerDensity: number,
  compactness: number,
  aspectRatio: number,
  elongation: number,
  blob: Blob
): DetectedMark['type'] | 'unknown' {
  const isCompact = compactness > 0.3
  const isSquareish = aspectRatio > 0.6 && aspectRatio < 1.7
  const isSmallish = blob.width < 50 && blob.height < 50

  if (isSquareish && isSmallish && density > 0.2 && density < 0.7 && innerDensity < 0.15 && compactness > 0.25) {
    return 'checkbox'
  }

  if (density > 0.08 && density < 0.45 && innerDensity > 0.03 && compactness > 0.2 && elongation < 3) {
    return 'checkmark'
  }

  if (density > 0.1 && density < 0.5 && innerDensity > 0.02 && isCompact && elongation < 2.5) {
    return 'xmark'
  }

  if (isSquareish && density > 0.15 && density < 0.65 && compactness > 0.3) {
    return 'circle'
  }

  return 'unknown'
}

function estimateConfidence(
  density: number,
  innerDensity: number,
  compactness: number,
  type: DetectedMark['type'],
  blob: Blob
): number {
  let base = 0.5
  const sizeBonus = Math.min(0.15, (blob.width * blob.height) / 2000)

  switch (type) {
    case 'checkbox':
      base = 0.7 + innerDensity * 0.5
      break
    case 'checkmark':
      base = 0.65 + compactness * 0.3
      break
    case 'xmark':
      base = 0.6 + compactness * 0.3
      break
    case 'circle':
      base = 0.6 + compactness * 0.25
      break
  }

  return Math.min(0.95, base + sizeBonus)
}
