import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base


Base_dir=Path(__file__).resolve().parent
load_dotenv(Base_dir / ".env")
Database_url=os.getenv("DATABASE_URL")

if not Database_url:
    raise ValueError("DATABASE_URL environment variable is not set.")

engine=create_engine(Database_url)

SessionLocal=sessionmaker(autocommit=False,autoflush=False,bind=engine)
Base=declarative_base()


def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()