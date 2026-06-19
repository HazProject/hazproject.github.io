import { TextBlock, DetectedMark, TableRow, TableCell, BoundingBox } from '../../types/docmarker'

export function clusterRows(
  textBlocks: TextBlock[],
  marks: DetectedMark[],
  pageIndex: number,
  tolerance: number
): TableRow[] {
  const items: Array<{
    type: 'text' | 'mark'
    yCenter: number
    x: number
    data: TextBlock | DetectedMark
  }> = []

  for (const block of textBlocks) {
    items.push({
      type: 'text',
      yCenter: block.bbox.y + block.bbox.height / 2,
      x: block.bbox.x,
      data: block
    })
  }

  for (const mark of marks) {
    items.push({
      type: 'mark',
      yCenter: mark.bbox.y + mark.bbox.height / 2,
      x: mark.bbox.x,
      data: mark
    })
  }

  if (items.length === 0) return []

  // If no text, just cluster by Y
  if (textBlocks.length === 0) {
      // Logic to cluster marks only by Y
      items.sort((a, b) => a.yCenter - b.yCenter)
      // ... (existing clustering logic already handles this!)
  }


  items.sort((a, b) => a.yCenter - b.yCenter)

  const clusters: Array<typeof items> = []
  let currentCluster: typeof items = [items[0]]

  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    const clusterCenter = currentCluster.reduce((sum, it) => sum + it.yCenter, 0) / currentCluster.length

    if (Math.abs(item.yCenter - clusterCenter) <= tolerance) {
      currentCluster.push(item)
    } else {
      clusters.push(currentCluster)
      currentCluster = [item]
    }
  }
  clusters.push(currentCluster)

  return clusters.map((cluster, index) => {
    cluster.sort((a, b) => a.x - b.x)

    const cells: TableCell[] = []
    const rowMarks: DetectedMark[] = []
    const ys: number[] = []
    const heights: number[] = []

    for (const item of cluster) {
      if (item.type === 'text') {
        const block = item.data as TextBlock
        cells.push({
          text: block.text,
          bbox: block.bbox,
          columnIndex: cells.length
        })
      } else {
        const mark = item.data as DetectedMark
        rowMarks.push(mark)
      }
      ys.push(item.yCenter)
      heights.push(item.type === 'text' ? (item.data as TextBlock).bbox.height : (item.data as DetectedMark).bbox.height)
    }

    const avgY = ys.reduce((a, b) => a + b, 0) / ys.length
    const maxHeight = Math.max(...heights)
    const isMarked = rowMarks.some(m => m.isMarked)
    const confidence = rowMarks.length > 0
      ? rowMarks.reduce((sum, m) => sum + m.confidence, 0) / rowMarks.length
      : cells.length > 0
        ? cells.reduce((sum, c) => sum + (c.bbox ? 0.5 : 0), 0) / cells.length
        : 0

    const allBboxes = [...cells.map(c => c.bbox), ...rowMarks.map(m => m.bbox)]
    const minY = allBboxes.length > 0 ? Math.min(...allBboxes.map(b => b.y)) : avgY - maxHeight / 2
    const minX = allBboxes.length > 0 ? Math.min(...allBboxes.map(b => b.x)) : 0
    const maxRight = allBboxes.length > 0 ? Math.max(...allBboxes.map(b => b.x + b.width)) : 100
    const maxY = allBboxes.length > 0 ? Math.max(...allBboxes.map(b => b.y + b.height)) : avgY + maxHeight / 2

    return {
      id: `row-${pageIndex}-${index}`,
      pageIndex,
      yPosition: minY,
      height: maxY - minY || maxHeight,
      cells,
      marks: rowMarks,
      isMarked,
      confidence,
      originalIndex: index
    }
  })
}
