from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import achievements, analytics, auth, calibration, notifications, sessions

app = FastAPI(title="Postura API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(auth.router)
app.include_router(calibration.router)
app.include_router(sessions.router)
app.include_router(analytics.router)
app.include_router(achievements.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "postura-api"}
