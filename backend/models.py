
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

if __package__:
    from .database import Base
else:
    from database import Base


class Video(Base):

    __tablename__ = "videos"

    upload_id = Column(
        String,
        primary_key=True,
        index=True
    )

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    status = Column(
        String,
        default="uploaded",
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    analytics = relationship(
        "Analytics",
        back_populates="video",
        uselist=False,
        cascade="all, delete-orphan"
    )

    traffic_density = relationship(
        "TrafficDensity",
        back_populates="video",
        uselist=False,
        cascade="all, delete-orphan"
    )


class Analytics(Base):

    __tablename__ = "analytics"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        String,
        ForeignKey("videos.upload_id"),
        unique=True,
        nullable=False
    )

    total_vehicles = Column(Integer, default=0)
    total_frames = Column(Integer, default=0)
    max_vehicles = Column(Integer, default=0)

    cars = Column(Integer, default=0)
    motorcycles = Column(Integer, default=0)
    buses = Column(Integer, default=0)
    trucks = Column(Integer, default=0)

    video = relationship(
        "Video",
        back_populates="analytics"
    )


class TrafficDensity(Base):

    __tablename__ = "traffic_density"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        String,
        ForeignKey("videos.upload_id"),
        unique=True,
        nullable=False
    )

    low_frames = Column(Integer, default=0)
    medium_frames = Column(Integer, default=0)
    high_frames = Column(Integer, default=0)

    video = relationship(
        "Video",
        back_populates="traffic_density"
    )
