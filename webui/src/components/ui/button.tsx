import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-11 px-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        outline: 'border border-border bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />
}
