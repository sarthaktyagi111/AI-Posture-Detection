import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

// Loads once and is memoized — MediaPipe's WASM + model download is not
// cheap, so every caller shares the same landmarker instance.
let landmarkerPromise: Promise<PoseLandmarker> | null = null

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    })()
  }
  return landmarkerPromise
}

// NOTE: if this 404s when you run it, MediaPipe occasionally moves model/wasm
// paths between releases — check https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
// for the current URLs and swap them in here. It's a one-line fix.
