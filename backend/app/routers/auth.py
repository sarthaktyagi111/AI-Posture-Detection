from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..db import get_session
from ..models import User
from ..schemas import Token, UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: DBSession = Depends(get_session)):
    existing = db.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(400, "Username already taken")
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: DBSession = Depends(get_session)):
    user = db.exec(select(User).where(User.username == payload.username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "email": user.email}
