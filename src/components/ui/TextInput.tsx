import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import clsx from 'clsx'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[color:var(--color-text-muted)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'h-11 rounded-md bg-[color:var(--color-surface)] border border-[color:var(--color-border)] px-4',
          'text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-faint)]',
          'outline-none focus:border-[color:var(--color-red)]',
          error && 'border-[color:var(--color-red)]',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-[color:var(--color-red)]">{error}</span>}
    </div>
  )
})
