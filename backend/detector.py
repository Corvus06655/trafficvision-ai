
from ultralytics import YOLO
import cv2
from pathlib import Path
import imageio_ffmpeg
import subprocess
import easyocr
import re
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "yolo11n.pt"
plate_model_path = BASE_DIR / "license_plate_model.pt"

model = YOLO(str(MODEL_PATH))
plate_model = YOLO(str(plate_model_path))

VEHICLE_CLASSES = [2, 3, 5, 7]

reader = easyocr.Reader(["en"], gpu=False)




def clean_plate_number(text):
    return re.sub(r"[^A-Z0-9]", "", (text or "").upper())


def preprocess_plate(plate_crop):

    if plate_crop is None or plate_crop.size == 0:
        return []

    height, width = plate_crop.shape[:2]

    if height == 0 or width == 0:
        return []

    scale = max(2, min(4, 160 // max(height, 1)))

    enlarged = cv2.resize(
        plate_crop,
        (width * scale, height * scale),
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    thresholded = cv2.threshold(
        enhanced,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    return [enhanced, thresholded]


def read_plate_text(plate_crop):

    candidates = []

    for image in preprocess_plate(plate_crop):

        ocr_results = reader.readtext(
            image,
            detail=1,
            paragraph=False,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        )

        for item in ocr_results:

            number = clean_plate_number(item[1])
            confidence = float(item[2])

            if confidence < 0.20:
                continue

            if number:
                candidates.append((number,confidence))

    return candidates


def find_vehicle_for_plate(plate_box, tracked_vehicles):

    x1, y1, x2, y2 = plate_box

    center_x = (x1 + x2) // 2
    center_y = (y1 + y2) // 2

    matched_vehicles = []

    for track_id, vehicle_box in tracked_vehicles:

        vx1, vy1, vx2, vy2 = vehicle_box

        if (
            vx1 <= center_x <= vx2
            and vy1 <= center_y <= vy2
        ):

            area = max(1, (vx2 - vx1) * (vy2 - vy1))

            matched_vehicles.append((area, track_id))

    if not matched_vehicles:
        return None

    matched_vehicles.sort(key=lambda item: item[0])

    return matched_vehicles[0][1]


def process_video(video_path, output_path):

    video_path = Path(video_path)
    output_path = Path(output_path)

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise ValueError("Unable to open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    cap.release()

    if fps <= 0:
        fps = 25

    output_path.parent.mkdir(parents=True, exist_ok=True)

    avi_path = output_path.with_suffix(".avi")

    writer = cv2.VideoWriter(
        str(avi_path),
        cv2.VideoWriter_fourcc(*"XVID"),
        fps,
        (width, height)
    )

    if not writer.isOpened():
        raise RuntimeError("Unable to create output video")

    vehicle_counts = {}
    density_count = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    frame_counts = []

   
    plate_votes = defaultdict(lambda: defaultdict(float))
    plate_observations = defaultdict(int)
    plate_best_confidence = defaultdict(float)

    try:

        results = model.track(
            source=str(video_path),
            classes=VEHICLE_CLASSES,
            conf=0.15,
            tracker=str(Path(__file__).resolve().parent / "bytetracker_custom.yaml"),
            persist=True,
            stream=True,
            save=False,
            verbose=False
        )

        for result in results:

            # Original frame for clean plate detection
            original_frame = result.orig_img.copy()

            # Annotated frame for output video
            frame = result.plot()

            count = 0
            tracked_vehicles = []

            if (
                result.boxes is not None
                and result.boxes.id is not None
            ):

                ids = result.boxes.id.int().cpu().tolist()
                classes = result.boxes.cls.int().cpu().tolist()
                boxes = result.boxes.xyxy.int().cpu().tolist()

                count = len(ids)

                for track_id, cls, vehicle_box in zip(
                    ids, classes, boxes
                ):

                    vehicle_counts[track_id] = model.names[cls]

                    tracked_vehicles.append(
                        (track_id, vehicle_box)
                    )

            frame_counts.append(count)

            if count <= 5:
                density = "LOW"

            elif count <= 9:
                density = "MEDIUM"

            else:
                density = "HIGH"

            density_count[density] += 1

           
            plate_results = plate_model.predict(
                original_frame,
                conf=0.4,
                verbose=False,
                imgsz=960
            )

            for plate_result in plate_results:

                if plate_result.boxes is None:
                    continue

                for box in plate_result.boxes:

                    x1, y1, x2, y2 = map(
                        int, box.xyxy[0].tolist()
                    )

                    # Crop boundaries
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(width, x2)
                    y2 = min(height, y2)

                    if x2 <= x1 or y2 <= y1:
                        continue

                    vehicle_id = find_vehicle_for_plate(
                        (x1, y1, x2, y2),
                        tracked_vehicles
                    )

                    if vehicle_id is None:
                        continue

                    # OCR on original plate crop
                    plate_crop = original_frame[y1:y2, x1:x2]

                    candidates = read_plate_text(plate_crop)

                    for number, confidence in candidates:

                        plate_votes[vehicle_id][number] += confidence

                        plate_observations[vehicle_id] += 1

                        plate_best_confidence[vehicle_id] = max(
                            plate_best_confidence[vehicle_id],
                            confidence
                        )

            cv2.putText(
                frame,
                f"Vehicles: {count}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                f"Density: {density}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 255),
                2
            )

            writer.write(frame)

    finally:
        writer.release()

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    subprocess.run([
        ffmpeg,
        "-y",
        "-i", str(avi_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_path)
    ], check=True)

    avi_path.unlink(missing_ok=True)

    vehicle = {
        "car": 0,
        "motorcycle": 0,
        "bus": 0,
        "truck": 0
    }

    for name in vehicle_counts.values():

        if name in vehicle:
            vehicle[name] += 1

    # Final number selection using confidence-weighted voting
    license_plates = []

    for vehicle_id, votes in plate_votes.items():

        if not votes:
            continue

        final_number = max(votes, key=votes.get)

        total_score = sum(votes.values())

        confidence = (
            votes[final_number] / max(total_score, 1e-9)
        )

        if confidence < 0.55:
            continue

        license_plates.append({

            "vehicle_id": int(vehicle_id),

            "number": final_number,

            "number_plate": final_number,

            "confidence": round(
                min(
                    1.0,
                    confidence * plate_best_confidence[vehicle_id]
                ),
                4
            )
        })

    # Print each vehicle only once
    for item in license_plates:

        print(
            "Vehicle ID:", item["vehicle_id"],
            "Final Plate:", item["number"],
            "Confidence:", item["confidence"]
        )

    return {

        "total_vehicles": len(vehicle_counts),

        "vehicle_counts": vehicle,

        "total_frames": len(frame_counts),

        "max_vehicles": max(frame_counts, default=0),

        "density_count": density_count,

        "license_plates": license_plates,

        "output_video": str(output_path)
    }
