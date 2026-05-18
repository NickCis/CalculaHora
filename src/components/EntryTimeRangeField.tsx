import { useRef } from 'react'
import type { TimeFormat } from '@/lib/sheets/schema'
import { normalizeTimeInput, timeInputPlaceholder } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

const timeInputWidth = (timeFormat: TimeFormat) =>
  timeFormat === '12' ? 'w-[7rem]' : 'w-[5.5rem]'

const timeInputClass = (timeFormat: TimeFormat) =>
  cn(
    'h-8 shrink-0 px-2 font-mono text-sm tabular-nums shadow-none focus-visible:z-10',
    timeInputWidth(timeFormat),
  )

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
  hideEndTime,
  onStartTimeChange,
  onEndTimeChange,
  onDateChange,
  onStartFocus,
  onEndFocus,
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
  hideEndTime?: boolean
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onDateChange: (date: string) => void
  onStartFocus?: () => void
  onEndFocus?: () => void
  onStartBlur?: (normalizedStart: string) => void
  onEndBlur?: (normalizedEnd: string) => void
  className?: string
  startAriaLabel?: string
  endAriaLabel?: string
  dateAriaLabel?: string
}) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const placeholder = timeInputPlaceholder(timeFormat)

  const handleStartBlur = () => {
    const normalized = startTime.trim()
      ? normalizeTimeInput(startTime, timeFormat)
      : startTime
    onStartTimeChange(normalized)
    onStartBlur?.(normalized)
  }

  const handleEndBlur = () => {
    const normalized = endTime.trim() ? normalizeTimeInput(endTime, timeFormat) : endTime
    onEndTimeChange(normalized)
    onEndBlur?.(normalized)
  }

  return (
    <div className={cn('flex shrink-0 items-stretch', className)}>
      <Input
        type="text"
        className={cn(timeInputClass(timeFormat), 'rounded-r-none border-r-0')}
        value={startTime}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onStartTimeChange(e.target.value)}
        onFocus={onStartFocus}
        onBlur={handleStartBlur}
        onKeyDown={commitOnEnter}
        aria-label={startAriaLabel}
      />
      {!hideEndTime && (
        <Input
          type="text"
          className={cn(timeInputClass(timeFormat), '-ml-px rounded-none border-r-0')}
          value={endTime}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onEndTimeChange(e.target.value)}
          onFocus={onEndFocus}
          onBlur={handleEndBlur}
          onKeyDown={commitOnEnter}
          aria-label={endAriaLabel}
        />
      )}
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
