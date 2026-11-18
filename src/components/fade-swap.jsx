import { AnimatePresence, motion } from 'framer-motion'
import { EASE_SPRING } from '@/lib/motion'

const variants = {
  hidden: { opacity: 0, y: 5 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.38, ease: EASE_SPRING } },
  gone: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
}

/** Текст, що змінюється: старий гасне, новий проявляється — без миттєвої підміни. */
export function FadeSwap({ text }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={text} className="inline-block" variants={variants} initial="hidden" animate="shown" exit="gone">
        {text}
      </motion.span>
    </AnimatePresence>
  )
}
