import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GlassCard, Button, Dropzone, LogPanel, PreviewTable } from '../components/common'
import { Upload, FileText, Download, CheckSquare, AlertCircle } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import 'pdfjs-dist/build/pdf.worker.mjs'
import { DocumentData, DetectionSettings, DEFAULT_DETECTION_SETTINGS, ProcessedPage } from '../types/docmarker'
import './docMarker.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

export const DocMarker: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [logEntries, setLogEntries] = useState<Array<{ message: string; type: 'info' | 'warn' | 'error' | 'success'; timestamp: Date }>>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'settings'>('upload')
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(DEFAULT_DETECTION_SETTINGS)
  const [selectedPage, setSelectedPage] = useState<number>(0)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  const { addToast } = useToast()

  const addLog = useCallback((message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const entry = { message, type, timestamp: new Date() }
    setLogEntries(prev => [...prev, entry])
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      setSelectedFile(file)
      addLog(`Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info')
      setActiveTab('preview')
    } else {
      addLog('Please select a valid PDF or image file', 'error')
    }
  }, [addLog])

  const processDocument = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    addLog('Starting document processing...', 'info')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // TODO: Replace with actual API call
      // For now, simulate processing
      setTimeout(() => {
        const mockDocument: DocumentData = {
          id: Math.random().toString(36).substr(2, 9),
          name: selectedFile.name,
          type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image',
          pages: [],
          createdAt: new Date(),
          status: 'completed'
        }
        setDocumentData(mockDocument)
        addLog('Document processed successfully!', 'success')
        setIsProcessing(false)
        setActiveTab('preview')
      }, 2000)

    } catch (error) {
      addLog(`Error processing document: ${(error as Error).message}`, 'error')
      setIsProcessing(false)
    }
  }, [selectedFile, addLog])

  const renderPDFPage = useCallback(async (pageIndex: number) => {
    if (!documentData || !canvasRefs.current[pageIndex]) return

    try {
      const page = await documentData.pages[pageIndex].pdfPage
      const canvas = canvasRefs.current[pageIndex]
      const context = canvas.getContext('2d')

      const viewport = page.getViewport({ scale: 1.5 })
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext)
    } catch (error) {
      addLog(`Error rendering page ${pageIndex + 1}: ${(error as Error).message}`, 'error')
    }
  }, [documentData, addLog])

  useEffect(() => {
    if (documentData?.pages && documentData.pages.length > 0) {
      renderPDFPage(selectedPage)
    }
  }, [documentData, selectedPage, renderPDFPage])

  const handleExport = useCallback(() => {
    addLog('Exporting to Excel...', 'info')
    // TODO: Implement Excel export
    // addToast('Export completed', 'success')
  }, [addLog])

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
                  <Dropzone onFileSelect={handleFileSelect} />
                  {selectedFile && (
                    <div className="file-info">
                      <FileText size={20} />
                      <div>
                        <strong>{selectedFile.name}</strong><br/>
                        {(selectedFile.size / 1024).toFixed(1)} KB
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
                  <div className="document-viewer">
                    <div className="pdf-pages">
                      {documentData.pages.map((_, index) => (
                        <div 
                          key={index}
                          className={`pdf-page ${selectedPage === index ? 'active' : ''}`}
                          onClick={() => setSelectedPage(index)}
                        >
                          <canvas ref={el => canvasRefs.current[index] = el} />
                          <div className="page-number">Page {index + 1}</div>
                        </div>
                      ))}
                    </div>
                    <div className="document-info">
                      <h3>{documentData.name}</h3>
                      <p>{documentData.pages.length} pages</p>
                      <p>Status: {documentData.status}</p>
                    </div>
                  </div>
                  <div className="processing-results">
                    <h3>Detection Results</h3>
                    <PreviewTable 
                      headers={['Row', 'Content', 'Marked', 'Confidence']}
                      rows={[]}
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
                          confidenceThreshold: parseFloat(e.target.value)
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
                          iouThreshold: parseFloat(e.target.value)
                        }))}
                        min="0" max="1" step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Min Mark Size</label>
                      <input 
                        type="number" 
                        value={detectionSettings.minMarkSize}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          minMarkSize: parseInt(e.target.value)
                        }))}
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Mark Size</label>
                      <input 
                        type="number" 
                        value={detectionSettings.maxMarkSize}
                        onChange={(e) => setDetectionSettings(prev => ({
                          ...prev,
                          maxMarkSize: parseInt(e.target.value)
                        }))}
                        min="1"
                      />
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
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