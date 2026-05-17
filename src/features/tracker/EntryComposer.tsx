import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '@/lib/sheets/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProjectSelect } from '@/components/ProjectSelect'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Play } from 'lucide-react'

export interface ComposerState {
  title: string
  projectId: string
  billable: boolean
}

export function EntryComposer({
  projects,
  onStart,
  busy,
}: {
  projects: Project[]
  onStart: (state: ComposerState) => void
  busy?: boolean
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [billable, setBillable] = useState(true)

  const onProject = (id: string) => {
    setProjectId(id)
    const p = projects.find((x) => x.id === id)
    if (p) setBillable(p.billableDefault)
  }

  const resetForm = () => {
    setTitle('')
    setProjectId('')
    setBillable(true)
  }

  const handleStart = () => {
    onStart({ title, projectId, billable })
    resetForm()
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-4 pt-6">
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label>{t('tracker.title')}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('tracker.title')} />
        </div>
        <div className="space-y-2">
          <Label>{t('tracker.project')}</Label>
          <ProjectSelect
            value={projectId}
            projects={projects}
            onChange={onProject}
            className="h-9 min-w-[160px] flex-none"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={billable ? 'default' : 'outline'}
              className="size-9 shrink-0"
              disabled={busy}
              onClick={() => setBillable((b) => !b)}
              aria-label={t('tracker.billable')}
              aria-pressed={billable}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('tracker.billable')}</TooltipContent>
        </Tooltip>
        <Button disabled={busy} onClick={handleStart}>
          <Play className="h-4 w-4" /> {t('tracker.start')}
        </Button>
      </CardContent>
    </Card>
  )
}
