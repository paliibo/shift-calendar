import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { EASE_SPRING, SHEET_OPEN, SHEET_SPRING } from '@/lib/motion'

// Запас під тінь: щойно шторка схована, її не видно навіть краєм тіні.
const HIDE_MARGIN = 80

/** Залишає останнє значення, поки шторка закрита, — вміст не міняється посеред виїзду. */
export function useHeldWhileClosed(value, open) {
  const [held, setHeld] = useState(value)
  if (open && held !== value) setHeld(value)
  return open ? value : held
}

/**
 * Нижня шторка, що завжди лежить у DOM: закрита вона просто зсунута нижче екрана
 * (translateY на власну висоту), відкрита — виїжджає на місце. Нічого не монтується
 * й не зникає, тому немає різкого першого кадру чи раптового обриву в кінці.
 *
 * Закрита шторка неактивна (`inert`): фокус і читалки екрана її не бачать.
 * Закривається кнопкою, тапом по затемненню, Esc або свайпом униз.
 */
export function Sheet({ open, title, description, onClose, children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const returnFocusTo = useRef(null)
  const openRef = useRef(open)
  const dragged = useRef(false)
  const size = useRef({ height: 400, hidden: 480 })
  const titleId = useId()
  const reduceMotion = useReducedMotion()

  // Позиція панелі в пікселях: 0 — на місці, hidden — повністю за екраном.
  // Затемнення привʼязане до неї, тому гасне разом із рухом (і пальця теж).
  const y = useMotionValue(typeof window === 'undefined' ? 1000 : window.innerHeight + HIDE_MARGIN)
  const fade = useMotionValue(0) // для режиму «менше руху»: замість зсуву — проста поява
  const scrimOpacity = useTransform(y, (value) => Math.min(1, Math.max(0, 1 - value / size.current.height)))

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  // Тримаємо актуальну висоту; закриту шторку одразу ставимо за межі екрана.
  useLayoutEffect(() => {
    const panel = panelRef.current
    const measure = () => {
      const height = panel.offsetHeight
      size.current = { height, hidden: height + HIDE_MARGIN }
      if (!openRef.current) y.set(size.current.hidden)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    return () => observer.disconnect()
  }, [y])
  useLayoutEffect(() => {
    openRef.current = open
  })

  // Поява й зникнення — одна й та сама анімація положення в обидва боки.
  useEffect(() => {
    const controls = reduceMotion
      ? animate(fade, open ? 1 : 0, { duration: open ? 0.25 : 0.2 })
      : animate(y, open ? 0 : size.current.hidden, open ? SHEET_OPEN : SHEET_SPRING)
    return () => controls.stop()
  }, [open, reduceMotion, y, fade])

  // Фокус: на панель при відкритті, назад на кнопку-джерело при закритті. Esc закриває.
  useEffect(() => {
    if (!open) return
    returnFocusTo.current = document.activeElement
    panelRef.current.focus({ preventScroll: true })
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const target = returnFocusTo.current
      returnFocusTo.current = null
      if (target?.isConnected) target.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <div
      inert={!open}
      data-open={open ? '' : undefined}
      className="pointer-events-none fixed inset-0 z-20 touch-none overscroll-contain select-none data-open:pointer-events-auto"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/45"
        style={{ opacity: reduceMotion ? fade : scrimOpacity }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-[28px] bg-card pt-2.5 pr-[max(18px,env(safe-area-inset-right))] pb-[calc(18px+env(safe-area-inset-bottom))] pl-[max(18px,env(safe-area-inset-left))] text-foreground shadow-[0_-12px_40px_rgb(0_0_0/0.16)] outline-none will-change-transform"
        style={reduceMotion ? { opacity: fade } : { y }}
        drag={open && !reduceMotion ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        dragTransition={{ bounceStiffness: 420, bounceDamping: 42 }}
        onPointerDownCapture={() => {
          dragged.current = false
        }}
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={(_, info) => {
          // закриваємо, якщо стягнули на третину або змахнули вниз (але не від тремтіння пальця)
          const far = info.offset.y > size.current.height * 0.3
          const flick = info.velocity.y > 500 && info.offset.y > 24
          if (far || flick) onClose()
        }}
        onClickCapture={(event) => {
          // після свайпу тап по кнопці під пальцем не повинен спрацювати
          if (!dragged.current) return
          dragged.current = false
          event.stopPropagation()
          event.preventDefault()
        }}
      >
        <i className="mx-auto mb-4 block h-[5px] w-[38px] rounded-full bg-border" />
        {/* вміст проявляється трохи згодом за самою панеллю — поява виходить багатошаровою, а не різкою */}
        <motion.div
          initial={false}
          animate={reduceMotion ? { opacity: open ? 1 : 0 } : { opacity: open ? 1 : 0, y: open ? 0 : 10 }}
          transition={open ? { duration: 0.4, delay: 0.06, ease: EASE_SPRING } : { duration: 0.2 }}
        >
          <h2 id={titleId} className="text-[22px] font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="mt-1 mb-[18px] text-[15px] text-muted-foreground">{description}</p>
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}
