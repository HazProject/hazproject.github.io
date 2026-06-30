import React from 'react'
import './common.css'

interface PreviewTableProps {
  headers: string[]
  rows: any[]
  className?: string
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ 
  headers, 
  rows, 
  className = '' 
}) => {
  return (
    <div className={`preview-table-container ${className}`}>
      <table className="preview-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row) ? row : (row.cells || [])
            const isMarked = Array.isArray(row) ? false : row.isMarked
            return (
              <tr key={rowIndex} className={isMarked ? 'separated-row' : ''}>              
                {cells.map((cell: any, cellIndex: number) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
                {isMarked && (
                  <td>
                    <span className="badge-separated">Marked</span>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}