import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GlassCard, Button, Dropzone, LogPanel, PreviewTable } from '../components/common'
import { Upload, FileText, Download, CheckSquare, AlertCircle, Eye } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import { DocumentData, DetectionSettings, DEFAULT_DETECTION_SETTINGS, ProcessedPage, DetectedMark } from '../types/docmarker'
import { loadPdfFile, loadImageFile, loadImage } from '../lib/docmarker/processFile'
import { detectMarks } from '../lib/docmarker/detectMarks'
import { ocrPage } from '../lib/docmarker/ocr'
import { clusterRows } from '../lib/docmarker/clusterRows'
import { exportToExcel, downloadBlob } from '../lib/docmarker/exportExcel'
import './docMarker.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

export const DocMarker: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [logEntries, setLogEntries] = useState<Array<{ message: string; type: 'info' | 'warn' | 'error' | 'success'; timestamp: Date }>>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'settings'>('upload')
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(DEFAULT_DETECTION_SETTINGS)
  const [selectedPage, setSelectedPage] = useState<number>(0)
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' })
  const [showOverlay, setShowOverlay] = useState(true)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const overlayCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  const addLog = useCallback((message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogEntries(prev => [...prev, { message, type, timestamp: new Date() }])
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      setSelectedFile(file)
      setDocumentData(null)
      addLog(`Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info')
    } else {
      addLog('Please select a valid PDF or image file', 'error')
    }
  }, [addLog])

  const processDocument = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setLogEntries([])
    addLog('Starting document processing...', 'info')

    try {
      setProgress({ current: 0, total: 3, phase: 'Loading document...' })
      addLog('Loading document pages...', 'info')

      let pages: ProcessedPage[]
      if (selectedFile.type === 'application/pdf') {
        pages = await loadPdfFile(selectedFile)
      } else {
        pages = await loadImageFile(selectedFile)
      }

      addLog(`Loaded ${pages.length} page(s)`, 'success')
      setProgress({ current: 1, total: 3, phase: 'Detecting marks...' })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        addLog(`Processing page ${i + 1}/${pages.length} - Detecting marks...`, 'info')

        const img = await loadImage(page.imageData)
        const offscreen = document.createElement('canvas')
        offscreen.width = img.width
        offscreen.height = img.height
        const ctx = offscreen.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)

        const marks = await detectMarks(imageData, i, detectionSettings)
        page.marks = marks
        addLog(`  Found ${marks.length} mark(s) on page ${i + 1}`, marks.length > 0 ? 'success' : 'info')
      }

      setProgress({ current: 2, total: 3, phase: 'Running OCR...' })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        addLog(`Processing page ${i + 1}/${pages.length} - OCR text extraction...`, 'info')

        const textBlocks = await ocrPage(page.imageData, i, () => {})
        page.textBlocks = textBlocks
        addLog(`  Extracted ${textBlocks.length} text block(s)`, 'success')
      }

      setProgress({ current: 2.5, total: 3, phase: 'Clustering rows...' })

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        const rows = clusterRows(page.textBlocks, page.marks, i, detectionSettings.rowClusterTolerance)
        page.rows = rows
        addLog(`  Page ${i + 1}: ${rows.length} row(s) (${rows.filter(r => r.isMarked).length} marked)`, 'info')
      }

      setProgress({ current: 3, total: 3, phase: 'Complete!' })

      const docData: DocumentData = {
        id: Math.random().toString(36).substr(2, 9),
        name: selectedFile.name,
        type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image',
        pages,
        createdAt: new Date(),
        status: 'completed'
      }

      setDocumentData(docData)

      const totalMarks = pages.reduce((sum, p) => sum + p.marks.length, 0)
      const totalRows = pages.reduce((sum, p) => sum + p.rows.length, 0)
      const markedRows = pages.reduce((sum, p) => sum + p.rows.filter(r => r.isMarked).length, 0)

      addLog(`Processing complete! ${totalMarks} marks, ${totalRows} rows (${markedRows} marked)`, 'success')
      setActiveTab('preview')

    } catch (error) {
      addLog(`Error: ${(error as Error).message}`, 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile, detectionSettings, addLog])

  const renderPDFPage = useCallback(async (page: ProcessedPage, canvas: HTMLCanvasElement) => {
    const img = await loadImage(page.imageData)
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
  }, [])

  const renderOverlay = useCallback((page: ProcessedPage, canvas: HTMLCanvasElement) => {
    canvas.width = page.width
    canvas.height = page.height
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const mark of page.marks) {
      const { x, y, width, height } = mark.bbox

      ctx.strokeStyle = mark.isMarked ? '#c084fc' : '#ff6b6b'
      ctx.lineWidth = 3
      ctx.setLineDash([])
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = mark.isMarked ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 107, 107, 0.15)'
      ctx.fillRect(x, y, width, height)

      ctx.fillStyle = mark.isMarked ? '#c084fc' : '#ff6b6b'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.fillText(`${mark.type} ${(mark.confidence * 100).toFixed(0)}%`, x + 4, y - 6)
    }

    for (const row of page.rows) {
      if (row.isMarked) {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        const rowTop = row.yPosition - 4
        ctx.strokeRect(0, rowTop, page.width, row.height + 8)
        ctx.setLineDash([])
      }
    }
  }, [])

  const handleCanvasClick = useCallback((page: ProcessedPage, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showOverlay) return

    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = page.width / rect.width
    const scaleY = page.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    for (const mark of page.marks) {
      const { x, y, width, height } = mark.bbox
      if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        mark.isMarked = !mark.isMarked
        mark.correctedByUser = true

        for (const row of page.rows) {
          if (row.marks.some(m => m.id === mark.id)) {
            row.isMarked = row.marks.some(m => m.isMarked)
          }
        }

        setDocumentData(prev => prev ? { ...prev, pages: [...prev.pages] } : null)
        addLog(`Mark toggled: ${mark.type} → ${mark.isMarked ? 'MARKED' : 'unmarked'}`, 'info')
        return
      }
    }
  }, [showOverlay, addLog])

  useEffect(() => {
    if (!documentData?.pages?.length) return
    const page = documentData.pages[selectedPage]
    if (!page) return

    const canvas = canvasRefs.current[selectedPage]
    if (canvas) renderPDFPage(page, canvas)

    const overlayCanvas = overlayCanvasRefs.current[selectedPage]
    if (overlayCanvas && showOverlay) renderOverlay(page, overlayCanvas)
  }, [documentData, selectedPage, renderPDFPage, renderOverlay, showOverlay])

  const handleExport = useCallback(async () => {
    if (!documentData) return
    addLog('Generating Excel file...', 'info')
    try {
      const blob = await exportToExcel(documentData)
      const name = documentData.name.replace(/\.[^.]+$/, '') + '_marked.xlsx'
      downloadBlob(blob, name)
      addLog(`Exported: ${name}`, 'success')
    } catch (error) {
      addLog(`Export error: ${(error as Error).message}`, 'error')
    }
  }, [documentData, addLog])

  return (
    <div className="docmarker-page">
      <div className="mesh-gradient" />
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />

      <div className="docmarker-container">
        <header className="docmarker-header">
          <div className="haz-brand">
            <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="lg" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="2.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc"/>
                  <stop offset="100%" stopColor="#a8d8ea"/>
                </linearGradient>
              </defs>
              <polygon points="22,2 40,22 22,42 4,22" fill="url(#dg)" filter="url(#lg)" opacity="0.95"/>
              <polygon points="22,10 34,22 22,34 10,22" fill="#0d0b15"/>
              <line x1="22" y1="16" x2="22" y2="28" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
              <line x1="16" y1="22" x2="28" y2="22" stroke="#a8d8ea" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
              <circle cx="22" cy="22" r="2.2" fill="#ffffff" opacity="0.9" filter="url(#lg)"/>
            </svg>
            <span className="haz-brand-title">haz.</span>
          </div>
          <a href="/" className="back-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>All Projects</span>
          </a>
        </header>

        <div className="docmarker-content">
          <GlassCard className="docmarker-card">
            <div className="docmarker-title-area">
              <h2>
                <CheckSquare size={24} style={{ color: 'var(--accent-primary)' }} />
                Document Mark Detector
              </h2>
              <p>Upload documents to detect marks and convert to Excel with automatic sorting.</p>
            </div>

            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={16} /> Upload
              </button>
              <button
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
                disabled={!documentData}
              >
                <FileText size={16} /> Preview
              </button>
              <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <AlertCircle size={16} /> Settings
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'upload' && (
                <div className="upload-tab">
                  <Dropzone onFileSelect={handleFileSelect} accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp" />
                  {selectedFile && (
                    <div className="file-info">
                      <FileText size={20} />
                      <div>
                        <strong>{selectedFile.name}</strong><br/>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  )}
                  {isProcessing && progress.total > 0 && (
                    <div className="progress-bar">
                      <div className="progress-text">{progress.phase}</div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="action-buttons">
                    <Button
                      variant="primary"
                      onClick={processDocument}
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process Document'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'preview' && documentData && (
                <div className="preview-tab">
                  {documentData.pages.length > 1 && (
                    <div className="page-tabs">
                      {documentData.pages.map((_, index) => (
                        <button
                          key={index}
                          className={`page-tab ${selectedPage === index ? 'active' : ''}`}
                          onClick={() => setSelectedPage(index)}
                        >
                          Page {index + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="document-viewer">
                    <div className="pdf-preview">
                      <div className="canvas-wrapper">
                        <canvas ref={el => canvasRefs.current[selectedPage] = el} />
                        {showOverlay && (
                          <canvas
                            ref={el => overlayCanvasRefs.current[selectedPage] = el}
                            className="overlay-canvas"
                            onClick={(e) => documentData.pages[selectedPage] && handleCanvasClick(documentData.pages[selectedPage], e)}
                          />
                        )}
                      </div>
                      <div className="preview-controls">
                        <button
                          className={`overlay-toggle ${showOverlay ? 'active' : ''}`}
                          onClick={() => setShowOverlay(!showOverlay)}
                        >
                          <Eye size={16} /> {showOverlay ? 'Hide' : 'Show'} Marks
                        </button>
                      </div>
                    </div>
                    <div className="document-info">
                      <h3>{documentData.name}</h3>
                      <p>{documentData.pages.length} page(s)</p>
                      <div className="stats-grid">
                        <div className="stat">
                          <span className="stat-value">{documentData.pages.reduce((s, p) => s + p.marks.length, 0)}</span>
                          <span className="stat-label">Marks</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{documentData.pages.reduce((s, p) => s + p.rows.length, 0)}</span>
                          <span className="stat-label">Rows</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value marked">{documentData.pages.reduce((s, p) => s + p.rows.filter(r => r.isMarked).length, 0)}</span>
                          <span className="stat-label">Marked</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="processing-results">
                    <h3>Row Data (marked rows shown first)</h3>
                    <PreviewTable
                      headers={['#', 'Page', 'Marked', 'Confidence', 'Content']}
                      rows={
                        (() => {
                          const allRows = documentData.pages.flatMap(p => p.rows)
                          const marked = allRows.filter(r => r.isMarked)
                          const unmarked = allRows.filter(r => !r.isMarked)
                          const sorted = [...marked, ...unmarked]
                          return sorted.map((row, i) => [
                            String(i + 1),
                            String(row.pageIndex + 1),
                            row.isMarked ? 'YES' : 'NO',
                            `${(row.confidence * 100).toFixed(0)}%`,
                            row.cells.map(c => c.text).join(' | ')
                          ])
                        })()
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="settings-tab">
                  <h3>Detection Settings</h3>
                  <div className="settings-grid">
                    <div className="form-group">
                      <label>Confidence Threshold</label>
                      <input
                        type="number"
                        value={detectionSettings.confidenceThreshold}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          confidenceThreshold: parseFloat(e.target.value) || 0.5
                        }))}
                        min="0" max="1" step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label>IoU Threshold</label>
                      <input
                        type="number"
                        value={detectionSettings.iouThreshold}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          iouThreshold: parseFloat(e.target.value) || 0.4
                        }))}
                        min="0" max="1" step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Min Mark Size (px)</label>
                      <input
                        type="number"
                        value={detectionSettings.minMarkSize}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          minMarkSize: parseInt(e.target.value) || 8
                        }))}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Mark Size (px)</label>
                      <input
                        type="number"
                        value={detectionSettings.maxMarkSize}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          maxMarkSize: parseInt(e.target.value) || 60
                        }))}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Row Cluster Tolerance (px)</label>
                      <input
                        type="number"
                        value={detectionSettings.rowClusterTolerance}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          rowClusterTolerance: parseInt(e.target.value) || 15
                        }))}
                        min="1"
                      />
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => addLog('Settings saved', 'success')}>Save Settings</Button>
                </div>
              )}
            </div>

            <LogPanel entries={logEntries} className="mt-4" />

            <div className="export-section">
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={!documentData}
              >
                <Download size={18} /> Export to Excel
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
