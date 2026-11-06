import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Card({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Tag
      className={cx(
        'rounded-3xl border border-line/80 bg-surface shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-3 flex items-end justify-between gap-3', className)}>
      <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">
        {children}
      </h2>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex rounded-2xl border border-line/80 bg-surface2/70 p-1',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx(
            'tap flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12.5px] font-semibold transition-colors',
            value === opt.value
              ? 'bg-surface text-brand shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative mx-auto flex max-h-[88dvh] w-full max-w-md animate-sheet-up flex-col rounded-t-[30px] border border-line/70 bg-surface pb-[env(safe-area-inset-bottom)] shadow-float">
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3">
          <div className="pt-1">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <h3 className="font-display text-xl font-semibold">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close sheet"
            className="tap mt-1 grid h-9 w-9 place-items-center rounded-full bg-surface2 text-muted"
          >
            <X size={17} />
          </button>
        </div>
        <div className="no-scrollbar overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'gold' | 'brand' | 'live'
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface2 text-muted',
    gold: 'bg-gold-soft text-gold',
    brand: 'bg-brand-soft text-brand dark:text-gold',
    live: 'bg-brand text-gold-soft',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand dark:text-gold">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-[30ch] text-[13px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span
        className={cx(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
