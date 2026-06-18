import ExcelJS from 'exceljs'
import { DocumentData, TableRow } from '../../types/docmarker'

export async function exportToExcel(documentData: DocumentData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Haz Document Mark Detector'
  workbook.created = new Date()

  const allRows: TableRow[] = []
  for (const page of documentData.pages) {
    allRows.push(...page.rows)
  }

  const markedRows = allRows.filter(r => r.isMarked)
  const unmarkedRows = allRows.filter(r => !r.isMarked)
  const sortedRows = [...markedRows, ...unmarkedRows]

  const maxCols = Math.max(...sortedRows.map(r => r.cells.length), 1)

  const sheet = workbook.addWorksheet('Document Data', {
    views: [{ state: 'frozen', ySplit: 1 }]
  })

  const headerRow = sheet.addRow([
    '#',
    'Page',
    'Marked',
    'Confidence',
    ...Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`)
  ])

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D1B4E' }
    }
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFC084FC' } }
    }
  })

  headerRow.height = 28

  for (let i = 0; i < sortedRows.length; i++) {
    const row = sortedRows[i]
    const rowData = [
      i + 1,
      row.pageIndex + 1,
      row.isMarked ? 'YES' : 'NO',
      `${(row.confidence * 100).toFixed(1)}%`,
      ...row.cells.map(c => c.text)
    ]

    const excelRow = sheet.addRow(rowData)

    if (row.isMarked) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3CD' }
        }
        cell.font = { bold: true }
      })
    }
  }

  for (let col = 1; col <= maxCols + 4; col++) {
    const maxLen = sortedRows.reduce((max, row) => {
      const cellText = row.cells[col - 5]?.text || ''
      const headerText = ['', '', '', '', ...Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`)][col - 1]
      return Math.max(max, cellText.length, headerText?.length || 0)
    }, 10)

    sheet.getColumn(col).width = Math.min(maxLen + 4, 40)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
