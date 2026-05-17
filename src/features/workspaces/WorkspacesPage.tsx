import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { listWorkspaces, createSpreadsheet } from '@/lib/google/drive'
import { initializeWorkspaceSpreadsheet } from '@/lib/sheets/template'
import { STORAGE_KEYS } from '@/lib/storage/keys'
import { writeJson } from '@/lib/storage/local-storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimeFormat } from '@/lib/sheets/schema'

export function WorkspacesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  )
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24')

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
  })

  const createMut = useMutation({
    mutationFn: async () => {
      const file = await createSpreadsheet(name.trim())
      await initializeWorkspaceSpreadsheet(file.id, name.trim(), timezone, timeFormat)
      return file
    },
    onSuccess: (file) => {
      writeJson(STORAGE_KEYS.lastWorkspaceId, file.id)
      void qc.invalidateQueries({ queryKey: ['workspaces'] })
      navigate(`/w/${file.id}/tracker`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('workspaces.title')}</CardTitle>
          <CardDescription>{t('workspaces.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('workspaces.namePlaceholder')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('workspaces.timezone')}</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('tracker.timeFormat')}</Label>
            <select
              className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-3 text-sm"
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
            >
              <option value="24">{t('tracker.timeFormat24')}</option>
              <option value="12">{t('tracker.timeFormat12')}</option>
            </select>
          </div>
          <Button
            disabled={!name.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {t('workspaces.create')}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : workspaces.length === 0 ? (
        <p className="text-muted-foreground">{t('workspaces.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  writeJson(STORAGE_KEYS.lastWorkspaceId, w.id)
                  navigate(`/w/${w.id}/tracker`)
                }}
              >
                {w.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
