import { api } from '@/lib/api'

const DEFAULT_THRESHOLD = 60

export class DualPostureTracker {
  private severeBadSince: number | null = null
  private severeNotified = false

  private strainSince: number | null = null
  private strainNotified = false

  constructor(
    private sustainSeconds = 5,
    private severeThreshold = 70
  ) {}

  setSustainSeconds(seconds: number) {
    this.sustainSeconds = seconds
  }

  setSevereThreshold(threshold: number) {
    this.severeThreshold = threshold
  }

  check(
    score: number,
    issues: string[],
    nowMs: number
  ): { notificationType: 'severe' | 'strain' | null; elapsedSeconds: number } {
    // 1. Severe Bad Posture (Score < 70)
    if (score < this.severeThreshold) {
      if (this.severeBadSince === null) this.severeBadSince = nowMs
      const elapsed = (nowMs - this.severeBadSince) / 1000

      this.strainSince = null
      this.strainNotified = false

      if (elapsed >= this.sustainSeconds && !this.severeNotified) {
        this.severeNotified = true
        return { notificationType: 'severe', elapsedSeconds: elapsed }
      }
      return { notificationType: null, elapsedSeconds: elapsed }
    } else {
      this.severeBadSince = null
      this.severeNotified = false
    }

    // 2. Subtle Strain Warning (Score >= 70, but neck/shoulder strain detected)
    if (score >= this.severeThreshold && issues.length > 0) {
      if (this.strainSince === null) this.strainSince = nowMs
      const elapsed = (nowMs - this.strainSince) / 1000

      if (elapsed >= this.sustainSeconds && !this.strainNotified) {
        this.strainNotified = true
        return { notificationType: 'strain', elapsedSeconds: elapsed }
      }
      return { notificationType: null, elapsedSeconds: elapsed }
    } else {
      this.strainSince = null
      this.strainNotified = false
    }

    return { notificationType: null, elapsedSeconds: 0 }
  }
}

export class SustainedPostureTracker extends DualPostureTracker {}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function fireBrowserNotification(title: string, body: string) {
  // 1. Native OS Level Notification (Sent via local backend to system notification daemon)
  api.triggerOsNotification(title, body).catch(() => {})

  // 2. Native Desktop Browser Notification (shows in OS corner over all apps)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'postura-alert',
      requireInteraction: true,
    })
  }

  // 2. Pop-up Alert Window (forces attention over browser windows)
  try {
    const popup = window.open(
      '',
      'postura_alert_popup',
      'width=460,height=240,top=120,left=120,resizable=no,scrollbars=no'
    )
    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Posture Alert!</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #991b1b;
                color: #ffffff;
                margin: 0;
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100vh;
                box-sizing: border-box;
              }
              h1 { font-size: 22px; margin: 0 0 8px 0; font-weight: 700; }
              p { font-size: 14px; opacity: 0.95; margin: 0 0 18px 0; line-height: 1.4; }
              button {
                background-color: #ffffff;
                color: #991b1b;
                border: none;
                padding: 10px 22px;
                font-size: 14px;
                font-weight: 700;
                border-radius: 6px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              button:hover { background-color: #f3f4f6; }
            </style>
          </head>
          <body>
            <h1>🚨 Bad Posture Alert!</h1>
            <p>${body}</p>
            <button onclick="window.close()">Sit Up Straight & Dismiss</button>
          </body>
        </html>
      `)
      popup.focus()
    }
  } catch {
    // Blocked by popup blocker if untrusted
  }
}

/** A short, unobtrusive alert tone via the Web Audio API — no audio files needed. */
export function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio not available in this browser context — fail silently, not critical.
  }
}
