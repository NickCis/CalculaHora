import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { Project } from '@/lib/sheets/schema'
import { useWorkspaceId, useWorkspaceRepo } from '@/hooks/use-workspace'
import { parseProjectColor, projectNameStyle } from '@/lib/project-color'
import { ColorPicker } from '@/components/ColorPicker'
import { newId } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ProjectsPage() {
  const { t } = useTranslation()
  const workspaceId = useWorkspaceId()
  const repo = useWorkspaceRepo()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [editDraft, setEditDraft] = useState<Project | null>(null)
  const [draft, setDraft] = useState<Partial<Project>>({
    name: '',
    billableDefault: true,
    currency: 'EUR',
    rate: 0,
    color: '',
  })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => repo.listProjects(),
  })

  const saveMut = useMutation({
    mutationFn: (p: Project) => repo.upsertProject(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] })
      setDraft({ name: '', billableDefault: true, currency: 'EUR', rate: 0, color: '' })
      setAddOpen(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('common.error')),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => repo.deleteProject(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const createProject = () => {
    if (!draft.name?.trim()) return
    saveMut.mutate({
      id: newId(),
      name: draft.name.trim(),
      billableDefault: draft.billableDefault ?? true,
      currency: draft.currency ?? 'EUR',
      rate: Number(draft.rate ?? 0),
      color: parseProjectColor(draft.color),
    })
  }

  if (isLoading) return <p>{t('common.loading')}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('projects.title')}</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              {t('projects.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('projects.add')}</DialogTitle>
            </DialogHeader>
            <ProjectForm draft={draft} onChange={setDraft} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button disabled={!draft.name?.trim() || saveMut.isPending} onClick={createProject}>
                {t('projects.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">{t('projects.empty')}</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('projects.name')}</TableHead>
                <TableHead>{t('projects.currency')}</TableHead>
                <TableHead className="text-right">{t('projects.rate')}</TableHead>
                <TableHead>{t('projects.billableDefault')}</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onEdit={() => {
                    setEditing(p)
                    setEditDraft(p)
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          {editDraft && <ProjectForm draft={editDraft} onChange={(d) => setEditDraft({ ...editDraft, ...d })} />}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (editing) delMut.mutate(editing.id)
                setEditing(null)
              }}
            >
              {t('projects.delete')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                disabled={!editDraft}
                onClick={() => {
                  if (editDraft) {
                    saveMut.mutate({
                      ...editDraft,
                      color: parseProjectColor(editDraft.color),
                    })
                  }
                  setEditing(null)
                }}
              >
                {t('projects.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectForm({
  draft,
  onChange,
}: {
  draft: Partial<Project>
  onChange: (d: Partial<Project>) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>{t('projects.name')}</Label>
        <Input value={draft.name ?? ''} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t('projects.currency')}</Label>
        <Input value={draft.currency ?? 'EUR'} onChange={(e) => onChange({ ...draft, currency: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t('projects.rate')}</Label>
        <Input
          type="number"
          value={draft.rate ?? 0}
          onChange={(e) => onChange({ ...draft, rate: Number(e.target.value) })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={draft.billableDefault ?? true}
          onCheckedChange={(v) => onChange({ ...draft, billableDefault: v })}
        />
        <Label>{t('projects.billableDefault')}</Label>
      </div>
      <ColorPicker
        value={draft.color ?? ''}
        onChange={(color) => onChange({ ...draft, color })}
      />
    </div>
  )
}

function ProjectRow({
  project,
  onEdit,
}: {
  project: Project
  onEdit: () => void
}) {
  const { t } = useTranslation()

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-2">
          {project.color ? (
            <span
              className="size-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: project.color }}
              aria-hidden
            />
          ) : null}
          <span style={projectNameStyle(project.color)}>{project.name}</span>
        </span>
      </TableCell>
      <TableCell>{project.currency}</TableCell>
      <TableCell className="text-right tabular-nums">{project.rate}</TableCell>
      <TableCell>{project.billableDefault ? t('common.yes') : t('common.no')}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={onEdit}>
            {t('projects.edit')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
