from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session as DBSession, select

from ..auth import get_current_user
from ..db import get_session
from ..models import Achievement, Goal, Streak, User
from ..schemas import GoalIn

router = APIRouter(tags=["achievements"])


@router.get("/achievements")
def list_achievements(db: DBSession = Depends(get_session), user: User = Depends(get_current_user)):
    return db.exec(select(Achievement).where(Achievement.user_id == user.id)).all()


@router.get("/achievements/streak")
def get_streak(db: DBSession = Depends(get_session), user: User = Depends(get_current_user)):
    streak = db.get(Streak, user.id)
    if not streak:
        return {"user_id": user.id, "current_streak_days": 0, "longest_streak_days": 0, "last_active_date": None}
    return streak


@router.post("/goals")
def create_goal(
    goal: GoalIn, db: DBSession = Depends(get_session), user: User = Depends(get_current_user)
):
    start = datetime.utcnow()
    end = start + timedelta(days=7 if goal.period == "weekly" else 1)
    g = Goal(
        user_id=user.id,
        target_avg_score=goal.target_avg_score,
        period=goal.period,
        start_date=start,
        end_date=end,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g


@router.get("/goals")
def list_goals(db: DBSession = Depends(get_session), user: User = Depends(get_current_user)):
    return db.exec(
        select(Goal).where(Goal.user_id == user.id).order_by(Goal.start_date.desc())
    ).all()
