# TrafficVision AI

TrafficVision AI is a local web application for analyzing traffic videos. A React/Vite dashboard uploads a video to a FastAPI backend. The backend uses YOLO and ByteTrack to detect and track cars, motorcycles, buses, and trucks, estimates frame-level traffic density, attempts license-plate detection/OCR, and returns an annotated MP4 with analytics.

## Project layout

- `backend/main.py` — FastAPI endpoints for health checks, uploads, processing, and processed-video downloads.
- `backend/detector.py` — video processing, vehicle tracking, traffic-density labels, plate detection, and OCR.
- `backend/models.py`, `backend/database.py` — SQLAlchemy models and database setup.
- `backend/bytetracker_custom.yaml` — ByteTrack configuration.
- `trafficvision-frontend/` — React dashboard and Vite development server.
- `yolo11n.pt`, `license_plate_model.pt` — model weights expected by the backend.
- `detect.py` — small standalone YOLO smoke-test script; it is not the web-app server.

## Requirements

- Python 3.10+ and a working PyTorch/Ultralytics installation compatible with your machine.
- Node.js and npm.
- A SQLAlchemy-compatible database URL. SQLite can be used for local development.

## Run locally

From the repository root, create and activate a Python virtual environment, then install the backend packages:

```bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn python-multipart python-dotenv sqlalchemy ultralytics opencv-python easyocr imageio-ffmpeg
```

Create `backend/.env` locally (this file is intentionally excluded from Git) and set a database URL, for example:

```dotenv
DATABASE_URL=sqlite:///./trafficvision.db
```

Start the backend from the repository root:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

In another terminal, install and start the frontend:

```bash
cd trafficvision-frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The development proxy forwards `/api` requests to the backend on port 8001. For deployment, configure an equivalent reverse proxy or set `VITE_API_URL` to the backend API base URL.

## Notes

- Processing runs synchronously in the API request; large videos can take a long time.
- Density is a frame-count heuristic: LOW = 0–5, MEDIUM = 6–9, HIGH = 10+ detected vehicles.
- License-plate OCR is an estimate and should be verified against the source video.
- Keep `backend/.env` and uploaded videos private. The API currently has no user authentication or upload-history/deletion endpoint.
