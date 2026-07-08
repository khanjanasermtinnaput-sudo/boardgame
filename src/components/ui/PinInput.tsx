import { useRef } from 'react'
import clsx from 'clsx'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  autoFocus?: boolean
  disabled?: boolean
}

const LENGTH = 4

export function PinInput({ value, onChange, label, autoFocus, disabled }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '')

  function setDigit(index: number, digit: string) {
    const clean = digit.replace(/\D/g, '').slice(-1)
    const next = digits.slice()
    next[index] = clean
    const joined = next.join('').slice(0, LENGTH)
    onChange(joined)
    if (clean && index < LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (pasted) {
      e.preventDefault()
      onChange(pasted)
      refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-surface-300">{label}</span>}
      <div className="flex gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={clsx(
              'h-14 w-12 rounded-xl bg-white/[0.05] border border-white/10 text-center text-2xl font-semibold text-surface-50',
              'outline-none transition-colors focus:border-emerald-glow/60 focus:bg-white/[0.07]',
            )}
          />
        ))}
      </div>
    </div>
  )
}
