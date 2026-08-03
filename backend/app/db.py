import os
from sqlmodel import SQLModel, create_engine, Session as DBSession

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./posture.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with DBSession(engine) as session:
        yield session
