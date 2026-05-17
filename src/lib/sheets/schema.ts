import { z } from 'zod'

export const SHEET_NAMES = {
  workspace: 'workspace',
  projects: 'projects',
  timeTracker: 'time-tracker',
} as const

export const timeFormatSchema = z.enum(['24', '12']).default('24')

export type TimeFormat = z.infer<typeof timeFormatSchema>

export const workspaceMetaSchema = z.object({
  version: z.string().default('1'),
  name: z.string(),
  timezone: z.string(),
  timeFormat: timeFormatSchema,
})

export type WorkspaceMeta = z.infer<typeof workspaceMetaSchema>

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  billableDefault: z.boolean(),
  currency: z.string(),
  rate: z.number(),
  color: z.string().default(''),
})

export type Project = z.infer<typeof projectSchema>

export const timeEntrySchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  title: z.string(),
  projectId: z.string(),
  billable: z.boolean(),
  currency: z.string(),
  rate: z.number(),
})

export type TimeEntry = z.infer<typeof timeEntrySchema>

export function isRunningEntry(entry: TimeEntry): boolean {
  if (!entry.endTime) return true
  const t = entry.endTime.trim()
  return t === '' || t === '0' || /^0+(\.0+)?$/.test(t)
}

export function parseBool(value: string): boolean {
  const v = value.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes' || v === 'si' || v === 'sí'
}

export function boolToSheet(value: boolean): string {
  return value ? 'TRUE' : 'FALSE'
}
