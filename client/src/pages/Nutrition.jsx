import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const GlassPanel = ({ children, className = "" }) => (
  <div className={`rounded-2xl p-6 ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
    {children}
  </div>
);

const MacroBar = ({ label, value, max, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{value}g</span>
    </div>
    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
    </div>
  </div>
);

export default function Nutrition() {
  const fileRef = useRef(null);
  const [preview,  setPreview]  = useState(null);
  const [file,     setFile]     = useState(null);
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [mealType, setMealType] = useState("lunch");

  const handleFileChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setResults(null);
  };

  const handleAnalyze = async () => {
    if (!file) return toast.error("Please upload a food image first.");
    setLoading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const { data } = await axios.post(`${AI_URL}/food/recognize`, form);
      setResults(data);
      if (!data.detected) toast("No food detected — try a clearer image.", { icon: "🤔" });
      else toast.success(`${data.items.length} item(s) detected!`);
    } catch {
      toast.error("AI service unreachable. Is FastAPI running on :8000?");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto" style={{ background: "#0a0a0c" }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: "#F97316" }}>YOLO-Powered</p>
        <h1 className="font-black text-white uppercase" style={{ fontFamily: "Oswald, sans-serif", fontSize: 40, letterSpacing: "-0.01em" }}>
          Nutrition Scanner
        </h1>
        <p className="text-white/30 text-sm mt-1">Upload a food photo — our AI estimates macros instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Upload column (2/5) ───────────────────────────────────────────── */}
        <GlassPanel className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Upload Food Photo</h3>

          {/* Drop zone */}
          <div onClick={() => fileRef.current.click()}
            className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center"
            style={{ border: `2px dashed ${preview ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.02)" }}>
            {preview ? (
              <img src={preview} alt="food" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  <span className="text-3xl">🍔</span>
                </div>
                <p className="text-white/40 text-xs font-medium">Click or drag & drop</p>
                <p className="text-white/20 text-[10px] mt-1">JPG · PNG · WEBP</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {/* Hover overlay */}
            {preview && (
              <div className="absolute inset-0 items-center justify-center hidden group-hover:flex"
                style={{ background: "rgba(10,10,12,0.6)" }}>
                <p className="text-white text-xs font-semibold">Click to change photo</p>
              </div>
            )}
          </div>

          {/* Meal type chips */}
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Meal Type</p>
            <div className="flex gap-2">
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setMealType(m)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider capitalize transition-all"
                  style={mealType === m
                    ? { background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleAnalyze} disabled={loading || !file}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: file ? "0 0 24px rgba(249,115,22,0.4)" : "none", fontFamily: "Poppins" }}>
            {loading ? "Analyzing…" : "🔍 Analyze with AI"}
          </button>
        </GlassPanel>

        {/* ── Results column (3/5) ─────────────────────────────────────────── */}
        <GlassPanel className="lg:col-span-3 flex flex-col">
          {!results ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16" style={{ color: "rgba(255,255,255,0.15)" }}>
              <span className="text-5xl mb-4">📊</span>
              <p className="font-black uppercase" style={{ fontFamily: "Oswald", fontSize: 22 }}>Awaiting Analysis</p>
              <p className="text-xs mt-1">Upload a photo and hit Analyze</p>
            </div>
          ) : !results.detected ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16" style={{ color: "#F97316" }}>
              <span className="text-5xl mb-4">🤔</span>
              <p className="font-black uppercase text-white" style={{ fontFamily: "Oswald", fontSize: 22 }}>No Food Detected</p>
              <p className="text-xs text-white/30 mt-1">Try a clearer, well-lit photo</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 flex-1">
              {/* Detected items */}
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Detected Items</h3>
                <div className="flex flex-col gap-2">
                  {results.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: "#F97316" }} />
                        <span className="text-white text-sm font-semibold capitalize">{item.label.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: "rgba(249,115,22,0.12)", color: "#F97316" }}>
                        {(item.confidence * 100).toFixed(0)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro summary cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Calories", value: "420 kcal", sub: "Estimated total", color: "#F97316" },
                  { label: "Protein",  value: "28g",      sub: "of 150g goal",    color: "#818cf8" },
                  { label: "Carbs",    value: "52g",      sub: "of 300g goal",    color: "#22c55e" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="font-black" style={{ fontFamily: "Oswald", fontSize: 22, color }}>{value}</p>
                    <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
                    <p className="text-white/20 text-[10px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Macro bars */}
              <div className="flex flex-col gap-3">
                <MacroBar label="Protein" value={28}  max={150} color="#818cf8" />
                <MacroBar label="Carbs"   value={52}  max={300} color="#22c55e" />
                <MacroBar label="Fats"    value={14}  max={80}  color="#F97316" />
                <MacroBar label="Fiber"   value={6}   max={30}  color="#06b6d4" />
              </div>

              {/* Save button */}
              <button onClick={() => toast.success(`Saved to ${mealType} log! (Phase 4)`)}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white uppercase tracking-wider mt-auto"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#F97316", fontFamily: "Poppins" }}>
                ✅ Save to {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Log
              </button>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
