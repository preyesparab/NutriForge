import io
import cv2
import numpy as np
import mediapipe as mp
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter()

mp_pose = mp.solutions.pose
pose_detector = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)


@router.post("/analyze")
async def analyze_pose(file: UploadFile = File(...)):
    """Accept a single frame (JPEG/PNG) and return 33 MediaPipe landmarks."""
    data = await file.read()
    nparr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = pose_detector.process(rgb)
    if not results.pose_landmarks:
        return JSONResponse({"detected": False, "landmarks": []})

    landmarks = [
        {
            "index": i,
            "name":  mp_pose.PoseLandmark(i).name,
            "x": lm.x, "y": lm.y, "z": lm.z,
            "visibility": lm.visibility,
        }
        for i, lm in enumerate(results.pose_landmarks.landmark)
    ]
    return {"detected": True, "landmarks": landmarks}
