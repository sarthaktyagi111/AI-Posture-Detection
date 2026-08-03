# Postura — Posture Intelligence

Real-time posture tracking via webcam, calibrated to your own body, with session
analytics, streaks, badges, goals, and a focus timer.

**Built for a one-week solo project.** Core CV runs entirely client-side in the
browser (MediaPipe, WebAssembly) — nothing but small numeric samples ever
reaches the backend.

> **I could not run or test this code** — it was generated in a sandbox with no
> internet access, so `npm install` / `pip install` never ran. Everything below
> was written as carefully and correctly as possible, but budget 15–30 minutes
> for the inevitable small fix (a typo, a version mismatch) once you run it for
> real. If you get stuck, paste the exact error back to me, or use Claude Code
> locally where it can install packages and iterate with you directly.

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Interactive API docs at
`http://localhost:8000/docs`.

**Optional — seed 4 weeks of realistic demo data** (do this before any demo or report screenshot):

```bash
python seed_demo_data.py
```

Login `demo` / `demo1234`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env    # only needed if your backend isn't on localhost:8000
npm run dev
```

Opens at `http://localhost:5173`.

### 3. Use it

1. Register an account (or sign in as `demo` / `demo1234` if you seeded data).
2. On the dashboard, click **Start camera** and allow camera access.
3. If you have no saved baseline yet, calibration starts automatically —
   sit normally, look forward, hold still for ~6 seconds.
4. Click **Start session** and work normally. The score updates live; sustained
   poor posture (default 45s) triggers a notification.

## Why it's built this way

- **Pose detection runs entirely in the browser** (`@mediapipe/tasks-vision`,
  `PoseLandmarker`, WebAssembly) — no GPU server, no per-frame network call,
  video never leaves the device.
- **Calibration, not a fixed threshold.** Posture "good" is relative to your
  own body proportions and camera placement, so the score is a deviation from
  *your* baseline, not a universal angle.
- **Samples every ~5s, not every frame**, keep the database small — a 2-hour
  session is ~100 rows, not 200,000.
- **`neckAngle` is a 2D front-camera proxy.** Forward-head posture is really a
  depth change toward the screen, which a single frontal camera can't observe
  directly. See the comment in `frontend/src/lib/posture/metrics.ts` — using
  MediaPipe's `worldLandmarks`, or adding a side-view companion camera, are
  the two ways to make this more precise if you extend the project.

## What's fully built vs. left as an extension point

**Built:** live detection + skeleton overlay, calibration, composite scoring,
sustained-bad-posture notifications (browser + in-app + sound), session
tracking and persistence, dashboard, trend + issue-breakdown charts, session
history with CSV export and print-to-PDF, streaks, badges, weekly goals,
Pomodoro timer, JWT auth, dark mode, responsive layout.

**Deliberately not built** (documented, not guessed at, since I couldn't test
them) — these were flagged as stretch/optional from the start:

- **Second camera (side view).** Don't try to stream raw video between
  devices — that's a real WebRTC undertaking. The tractable version: run this
  same web app on the phone in a "companion" mode, let it do its own
  on-device pose detection, and POST just its computed angles to
  `/sessions/{id}/sample` tagged with the same session ID. The backend and
  schema already support this (`device_info` on `WorkSession`); it just needs
  a companion-mode screen and a way to pair phone + laptop to one session
  (a short-lived join code is the simplest approach).
- **LLM-generated weekly narrative tips.** The rule-based tips ("your #1
  issue this week is X") are easy to derive from `/analytics/summary` and
  intentionally left for you to add as a small component — deterministic and
  safe for a live demo. If you want the AI version, add an endpoint that
  sends that same summary JSON to an LLM API and returns a short paragraph;
  cache it (don't call it live during a demo).
- **Posture heatmap** (by hour/day). The data's already there in
  `posture_samples` — this is a Recharts `<ScatterChart>` or a small custom
  grid away, not a backend change.

## Project structure

```
postura/
├── backend/            FastAPI + SQLModel + SQLite (see backend/app/)
├── frontend/            React + Vite + TypeScript + Tailwind
└── README.md            you are here
```

## Before you demo or submit

- `getUserMedia` (camera access) only works on `localhost` or over HTTPS —
  test your actual deploy URL, not just local dev, before demo day.
- Run `seed_demo_data.py` so analytics/history aren't empty on screen.
- Test in Chrome or Edge first — best WebAssembly + camera support.
- Have a 60–90s screen recording of a working session as a backup in case of
  wifi/projector issues live.
