from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class CalibrationIn(BaseModel):
    neck_angle: float
    shoulder_tilt: float
    torso_lean: float


class SampleIn(BaseModel):
    score: float
    neck_angle: float
    shoulder_tilt: float
    torso_lean: float
    issues: list[str] = []


class GoalIn(BaseModel):
    target_avg_score: float
    period: str = "weekly"


class SessionOut(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    avg_score: Optional[float] = None
    duration_seconds: Optional[int] = None

    class Config:
        from_attributes = True
