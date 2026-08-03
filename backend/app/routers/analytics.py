import json
from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session as DBSession, select

from ..auth import get_current_user
from ..db import get_session
from ..models import PostureSample, User, WorkSession

router = APIRouter(prefix="/analytics", tags=["analytics"])

PERIOD_DAYS = {"daily": 1, "weekly": 7, "monthly": 30}


@router.get("/summary")
def summary(
    period: str = Query("weekly"),
    db: DBSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    days = PERIOD_DAYS.get(period, 7)
    since = datetime.utcnow() - timedelta(days=days)

    sessions = db.exec(
        select(WorkSession).where(
            WorkSession.user_id == user.id,
            WorkSession.start_time >= since,
            WorkSession.end_time.isnot(None),
        )
    ).all()

    by_day: dict[str, list[float]] = {}
    for s in sessions:
        day = s.start_time.date().isoformat()
        by_day.setdefault(day, []).append(s.avg_score or 0)

    trend = [
        {"date": day, "avgScore": round(sum(scores) / len(scores), 1)}
        for day, scores in sorted(by_day.items())
    ]

    issue_counter: Counter = Counter()
    for s in sessions:
        samples = db.exec(select(PostureSample).where(PostureSample.session_id == s.id)).all()
        for sample in samples:
            for issue in json.loads(sample.issue_flags or "[]"):
                issue_counter[issue] += 1

    total_issue_events = sum(issue_counter.values()) or 1
    issue_breakdown = [
        {"issue": issue, "percentage": round(count / total_issue_events * 100, 1)}
        for issue, count in issue_counter.most_common()
    ]

    best_day = (
        max(by_day.items(), key=lambda kv: sum(kv[1]) / len(kv[1]))[0] if by_day else None
    )

    return {
        "trend": trend,
        "issueBreakdown": issue_breakdown,
        "sessionsCount": len(sessions),
        "bestDay": best_day,
        "topIssue": issue_counter.most_common(1)[0][0] if issue_counter else None,
    }
