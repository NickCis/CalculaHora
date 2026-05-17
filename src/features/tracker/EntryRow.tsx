import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project, TimeEntry, TimeFormat } from '@/lib/sheets/schema'
import { isRunningEntry } from '@/lib/sheets/schema'
import {
  calendarDayOffsetBetween,
  dateAndTimeToIso,
  endDayOffsetFromEntry,
  endTimeFromStartAndDuration,
  entryAmount,
  entryDurationMs,
  formatDurationHms,
  formatTimeInput,
  inferEndDayOffsetFromTimes,
  isoToDateInput,
  parseDurationHms,
  rateFromAmount,
  resolveEndWithDayOffset,
  shiftEntryStartDate,
} from '@/lib/time'
import { EntryTimeRangeField } from '@/components/EntryTimeRangeField'
import { ProjectSelect } from '@/components/ProjectSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { DollarSign, Loader2, MoreVertical, Play, Square } from 'lucide-react'

const MULTI_DAY_MS = 48 * 3_600_000

function commitOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.currentTarget.blur()
  }
}

function formatAmount(value: number): string {
  return value.toFixed(2)
}

export function EntryRow({
  entry,
  projects,
  timezone,
  timeFormat = '24',
  now,
  running,
  loading,
  showAmount = false,
  hidePlayControls = false,
  onSave,
  onDelete,
  onPlay,
}: {
  entry: TimeEntry
  projects: Project[]
  timezone: string
  timeFormat?: TimeFormat
  now: Date
  running?: boolean
  loading?: boolean
  showAmount?: boolean
  hidePlayControls?: boolean
  onSave: (entry: TimeEntry) => void
  onDelete: () => void
  onPlay?: () => void
}) {
  const { t } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [title, setTitle] = useState(entry.title)
  const [projectId, setProjectId] = useState(entry.projectId)
  const [billable, setBillable] = useState(entry.billable)
  const [entryDate, setEntryDate] = useState(() => isoToDateInput(entry.startTime, timezone))
  const [endDayOffset, setEndDayOffset] = useState(() =>
    endDayOffsetFromEntry(entry, timezone),
  )
  const [startTime, setStartTime] = useState(() =>
    formatTimeInput(entry.startTime, timezone, timeFormat),
  )
  const [endTime, setEndTime] = useState(() =>
    entry.endTime && !isRunningEntry(entry)
      ? formatTimeInput(entry.endTime, timezone, timeFormat)
      : '',
  )
  const [durationHms, setDurationHms] = useState(() =>
    formatDurationHms(entryDurationMs(entry, now)),
  )
  const [amountInput, setAmountInput] = useState(() =>
    formatAmount(entryAmount(entry, now)),
  )

  const durationFocused = useRef(false)
  const amountFocused = useRef(false)
  const startTimeFocused = useRef(false)
  const endTimeFocused = useRef(false)
  const entryRev = useRef(entry)

  useEffect(() => {
    if (loading) return
    setTitle(entry.title)
    setProjectId(entry.projectId)
    setBillable(entry.billable)
    setEntryDate(isoToDateInput(entry.startTime, timezone))
    setEndDayOffset(endDayOffsetFromEntry(entry, timezone))
    if (!startTimeFocused.current) {
      setStartTime(formatTimeInput(entry.startTime, timezone, timeFormat))
    }
    if (!endTimeFocused.current) {
      setEndTime(
        entry.endTime && !isRunningEntry(entry)
          ? formatTimeInput(entry.endTime, timezone, timeFormat)
          : '',
      )
    }
    if (!durationFocused.current) {
      setDurationHms(formatDurationHms(entryDurationMs(entry, now)))
    }
    entryRev.current = entry
  }, [entry, timezone, timeFormat, loading])

  useEffect(() => {
    if (!running || durationFocused.current) return
    setDurationHms(formatDurationHms(entryDurationMs(entry, now)))
  }, [running, entry, now])

  useEffect(() => {
    if (!showAmount || amountFocused.current) return
    setAmountInput(formatAmount(entryAmount(entry, now)))
  }, [entry, now, showAmount, durationHms])

  const applyProject = (id: string) => {
    setProjectId(id)
    const project = projects.find((p) => p.id === id)
    const nextBillable = project?.billableDefault ?? billable
    setBillable(nextBillable)
    persist({
      projectId: id,
      billable: nextBillable,
      currency: project?.currency ?? entry.currency,
      rate: project?.rate ?? entry.rate,
    })
  }

  const persist = (patch: Partial<TimeEntry> & { endTime?: string | null }) => {
    onSave({
      ...entryRev.current,
      ...patch,
    })
  }

  const saveTitle = () => {
    if (title === entry.title) return
    persist({ title })
  }

  const startIso = (date = entryDate, time = startTime) =>
    dateAndTimeToIso(date, time, timezone, timeFormat, entryRev.current.startTime)

  const applyEntryDate = (newDate: string) => {
    setEntryDate(newDate)
    const base = entryRev.current
    const endIso =
      !running && base.endTime && !isRunningEntry(base) ? base.endTime : null
    const shifted = shiftEntryStartDate(base.startTime, endIso, newDate, timezone)

    const patch: Partial<TimeEntry> & { endTime?: string | null } = {}
    if (shifted.startTime !== base.startTime) patch.startTime = shifted.startTime
    if (shifted.endTime !== null && shifted.endTime !== base.endTime) {
      patch.endTime = shifted.endTime
    }

    if (Object.keys(patch).length === 0) return
    persist(patch)

    if (shifted.endTime) {
      setEndDayOffset(
        calendarDayOffsetBetween(shifted.startTime, shifted.endTime, timezone),
      )
    }
  }

  const saveStartAndEnd = (
    date = entryDate,
    times?: { startTime?: string; endTime?: string },
  ) => {
    const startVal = times?.startTime ?? startTime
    const endVal = times?.endTime ?? endTime
    const start = startIso(date, startVal)
    if (!start) return

    const patch: Partial<TimeEntry> & { endTime?: string } = {}
    if (start !== entryRev.current.startTime) patch.startTime = start

    if (!running && endVal.trim()) {
      const end = resolveEndWithDayOffset(
        date,
        startVal,
        endVal,
        endDayOffset,
        timezone,
        timeFormat,
        entryRev.current.endTime ?? undefined,
      )
      if (end && end !== entryRev.current.endTime) patch.endTime = end
    }

    if (Object.keys(patch).length === 0) return
    persist(patch)
  }

  const saveStart = (startOverride?: string) => {
    if (startOverride !== undefined) setStartTime(startOverride)
    saveStartAndEnd(entryDate, { startTime: startOverride ?? startTime })
  }

  const saveEnd = (endOverride?: string) => {
    if (running) return
    const endVal = endOverride ?? endTime
    if (endOverride !== undefined) setEndTime(endOverride)
    const start = startIso()
    if (!start) return

    const offset = inferEndDayOffsetFromTimes(
      entryDate,
      startTime,
      endVal,
      timezone,
      timeFormat,
    )
    const resolved = resolveEndWithDayOffset(
      entryDate,
      startTime,
      endVal,
      offset,
      timezone,
      timeFormat,
      entry.endTime ?? undefined,
    )
    if (!resolved) return

    if (entry.endTime) {
      const displayed = formatTimeInput(entry.endTime, timezone, timeFormat)
      const span = new Date(entry.endTime).getTime() - new Date(start).getTime()
      if (
        endVal.trim() === displayed.trim() &&
        span > MULTI_DAY_MS &&
        resolved !== entry.endTime
      ) {
        return
      }
    }

    setEndDayOffset(offset)
    if (resolved === entry.endTime) return
    persist({ endTime: resolved })
  }

  const saveDuration = () => {
    const ms = parseDurationHms(durationHms)
    const start = startIso()
    if (ms === null || !start) return
    const end = endTimeFromStartAndDuration(start, ms)
    const offset = calendarDayOffsetBetween(start, end, timezone)
    setEndDayOffset(offset)
    if (running && entry.endTime === null) {
      persist({ startTime: start, endTime: end })
      return
    }
    if (!running && entry.endTime && end === entry.endTime) return
    persist({ startTime: start, endTime: end })
    if (!running) {
      setEndTime(formatTimeInput(end, timezone, timeFormat))
    }
  }

  const toggleBillable = () => {
    const next = !billable
    setBillable(next)
    persist({ billable: next })
  }

  const saveAmount = () => {
    if (!billable) return
    const parsed = Number(amountInput.replace(',', '.'))
    if (Number.isNaN(parsed)) {
      setAmountInput(formatAmount(entryAmount(entryRev.current, now)))
      return
    }
    const nextRate = rateFromAmount(parsed, entryRev.current, now)
    if (nextRate === null) return
    if (nextRate === entry.rate) return
    persist({ rate: nextRate })
  }

  return (
    <>
      <li
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-lg border px-2 py-2 xl:flex-nowrap',
          running ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border',
          loading && 'pointer-events-none opacity-60',
        )}
      >
        {loading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        )}

        <div className="min-w-0 flex-1 basis-[8rem]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                className="h-8 w-full min-w-0"
                value={title}
                disabled={loading}
                placeholder={t('tracker.title')}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
              />
            </TooltipTrigger>
            {title.trim() && <TooltipContent>{title}</TooltipContent>}
          </Tooltip>
        </div>

        <ProjectSelect
          value={projectId}
          projects={projects}
          disabled={loading}
          className="shrink-0"
          onChange={applyProject}
        />

        {showAmount && billable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                className="h-8 w-[88px] shrink-0 font-mono text-sm tabular-nums"
                value={amountInput}
                disabled={loading || running}
                onChange={(e) => setAmountInput(e.target.value)}
                onFocus={() => {
                  amountFocused.current = true
                }}
                onBlur={() => {
                  amountFocused.current = false
                  saveAmount()
                }}
                onKeyDown={commitOnEnter}
                aria-label={t('reports.amount')}
              />
            </TooltipTrigger>
            <TooltipContent>
              {t('reports.rateHint', {
                rate: entry.rate.toFixed(2),
                currency: entry.currency,
              })}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={billable ? 'default' : 'outline'}
              className="size-8 shrink-0"
              disabled={loading}
              onClick={toggleBillable}
              aria-label={t('tracker.billable')}
              aria-pressed={billable}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('tracker.billable')}</TooltipContent>
        </Tooltip>

        <EntryTimeRangeField
          startTime={startTime}
          endTime={endTime}
          entryDate={entryDate}
          timeFormat={timeFormat}
          disabled={loading}
          hideEndTime={running}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onDateChange={applyEntryDate}
          onStartFocus={() => {
            startTimeFocused.current = true
          }}
          onEndFocus={() => {
            endTimeFocused.current = true
          }}
          onStartBlur={(normalized) => {
            startTimeFocused.current = false
            saveStart(normalized)
          }}
          onEndBlur={(normalized) => {
            endTimeFocused.current = false
            saveEnd(normalized)
          }}
          startAriaLabel={t('tracker.startTime')}
          endAriaLabel={t('tracker.endTime')}
          dateAriaLabel={t('tracker.entryDate')}
        />

        <Input
          className="h-8 min-w-[100px] flex-[0_1_100px] font-mono text-sm tabular-nums"
          value={durationHms}
          disabled={loading}
          placeholder="00:00:00"
          onChange={(e) => setDurationHms(e.target.value)}
          onFocus={() => {
            durationFocused.current = true
          }}
          onBlur={() => {
            durationFocused.current = false
            saveDuration()
          }}
          onKeyDown={commitOnEnter}
          aria-label={t('tracker.duration')}
        />

        <div className="flex shrink-0 items-center gap-2">
          {!hidePlayControls && onPlay && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant={running ? 'destructive' : 'outline'}
                className="size-8"
                disabled={loading}
                onClick={onPlay}
                aria-label={running ? t('tracker.stop') : t('tracker.restart')}
              >
                {running ? (
                  <Square className="h-3 w-3 fill-current" strokeWidth={0} />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {running ? t('tracker.stop') : t('tracker.restart')}
            </TooltipContent>
          </Tooltip>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                disabled={loading}
                aria-label={t('tracker.moreActions')}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setDeleteOpen(true)
                }}
              >
                {t('tracker.deleteEntry')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tracker.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tracker.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDelete()
              }}
            >
              {t('tracker.deleteEntry')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
