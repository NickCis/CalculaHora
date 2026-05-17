import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { TimeEntry, Project } from '@/lib/sheets/schema'
import { isRunningEntry } from '@/lib/sheets/schema'
import { parseProjectColor } from '@/lib/project-color'
import {
  entryAmount,
  entryDurationHours,
  entryDurationMs,
  formatDurationHms,
  formatInWorkspaceTz,
} from '@/lib/time'

export function exportCsv(
  entries: TimeEntry[],
  projects: Project[],
  tz: string,
  t: (k: string) => string,
): void {
  const pmap = new Map(projects.map((p) => [p.id, p.name]))
  const header = ['title', 'project', 'start', 'end', 'hours', 'billable', 'rate', 'amount']
  const rows = entries.map((e) => {
    const hours = entryDurationHours(e)
    const running = isRunningEntry(e)
    return [
      e.title,
      pmap.get(e.projectId) ?? e.projectId,
      formatInWorkspaceTz(e.startTime, tz),
      running ? t('reports.running') : formatInWorkspaceTz(e.endTime!, tz),
      hours.toFixed(2),
      e.billable ? 'yes' : 'no',
      String(e.rate),
      entryAmount(e).toFixed(2),
    ]
  })
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n')
  downloadBlob(csv, 'report.csv', 'text/csv')
}

function escapeCsv(v: string): string {
  if (v.includes(',') || v.includes('"')) return `"${v.replace(/"/g, '""')}"`
  return v
}

