import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  parseProjectColor,
  PROJECT_COLOR_PRESETS,
} from '@/lib/project-color'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const { t } = useTranslation()
  const normalized = parseProjectColor(value)
  const [hexInput, setHexInput] = useState(normalized)

  useEffect(() => {
    setHexInput(normalized)
  }, [normalized])

  const commitHex = () => {
    const parsed = parseProjectColor(hexInput)
    onChange(parsed)
    setHexInput(parsed)
  }

  return (
    <div className="space-y-3">
      <Label>{t('projects.color')}</Label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          title={t('projects.colorNone')}
          aria-label={t('projects.colorNone')}
          className={cn(
            'flex size-8 items-center justify-center rounded-md border-2 bg-muted text-muted-foreground',
            !normalized ? 'border-primary ring-2 ring-primary/30' : 'border-border',
          )}
          onClick={() => onChange('')}
        >
          —
        </button>
        {PROJECT_COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            className={cn(
              'size-8 rounded-md border-2 transition-transform hover:scale-105',
              normalized === c
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent',
            )}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalized || '#000000'}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('projects.colorPick')}
        />
        <Input
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => e.key === 'Enter' && commitHex()}
          placeholder="#000000"
          className="font-mono"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
