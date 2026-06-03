"""
food.py — YOLOv8 food detection + USDA FoodData Central nutrition lookup
Fixes: deduplication, non-food class filtering, smarter USDA mapping.
"""
import os
import io
import base64
import asyncio
import requests
import numpy as np
import cv2
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image

router = APIRouter()

# ── ENV ───────────────────────────────────────────────────────────────────────
USDA_API_KEY         = os.getenv("USDA_API_KEY") or os.getenv("FOOD_DATASET_API", "DEMO_KEY")
MODEL_PATH           = os.getenv("FOOD_MODEL_PATH", "models/food_yolov8n.pt")
CONFIDENCE_THRESHOLD = 0.40

# ── COCO classes that are containers/utensils — NOT nutritional food items ────
# When yolov8n detects these, we skip the USDA lookup entirely.
# "bowl" → USDA returns "Chili with beans" which is wrong.
NON_FOOD_COCO = {
    "bowl", "cup", "bottle", "wine glass", "fork", "knife", "spoon",
    "plate", "dining table", "chair", "couch", "vase", "scissors",
    "refrigerator", "oven", "microwave", "toaster", "sink",
    "person", "cat", "dog", "bird", "background",
}

# ── COCO class → better USDA search query ────────────────────────────────────
# The COCO class name is often too generic.  Map to a more specific term.
COCO_TO_USDA_QUERY = {
    "banana":    "banana raw",
    "apple":     "apple raw with skin",
    "sandwich":  "sandwich turkey",
    "orange":    "orange raw",
    "broccoli":  "broccoli raw",
    "carrot":    "carrot raw",
    "hot dog":   "frankfurter beef",
    "pizza":     "pizza cheese",
    "donut":     "doughnut glazed",
    "cake":      "cake chocolate",
}

# ── Lazy-loaded model ─────────────────────────────────────────────────────────
_model = None

def get_model() -> YOLO:
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            print(f"[food] Loading local model: {MODEL_PATH}")
            _model = YOLO(MODEL_PATH)
        else:
            print("[food] Trying HuggingFace food model…")
            try:
                from huggingface_hub import hf_hub_download
                weights = hf_hub_download(
                    repo_id="keremberke/yolov8m-food-detection",
                    filename="best.pt",
                )
                _model = YOLO(weights)
                os.makedirs("models", exist_ok=True)
                import shutil
                shutil.copy(weights, MODEL_PATH)
                print(f"[food] Cached to {MODEL_PATH}")
            except Exception as e:
                print(f"[food] HuggingFace failed ({e}). Using yolov8n.")
                _model = YOLO("yolov8n.pt")
    return _model


# ── USDA lookup ───────────────────────────────────────────────────────────────
NUTRIENT_ID_MAP = {
    1008: "calories",
    1003: "protein",
    1004: "fat",
    1005: "carbs",
    1079: "fiber",
    2000: "sugar",
}
EMPTY_MACROS = {"calories": 0.0, "protein": 0.0, "fat": 0.0,
                "carbs": 0.0, "fiber": 0.0, "sugar": 0.0}


async def fetch_usda(query: str) -> tuple:
    """Return (macros_dict, display_name) for a food query."""
    try:
        resp = await asyncio.to_thread(
            requests.get,
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={
                "api_key":  USDA_API_KEY,
                "query":    query,
                "dataType": "Foundation,SR Legacy",
                "pageSize": 1,
            },
            timeout=8,
        )
        resp.raise_for_status()
        foods = resp.json().get("foods", [])
        if not foods:
            return EMPTY_MACROS.copy(), query

        food_item    = foods[0]
        display_name = food_item.get("description", query)
        macros       = EMPTY_MACROS.copy()
        for n in food_item.get("foodNutrients", []):
            key = NUTRIENT_ID_MAP.get(n.get("nutrientId"))
            if key:
                macros[key] = round(float(n.get("value", 0)), 2)
        return macros, display_name

    except Exception as e:
        print(f"[USDA] Error for '{query}': {e}")
        return EMPTY_MACROS.copy(), query


# ── Portion estimation (4-tier) ───────────────────────────────────────────────
def estimate_grams(bbox: list, img_w: int, img_h: int) -> int:
    x1, y1, x2, y2 = bbox
    ratio = ((x2 - x1) * (y2 - y1)) / (img_w * img_h) if img_w * img_h > 0 else 0
    if ratio < 0.10:  return 60
    if ratio < 0.20:  return 100
    if ratio < 0.35:  return 150
    return 220


def scale_macros(macros: dict, grams: int) -> dict:
    f = grams / 100.0
    return {k: round(v * f, 1) for k, v in macros.items()}


