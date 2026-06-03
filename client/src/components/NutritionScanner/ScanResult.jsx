import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { RefreshCw, Bookmark, CheckCircle2, Dumbbell, Droplets, Leaf } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

/* ─────────────────────────────────────────────────────────────────────────────
   Design language: clean commercial dark-mode (think Linear / Vercel / Health)
   - ONE accent color: blue #2563eb
   - Glows only where earned (the primary CTA)
   - Typography carries the hierarchy, not color explosions
   - Borders are structural, not decorative
───────────────────────────────────────────────────────────────────────────── */

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const MACROS = [
  {
    key: "protein", label: "Protein", unit: "g",
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    color: "#60a5fa",          // blue-400 — single brand color family
    maxRef: 60,
  },
  {
    key: "carbs", label: "Carbs", unit: "g",
    icon: <Leaf className="w-3.5 h-3.5" />,
    color: "#94a3b8",          // slate-400 — neutral, no purple explosion
    maxRef: 120,
  },
  {
    key: "fat", label: "Fat", unit: "g",
    icon: <Droplets className="w-3.5 h-3.5" />,
    color: "#64748b",          // slate-500 — even quieter
    maxRef: 50,
  },
];

const ITEM_ACCENT = [
  "#3b82f6", "#60a5fa", "#93c5fd",
  "#bfdbfe", "#2563eb", "#1d4ed8",
];

/* ── Animated calorie counter ────────────────────────────────────────────── */
function CalorieCounter({ target }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const val = useMotionValue ? null : null; // unused, plain timer approach
    let start = null;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{display.toLocaleString()}</>;
}

