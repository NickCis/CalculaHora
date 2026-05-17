import type { TimeFormat } from '@/lib/sheets/schema'
import { timeInputPlaceholder } from '@/lib/time'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function WorkspaceDateTimeFields({
  date,
  time,
  timeFormat,
  disabled,
  onDateChange,
  onTimeChange,
  onBlur,
  className,
  dateAriaLabel,
  timeAriaLabel,
}: {
  date: string
  time: string
  timeFormat: TimeFormat
  disabled?: boolean
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  onBlur?: () => void
  className?: string
  dateAriaLabel?: string
  timeAriaLabel?: string
}) {
  return (
    <div className={cn('flex min-w-[168px] flex-[1_1_168px] gap-1', className)}>
      <Input
        type="date"
        className="h-8 min-w-0 flex-1 text-sm"
        value={date}
        disabled={disabled}
        onChange={(e) => onDateChange(e.target.value)}
        onBlur={onBlur}
        aria-label={dateAriaLabel}
      />
      <Input
        type="text"
        className={cn(
          'h-8 shrink-0 font-mono text-sm tabular-nums',
          timeFormat === '12' ? 'w-[7rem]' : 'w-[5.5rem]',
        )}
        value={time}
        disabled={disabled}
        placeholder={timeInputPlaceholder(timeFormat)}
        onChange={(e) => onTimeChange(e.target.value)}
        onBlur={onBlur}
        aria-label={timeAriaLabel}
      />
    </div>
  )
}
