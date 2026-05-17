import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TimeFormat } from '@/lib/sheets/schema'
import { useWorkspaceId, useWorkspaceRepo } from '@/hooks/use-workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function WorkspaceSettingsPage() {
  const { t } = useTranslation()
  const workspaceId = useWorkspaceId()
  const repo = useWorkspaceRepo()
  const qc = useQueryClient()

  const { data: meta, isLoading } = useQuery({
    queryKey: ['workspace-meta', workspaceId],
    queryFn: () => repo.getMeta(),
  })

  const [timezone, setTimezone] = useState('')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24')

  useEffect(() => {
    if (meta) {
      setTimezone(meta.timezone)
      setTimeFormat(meta.timeFormat)
    }
  }, [meta])

  const saveMut = useMutation({
    mutationFn: () => repo.updateMeta({ timezone, timeFormat }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspace-meta', workspaceId] })
      toast.success(t('settings.saved'))
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  if (isLoading || !meta) return <p>{t('common.loading')}</p>

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
        <CardDescription>{t('settings.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">{t('workspaces.timezone')}</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Europe/Madrid"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-format">{t('tracker.timeFormat')}</Label>
          <select
            id="time-format"
            className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-3 text-sm"
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
          >
            <option value="24">{t('tracker.timeFormat24')}</option>
            <option value="12">{t('tracker.timeFormat12')}</option>
          </select>
        </div>
        <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {t('common.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
