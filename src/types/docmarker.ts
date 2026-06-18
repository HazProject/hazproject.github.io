export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedMark {
  id: string
  bbox: BoundingBox
  confidence: number
  type: 'checkbox' | 'checkmark' | 'xmark' | 'circle' | 'unknown'
  pageIndex: number
  isMarked: boolean
  correctedByUser?: boolean
}

export interface TextBlock {
  id: string
  text: string
  bbox: BoundingBox
  pageIndex: number
  confidence: number
  lineNumber?: number
}

export interface TableRow {
  id: string
  pageIndex: number
  yPosition: number
  height: number
  cells: TableCell[]
  marks: DetectedMark[]
  isMarked: boolean
  confidence: number
  originalIndex: number
}

export interface TableCell {
  text: string
  bbox: BoundingBox
  columnIndex: number
}

export interface ProcessedPage {
  pageIndex: number
  width: number
  height: number
  imageData: string
  marks: DetectedMark[]
  textBlocks: TextBlock[]
  rows: TableRow[]
}

export interface DocumentData {
  id: string
  name: string
  type: 'pdf' | 'image'
  pages: ProcessedPage[]
  createdAt: Date
  status: 'pending' | 'processing' | 'review' | 'completed' | 'error'
}

export interface ExportRow {
  rowIndex: number
  pageIndex: number
  isMarked: boolean
  confidence: number
  cells: string[]
  originalY: number
}

export interface DetectionSettings {
  confidenceThreshold: number
  iouThreshold: number
  minMarkSize: number
  maxMarkSize: number
  rowClusterTolerance: number
  enableOCR: boolean
  ocrLanguage: string
}

export const DEFAULT_DETECTION_SETTINGS: DetectionSettings = {
  confidenceThreshold: 0.5,
  iouThreshold: 0.4,
  minMarkSize: 8,
  maxMarkSize: 60,
  rowClusterTolerance: 15,
  enableOCR: true,
  ocrLanguage: 'eng'
}