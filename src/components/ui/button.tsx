import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '#/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'border-[rgba(50,143,151,0.35)] bg-[rgba(79,184,178,0.22)] text-[var(--lagoon-deep)] hover:bg-[rgba(79,184,178,0.32)]',
  secondary:
    'border-[rgba(23,58,64,0.2)] bg-white/50 text-[var(--sea-ink)] hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10',
  outline:
    'border-[var(--line)] bg-transparent text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)]',
  danger:
    'border-red-400/40 bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-200',
  ghost:
    'border-transparent bg-transparent text-red-600 hover:bg-red-500/10 dark:text-red-300',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-2.5 py-1 text-xs',
  md: 'rounded-full px-4 py-2 text-sm',
  lg: 'rounded-full px-5 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      type = 'button',
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 border font-semibold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      />
    )
  },
)
