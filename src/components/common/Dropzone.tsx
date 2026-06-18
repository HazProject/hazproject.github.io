import React, { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import './common.css'

interface DropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  multiple?: boolean
  children?: React.ReactNode
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  onFileSelect, 
  accept = '.pdf,.png,.jpg,.jpeg',
  multiple = false,
  children 
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (multiple) {
        files.forEach(file => {
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            onFileSelect(file)
          }
        })
      } else {
        const file = files[0]
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          onFileSelect(file)
        }
      }
    }
  }, [onFileSelect, multiple])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            onFileSelect(file)
          }
        })
      } else {
        const file = files[0]
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          onFileSelect(file)
        }
      }
    }
  }, [onFileSelect, multiple])

  return (
    <div
      className={`dropzone ${isDragOver ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload size={44} strokeWidth={1.5} />
      <div className="font-heading font-semibold text-lg text-primary">
        {children || 'Drag and Drop Files Here'}
      </div>
      <div className="text-sm text-muted">
        PDF, PNG, JPG files supported
      </div>
      <input
        id="file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />
      <button 
        type="button" 
        className="btn btn-secondary"
        onClick={(e) => {
          e.stopPropagation()
          document.getElementById('file-input')?.click()
        }}
      >
        Browse Files
      </button>
    </div>
  )
}