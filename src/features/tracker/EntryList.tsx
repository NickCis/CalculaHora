import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project, TimeEntry, TimeFormat } from '@/lib/sheets/schema'
import { isRunningEntry } from '@/lib/sheets/schema'
import { dateKeyInTz, dayTotalDurationMs, formatDurationHms } from '@/lib/time'
import { useNow } from '@/hooks/use-now'
import { Button } from '@/components/ui/button'
import { EntryRow } from './EntryRow'

const PAGE_SIZE = 25

export function EntryList({
  entries,
  projects,
  timezone,
  timeFormat,
  loadingEntryId,
  onStop,
  onRestart,
  onSave,
  onDelete,
}: {
  entries: TimeEntry[]
  projects: Project[]
  timezone: string
  timeFormat: TimeFormat
  loadingEntryId?: string | null
  onStop: (id: string) => void
  onRestart: (entry: TimeEntry) => void
  onSave: (entry: TimeEntry) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const now = useNow(entries.some(isRunningEntry))

  const running = entries.filter(isRunningEntry)
  const stopped = entries.filter((e) => !isRunningEntry(e))
  const totalPages = Math.max(1, Math.ceil(stopped.length / PAGE_SIZE))
  const pageItems = stopped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const grouped = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    for (const e of pageItems) {
      const key = dateKeyInTz(e.startTime, timezone)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return [...map.entries()]
  }, [pageItems, timezone])

  if (entries.length === 0) {
    return <p className="text-muted-foreground">{t('tracker.empty')}</p>
  }

  const renderRow = (e: TimeEntry, isRunning: boolean) => (
    <EntryRow
      key={e.id}
      entry={e}
      projects={projects}
      timezone={timezone}
      timeFormat={timeFormat}
      now={now}
      running={isRunning}
      loading={loadingEntryId === e.id}
      onSave={onSave}
      onDelete={() => onDelete(e.id)}
      onPlay={() => (isRunning ? onStop(e.id) : onRestart(e))}
    />
  )

  return (
    <div className="space-y-6">
      <div>
        {running.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">{t('tracker.activeTimers')}</h2>
            <ul className="space-y-2">{running.map((e) => renderRow(e, true))}</ul>
          </section>
        )}

        {grouped.map(([day, items]) => {
          const totalMs = dayTotalDurationMs(entries, day, timezone, now)
          return (
            <section key={day} className="mt-6">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-medium text-muted-foreground">{day}</h2>
                <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                  {t('tracker.dayTotal', { duration: formatDurationHms(totalMs) })}
                </span>
              </div>
              <ul className="space-y-2">{items.map((e) => renderRow(e, false))}</ul>
            </section>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('common.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('tracker.page', { page, total: totalPages })}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
