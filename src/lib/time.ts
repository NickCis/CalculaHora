import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  parse,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { TimeEntry, TimeFormat } from '@/lib/sheets/schema'
import { isRunningEntry } from '@/lib/sheets/schema'

export function nowUtcIso(): string {
  return new Date().toISOString()
}

export function timePattern(format: TimeFormat, withDate = false): string {
  const time = format === '12' ? 'h:mm a' : 'HH:mm'
  return withDate ? `yyyy-MM-dd ${time}` : time
}

export function formatInWorkspaceTz(
  iso: string,
  tz: string,
  pattern = 'PPp',
): string {
  return formatInTimeZone(iso, tz, pattern)
}

export function formatTimeInWorkspaceTz(
  iso: string,
  tz: string,
  timeFormat: TimeFormat,
): string {
  return formatInTimeZone(iso, tz, timePattern(timeFormat))
}

export function formatDurationHms(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function parseDurationHms(value: string): number | null {
  const parts = value.trim().split(':').map((p) => p.trim())
  if (parts.length < 2 || parts.length > 3) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return null
  const [h, m, s = 0] = nums.length === 2 ? [0, nums[0], nums[1]] : nums
  return ((h * 60 + m) * 60 + s) * 1000
}

export function isoToDatetimeLocal(iso: string, tz: string): string {
  return formatInTimeZone(iso, tz, "yyyy-MM-dd'T'HH:mm")
}

export function datetimeLocalToIso(local: string, tz: string): string {
  return fromZonedTime(local, tz).toISOString()
}

export function isoToDateInput(iso: string, tz: string): string {
  return formatInTimeZone(iso, tz, 'yyyy-MM-dd')
}

export function formatTimeInput(
  iso: string,
  tz: string,
  timeFormat: TimeFormat,
): string {
  return formatInTimeZone(iso, tz, timePattern(timeFormat))
}

export function timeInputPlaceholder(timeFormat: TimeFormat): string {
  return timeFormat === '12' ? 'h:mm AM' : 'HH:mm'
}

function parseTimeDigits(digits: string): { hours: number; minutes: number } | null {
  const len = digits.length
  if (len === 0) return null
  if (len <= 2) {
    const hours = Number(digits)
    if (hours > 23) return null
    return { hours, minutes: 0 }
  }
  if (len === 3) {
    const hours = Number(digits[0])
    const minutes = Number(digits.slice(1))
    if (hours > 23 || minutes > 59) return null
    return { hours, minutes }
  }
  if (len === 4) {
    const hours = Number(digits.slice(0, 2))
    const minutes = Number(digits.slice(2))
    if (hours > 23 || minutes > 59) return null
    return { hours, minutes }
  }
  return null
}

function apply12hPeriod(
  hours: number,
  minutes: number,
  period: string,
): { hours: number; minutes: number } | null {
  if (minutes > 59) return null
  const p = period.toLowerCase()
  if (p !== 'am' && p !== 'pm') return null
  if (hours < 1 || hours > 12) return null
  let h = hours
  if (p === 'am') {
    if (h === 12) h = 0
  } else if (h !== 12) {
    h += 12
  }
  return { hours: h, minutes }
}

export function formatParsedTime(
  hours: number,
  minutes: number,
  timeFormat: TimeFormat,
): string {
  if (timeFormat === '24') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  let h = hours % 12
  if (h === 0) h = 12
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`
}

export function parseTimeInput(
  time: string,
  timeFormat: TimeFormat,
): { hours: number; minutes: number } | null {
  const t = time.trim()
  if (!t) return null

  if (timeFormat === '24') {
    const withColon = t.match(/^(\d{1,2}):(\d{2})$/)
    if (withColon) {
      const hours = Number(withColon[1])
      const minutes = Number(withColon[2])
      if (hours > 23 || minutes > 59) return null
      return { hours, minutes }
    }
    if (/^\d{1,4}$/.test(t)) return parseTimeDigits(t)
    return null
  }

  const withColon = t.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (withColon) {
    return apply12hPeriod(Number(withColon[1]), Number(withColon[2]), withColon[3])
  }

  const compact = t.match(/^(\d{1,4})\s*([AaPp][Mm])$/i)
  if (compact) {
    const clock = parseTimeDigits(compact[1])
    if (!clock) return null
    if (compact[1].length >= 3 && clock.hours > 12) return null
    return apply12hPeriod(clock.hours, clock.minutes, compact[2])
  }

  return null
}

export function normalizeTimeInput(
  time: string,
  timeFormat: TimeFormat,
): string {
  const parsed = parseTimeInput(time, timeFormat)
  if (!parsed) return time
  return formatParsedTime(parsed.hours, parsed.minutes, timeFormat)
}

export function addDaysToDateString(date: string, days: number): string {
  const d = parse(date, 'yyyy-MM-dd', new Date())
  return format(addDays(d, days), 'yyyy-MM-dd')
}

export function dateAndTimeToIso(
  date: string,
  time: string,
  tz: string,
  timeFormat: TimeFormat,
  referenceIso?: string,
): string | null {
  if (!date || !time.trim()) return null
  const parsed = parseTimeInput(time, timeFormat)
  if (!parsed) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  let seconds = 0
  if (referenceIso) {
    const refH = Number(formatInTimeZone(referenceIso, tz, 'H'))
    const refM = Number(formatInTimeZone(referenceIso, tz, 'm'))
    if (refH === parsed.hours && refM === parsed.minutes) {
      seconds = Number(formatInTimeZone(referenceIso, tz, 's'))
    }
  }
  const local = `${date}T${pad(parsed.hours)}:${pad(parsed.minutes)}:${pad(seconds)}`
  return fromZonedTime(local, tz).toISOString()
}

/** Move entry to a new start calendar date; keeps clock times (with seconds) and duration. */
export function shiftEntryStartDate(
  startIso: string,
  endIso: string | null,
  newStartDate: string,
  tz: string,
): { startTime: string; endTime: string | null } {
  const wallTime = formatInTimeZone(startIso, tz, 'HH:mm:ss')
  const newStart = fromZonedTime(`${newStartDate}T${wallTime}`, tz).toISOString()
  if (!endIso) return { startTime: newStart, endTime: null }
  const durationMs = new Date(endIso).getTime() - new Date(startIso).getTime()
  const newEnd = new Date(new Date(newStart).getTime() + durationMs).toISOString()
  return { startTime: newStart, endTime: newEnd }
}

export function calendarDayOffsetBetween(
  startIso: string,
  endIso: string,
  tz: string,
): number {
  const startDate = isoToDateInput(startIso, tz)
  const endDate = isoToDateInput(endIso, tz)
  return differenceInCalendarDays(
    parse(endDate, 'yyyy-MM-dd', new Date()),
    parse(startDate, 'yyyy-MM-dd', new Date()),
  )
}

export function endDayOffsetFromEntry(entry: TimeEntry, tz: string): number {
  if (!entry.endTime || isRunningEntry(entry)) return 0
  return Math.max(0, calendarDayOffsetBetween(entry.startTime, entry.endTime, tz))
}

/** 0 = same calendar day; 1 = end clock is on or before start clock (overnight). */
export function inferEndDayOffsetFromTimes(
  startDate: string,
  startTime: string,
  endTime: string,
  tz: string,
  timeFormat: TimeFormat,
): number {
  const startIso = dateAndTimeToIso(startDate, startTime, tz, timeFormat)
  const sameDayEnd = dateAndTimeToIso(startDate, endTime, tz, timeFormat)
  if (!startIso || !sameDayEnd) return 0
  if (sameDayEnd > startIso) return 0
  return 1
}

export function resolveEndWithDayOffset(
  startDate: string,
  _startTime: string,
  endTime: string,
  dayOffset: number,
  tz: string,
  timeFormat: TimeFormat,
  referenceEndIso?: string,
): string | null {
  if (!endTime.trim()) return null
  const endDate =
    dayOffset === 0 ? startDate : addDaysToDateString(startDate, dayOffset)
  return dateAndTimeToIso(endDate, endTime, tz, timeFormat, referenceEndIso)
}

/** End time on the same calendar day as start, or the next day if end clock ≤ start clock. */
export function resolveEndFromStartDate(
  startDate: string,
  startTime: string,
  endTime: string,
  tz: string,
  timeFormat: TimeFormat,
): string | null {
  const offset = inferEndDayOffsetFromTimes(
    startDate,
    startTime,
    endTime,
    tz,
    timeFormat,
  )
  return resolveEndWithDayOffset(
    startDate,
    startTime,
    endTime,
    offset,
    tz,
    timeFormat,
  )
}

export function dayTotalDurationMs(
  entries: TimeEntry[],
  dayKey: string,
  tz: string,
  now = new Date(),
): number {
  return entries
    .filter((e) => dateKeyInTz(e.startTime, tz) === dayKey)
    .reduce((sum, e) => sum + entryDurationMs(e, now), 0)
}

export function endTimeFromStartAndDuration(
  startIso: string,
  durationMs: number,
): string {
  return new Date(new Date(startIso).getTime() + durationMs).toISOString()
}

export function dateKeyInTz(iso: string, tz: string): string {
  return formatInTimeZone(iso, tz, 'yyyy-MM-dd')
}

export function entryDurationMs(entry: TimeEntry, now = new Date()): number {
  const start = new Date(entry.startTime).getTime()
  const end = isRunningEntry(entry) ? now.getTime() : new Date(entry.endTime!).getTime()
  return Math.max(0, end - start)
}

export function entryDurationHours(entry: TimeEntry, now = new Date()): number {
  return entryDurationMs(entry, now) / 3_600_000
}

export function entryAmount(entry: TimeEntry, now = new Date()): number {
  if (!entry.billable) return 0
  return entryDurationHours(entry, now) * entry.rate
}

export function rateFromAmount(amount: number, entry: TimeEntry, now = new Date()): number | null {
  const hours = entryDurationHours(entry, now)
  if (hours <= 0 || !Number.isFinite(amount)) return null
  return amount / hours
}

export function reportTotals(
  entries: TimeEntry[],
  now = new Date(),
): { durationMs: number; amount: number } {
  let durationMs = 0
  let amount = 0
  for (const e of entries) {
    durationMs += entryDurationMs(e, now)
    if (e.billable) amount += entryAmount(e, now)
  }
  return { durationMs, amount }
}

export type DatePreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'

export function presetRange(
  preset: DatePreset,
  tz: string,
): { from: string; to: string } {
  const zonedNow = toZonedTime(new Date(), tz)
  let start: Date
  let end: Date

  switch (preset) {
    case 'thisMonth':
      start = startOfMonth(zonedNow)
      end = endOfMonth(zonedNow)
      break
    case 'lastMonth': {
      const prev = subMonths(zonedNow, 1)
      start = startOfMonth(prev)
      end = endOfMonth(prev)
      break
    }
    case 'thisYear':
      start = startOfYear(zonedNow)
      end = endOfYear(zonedNow)
      break
    case 'lastYear': {
      const prev = subYears(zonedNow, 1)
      start = startOfYear(prev)
      end = endOfYear(prev)
      break
    }
  }

  const fromUtc = fromZonedTime(startOfDay(start), tz).toISOString()
  const toUtc = fromZonedTime(endOfDay(end), tz).toISOString()
  return { from: fromUtc, to: toUtc }
}

function parseFilterDate(value: string): number {
  const d = value.includes('T') && !value.endsWith('Z') && !value.includes('+')
    ? new Date(value)
    : new Date(value)
  return d.getTime()
}

export function filterEntries(
  entries: TimeEntry[],
  opts: { from?: string; to?: string; projectIds?: string[] },
): TimeEntry[] {
  const projectFilter =
    opts.projectIds && opts.projectIds.length > 0 ? new Set(opts.projectIds) : null
  return entries.filter((e) => {
    const t = new Date(e.startTime).getTime()
    if (opts.from && t < parseFilterDate(opts.from)) return false
    if (opts.to && t > parseFilterDate(opts.to)) return false
    if (projectFilter && !projectFilter.has(e.projectId)) return false
    return true
  })
}

export function newId(): string {
  return crypto.randomUUID()
}