function hexToRgb(hex: string): [number, number, number] | null {
  const c = parseProjectColor(hex)
  if (!c) return null
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function formatTimeHms(iso: string, tz: string): string {
  return formatInWorkspaceTz(iso, tz, 'HH:mm:ss')
}

const PDF_DESC_FONT_SIZE = 9
const PDF_DESC_LINE_HEIGHT = 4.5
const PDF_DESC_CELL_PAD = 3
const PDF_DESC_TOP_INSET = 4

function countWrappedLines(doc: jsPDF, text: string, maxWidth: number): number {
  if (!text) return 1
  return (doc.splitTextToSize(text, maxWidth) as string[]).length
}

function estimateDescriptionCellHeight(
  doc: jsPDF,
  entry: TimeEntry,
  columnWidth: number,
  showProjectInRows: boolean,
  projectMap: Map<string, Project>,
): number {
  const maxW = Math.max(columnWidth - PDF_DESC_CELL_PAD * 2, 24)
  doc.setFontSize(PDF_DESC_FONT_SIZE)

  let lines = countWrappedLines(doc, entry.title?.trim() || '—', maxW)

  if (showProjectInRows && entry.projectId) {
    const project = projectMap.get(entry.projectId)
    if (project?.name) {
      lines += 1
      lines += countWrappedLines(doc, project.name, maxW)
    }
  }

  return PDF_DESC_CELL_PAD * 2 + PDF_DESC_TOP_INSET + lines * PDF_DESC_LINE_HEIGHT + 2
}

function formatReportFilterDate(iso: string, tz: string): string {
  return formatInWorkspaceTz(iso, tz, 'dd/MM/yyyy')
}

const PDF_DURATION_TIME_COLOR: [number, number, number] = [130, 130, 130]
const PDF_DURATION_LINE_HEIGHT = 4.5
const PDF_DURATION_CELL_HEIGHT =
  PDF_DESC_CELL_PAD * 2 + PDF_DESC_TOP_INSET + PDF_DURATION_LINE_HEIGHT * 2 + 2

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function buildReportFilename(opts: {
  tz: string
  fromIso?: string
  toIso?: string
  projectFilterName?: string
}): string {
  const parts: string[] = []

  if (opts.projectFilterName) {
    const name = sanitizeFilenamePart(opts.projectFilterName)
    if (name) parts.push(name)
  }

  if (opts.fromIso || opts.toIso) {
    const from = formatInWorkspaceTz(
      (opts.fromIso ?? opts.toIso)!,
      opts.tz,
      'yyyyMMdd',
    )
    const to = formatInWorkspaceTz(
      (opts.toIso ?? opts.fromIso)!,
      opts.tz,
      'yyyyMMdd',
    )
    parts.push(from === to ? from : `${from}-${to}`)
  }

  return `${parts.length > 0 ? parts.join('-') : 'report'}.pdf`
}

export interface ExportPdfOptions {
  tz: string
  t: (k: string) => string
  fromIso?: string
  toIso?: string
  projectFilterName?: string
  showAmount: boolean
  now?: Date
}

export function exportPdf(
  entries: TimeEntry[],
  projects: Project[],
  opts: ExportPdfOptions,
): void {
  const { tz, t, fromIso, toIso, projectFilterName, showAmount, now = new Date() } =
    opts
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const sorted = [...entries].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )

  const projectIds = new Set(
    sorted.map((e) => e.projectId).filter((id) => id && projectMap.has(id)),
  )
  const showProjectInRows = projectIds.size > 1

  const totalMs = sorted.reduce((sum, e) => sum + entryDurationMs(e, now), 0)

  const doc = new jsPDF()
  const margin = 14
  let y = margin

  doc.setFontSize(10)
  if (fromIso) {
    doc.setTextColor(80, 80, 80)
    doc.text(`${t('reports.from')}: ${formatReportFilterDate(fromIso, tz)}`, margin, y)
    y += 5
  }
  if (toIso) {
    doc.setTextColor(80, 80, 80)
    doc.text(`${t('reports.to')}: ${formatReportFilterDate(toIso, tz)}`, margin, y)
    y += 5
  }
  if (fromIso || toIso) y += 1

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `${t('reports.totalDuration')}: ${formatDurationHms(totalMs)}`,
    margin,
    y,
  )
  doc.setFont('helvetica', 'normal')
  y += 8

  const pageWidth = doc.internal.pageSize.getWidth()
  const tableWidth = pageWidth - margin * 2
  const dateColWidth = 26
  const durationColWidth = 40
  const amountColWidth = showAmount ? 30 : 0
  const descColWidth = tableWidth - dateColWidth - durationColWidth - amountColWidth
  const descColIndex = 1
  const durationColIndex = 2

  const head = [
    t('reports.pdf.date'),
    t('reports.pdf.description'),
    t('reports.pdf.duration'),
    ...(showAmount ? [t('reports.amount')] : []),
  ]

  const body = sorted.map((e) => {
    const row: string[] = [
      formatInWorkspaceTz(e.startTime, tz, 'yyyy-MM-dd'),
      '',
      '',
    ]
    if (showAmount) {
      const amt = entryAmount(e, now)
      row.push(e.billable ? `${amt.toFixed(2)} ${e.currency}` : '—')
    }
    return row
  })

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    tableWidth,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: PDF_DESC_CELL_PAD, valign: 'top' },
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    columnStyles: {
      0: { cellWidth: dateColWidth },
      1: { cellWidth: descColWidth },
      2: { cellWidth: durationColWidth },
      ...(showAmount ? { 3: { cellWidth: amountColWidth, halign: 'right' } } : {}),
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      const entry = sorted[data.row.index]
      if (!entry) return

      if (data.column.index === descColIndex) {
        data.cell.text = ['']
        data.cell.styles.minCellHeight = estimateDescriptionCellHeight(
          doc,
          entry,
          descColWidth,
          showProjectInRows,
          projectMap,
        )
      }

      if (data.column.index === durationColIndex) {
        data.cell.text = ['']
        data.cell.styles.minCellHeight = PDF_DURATION_CELL_HEIGHT
      }
    },
    didDrawCell(data) {
      if (data.section !== 'body') return
      const entry = sorted[data.row.index]
      if (!entry) return

      if (data.column.index === durationColIndex) {
        const { doc: pdf, cell } = data
        const x = cell.x + PDF_DESC_CELL_PAD
        const running = isRunningEntry(entry)
        const durationMs = entryDurationMs(entry, now)
        const endIso = running ? now.toISOString() : entry.endTime!
        const timeRange = running
          ? `${formatTimeHms(entry.startTime, tz)} - ${t('reports.running')}`
          : `${formatTimeHms(entry.startTime, tz)} - ${formatTimeHms(endIso, tz)}`

        let lineY = cell.y + PDF_DESC_CELL_PAD + PDF_DESC_TOP_INSET
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text(formatDurationHms(durationMs), x, lineY)
        lineY += PDF_DURATION_LINE_HEIGHT
        pdf.setTextColor(...PDF_DURATION_TIME_COLOR)
        pdf.text(timeRange, x, lineY)
        pdf.setTextColor(0, 0, 0)
        return
      }

      if (data.column.index !== descColIndex) return

      const { doc: pdf, cell } = data
      const x = cell.x + PDF_DESC_CELL_PAD
      const maxW = cell.width - PDF_DESC_CELL_PAD * 2
      let lineY = cell.y + PDF_DESC_CELL_PAD + PDF_DESC_TOP_INSET

      pdf.setFontSize(PDF_DESC_FONT_SIZE)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      const title = entry.title?.trim() || '—'
      const titleLines = pdf.splitTextToSize(title, maxW) as string[]
      for (const line of titleLines) {
        pdf.text(line, x, lineY)
        lineY += PDF_DESC_LINE_HEIGHT
      }

      if (showProjectInRows && entry.projectId) {
        const project = projectMap.get(entry.projectId)
        if (project?.name) {
          lineY += PDF_DESC_LINE_HEIGHT
          const rgb = hexToRgb(project.color)
          if (rgb) pdf.setTextColor(...rgb)
          else pdf.setTextColor(90, 90, 90)
          const projectLines = pdf.splitTextToSize(project.name, maxW) as string[]
          for (const line of projectLines) {
            pdf.text(line, x, lineY)
            lineY += PDF_DESC_LINE_HEIGHT
          }
          pdf.setTextColor(0, 0, 0)
        }
      }
    },
  })

  doc.save(
    buildReportFilename({
      tz,
      fromIso,
      toIso,
      projectFilterName,
    }),
  )
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
