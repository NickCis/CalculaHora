import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TimeEntry } from '@/lib/sheets/schema'
import { useWorkspaceId, useWorkspaceRepo } from '@/hooks/use-workspace'
import { newId, nowUtcIso } from '@/lib/time'
import { EntryComposer, type ComposerState } from './EntryComposer'
import { EntryList } from './EntryList'
import { Loader2 } from 'lucide-react'

export function TrackerPage() {
  const { t } = useTranslation()
  const workspaceId = useWorkspaceId()
  const repo = useWorkspaceRepo()
  const qc = useQueryClient()

  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ['workspace-meta', workspaceId],
    queryFn: () => repo.getMeta(),
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => repo.listProjects(),
  })

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', workspaceId],
    queryFn: () => repo.listEntries(),
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['entries'] })
  }

  const startMut = useMutation({
    mutationFn: async (state: ComposerState) => {
      const project = projects.find((p) => p.id === state.projectId)
      const entry: TimeEntry = {
        id: newId(),
        startTime: nowUtcIso(),
        endTime: null,
        title: state.title,
        projectId: state.projectId,
        billable: state.billable,
        currency: project?.currency ?? 'EUR',
        rate: project?.rate ?? 0,
      }
      return repo.appendEntry(entry)
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  const stopMut = useMutation({
    mutationFn: (id: string) => repo.stopEntry(id, nowUtcIso()),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  const restartMut = useMutation({
    mutationFn: async (source: TimeEntry) => {
      const project = projects.find((p) => p.id === source.projectId)
      return repo.appendEntry({
        id: newId(),
        startTime: nowUtcIso(),
        endTime: null,
        title: source.title,
        projectId: source.projectId,
        billable: source.billable,
        currency: project?.currency ?? source.currency,
        rate: project?.rate ?? source.rate,
      })
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

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

  const loadingEntryId = (() => {
    if (updateMut.isPending && updateMut.variables) return updateMut.variables.id
    if (deleteMut.isPending && deleteMut.variables) return deleteMut.variables
    if (stopMut.isPending && stopMut.variables) return stopMut.variables
    if (restartMut.isPending && restartMut.variables) return restartMut.variables.id
    return null
  })()

  const pageLoading = metaLoading || projectsLoading || entriesLoading

  if (pageLoading || !meta) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <EntryComposer projects={projects} busy={startMut.isPending} onStart={(s) => startMut.mutate(s)} />
      <EntryList
        entries={entries}
        projects={projects}
        timezone={meta.timezone}
        timeFormat={meta.timeFormat}
        loadingEntryId={loadingEntryId}
        onStop={(id) => stopMut.mutate(id)}
        onRestart={(e) => restartMut.mutate(e)}
        onSave={(e) => updateMut.mutate(e)}
        onDelete={(id) => deleteMut.mutate(id)}
      />
    </div>
  )
}
