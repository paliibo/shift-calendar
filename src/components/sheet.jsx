import { useId, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { SHEET_SPRING } from '@/lib/motion'

/**
 * Нижня шторка на рідному <dialog>: браузер сам робить решту сторінки неактивною,
 * тримає фокус усередині й повертає його після закриття.
 * Рендерити всередині <AnimatePresence> — тоді шторка плавно виїжджає перед зникненням.
 * Закривається кнопкою, тапом по затемненню, Esc або свайпом униз.
 */
export function Sheet({ title, description, onClose, children }) {
  const dialogRef = useRef(null)
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const dragged = useRef(false)
  const travel = useRef(1)
  const titleId = useId()
  const reduceMotion = useReducedMotion()

  // Позиція панелі в пікселях (0 — на місці). Затемнення привʼязане до неї,
  // тому гасне разом із рухом пальця, а не окремою анімацією.
  const y = useMotionValue(typeof window === 'undefined' ? 0 : window.innerHeight)
  const fade = useMotionValue(0)
  const scrimFromY = useTransform(y, (value) => Math.min(1, Math.max(0, 1 - value / travel.current)))
  const [exitY, setExitY] = useState(null)

  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    panel.setAttribute('autofocus', '') // фокус на саму панель, а не на першу кнопку
    if (!dialog.open) dialog.showModal()

    // Якщо браузер закрив діалог сам (напр. повторний Esc), синхронізуємо стан.
    // Подія close приходить із запізненням, тому перевіряємо, що діалог справді закритий:
    // у StrictMode ефект запускається двічі, і подія від першого проходу інакше закрила б шторку.
    const onNativeClose = () => {
      if (!dialog.open) onCloseRef.current()
    }
    dialog.addEventListener('close', onNativeClose)

    let controls
    if (reduceMotion) {
      y.set(0)
      controls = animate(fade, 1, { duration: 0.2 })
    } else {
      const distance = panel.offsetHeight + 40
      travel.current = distance
      setExitY(distance)
      y.set(distance)
      controls = animate(y, 0, SHEET_SPRING)
    }

    return () => {
      controls.stop()
      dialog.removeEventListener('close', onNativeClose)
      if (dialog.open) dialog.close() // повертає фокус туди, звідки шторку відкрили
    }
  }, [reduceMotion, y, fade])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none touch-none overflow-hidden bg-transparent p-0 text-foreground select-none backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <motion.div
        className="absolute inset-0 bg-black/45"
        style={{ opacity: reduceMotion ? fade : scrimFromY }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] rounded-t-[28px] bg-card pt-2.5 pr-[max(18px,env(safe-area-inset-right))] pb-[calc(18px+env(safe-area-inset-bottom))] pl-[max(18px,env(safe-area-inset-left))] shadow-[0_-12px_40px_rgb(0_0_0/0.16)] outline-none will-change-transform"
        style={reduceMotion ? { opacity: fade } : { y }}
        exit={reduceMotion ? { opacity: 0, transition: { duration: 0.2 } } : { y: exitY ?? 0, transition: SHEET_SPRING }}
        drag="y"
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
          const far = info.offset.y > panelRef.current.offsetHeight * 0.3
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
        <h2 id={titleId} className="text-[22px] font-bold tracking-[-0.01em]">
          {title}
        </h2>
        <p className="mt-1 mb-[18px] text-[15px] text-muted-foreground">{description}</p>
        {children}
      </motion.div>
    </dialog>
  )
}
