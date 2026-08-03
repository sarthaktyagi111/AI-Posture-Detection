from fastapi import APIRouter, Depends
from sqlmodel import Session as DBSession, select

from ..auth import get_current_user
from ..db import get_session
from ..models import CalibrationProfile, User
from ..schemas import CalibrationIn

router = APIRouter(prefix="/calibration", tags=["calibration"])


@router.post("")
def save_calibration(
    data: CalibrationIn, db: DBSession = Depends(get_session), user: User = Depends(get_current_user)
):
    old = db.exec(
        select(CalibrationProfile).where(
            CalibrationProfile.user_id == user.id, CalibrationProfile.is_active == True  # noqa: E712
        )
    ).all()
    for o in old:
        o.is_active = False
        db.add(o)

    profile = CalibrationProfile(
        user_id=user.id,
        baseline_neck_angle=data.neck_angle,
        baseline_shoulder_tilt=data.shoulder_tilt,
        baseline_torso_lean=data.torso_lean,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/active")
def get_active_calibration(
    db: DBSession = Depends(get_session), user: User = Depends(get_current_user)
):
    return db.exec(
        select(CalibrationProfile).where(
            CalibrationProfile.user_id == user.id, CalibrationProfile.is_active == True  # noqa: E712
        )
    ).first()
