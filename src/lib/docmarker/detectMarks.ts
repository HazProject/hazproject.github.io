import { DetectedMark, BoundingBox, DetectionSettings } from '../../types/docmarker'

export async function detectMarks(
  imageData: ImageData,
  pageIndex: number,
  settings: DetectionSettings,
  rotation: number = 0
): Promise<DetectedMark[]> {
  const { width, height, data } = imageData
  let processedData = data
  let processedWidth = width
  let processedHeight = height

  if (rotation !== 0) {
    const rotated = rotateImageData(data, width, height, rotation)
    processedData = rotated.data
    processedWidth = rotated.width
    processedHeight = rotated.height
  }

  const gray = toGrayscale(processedData)

  const binary = adaptiveThreshold(gray, processedWidth, processedHeight)
  const labels = connectedComponents(binary, processedWidth, processedHeight)

  const blobs = extractBlobs(labels, processedWidth, processedHeight)
  const marks: DetectedMark[] = []

  for (const blob of blobs) {
    if (blob.pixelCount < 6) continue
    if (blob.width < 3 || blob.height < 3) continue
    if (blob.width > settings.maxMarkSize * 5 || blob.height > settings.maxMarkSize * 5) continue

    const aspectRatio = blob.width / blob.height
    if (aspectRatio < 0.15 || aspectRatio > 6.0) continue

    const elongation = Math.max(blob.width, blob.height) / Math.max(1, Math.min(blob.width, blob.height))
    if (elongation > 8) continue

    const density = computeBlobDensity(binary, blob, processedWidth)
    if (density < 0.03) continue

    const compactness = computeCompactness(blob, binary, processedWidth)
    const innerDensity = computeInnerDensity(binary, blob, processedWidth)

    const type = classifyMark(density, innerDensity, compactness, aspectRatio, elongation, blob)
    if (type === 'unknown') continue

    const confidence = estimateConfidence(density, innerDensity, compactness, type, blob)

    if (confidence < settings.confidenceThreshold) continue

    let bboxX = blob.x
    let bboxY = blob.y
    if (rotation !== 0) {
      const orig = unrotatePoint(bboxX, bboxY, processedWidth, processedHeight, -rotation)
      const orig2 = unrotatePoint(bboxX + blob.width, bboxY + blob.height, processedWidth, processedHeight, -rotation)
      bboxX = Math.min(orig.x, orig2.x)
      bboxY = Math.min(orig.y, orig2.y)
    }

    marks.push({
      id: `mark-${pageIndex}-${marks.length}`,
      bbox: { x: bboxX, y: bboxY, width: blob.width, height: blob.height },
      confidence,
      type,
      pageIndex,
      isMarked: confidence > 0.55
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

function adaptiveThreshold(gray: Uint8Array, width: number, height: number): Uint8Array {
  const binary = new Uint8Array(gray.length)
  const blockSize = 31
  const C = 10

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      const half = Math.floor(blockSize / 2)
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += gray[ny * width + nx]
            count++
          }
        }
      }
      const mean = sum / count
      binary[y * width + x] = gray[y * width + x] < mean - C ? 1 : 0
    }
  }
  return binary
}

function rotateImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  degrees: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  const newW = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin))
  const newH = Math.ceil(Math.abs(width * sin) + Math.abs(height * cos))
  const out = new Uint8ClampedArray(newW * newH * 4)

  const cx = width / 2
  const cy = height / 2
  const ncx = newW / 2
  const ncy = newH / 2

  for (let ny = 0; ny < newH; ny++) {
    for (let nx = 0; nx < newW; nx++) {
      const dx = nx - ncx
      const dy = ny - ncy
      const srcX = Math.round(cx + dx * cos + dy * sin)
      const srcY = Math.round(cy + -dx * sin + dy * cos)
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const si = (srcY * width + srcX) * 4
        const di = (ny * newW + nx) * 4
        out[di] = data[si]
        out[di + 1] = data[si + 1]
        out[di + 2] = data[si + 2]
        out[di + 3] = data[si + 3]
      }
    }
  }
  return { data: out, width: newW, height: newH }
}

function unrotatePoint(x: number, y: number, w: number, h: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = w / 2
  const cy = h / 2
  const dx = x - cx
  const dy = y - cy
  return {
    x: Math.round(cx + dx * cos + dy * sin),
    y: Math.round(cy + -dx * sin + dy * cos)
  }
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
  const isCompact = compactness > 0.15
  const isSquareish = aspectRatio > 0.4 && aspectRatio < 2.5
  const isSmallish = blob.width < 80 && blob.height < 80

  if (isSquareish && isSmallish && density > 0.1 && density < 0.8 && innerDensity < 0.25 && compactness > 0.15) {
    return 'checkbox'
  }

  if (density > 0.03 && density < 0.6 && innerDensity > 0.01 && compactness > 0.1 && elongation < 4) {
    return 'checkmark'
  }

  if (density > 0.05 && density < 0.6 && innerDensity > 0.01 && isCompact && elongation < 3) {
    return 'xmark'
  }

  if (isSquareish && density > 0.1 && density < 0.75 && compactness > 0.2) {
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
