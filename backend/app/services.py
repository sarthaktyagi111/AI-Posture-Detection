from datetime import datetime, timedelta

from sqlmodel import Session as DBSession, select

from .models import Achievement, Streak, User, WorkSession

BADGE_RULES = {
    "first_session": lambda ctx: ctx["total_sessions"] == 1,
    "perfect_session": lambda ctx: ctx["session"].avg_score is not None
    and ctx["session"].avg_score >= 90,
    "week_streak": lambda ctx: ctx["streak"].current_streak_days >= 7,
    "consistency_king": lambda ctx: ctx["sessions_this_week"] >= 5,
    "century_club": lambda ctx: ctx["total_sessions"] >= 100,
}


def update_streak(db: DBSession, user: User) -> Streak:
    streak = db.get(Streak, user.id)
    if not streak:
        streak = Streak(user_id=user.id, current_streak_days=0, longest_streak_days=0)

    today = datetime.utcnow().date()
    last = streak.last_active_date.date() if streak.last_active_date else None

    if last == today:
        pass  # already counted today
    elif last == today - timedelta(days=1):
        streak.current_streak_days += 1
    else:
        streak.current_streak_days = 1

    streak.longest_streak_days = max(streak.longest_streak_days, streak.current_streak_days)
    streak.last_active_date = datetime.utcnow()
    db.add(streak)
    db.commit()
    db.refresh(streak)
    return streak


def evaluate_achievements(db: DBSession, user: User, session: WorkSession) -> list[str]:
    """Called when a session ends. Updates streak, checks badge rules, returns newly earned badges."""
    streak = update_streak(db, user)

    all_sessions = db.exec(select(WorkSession).where(WorkSession.user_id == user.id)).all()
    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = [s for s in all_sessions if s.start_time >= week_ago]

    already_earned = {
        a.badge_type for a in db.exec(select(Achievement).where(Achievement.user_id == user.id)).all()
    }

    ctx = {
        "session": session,
        "streak": streak,
        "total_sessions": len(all_sessions),
        "sessions_this_week": len(sessions_this_week),
    }

    newly_earned = []
    for badge, rule in BADGE_RULES.items():
        if badge not in already_earned and rule(ctx):
            db.add(Achievement(user_id=user.id, badge_type=badge))
            newly_earned.append(badge)
    if newly_earned:
        db.commit()
    return newly_earned
