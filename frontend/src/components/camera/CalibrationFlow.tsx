import { motion } from 'framer-motion'
import { ProgressBar } from '@/components/ui/primitives'

export function CalibrationOverlay({ progress }: { progress: number }) {
  const secondsLeft = Math.max(0, Math.ceil(6 * (1 - progress)))
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/80 px-6 text-center backdrop-blur-sm"
    >
      <div className="h-10 w-px bg-paper/80" />
      <div>
        <p className="text-paper font-medium">Sit comfortably, look forward</p>
        <p className="text-paper/60 text-sm mt-1">Capturing your baseline posture — hold still</p>
      </div>
      <div className="w-56">
        <ProgressBar value={progress * 100} tone="plumb" />
      </div>
      <span className="font-data text-paper/70 text-sm">{secondsLeft}s remaining</span>
    </motion.div>
  )
}
