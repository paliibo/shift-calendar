import { memo } from 'react'
import { FadeSwap } from '@/components/fade-swap'
import { MONTHS, MONTHS_GEN, isWorkDay, plural } from '@/lib/schedule'
import { cn } from '@/lib/utils'

/**
 * Один місяць. memo — щоб відкриття шторки чи прокрутка не перемальовували всі 12 місяців:
 * місяць оновлюється лише тоді, коли змінюється графік або обраний день у ньому.
 * Дні — звичайні кнопки з CSS-переходами (клас .day): 365 анімованих компонентів були б зайвим тягарем.
 */
export const Month = memo(function Month({ ref, month, schedule, today, selectedDay, waveOrigin, isFirst, onPick }) {
  const configured = schedule.anchor != null
  const cells = []
  let workCount = 0

  for (let i = 0; i < month.count; i++) {
    const n = month.first + i
    const work = isWorkDay(schedule, n)
    if (work) workCount++
    cells.push(
      <button
        key={n}
        type="button"
        data-selected={n === selectedDay ? '' : undefined}
        aria-label={`${i + 1} ${MONTHS_GEN[month.month]}${configured ? (work ? ', робочий' : ', вихідний') : ''}`}
        className={cn(
          'day relative grid aspect-square min-w-0 place-items-center rounded-[14px] text-lg font-medium tabular-nums',
          work && 'bg-primary font-bold text-primary-foreground',
          n < today && 'opacity-35',
          n === today && 'shadow-[0_0_0_2px_var(--color-background),0_0_0_4px_var(--color-foreground)]',
          schedule.overrides[n] != null && 'after:opacity-75',
        )}
        // хвиля перефарбування від обраного дня
        style={waveOrigin == null ? undefined : { transitionDelay: `${90 + Math.min(Math.abs(n - waveOrigin) * 16, 480)}ms` }}
        onClick={() => onPick(n)}
      >
        {i + 1}
      </button>,
    )
  }

  return (
    <section ref={ref} className={cn('month', isFirst ? 'mt-2' : 'mt-[26px]')}>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[21px] font-bold tracking-[-0.01em]">
          {MONTHS[month.month]} <span className="font-medium text-muted-foreground">{month.year}</span>
        </h2>
        <small className="min-h-[19px] text-sm text-muted-foreground">
          <FadeSwap text={configured ? `${workCount} ${plural(workCount, 'робочий', 'робочі', 'робочих')}` : ''} />
        </small>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: month.offset }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {cells}
      </div>
    </section>
  )
})
