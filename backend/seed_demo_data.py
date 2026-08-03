"""
Seeds ~4 weeks of realistic-looking session history for a 'demo' account.
This is the single highest-leverage thing you can do before a demo or
screenshotting your report: a brand-new app with zero history looks like
a prototype, not a semester-long product.

Run from the backend/ folder with the venv active:
    python seed_demo_data.py

Login: username "demo", password "demo1234"
"""
import json
import random
from datetime import datetime, timedelta

from sqlmodel import Session as DBSession, select

from app.auth import hash_password
from app.db import engine, init_db
from app.models import Achievement, CalibrationProfile, PostureSample, Streak, User, WorkSession

DEMO_USERNAME = "demo"
ISSUES = ["forward_head", "shoulder_imbalance", "slouching_or_leaning"]


def seed():
    init_db()
    with DBSession(engine) as db:
        user = db.exec(select(User).where(User.username == DEMO_USERNAME)).first()
        if not user:
            user = User(
                username=DEMO_USERNAME,
                email="demo@postura.app",
                password_hash=hash_password("demo1234"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        db.add(
            CalibrationProfile(
                user_id=user.id,
                baseline_neck_angle=8.0,
                baseline_shoulder_tilt=2.0,
                baseline_torso_lean=4.0,
            )
        )

        today = datetime.utcnow()
        streak_days = 0

        for day_offset in range(27, -1, -1):
            day = today - timedelta(days=day_offset)
            if day.weekday() >= 5 and random.random() < 0.4:
                continue  # skip some weekends, like a real person

            for _ in range(random.choice([1, 1, 2])):
                start_hour = random.choice([9, 10, 14, 15, 16])
                start = day.replace(
                    hour=start_hour, minute=random.randint(0, 59), second=0, microsecond=0
                )
                duration_min = random.randint(25, 110)
                end = start + timedelta(minutes=duration_min)

                # slight improvement trend over the month, like a real habit forming
                base_quality = random.uniform(0.55, 0.9) + (0.05 if day_offset < 10 else 0)

                session = WorkSession(
                    user_id=user.id,
                    start_time=start,
                    end_time=end,
                    duration_seconds=duration_min * 60,
                )
                db.add(session)
                db.commit()
                db.refresh(session)

                scores = []
                n_samples = max(3, duration_min // 5)
                for i in range(n_samples):
                    drift = random.uniform(-0.15, 0.15)
                    fatigue = (i / n_samples) * -0.1  # posture drifts worse over a session
                    score = max(20, min(100, (base_quality + drift + fatigue) * 100))
                    scores.append(score)
                    issues = [iss for iss in ISSUES if random.random() < (1 - score / 100) * 0.6]
                    db.add(
                        PostureSample(
                            session_id=session.id,
                            timestamp=start + timedelta(minutes=i * 5),
                            score=score,
                            neck_angle=8 + random.uniform(-3, 6),
                            shoulder_tilt=2 + random.uniform(-2, 4),
                            torso_lean=4 + random.uniform(-3, 6),
                            issue_flags=json.dumps(issues),
                        )
                    )
                session.avg_score = sum(scores) / len(scores)
                db.add(session)
            streak_days += 1

        db.commit()

        streak = db.get(Streak, user.id) or Streak(user_id=user.id)
        streak.current_streak_days = min(streak_days, 12)
        streak.longest_streak_days = max(streak.current_streak_days, 14)
        streak.last_active_date = today
        db.add(streak)

        existing_badges = {a.badge_type for a in db.exec(
            select(Achievement).where(Achievement.user_id == user.id)
        ).all()}
        for badge in ["first_session", "week_streak", "consistency_king"]:
            if badge not in existing_badges:
                db.add(
                    Achievement(
                        user_id=user.id,
                        badge_type=badge,
                        earned_at=today - timedelta(days=random.randint(1, 20)),
                    )
                )

        db.commit()
        print(f"Seeded ~4 weeks of demo data for user '{DEMO_USERNAME}' (password: demo1234)")


if __name__ == "__main__":
    seed()