# ── Image annotation ──────────────────────────────────────────────────────────
def draw_corner_boxes(img_bgr: np.ndarray, detections: list) -> np.ndarray:
    out    = img_bgr.copy()
    CYAN   = (238, 211, 34)   # BGR for #22D3EE
    CORNER = 14
    THICK  = 2

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        short = (det.get("display_name") or det["name"]).split(",")[0].strip()[:24]
        label = f"{short}  {det['confidence']*100:.0f}%  ~{det['estimated_grams']}g"

        for (px, py), (dx, dy) in [
            ((x1, y1), (CORNER, 0)), ((x1, y1), (0, CORNER)),
            ((x2, y1), (-CORNER, 0)), ((x2, y1), (0, CORNER)),
            ((x1, y2), (CORNER, 0)), ((x1, y2), (0, -CORNER)),
            ((x2, y2), (-CORNER, 0)), ((x2, y2), (0, -CORNER)),
        ]:
            cv2.line(out, (px, py), (px + dx, py + dy), CYAN, THICK)

        font, fs = cv2.FONT_HERSHEY_DUPLEX, 0.40
        (tw, th), _ = cv2.getTextSize(label, font, fs, 1)
        pad = 5
        cx1, cy1 = x1, max(0, y1 - th - pad * 2 - 2)
        cx2, cy2 = x1 + tw + pad * 2, y1 - 2
        overlay = out.copy()
        cv2.rectangle(overlay, (cx1, cy1), (cx2, cy2), (37, 99, 235), -1)
        cv2.addWeighted(overlay, 0.82, out, 0.18, 0, out)
        cv2.rectangle(out, (cx1, cy1), (cx2, cy2), CYAN, 1)
        cv2.putText(out, label, (cx1 + pad, cy2 - 3), font, fs,
                    (255, 255, 255), 1, cv2.LINE_AA)

    return out


def encode_image(img_bgr: np.ndarray) -> str:
    _, buf = cv2.imencode(".jpg", img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return base64.b64encode(buf).decode("utf-8")


# ── Main endpoint ─────────────────────────────────────────────────────────────
@router.post("/analyze")
async def analyze_food(file: UploadFile = File(...)):
    raw   = await file.read()
    pil   = Image.open(io.BytesIO(raw)).convert("RGB")
    img_w, img_h = pil.size
    img_bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    model   = get_model()
    results = model(pil, conf=CONFIDENCE_THRESHOLD)[0]

    # 1. Collect all raw detections
    raw_dets = []
    for box in results.boxes:
        name = model.names[int(box.cls[0])]
        conf = float(box.conf[0])
        bbox = box.xyxy[0].tolist()
        raw_dets.append({"name": name, "confidence": conf, "bbox": bbox})

    # 2. Deduplicate: keep only the highest-confidence box per class
    best: dict = {}
    for det in raw_dets:
        cls = det["name"]
        if cls not in best or det["confidence"] > best[cls]["confidence"]:
            best[cls] = det
    raw_dets = list(best.values())

    # 3. Split into food vs non-food; skip nutrition for containers/utensils
    food_dets = [d for d in raw_dets if d["name"].lower() not in NON_FOOD_COCO]

    if not food_dets:
        return JSONResponse({
            "detected_foods":   [],
            "totals":           EMPTY_MACROS.copy(),
            "image_with_boxes": encode_image(draw_corner_boxes(img_bgr, [])),
            "message": (
                "No specific food items were detected — only containers or "
                "utensils were found. Please upload a clearer photo of the food."
            ),
        })

    # 4. Add portion estimates
    for det in food_dets:
        det["grams"] = estimate_grams(det["bbox"], img_w, img_h)

    # 5. Parallel USDA lookups using mapped queries
    usda_results = await asyncio.gather(*[
        fetch_usda(COCO_TO_USDA_QUERY.get(d["name"].lower(), d["name"]))
        for d in food_dets
    ])

    # 6. Compose final result
    detected_foods = []
    totals         = EMPTY_MACROS.copy()

    for det, (macros100g, display_name) in zip(food_dets, usda_results):
        portion = scale_macros(macros100g, det["grams"])
        detected_foods.append({
            "name":            det["name"],
            "display_name":    display_name,
            "confidence":      round(det["confidence"], 3),
            "estimated_grams": det["grams"],
            "bbox":            [round(v, 1) for v in det["bbox"]],
            "nutrition":       portion,
        })
        for k in totals:
            totals[k] = round(totals[k] + portion[k], 1)

    annotated = draw_corner_boxes(img_bgr, detected_foods)

    return JSONResponse({
        "detected_foods":   detected_foods,
        "totals":           totals,
        "image_with_boxes": encode_image(annotated),
    })


@router.post("/recognize")
async def recognize_food(file: UploadFile = File(...)):
    return await analyze_food(file)
