from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CalibrationProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    baseline_neck_angle: float
    baseline_shoulder_tilt: float
    baseline_torso_lean: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)


class WorkSession(SQLModel, table=True):
    """A single tracked work session. Named WorkSession (not Session) to avoid
    colliding with SQLModel/SQLAlchemy's own Session class used throughout the app."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    start_time: datetime
    end_time: Optional[datetime] = None
    avg_score: Optional[float] = None
    duration_seconds: Optional[int] = None
    device_info: Optional[str] = None  # JSON string, e.g. {"secondary_camera": false}


class PostureSample(SQLModel, table=True):
    """One row every ~5-10s of a session (NOT per-frame) to keep the table small."""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="worksession.id", index=True)
    timestamp: datetime
    score: float
    neck_angle: float
    shoulder_tilt: float
    torso_lean: float
    issue_flags: Optional[str] = None  # JSON string list, e.g. ["forward_head"]


class Achievement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    badge_type: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)


class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    target_avg_score: float
    period: str  # "daily" | "weekly"
    start_date: datetime
    end_date: datetime
    achieved: bool = Field(default=False)


class Streak(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    current_streak_days: int = Field(default=0)
    longest_streak_days: int = Field(default=0)
    last_active_date: Optional[datetime] = None
