import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isRunningEntry } from '@/lib/sheets/schema'
import { useWorkspaceId, useWorkspaceRepo } from '@/hooks/use-workspace'
import { useRunningTimerDocument } from '@/hooks/use-running-timer-document'

/** Syncs tab title and favicon with any running timer in the current workspace. */
export function RunningTimerDocument() {
  const workspaceId = useWorkspaceId()
  const repo = useWorkspaceRepo()

  const { data: entries = [] } = useQuery({
    queryKey: ['entries', workspaceId],
    queryFn: () => repo.listEntries(),
  })

  const runningEntries = useMemo(() => entries.filter(isRunningEntry), [entries])
  useRunningTimerDocument(runningEntries)

  return null
}
