import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '#/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3.5 py-2.5 font-mono text-sm text-[var(--sea-ink)] outline-none transition placeholder:text-[var(--sea-ink-soft)]/60 focus:border-[var(--lagoon)] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
})
