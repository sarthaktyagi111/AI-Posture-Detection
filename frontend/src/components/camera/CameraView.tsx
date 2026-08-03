import { RefObject } from 'react'
import { AlertTriangle, Camera } from 'lucide-react'

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>
  canvasRef: RefObject<HTMLCanvasElement>
  ready: boolean
  error: string | null
}

export function CameraView({ videoRef, canvasRef, ready, error }: CameraViewProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ink dark:bg-black">
      <video ref={videoRef} className="h-full w-full object-cover -scale-x-100" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-paper/70">
          <Camera size={28} />
          <p className="text-sm">Camera preview will appear here</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-attention bg-ink/95 px-6 text-center">
          <AlertTriangle size={28} />
          <p className="text-sm">{error}</p>
          <p className="text-xs text-paper/60">
            Check your browser's camera permission for this site, then reload.
          </p>
        </div>
      )}
    </div>
  )
}
