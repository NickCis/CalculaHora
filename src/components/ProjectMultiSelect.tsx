import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import type { Project } from '@/lib/sheets/schema'
import { projectNameStyle } from '@/lib/project-color'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ProjectMultiSelect({
  value,
  projects,
  onChange,
  disabled,
  className,
}: {
  value: string[]
  projects: Project[]
  onChange: (projectIds: string[]) => void
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()

  const label = useMemo(() => {
    if (value.length === 0) return t('reports.allProjects')
    if (value.length === 1) {
      return projects.find((p) => p.id === value[0])?.name ?? t('reports.allProjects')
    }
    return t('reports.projectsSelected', { count: value.length })
  }, [value, projects, t])

  const toggleProject = (projectId: string, checked: boolean) => {
    if (checked) {
      onChange(value.length === 0 ? [projectId] : [...value, projectId])
      return
    }
    onChange(value.filter((id) => id !== projectId))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between gap-1 px-3 font-normal',
            value.length === 0 && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
        <DropdownMenuCheckboxItem
          checked={value.length === 0}
          onCheckedChange={() => onChange([])}
          onSelect={(e) => e.preventDefault()}
        >
          {t('reports.allProjects')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuCheckboxItem
            key={p.id}
            checked={value.length > 0 && value.includes(p.id)}
            onCheckedChange={(checked) => toggleProject(p.id, checked)}
            onSelect={(e) => e.preventDefault()}
          >
            <span style={projectNameStyle(p.color)}>{p.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
