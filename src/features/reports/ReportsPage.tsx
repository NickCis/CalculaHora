import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TimeEntry } from '@/lib/sheets/schema'
import { isRunningEntry } from '@/lib/sheets/schema'
import { useWorkspaceId, useWorkspaceRepo } from '@/hooks/use-workspace'
import { useNow } from '@/hooks/use-now'
import {
  filterEntries,
  presetRange,
  formatDurationHms,
  isoToDatetimeLocal,
  datetimeLocalToIso,
  reportTotals,
  entryAmount,
  dateKeyInTz,
  type DatePreset,
} from '@/lib/time'
import { exportCsv, exportPdf } from '@/lib/export'
import { EntryRow } from '@/features/tracker/EntryRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ReportsPage() {
  const { t } = useTranslation()
  const workspaceId = useWorkspaceId()
  const repo = useWorkspaceRepo()
  const qc = useQueryClient()
  const [fromLocal, setFromLocal] = useState('')
  const [toLocal, setToLocal] = useState('')
  const [projectId, setProjectId] = useState('all')
  const [exportShowAmount, setExportShowAmount] = useState(false)

  const { data: meta } = useQuery({
    queryKey: ['workspace-meta', workspaceId],
    queryFn: () => repo.getMeta(),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => repo.listProjects(),
  })

  const { data: entries = [] } = useQuery({
    queryKey: ['entries', workspaceId],
    queryFn: () => repo.listEntries(),
  })

  const fromFilter =
    fromLocal && meta ? datetimeLocalToIso(fromLocal, meta.timezone) : undefined
  const toFilter = toLocal && meta ? datetimeLocalToIso(toLocal, meta.timezone) : undefined

  const filtered = useMemo(
    () =>
      filterEntries(entries, {
        from: fromFilter,
        to: toFilter,
        projectId,
      }),
    [entries, fromFilter, toFilter, projectId],
  )

  const hasRunning = filtered.some(isRunningEntry)
  const now = useNow(hasRunning)
  const totals = useMemo(() => reportTotals(filtered, now), [filtered, now])

  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filtered) {
      if (!e.billable) continue
      const amt = entryAmount(e, now)
      map.set(e.currency, (map.get(e.currency) ?? 0) + amt)
    }
    return [...map.entries()]
  }, [filtered, now])

  const groupedByDay = useMemo(() => {
    if (!meta) return []
    const map = new Map<string, TimeEntry[]>()
    for (const e of filtered) {
      const key = dateKeyInTz(e.startTime, meta.timezone)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return [...map.entries()]
  }, [filtered, meta])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['entries'] })
  }

  const updateMut = useMutation({
    mutationFn: (entry: TimeEntry) => repo.updateEntry(entry),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => repo.deleteEntry(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  const loadingEntryId =
    updateMut.isPending && updateMut.variables
      ? updateMut.variables.id
      : deleteMut.isPending && deleteMut.variables
        ? deleteMut.variables
        : null

  const applyPreset = (preset: DatePreset) => {
    if (!meta) return
    const r = presetRange(preset, meta.timezone)
    setFromLocal(isoToDatetimeLocal(r.from, meta.timezone))
    setToLocal(isoToDatetimeLocal(r.to, meta.timezone))
  }

  if (!meta) return <p>{t('common.loading')}</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {(['thisMonth', 'lastMonth', 'thisYear', 'lastYear'] as DatePreset[]).map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => applyPreset(p)}>
                {t(`reports.presets.${p}`)}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-from">{t('reports.from')}</Label>
            <Input
              id="report-from"
              type="datetime-local"
              value={fromLocal}
              onChange={(e) => setFromLocal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to">{t('reports.to')}</Label>
            <Input
              id="report-to"
              type="datetime-local"
              value={toLocal}
              onChange={(e) => setToLocal(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t('reports.project')}</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="all">{t('reports.allProjects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border border-input"
                checked={exportShowAmount}
                onChange={(e) => setExportShowAmount(e.target.checked)}
              />
              {t('reports.exportShowAmount')}
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportCsv(filtered, projects, meta.timezone, t)}
              >
                {t('reports.exportCsv')}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  exportPdf(filtered, projects, {
                    tz: meta.timezone,
                    t,
                    fromIso: fromLocal ? fromFilter : undefined,
                    toIso: toLocal ? toFilter : undefined,
                    projectFilterName:
                      projectId !== 'all'
                        ? projects.find((p) => p.id === projectId)?.name
                        : undefined,
                    showAmount: exportShowAmount,
                    now,
                  })
                }
              >
                {t('reports.exportPdf')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t('reports.empty')}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm tabular-nums">
            <span>
              {t('reports.totalDuration')}:{' '}
              <strong className="font-semibold text-foreground">
                {formatDurationHms(totals.durationMs)}
              </strong>
            </span>
            {totalsByCurrency.length > 0 && (
              <span className="inline-flex flex-wrap items-baseline gap-x-2">
                {t('reports.totalAmount')}:
                {totalsByCurrency.map(([currency, amount], i) => (
                  <strong key={currency} className="font-semibold text-foreground">
                    {i > 0 ? ' + ' : ' '}
                    {amount.toFixed(2)} {currency}
                  </strong>
                ))}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {groupedByDay.map(([day, items]) => (
              <section key={day}>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">{day}</h2>
                <ul className="space-y-2">
                  {items.map((e) => (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      projects={projects}
                      timezone={meta.timezone}
                      timeFormat={meta.timeFormat}
                      now={now}
                      running={isRunningEntry(e)}
                      loading={loadingEntryId === e.id}
                      showAmount
                      hidePlayControls
                      onSave={(entry) => updateMut.mutate(entry)}
                      onDelete={() => deleteMut.mutate(e.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
