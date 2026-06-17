from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import pose, food, plan

app = FastAPI(
    title="PoseNutri AI Service",
    description="Pose estimation (MediaPipe) + Food recognition (YOLO) + Plan generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(pose.router, prefix="/pose",      tags=["Pose Estimation"])
app.include_router(food.router, prefix="/food",      tags=["Food Recognition"])
app.include_router(plan.router, prefix="/plan",      tags=["Plan Generation"])

@app.get("/")
def root():
    return {"status": "ok", "service": "NutriForge AI"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "pose-nutri-ai"}
