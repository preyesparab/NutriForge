// ── AI Plan Generator Controller ─────────────────────────────────────────────
// Uses @google/genai with gemini-2.5-flash.
// Requires: GEMINI_API_KEY in server/.env
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /api/ai/generate-plan
 * Body: { weight, goal, timeframeWeeks, dietaryPreference }
 */
exports.generatePlan = async (req, res) => {
  const { weight, goal, timeframeWeeks, dietaryPreference } = req.body;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!weight || !goal || !timeframeWeeks || !dietaryPreference) {
    return res.status(400).json({
      success: false,
      message: "All fields are required: weight, goal, timeframeWeeks, dietaryPreference.",
    });
  }

  // ── Gemini prompt ──────────────────────────────────────────────────────────
  const prompt = `
You are an expert certified personal trainer and registered nutritionist.
Generate a complete, personalised fitness and diet protocol based on this profile:

- Current Weight: ${weight} kg
- Primary Goal: ${goal}
- Program Duration: ${timeframeWeeks} weeks
- Dietary Preference: ${dietaryPreference}

CRITICAL INSTRUCTIONS — READ CAREFULLY:
1. You MUST respond with a SINGLE, VALID JSON OBJECT ONLY.
2. Do NOT include any markdown, code fences, explanations, or extra text before or after the JSON.
3. The JSON must have exactly two top-level keys: "workoutPlan" and "dietPlan".

Required JSON schema (follow it exactly):
{
  "workoutPlan": [
    {
      "dayName": "Monday — Push (Chest / Shoulders / Triceps)",
      "exercises": [
        { "name": "Barbell Bench Press", "sets": "4", "reps": "8-10", "rest": "90s" }
      ]
    }
  ],
  "dietPlan": [
    {
      "mealName": "Breakfast — 07:00",
      "food": "Oats (80g dry) + banana + 2 whole eggs",
      "macros": { "calories": 520, "protein": "28g", "carbs": "68g", "fat": "12g" }
    }
  ]
}

Generate a 7-day workout split (rest days must have an empty exercises array []).
Generate exactly 5 meals for the diet plan.
Make every detail specific, measurable, and well-tailored to the user's goal and dietary preference.
Respond with ONLY the raw JSON — nothing else.
`.trim();

  // ── Call Gemini ────────────────────────────────────────────────────────────
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  const rawText = result.text.trim();

  // Strip accidental markdown code fences if the model wraps the JSON
  const jsonStr = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/,           "")
    .trim();

  let plan;
  try {
    plan = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error("Gemini returned non-JSON:\n", rawText);
    return res.status(502).json({
      success: false,
      message: "The AI returned an unexpected format. Please try again.",
    });
  }

  return res.status(200).json({ success: true, plan });
};
