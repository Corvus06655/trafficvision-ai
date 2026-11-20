
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

import os
import uuid

from pathlib import Path

if __package__:
    from .database import engine, Base, SessionLocal
    from .models import Video, Analytics, TrafficDensity
    from .detector import process_video
else:
    from database import engine, Base, SessionLocal
    from models import Video, Analytics, TrafficDensity
    from detector import process_video


app = FastAPI(
    title="TrafficVision AI Backend",
    description="Backend for TrafficVision AI Application",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)


BASE_DIR = Path(__file__).resolve().parent.parent

upload_dir = BASE_DIR / "uploads"
output_dir = BASE_DIR / "outputs"

upload_dir.mkdir(exist_ok=True)
output_dir.mkdir(exist_ok=True)


MAX_SIZE = 500 * 1024 * 1024

ALLOWED_FORMATS = [".mp4", ".avi", ".mov", ".mkv"]


@app.get("/")
def home():

    return {
        "message": "TrafficVision AI Backend Running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/upload-video")
def upload_vid(file: UploadFile = File(...)):

    db = SessionLocal()
    file_path = None

    try:

        extension = Path(file.filename or "").suffix.lower()

        if extension not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail="Only MP4, AVI, MOV and MKV videos are allowed."
            )

        header = file.file.read(12)
        file.file.seek(0)

        is_mp4 = extension == ".mp4" and header[4:8] == b"ftyp"

        is_mov = extension == ".mov" and header[4:8] == b"ftyp"

        is_avi = (
            extension == ".avi"
            and header[:4] == b"RIFF"
            and header[8:12] == b"AVI "
        )

        is_mkv = (
            extension == ".mkv"
            and header[:4] == b"\x1a\x45\xdf\xa3"
        )

        if not (is_mp4 or is_mov or is_avi or is_mkv):
            raise HTTPException(
                status_code=400,
                detail="Invalid video file."
            )

        upload_id = str(uuid.uuid4())

        filename = upload_id + extension

        file_path = upload_dir / filename

        file_size = 0

        with open(file_path, "wb") as buffer:

            while True:

                chunk = file.file.read(1024 * 1024)

                if not chunk:
                    break

                file_size += len(chunk)

                if file_size > MAX_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File size exceeds 500 MB."
                    )

                buffer.write(chunk)

        video = Video(
            upload_id=upload_id,
            filename=filename,
            file_path=str(file_path),
            status="uploaded"
        )

        db.add(video)
        db.commit()

        return {
            "upload_id": upload_id,
            "filename": filename,
            "size_mb": round(file_size / (1024 * 1024), 2),
            "status": "uploaded",
            "message": "Video uploaded successfully"
        }

    except HTTPException:

        db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise

    except Exception:

        db.rollback()

        if file_path and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Unable to upload video"
        )

    finally:

        db.close()
        file.file.close()


@app.post("/process-video/{upload_id}")
def process_uploaded_video(upload_id: str):

    try:

        upload_id = str(uuid.UUID(upload_id))

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid upload ID"
        )

    db = SessionLocal()

    output_path = output_dir / f"{upload_id}_processed.mp4"

    try:

        video = db.query(Video).filter(
            Video.upload_id == upload_id
        ).first()

        if video is None:

            raise HTTPException(
                status_code=404,
                detail="Uploaded video not found"
            )

        if video.status == "processing":

            raise HTTPException(
                status_code=409,
                detail="Video is already processing"
            )

        input_path = Path(video.file_path)

        if not input_path.exists():

            raise HTTPException(
                status_code=404,
                detail="Video file not found"
            )

        video.status = "processing"

        db.commit()

        analytics = process_video(
            input_path,
            output_path
        )

        vehicle_counts = analytics["vehicle_counts"]

        density_counts = analytics["density_count"]

        analytics_record = db.query(Analytics).filter(
            Analytics.video_id == upload_id
        ).first()

        if analytics_record is None:

            analytics_record = Analytics(
                video_id=upload_id
            )

            db.add(analytics_record)

        analytics_record.total_vehicles = analytics["total_vehicles"]
        analytics_record.total_frames = analytics["total_frames"]
        analytics_record.max_vehicles = analytics["max_vehicles"]

        analytics_record.cars = vehicle_counts.get("car", 0)
        analytics_record.motorcycles = vehicle_counts.get("motorcycle", 0)
        analytics_record.buses = vehicle_counts.get("bus", 0)
        analytics_record.trucks = vehicle_counts.get("truck", 0)

        density_record = db.query(TrafficDensity).filter(
            TrafficDensity.video_id == upload_id
        ).first()

        if density_record is None:

            density_record = TrafficDensity(
                video_id=upload_id
            )

            db.add(density_record)

        density_record.low_frames = density_counts.get("LOW", 0)
        density_record.medium_frames = density_counts.get("MEDIUM", 0)
        density_record.high_frames = density_counts.get("HIGH", 0)

        video.status = "completed"

        db.commit()

        return {
            "message": "Video processed successfully",
            "upload_id": upload_id,
            "status": "completed",
            "analytics": analytics,
            "video_url": f"/processed-video/{upload_id}"
        }

    except HTTPException:

        db.rollback()
        raise

    except Exception:

        db.rollback()

        try:

            video = db.query(Video).filter(
                Video.upload_id == upload_id
            ).first()

            if video is not None:

                video.status = "failed"
                db.commit()

        except Exception:

            db.rollback()

        if output_path.exists():
            output_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Video processing failed"
        )

    finally:

        db.close()


@app.get("/processed-video/{upload_id}")
def get_processed_video(upload_id: str):

    try:

        upload_id = str(uuid.UUID(upload_id))

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid upload ID"
        )

    video_path = output_dir / f"{upload_id}_processed.mp4"

    if not video_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Processed video not found"
        )

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=video_path.name
    )
