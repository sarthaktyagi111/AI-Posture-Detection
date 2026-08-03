import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select

from ..auth import get_current_user
from ..db import get_session
from ..models import PostureSample, User, WorkSession
from ..schemas import SampleIn, SessionOut
from ..services import evaluate_achievements

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionOut)
def start_session(db: DBSession = Depends(get_session), user: User = Depends(get_current_user)):
    session = WorkSession(user_id=user.id, start_time=datetime.utcnow())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/sample")
def add_sample(
    session_id: int,
    sample: SampleIn,
    db: DBSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    work_session = db.get(WorkSession, session_id)
    if not work_session or work_session.user_id != user.id:
        raise HTTPException(404, "Session not found")

    db.add(
        PostureSample(
            session_id=session_id,
            timestamp=datetime.utcnow(),
            score=sample.score,
            neck_angle=sample.neck_angle,
            shoulder_tilt=sample.shoulder_tilt,
            torso_lean=sample.torso_lean,
            issue_flags=json.dumps(sample.issues),
        )
    )
    db.commit()
    return {"ok": True}


@router.post("/{session_id}/end", response_model=SessionOut)
def end_session(
    session_id: int, db: DBSession = Depends(get_session), user: User = Depends(get_current_user)
):
    work_session = db.get(WorkSession, session_id)
    if not work_session or work_session.user_id != user.id:
        raise HTTPException(404, "Session not found")

    samples = db.exec(
        select(PostureSample).where(PostureSample.session_id == session_id)
    ).all()
    work_session.end_time = datetime.utcnow()
    work_session.duration_seconds = int(
        (work_session.end_time - work_session.start_time).total_seconds()
    )
    work_session.avg_score = (
        sum(s.score for s in samples) / len(samples) if samples else None
    )
    db.add(work_session)
    db.commit()
    db.refresh(work_session)

    evaluate_achievements(db, user, work_session)
    return work_session


@router.get("", response_model=list[SessionOut])
def list_sessions(db: DBSession = Depends(get_session), user: User = Depends(get_current_user)):
    return db.exec(
        select(WorkSession)
        .where(WorkSession.user_id == user.id)
        .order_by(WorkSession.start_time.desc())
    ).all()
