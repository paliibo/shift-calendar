import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-[opacity,scale] duration-300 ease-spring active:opacity-70 active:duration-100 motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-foreground',
        primary: 'bg-primary text-primary-foreground',
        ghost: 'bg-transparent font-medium text-muted-foreground',
        outline: 'border border-border bg-card text-foreground',
        inverted: 'bg-foreground text-background shadow-[0_10px_28px_rgb(0_0_0/0.28)]',
      },
      size: {
        default: 'min-h-[54px] w-full rounded-2xl px-4 py-2 text-[17px]',
        sm: 'h-[38px] rounded-full px-4 text-sm',
        pill: 'h-[50px] rounded-full px-5 text-base',
        icon: 'size-[46px] rounded-[15px] motion-safe:active:scale-90',
        stepper: 'size-[46px] rounded-[14px] text-[22px] leading-none font-medium motion-safe:active:scale-90',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant, size, type = 'button', ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
