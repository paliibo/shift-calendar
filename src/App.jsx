import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp, SlidersHorizontal } from 'lucide-react'
import { FadeSwap } from '@/components/fade-swap'
import { Month } from '@/components/month'
import { DaySheet, SettingsSheet } from '@/components/schedule-sheets'
import { Button } from '@/components/ui/button'
import { EASE_SPRING, SOFT_SPRING } from '@/lib/motion'
import {
  WEEKDAYS,
  buildMonths,
  clampRun,
  describeToday,
  formatLong,
  isBaseWork,
  loadSchedule,
  pruneOverrides,
  saveSchedule,
  todayNumber,
} from '@/lib/schedule'
import { cn } from '@/lib/utils'

const WRAP = 'mx-auto w-full max-w-[480px] pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]'

export default function App() {
  const [schedule, setSchedule] = useState(loadSchedule)
  const [today, setToday] = useState(todayNumber)
  const [back, setBack] = useState(0) // скільки минулих місяців показано
  const [sheet, setSheet] = useState(null) // 'day' | 'settings' | null
  const [selected, setSelected] = useState(null)
  const [waveOrigin, setWaveOrigin] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [awayFromToday, setAwayFromToday] = useState(false)
  const reduceMotion = useReducedMotion()

  const headerRef = useRef(null)
  const sentinelRef = useRef(null)
  const monthsRef = useRef(null)
  const currentMonthRef = useRef(null)
  const pendingInsert = useRef(null)

  const configured = schedule.anchor != null
  const status = useMemo(() => describeToday(schedule, today), [schedule, today])
  const months = useMemo(() => buildMonths(today, back), [today, back])

  useEffect(() => saveSchedule(schedule), [schedule])

  // Застосунок може провисіти у фоні до наступного дня (таймери там сплять),
  // тому дату звіряємо і за таймером, і щоразу, коли він повертається на екран.
  useEffect(() => {
    const sync = () => setToday(todayNumber())
    const onVisible = () => {
      if (!document.hidden) sync()
    }
    const timer = window.setInterval(sync, 60_000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])

  // давні ручні зміни більше не потрібні
  useEffect(() => {
    setSchedule((s) => {
      const overrides = pruneOverrides(s.overrides, today)
      return overrides === s.overrides ? s : { ...s, overrides }
    })
  }, [today])

  // лінія під шапкою зʼявляється, щойно сторінку зрушили з місця
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  // кнопка «Сьогодні» — коли поточний місяць зник з екрана
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setAwayFromToday(!entry.isIntersecting), {
      rootMargin: `-${headerRef.current.offsetHeight + 40}px 0px -80px 0px`,
    })
    observer.observe(currentMonthRef.current)
    return () => observer.disconnect()
  }, [today])

  // хвиля перефарбування триває недовго — потім затримки прибираємо
  useEffect(() => {
    if (waveOrigin == null) return
    const timer = window.setTimeout(() => setWaveOrigin(null), 1400)
    return () => window.clearTimeout(timer)
  }, [waveOrigin])

  // iOS: щоб працював :active і не було масштабування щипком
  useEffect(() => {
    const noop = () => {}
    const stop = (event) => event.preventDefault()
    document.addEventListener('touchstart', noop, { passive: true })
    document.addEventListener('gesturestart', stop)
    return () => {
      document.removeEventListener('touchstart', noop)
      document.removeEventListener('gesturestart', stop)
    }
  }, [])

  const scrollToY = useCallback(
    (top) => window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' }),
    [reduceMotion],
  )

  // Новий місяць вставляється над поточними. Щоб на екрані нічого не стрибнуло, прокрутку
  // зсуваємо рівно на його висоту (до першого кадру), а далі сторінка плавно підʼїжджає вгору.
  const addEarlier = () => {
    const firstMonth = monthsRef.current.querySelector('section')
    pendingInsert.current = { el: firstMonth, top: firstMonth.getBoundingClientRect().top }
    setBack((n) => n + 1)
  }
  useLayoutEffect(() => {
    const pending = pendingInsert.current
    if (!pending) return
    pendingInsert.current = null
    window.scrollBy(0, pending.el.getBoundingClientRect().top - pending.top)
    scrollToY(0)
  }, [back, scrollToY])

  const goToday = () => {
    const current = currentMonthRef.current
    const top = back === 0 ? 0 : current.getBoundingClientRect().top + window.scrollY - headerRef.current.offsetHeight - 10
    scrollToY(top)
  }

  const closeSheet = useCallback(() => setSheet(null), [])
  const pickDay = useCallback((day) => {
    setSelected(day)
    setSheet('day')
  }, [])

  const setAnchor = useCallback(
    (day) => {
      setSchedule((s) => {
        const overrides = { ...s.overrides }
        delete overrides[day]
        return { ...s, anchor: day, overrides }
      })
      if (!reduceMotion) setWaveOrigin(day)
    },
    [reduceMotion],
  )
  const toggleOverride = useCallback((day) => {
    setSchedule((s) => {
      const overrides = { ...s.overrides }
      if (overrides[day] != null) delete overrides[day]
      else overrides[day] = isBaseWork(s, day) ? 0 : 1
      return { ...s, overrides }
    })
  }, [])
  const stepRun = useCallback((key, delta) => setSchedule((s) => ({ ...s, [key]: clampRun(s[key] + delta) })), [])
  const resetOverrides = useCallback(() => setSchedule((s) => ({ ...s, overrides: {} })), [])

  return (
    <>
      <i ref={sentinelRef} className="pointer-events-none absolute top-0 left-0 size-px" />

      <header
        ref={headerRef}
        inert={sheet !== null}
        data-scrolled={scrolled ? '' : undefined}
        className="sticky top-0 z-10 border-b border-transparent bg-(--app-header) pt-[calc(10px+env(safe-area-inset-top))] backdrop-blur-[20px] backdrop-saturate-[1.8] transition-colors duration-400 data-scrolled:border-border"
      >
        <div className={WRAP}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-[3px] min-h-[17px] text-[13px] font-semibold tracking-[0.02em] text-muted-foreground">
                <FadeSwap text={formatLong(today)} />
              </p>
              <h1 className="flex items-center text-[25px] leading-[1.15] font-bold tracking-[-0.02em]">
                <motion.i
                  initial={false}
                  animate={{
                    width: configured ? 12 : 0,
                    marginRight: configured ? 10 : 0,
                    borderWidth: configured ? 2 : 0,
                    opacity: configured ? 1 : 0,
                    scale: status.work ? 1.15 : 1,
                  }}
                  transition={SOFT_SPRING}
                  className={cn(
                    'block h-3 flex-none rounded-[4px] border-muted-foreground transition-colors duration-500',
                    status.work && 'border-primary bg-primary',
                  )}
                />
                <FadeSwap text={status.title} />
              </h1>
              <p className="mt-1 min-h-5 text-[15px] text-muted-foreground">
                <FadeSwap text={status.sub} />
              </p>
            </div>
            <Button variant="outline" size="icon" aria-label="Налаштування" onClick={() => setSheet('settings')}>
              <SlidersHorizontal size={21} strokeWidth={1.8} aria-hidden="true" />
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="mt-3.5 grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase"
          >
            {WEEKDAYS.map((day, i) => (
              <span key={day} className={i > 4 ? 'opacity-60' : undefined}>
                {day}
              </span>
            ))}
          </div>
        </div>
      </header>

      <motion.main
        ref={monthsRef}
        inert={sheet !== null}
        className={WRAP}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_SPRING }}
      >
        <Button variant="ghost" size="sm" className="mx-auto mt-3 flex w-fit" onClick={addEarlier}>
          <ArrowUp size={15} aria-hidden="true" /> Попередній місяць
        </Button>
        {months.map((month) => (
          <Month
            key={month.key}
            ref={month.idx === 0 ? currentMonthRef : undefined}
            month={month}
            schedule={schedule}
            today={today}
            isFirst={month.idx === -back}
            selectedDay={sheet === 'day' && selected >= month.first && selected < month.first + month.count ? selected : null}
            waveOrigin={waveOrigin}
            onPick={pickDay}
          />
        ))}
      </motion.main>

      {/* обгортка на всю ширину центрує кнопку сама — transform лишається вільним для анімації */}
      <AnimatePresence>
        {awayFromToday && (
          <motion.div
            inert={sheet !== null}
            className="pointer-events-none fixed inset-x-0 bottom-[calc(18px+env(safe-area-inset-bottom))] z-10 flex justify-center"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.92 }}
            transition={SOFT_SPRING}
          >
            <Button variant="inverted" size="pill" className="pointer-events-auto" onClick={goToday}>
              <ArrowUp size={17} aria-hidden="true" /> Сьогодні
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* шторки лежать у DOM постійно й лише виїжджають — нічого не монтується посеред руху */}
      <DaySheet
        open={sheet === 'day'}
        day={selected ?? today}
        schedule={schedule}
        onClose={closeSheet}
        onToggle={(day) => {
          toggleOverride(day)
          closeSheet()
        }}
        onAnchor={(day) => {
          setAnchor(day)
          closeSheet()
        }}
      />
      <SettingsSheet
        open={sheet === 'settings'}
        schedule={schedule}
        onClose={closeSheet}
        onStep={stepRun}
        onAnchor={setAnchor}
        onReset={resetOverrides}
      />
    </>
  )
}
