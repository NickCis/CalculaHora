import { useRef } from 'react'
import type { TimeFormat } from '@/lib/sheets/schema'
import { normalizeTimeInput, timeInputPlaceholder } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

const timeInputClass =
  'h-8 min-w-0 flex-1 font-mono text-sm tabular-nums shadow-none focus-visible:z-10'

function commitOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.currentTarget.blur()
  }
}

export function EntryTimeRangeField({
  startTime,
  endTime,
  entryDate,
  timeFormat,
  disabled,
  endDisabled,
  onStartTimeChange,
  onEndTimeChange,
  onDateChange,
  onStartBlur,
  onEndBlur,
  className,
  startAriaLabel,
  endAriaLabel,
  dateAriaLabel,
}: {
  startTime: string
  endTime: string
  entryDate: string
  timeFormat: TimeFormat
  disabled?: boolean
  endDisabled?: boolean
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onDateChange: (date: string) => void
  onStartBlur?: () => void
  onEndBlur?: () => void
  className?: string
  startAriaLabel?: string
  endAriaLabel?: string
  dateAriaLabel?: string
}) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const placeholder = timeInputPlaceholder(timeFormat)

  const handleStartBlur = () => {
    if (startTime.trim()) {
      onStartTimeChange(normalizeTimeInput(startTime, timeFormat))
    }
    onStartBlur?.()
  }

  const handleEndBlur = () => {
    if (endTime.trim()) {
      onEndTimeChange(normalizeTimeInput(endTime, timeFormat))
    }
    onEndBlur?.()
  }

  return (
    <div className={cn('flex min-w-[200px] flex-[1_1_260px] items-stretch', className)}>
      <Input
        type="text"
        className={cn(timeInputClass, 'rounded-r-none border-r-0')}
        value={startTime}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onStartTimeChange(e.target.value)}
        onBlur={handleStartBlur}
        onKeyDown={commitOnEnter}
        aria-label={startAriaLabel}
      />
      <Input
        type="text"
        className={cn(timeInputClass, '-ml-px rounded-none border-r-0')}
        value={endTime}
        disabled={disabled || endDisabled}
        placeholder={placeholder}
        onChange={(e) => onEndTimeChange(e.target.value)}
        onBlur={handleEndBlur}
        onKeyDown={commitOnEnter}
        aria-label={endAriaLabel}
      />
      <input
        ref={dateInputRef}
        type="date"
        className="sr-only"
        tabIndex={-1}
        value={entryDate}
        disabled={disabled}
        onChange={(e) => onDateChange(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="-ml-px size-8 shrink-0 rounded-l-none rounded-r-md focus-visible:z-10"
        disabled={disabled}
        aria-label={dateAriaLabel ?? startAriaLabel}
        onClick={() => dateInputRef.current?.showPicker()}
      >
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  )
}
