import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimeEntry } from '@/lib/sheets/schema'
import { entryDurationMs, formatDurationHms } from '@/lib/time'
import { initFaviconThemeListener, setFavicon } from '@/lib/favicon'
import { useNow } from '@/hooks/use-now'

const DEFAULT_TITLE = 'CalculaHora'

export function useRunningTimerDocument(runningEntries: TimeEntry[]) {
  const { t } = useTranslation()
  const appName = t('app.name')
  const hasRunning = runningEntries.length > 0
  const now = useNow(hasRunning)

  useEffect(() => initFaviconThemeListener(), [])

  useEffect(() => {
    if (!hasRunning) {
      document.title = DEFAULT_TITLE
      setFavicon(false)
      return
    }

    const durationMs = runningEntries.reduce(
      (sum, entry) => sum + entryDurationMs(entry, now),
      0,
    )
    document.title = `${formatDurationHms(durationMs)} · ${appName}`
    setFavicon(true)
  }, [hasRunning, runningEntries, now, appName])

  useEffect(() => {
    return () => {
      document.title = DEFAULT_TITLE
      setFavicon(false)
    }
  }, [])
}
