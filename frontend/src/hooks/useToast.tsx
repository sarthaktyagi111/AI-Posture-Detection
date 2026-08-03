import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface Toast {
  id: number
  message: string
  variant: 'info' | 'success' | 'warning'
}

const ToastContext = createContext<((message: string, variant?: Toast['variant']) => void) | null>(null)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: Toast['variant'] = 'info') => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="flex items-start gap-2.5 rounded-md border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3 shadow-lg"
            >
              {t.variant === 'success' ? (
                <CheckCircle2 size={18} className="text-good mt-0.5 shrink-0" />
              ) : (
                <Info size={18} className="text-attention mt-0.5 shrink-0" />
              )}
              <p className="text-sm text-ink dark:text-ink-dark flex-1">{t.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-muted hover:text-ink dark:hover:text-ink-dark"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
