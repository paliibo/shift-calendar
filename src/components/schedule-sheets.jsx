import { useState } from 'react'
import { FadeSwap } from '@/components/fade-swap'
import { Sheet } from '@/components/sheet'
import { Button } from '@/components/ui/button'
import { formatLong, fromISO, isWorkDay, toISO } from '@/lib/schedule'

/** Шторка обраного дня: зробити виняток або почати цикл із цього дня. */
export function DaySheet({ day, schedule, onToggle, onAnchor, onClose }) {
  const configured = schedule.anchor != null
  const manual = schedule.overrides[day] != null
  const work = isWorkDay(schedule, day)
  const description = !configured
    ? 'Графік ще не налаштовано'
    : `${work ? 'Робочий день' : 'Вихідний'}${manual ? ' · змінено вручну' : ''}`

  return (
    <Sheet title={formatLong(day)} description={description} onClose={onClose}>
      {configured && (
        <Button className="mt-2.5" onClick={() => onToggle(day)}>
          {manual ? 'Повернути як за графіком' : work ? 'Зробити вихідним' : 'Зробити робочим'}
        </Button>
      )}
      <Button variant={configured ? 'default' : 'primary'} className="mt-2.5 flex-col gap-0.5" onClick={() => onAnchor(day)}>
        Зміна починається цього дня
        <small className="text-[13px] font-normal opacity-70">перерахує весь графік від цієї дати</small>
      </Button>
      <Button variant="ghost" className="mt-2.5" onClick={onClose}>
        Закрити
      </Button>
    </Sheet>
  )
}

function Stepper({ label, value, onStep }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border py-3 first-of-type:border-t-0">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <Button size="stepper" aria-label={`${label}: менше`} disabled={value <= 1} onClick={() => onStep(-1)}>
          −
        </Button>
        <output className="w-[34px] text-center text-[19px] font-bold tabular-nums">
          <FadeSwap text={String(value)} />
        </output>
        <Button size="stepper" aria-label={`${label}: більше`} disabled={value >= 14} onClick={() => onStep(1)}>
          +
        </Button>
      </div>
    </div>
  )
}

/** Шторка налаштувань: ритм змін, перший день і скидання ручних змін. */
export function SettingsSheet({ schedule, onStep, onAnchor, onReset, onClose }) {
  const overrideCount = Object.keys(schedule.overrides).length
  // Кнопка скидання не зникає під пальцем (інакше шторка смикається) —
  // вона лише гасне й лишається до наступного відкриття.
  const [hadOverrides] = useState(overrideCount > 0)

  return (
    <Sheet title="Графік" description="Скільки днів працюєш і скільки відпочиваєш" onClose={onClose}>
      <Stepper label="Робочих підряд" value={schedule.work} onStep={(delta) => onStep('work', delta)} />
      <Stepper label="Вихідних підряд" value={schedule.off} onStep={(delta) => onStep('off', delta)} />
      <div className="flex items-center justify-between gap-3 border-t border-border py-3">
        <label htmlFor="anchor-date">Перший день зміни</label>
        <input
          id="anchor-date"
          type="date"
          className="min-h-[46px] rounded-[14px] bg-secondary px-3 py-1.5"
          value={schedule.anchor == null ? '' : toISO(schedule.anchor)}
          onChange={(event) => {
            if (event.target.value) onAnchor(fromISO(event.target.value))
          }}
        />
      </div>
      {hadOverrides && (
        <Button className="mt-2.5" disabled={overrideCount === 0} onClick={onReset}>
          <FadeSwap text={overrideCount > 0 ? `Скинути ручні зміни (${overrideCount})` : 'Ручні зміни скинуто'} />
        </Button>
      )}
      <Button variant="primary" className="mt-2.5" onClick={onClose}>
        Готово
      </Button>
    </Sheet>
  )
}