/* ── Shared card shell ───────────────────────────────────────────────────── */
function Card({ children, className = "", delay = 0, noPad = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        bg-slate-900 border border-slate-800 rounded-2xl
        ${noPad ? "" : "p-6"}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

/* ── Section label ───────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-4"
    style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
    {children}
  </p>
);

/* ─────────────────────────────────────────────────────────────────────────── */
export default function ScanResult({
  scanId, detectedFoods = [], totals = {}, imageWithBoxes, onReset,
}) {
  const { token }                = useAuthStore();
  const [mealType, setMealType]  = useState("snack");
  const [saving,   setSaving]    = useState(false);
  const [saved,    setSaved]     = useState(false);

  const imgSrc        = imageWithBoxes ? `data:image/jpeg;base64,${imageWithBoxes}` : null;
  const totalCalories = Number(totals.calories ?? 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(
        "/api/nutrition/log",
        { scanId, mealType, detectedFoods, totals },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaved(true);
      toast.success(`Logged as ${mealType}`);
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Oswald','Poppins',sans-serif" }}
          >
            Meal Analysis
          </h2>
          <p className="text-slate-500 text-xs mt-1"
            style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
            {detectedFoods.length} item{detectedFoods.length !== 1 ? "s" : ""} detected · USDA verified
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 text-sm transition-colors duration-200"
          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
        >
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
          New Scan
        </button>
      </motion.div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">

        {/* LEFT: Annotated image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Meal scan with detections"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
              No annotated image
            </div>
          )}
        </motion.div>

        {/* RIGHT: Data column */}
        <div className="flex flex-col gap-4">

          {/* Card 1: Calories */}
          <Card delay={0.08} className="relative overflow-hidden">
            {/* Subtle blue tint on the card — not a glow, just a tinted bg */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <SectionLabel>Total Calories</SectionLabel>
              <div className="flex items-end gap-2 leading-none">
                <span
                  className="text-white"
                  style={{
                    fontFamily: "'Oswald','Poppins',sans-serif",
                    fontSize: "64px",
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <CalorieCounter target={totalCalories} />
                </span>
                <span className="text-slate-500 text-sm mb-2 pb-1"
                  style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  kcal
                </span>
              </div>
              {/* Thin blue underline accent — one subtle brand touch */}
              <div className="mt-4 h-px bg-slate-800 relative">
                <motion.div
                  className="absolute left-0 top-0 h-px bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: "40%" }}
                  transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                />
              </div>
              <p className="mt-3 text-[10px] text-slate-600 uppercase tracking-widest"
                style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
          </Card>

          {/* Card 2: Macros */}
          <Card delay={0.13}>
            <SectionLabel>Macronutrients</SectionLabel>
            <div className="space-y-5">
              {MACROS.map(({ key, label, unit, icon, color, maxRef }, i) => {
                const val = Number(totals[key] ?? 0);
                const pct = Math.min((val / maxRef) * 100, 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
                      >
                        <span style={{ color }}>{icon}</span>
                        {label}
                      </span>
                      <span
                        className="text-white text-base font-semibold leading-none"
                        style={{ fontFamily: "'Oswald','Poppins',sans-serif" }}
                      >
                        {val}
                        <span className="text-slate-600 text-xs font-normal ml-1"
                          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                          {unit}
                        </span>
                      </span>
                    </div>
                    {/* Clean track — no gradient, just a flat fill */}
                    <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.75, delay: 0.35 + i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card 3: Fiber + Sugar */}
          <Card delay={0.18} noPad>
            <div className="grid grid-cols-2 divide-x divide-slate-800">
              {[
                { label: "Fiber", key: "fiber", unit: "g" },
                { label: "Sugar", key: "sugar", unit: "g" },
              ].map(({ label, key, unit }, i) => (
                <div key={key} className="p-5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2"
                    style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                    {label}
                  </p>
                  <span
                    className="text-white"
                    style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "26px", fontWeight: 600, lineHeight: 1 }}
                  >
                    {totals[key] ?? 0}
                  </span>
                  <span className="text-slate-600 text-xs ml-1"
                    style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Detected items ───────────────────────────────────────────────── */}
      {detectedFoods.length > 0 && (
        <Card delay={0.22} className="mt-4" noPad>
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800">
            <SectionLabel>Detected Items</SectionLabel>
            <span
              className="text-[10px] text-blue-500 border border-blue-900/60 bg-blue-950/40 rounded-full px-2.5 py-0.5 -mt-3"
              style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
            >
              {detectedFoods.length}
            </span>
          </div>

          <div>
            {detectedFoods.map((food, i) => {
              const name    = (food.display_name || food.name || "").split(",")[0].trim();
              const cal     = food.nutrition?.calories ?? 0;
              const protein = food.nutrition?.protein  ?? 0;
              const carbs   = food.nutrition?.carbs    ?? 0;
              const accent  = ITEM_ACCENT[i % ITEM_ACCENT.length];

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 + i * 0.06 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors duration-150 cursor-default"
                  style={{ borderBottom: i < detectedFoods.length - 1 ? "1px solid rgba(30,41,59,1)" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    {/* 3px left border — consistent with Linear's list style */}
                    <div style={{ width: "3px", height: "32px", borderRadius: "2px", backgroundColor: accent, flexShrink: 0 }} />
                    <div>
                      <p className="text-sm font-medium text-slate-200 capitalize leading-snug"
                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                        {name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5"
                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                        ~{food.estimated_grams}g · {Math.round(food.confidence * 100)}% conf.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-white"
                      style={{ fontFamily: "'Oswald','Poppins',sans-serif" }}>
                      {cal} <span className="text-slate-500 text-xs font-normal">kcal</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5"
                      style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                      P {protein}g · C {carbs}g
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Meal type + Save ─────────────────────────────────────────────── */}
      <Card delay={0.28} className="mt-4">
        <SectionLabel>Log this meal</SectionLabel>

        {/* Meal type pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setMealType(t)}
              className={`
                px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider
                border transition-colors duration-150
                ${mealType === t
                  ? "bg-blue-600/10 border-blue-600 text-blue-400"
                  : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                }
              `}
              style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Save / Saved */}
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 py-3.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
              <span className="text-emerald-400 text-sm font-medium"
                style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                Saved to your nutrition log
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="save-btn"
              onClick={handleSave}
              disabled={saving}
              whileHover={!saving ? { scale: 1.005 } : {}}
              whileTap={!saving ? { scale: 0.995 } : {}}
              transition={{ duration: 0.1 }}
              className={`
                w-full flex items-center justify-center gap-2.5
                py-3.5 rounded-xl border text-sm font-semibold
                transition-all duration-200
                ${saving
                  ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 border-blue-500 text-white hover:bg-blue-500"
                }
              `}
              style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                  Save to Nutrition Log
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
