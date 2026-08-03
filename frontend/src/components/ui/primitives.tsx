import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-ink text-paper dark:bg-plumb dark:text-white hover:opacity-90',
    secondary: 'bg-transparent border border-line dark:border-line-dark text-ink dark:text-ink-dark hover:bg-line/30 dark:hover:bg-line-dark/30',
    ghost: 'bg-transparent text-muted hover:text-ink dark:hover:text-ink-dark',
    danger: 'bg-transparent border border-attention text-attention hover:bg-attention/10',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' }
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ className, children, tone = 'default' }: { className?: string; children: ReactNode; tone?: 'default' | 'good' | 'attention' | 'plumb' }) {
  const tones = {
    default: 'bg-line/40 dark:bg-line-dark/40 text-muted',
    good: 'bg-good-soft text-good dark:bg-good/20 dark:text-good-dark',
    attention: 'bg-attention-soft text-attention dark:bg-attention/20 dark:text-attention-dark',
    plumb: 'bg-plumb-soft text-plumb dark:bg-plumb/20 dark:text-plumb-dark',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, tone = 'plumb' }: { value: number; tone?: 'good' | 'attention' | 'plumb' }) {
  const colors = { good: 'bg-good', attention: 'bg-attention', plumb: 'bg-plumb' }
  return (
    <div className="h-1.5 w-full rounded-full bg-line dark:bg-line-dark overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-300', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-line/50 dark:bg-line-dark/50', className)} />
}
