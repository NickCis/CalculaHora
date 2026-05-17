import { useTranslation } from 'react-i18next'
import type { Project } from '@/lib/sheets/schema'
import { projectNameStyle } from '@/lib/project-color'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export function ProjectSelect({
  value,
  projects,
  onChange,
  disabled,
  className,
}: {
  value: string
  projects: Project[]
  onChange: (projectId: string) => void
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const selected = projects.find((p) => p.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-8 min-w-[120px] flex-[1_1_140px] justify-between gap-1 px-2 font-normal',
            className,
          )}
        >
          <span
            className={cn('truncate', !selected && 'text-muted-foreground')}
            style={projectNameStyle(selected?.color)}
          >
            {selected?.name ?? t('tracker.noProject')}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuItem onSelect={() => onChange('')}>
          <span className="text-muted-foreground">{t('tracker.noProject')}</span>
        </DropdownMenuItem>
        {projects.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => onChange(p.id)}>
            <span style={projectNameStyle(p.color)}>{p.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
