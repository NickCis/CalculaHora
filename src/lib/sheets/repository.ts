import { parseProjectColor } from '@/lib/project-color'
import { googleJson } from '@/lib/google/api'
import {
  SHEET_NAMES,
  boolToSheet,
  isRunningEntry,
  parseBool,
  projectSchema,
  timeEntrySchema,
  workspaceMetaSchema,
  type Project,
  type TimeEntry,
  type WorkspaceMeta,
} from './schema'

interface ValuesResponse {
  values?: string[][]
}

async function getSheetValues(spreadsheetId: string, sheet: string): Promise<string[][]> {
  const range = encodeURIComponent(`'${sheet}'!A:Z`)
  const res = await googleJson<ValuesResponse>(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
  )
  return res.values ?? []
}

async function clearSheetFromRow(
  spreadsheetId: string,
  sheet: string,
  startRow: number,
): Promise<void> {
  if (startRow < 1) return
  const range = encodeURIComponent(`'${sheet}'!A${startRow}:Z`)
  await googleJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
    { method: 'POST' },
  )
}

async function writeSheetValues(
  spreadsheetId: string,
  sheet: string,
  rows: string[][],
): Promise<void> {
  const range = encodeURIComponent(`'${sheet}'!A1`)
  await googleJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    },
  )
  // PUT only overwrites cells in `rows`; clear leftover rows from prior writes.
  await clearSheetFromRow(spreadsheetId, sheet, rows.length + 1)
}

function rowsToMap(rows: string[][]): Record<string, string> {
  const map: Record<string, string> = {}
  for (let i = 1; i < rows.length; i++) {
    const [key, value] = rows[i] ?? []
    if (key) map[key] = value ?? ''
  }
  return map
}

function mapToRows(map: Record<string, string>): string[][] {
  const keys = ['version', 'name', 'timezone', 'timeFormat']
  const extra = Object.keys(map).filter((k) => !keys.includes(k))
  const allKeys = [...keys, ...extra.filter((k) => !keys.includes(k))]
  return [
    ['key', 'value'],
    ...allKeys.filter((k) => map[k] !== undefined).map((k) => [k, map[k]!]),
  ]
}

export class SpreadsheetWorkspaceRepository {
  private readonly spreadsheetId: string

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId
  }

  async getMeta(): Promise<WorkspaceMeta> {
    const rows = await getSheetValues(this.spreadsheetId, SHEET_NAMES.workspace)
    const map = rowsToMap(rows)
    return workspaceMetaSchema.parse({
      version: map.version ?? '1',
      name: map.name ?? 'Workspace',
      timezone: map.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeFormat: map.timeFormat === '12' ? '12' : '24',
    })
  }

  async updateMeta(partial: Partial<WorkspaceMeta>): Promise<WorkspaceMeta> {
    const current = await this.getMeta()
    const next = { ...current, ...partial }
    const map: Record<string, string> = {
      version: next.version,
      name: next.name,
      timezone: next.timezone,
      timeFormat: next.timeFormat,
    }
    await writeSheetValues(this.spreadsheetId, SHEET_NAMES.workspace, mapToRows(map))
    return next
  }

  async listProjects(): Promise<Project[]> {
    const rows = await getSheetValues(this.spreadsheetId, SHEET_NAMES.projects)
    const projects: Project[] = []
    for (let i = 1; i < rows.length; i++) {
      const [id, name, billableDefault, currency, rate, color] = rows[i] ?? []
      if (!id) continue
      const parsed = projectSchema.safeParse({
        id,
        name: name ?? '',
        billableDefault: parseBool(billableDefault ?? 'false'),
        currency: currency ?? 'EUR',
        rate: Number(rate ?? 0),
        color: parseProjectColor(color),
      })
      if (parsed.success) projects.push(parsed.data)
    }
    return projects
  }

  async upsertProject(project: Project): Promise<void> {
    const projects = await this.listProjects()
    const idx = projects.findIndex((p) => p.id === project.id)
    if (idx >= 0) projects[idx] = project
    else projects.push(project)
    await this.writeProjects(projects)
  }

  async deleteProject(id: string): Promise<void> {
    const projects = (await this.listProjects()).filter((p) => p.id !== id)
    await this.writeProjects(projects)
  }

  private async writeProjects(projects: Project[]): Promise<void> {
    const rows: string[][] = [
      ['id', 'name', 'billableDefault', 'currency', 'rate', 'color'],
      ...projects.map((p) => [
        p.id,
        p.name,
        boolToSheet(p.billableDefault),
        p.currency,
        String(p.rate),
        p.color ?? '',
      ]),
    ]
    await writeSheetValues(this.spreadsheetId, SHEET_NAMES.projects, rows)
  }

  async listEntries(): Promise<TimeEntry[]> {
    const rows = await getSheetValues(this.spreadsheetId, SHEET_NAMES.timeTracker)
    const entries: TimeEntry[] = []
    for (let i = 1; i < rows.length; i++) {
      const [id, startTime, endTime, title, projectId, billable, currency, rate] = rows[i] ?? []
      if (!id || !startTime) continue
      const end = endTime?.trim() ? endTime : null
      const parsed = timeEntrySchema.safeParse({
        id,
        startTime,
        endTime: end,
        title: title ?? '',
        projectId: projectId ?? '',
        billable: parseBool(billable ?? 'false'),
        currency: currency ?? 'EUR',
        rate: Number(rate ?? 0),
      })
      if (parsed.success) entries.push(parsed.data)
    }
    return entries.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
  }

  private async writeEntries(entries: TimeEntry[]): Promise<void> {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    const rows: string[][] = [
      ['id', 'startTime', 'endTime', 'title', 'projectId', 'billable', 'currency', 'rate'],
      ...sorted.map((e) => [
        e.id,
        e.startTime,
        isRunningEntry(e) ? '' : (e.endTime ?? ''),
        e.title,
        e.projectId,
        boolToSheet(e.billable),
        e.currency,
        String(e.rate),
      ]),
    ]
    await writeSheetValues(this.spreadsheetId, SHEET_NAMES.timeTracker, rows)
  }

  async appendEntry(entry: TimeEntry): Promise<TimeEntry> {
    const entries = await this.listEntries()
    entries.push(entry)
    await this.writeEntries(entries)
    return entry
  }

  async updateEntry(entry: TimeEntry): Promise<TimeEntry> {
    const entries = await this.listEntries()
    const idx = entries.findIndex((e) => e.id === entry.id)
    if (idx < 0) throw new Error('Entry not found')
    entries[idx] = entry
    await this.writeEntries(entries)
    return entry
  }

  async stopEntry(id: string, endTime: string): Promise<TimeEntry> {
    const entries = await this.listEntries()
    const entry = entries.find((e) => e.id === id)
    if (!entry) throw new Error('Entry not found')
    entry.endTime = endTime
    await this.writeEntries(entries)
    return entry
  }

  async deleteEntry(id: string): Promise<void> {
    const entries = (await this.listEntries()).filter((e) => e.id !== id)
    await this.writeEntries(entries)
  }
}
