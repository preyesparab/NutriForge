from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class UserProfile(BaseModel):
    age: int
    weight_kg: float
    height_cm: float
    goal: str           # e.g. "weight_loss", "muscle_gain", "maintenance"
    fitness_level: str  # e.g. "beginner", "intermediate", "advanced"
    days_per_week: int
    equipment: Optional[List[str]] = []


@router.post("/generate")
def generate_plan(profile: UserProfile):
    """
    Rule-based plan generator (stub).
    Replace with LLM call (e.g. OpenAI) or more sophisticated logic.
    """
    plan = {
        "goal": profile.goal,
        "weeks": 8,
        "weekly_schedule": [],
        "notes": "This is a stub — integrate LLM or rule engine here.",
    }
    return {"success": True, "plan": plan}
