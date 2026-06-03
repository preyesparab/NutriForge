import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import toast from "react-hot-toast";

const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";

const EXERCISES = [
  { id: "squat",          label: "Squat",           muscles: "Quads · Glutes"    },
  { id: "dumbbell_curl",  label: "Dumbbell Curl",   muscles: "Biceps · Forearms" },
  { id: "push_up",        label: "Push Up",          muscles: "Chest · Triceps"  },
  { id: "lunge",          label: "Lunge",            muscles: "Quads · Hams"     },
  { id: "shoulder_press", label: "Shoulder Press",  muscles: "Deltoids · Traps"  },
  { id: "plank",          label: "Plank",            muscles: "Core · Shoulders"  },
];

const GlassPanel = ({ children, className = "" }) => (
  <div className={`rounded-2xl ${className}`}
    style={{ background: "rgba(10,10,12,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
    {children}
  </div>
);

const AccuracyRing = ({ score }) => {
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#F97316" : "#ef4444";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="48" y="52" textAnchor="middle" dominantBaseline="middle"
        className="rotate-90" fill="white" fontSize="18" fontWeight="900"
        fontFamily="Oswald, sans-serif" style={{ transform: "rotate(90deg)", transformOrigin: "48px 48px" }}>
        {score}%
      </text>
    </svg>
  );
};

export default function AITracker() {
  const webcamRef   = useRef(null);
  const intervalRef = useRef(null);

  const [selected,  setSelected]  = useState(EXERCISES[0]);
  const [isActive,  setIsActive]  = useState(false);
  const [reps,      setReps]      = useState(0);
  const [accuracy,  setAccuracy]  = useState(0);
  const [feedback,  setFeedback]  = useState(["Select an exercise and press Start."]);
  const [elapsed,   setElapsed]   = useState(0);

  // Timer
  useEffect(() => {
    let t;
    if (isActive) t = setInterval(() => setElapsed((s) => s + 1), 1000);
    else clearInterval(t);
    return () => clearInterval(t);
  }, [isActive]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    try {
      const blob = await (await fetch(imageSrc)).blob();
      const form = new FormData();
      form.append("file", blob, "frame.jpg");
      const { data } = await axios.post(`${AI_URL}/pose/analyze`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.detected) {
        // Simulated rep count increment + random accuracy for demo
        setReps((r) => r + 1);
        const score = Math.round(85 + Math.random() * 15);
        setAccuracy(score);
        const msgs = ["Keep your back straight!", "Lower your hips more.", "Great form — hold it!", "Breathe out on the push."];
        setFeedback((f) => [msgs[Math.floor(Math.random() * msgs.length)], ...f.slice(0, 4)]);
      }
    } catch (_) { /* AI service may not be running yet */ }
  }, []);

  const handleStart = () => {
    setIsActive(true); setReps(0); setAccuracy(0); setElapsed(0);
    setFeedback(["Session started — ensure full body is visible."]);
    intervalRef.current = setInterval(captureAndAnalyze, 1500);
  };

  const handleStop = () => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    setFeedback((f) => ["✅ Session ended. Great work!", ...f]);
    toast.success(`Session complete — ${reps} reps tracked!`);
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-[1400px] mx-auto" style={{ background: "#0a0a0c" }}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: "#F97316" }}>Computer Vision</p>
        <h1 className="font-black text-white uppercase" style={{ fontFamily: "Oswald, sans-serif", fontSize: 36, letterSpacing: "-0.01em" }}>
          AI Trainer
        </h1>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="flex gap-4 h-[78vh]">

        {/* ── Left: exercise selector ─────────────────────────────────────── */}
        <GlassPanel className="w-48 shrink-0 p-4 flex flex-col gap-1.5 overflow-y-auto">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] mb-2">Exercise</p>
          {EXERCISES.map((ex) => (
            <button key={ex.id}
              onClick={() => { setSelected(ex); if (isActive) handleStop(); }}
              className="text-left px-3 py-2.5 rounded-xl transition-all"
              style={selected.id === ex.id ? {
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.3)",
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
              <p className="text-xs font-semibold" style={{ color: selected.id === ex.id ? "#F97316" : "rgba(255,255,255,0.6)" }}>
                {ex.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{ex.muscles}</p>
            </button>
          ))}
        </GlassPanel>

        {/* ── Centre: cinematic webcam ─────────────────────────────────────── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          {isActive ? (
            <Webcam ref={webcamRef} mirrored screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ width: 1920, height: 1080, facingMode: "user" }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center"
              style={{ background: "radial-gradient(ellipse at center, rgba(249,115,22,0.04) 0%, rgba(10,10,12,1) 70%)" }}>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  <span className="text-4xl">📷</span>
                </div>
                <p className="font-black text-white/60 uppercase mb-1" style={{ fontFamily: "Oswald", fontSize: 20 }}>Camera Standby</p>
                <p className="text-white/25 text-xs">Press <strong className="text-orange-400">Start Session</strong> to begin</p>
              </div>
            </div>
          )}

          {/* ── Timer overlay (top-left) ─────────────────────────────── */}
          {isActive && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(10,10,12,0.8)", border: "1px solid rgba(249,115,22,0.3)" }}>
              <p className="text-orange-400 font-black text-sm" style={{ fontFamily: "Oswald" }}>
                🔴 LIVE — {fmtTime(elapsed)}
              </p>
            </div>
          )}

          {/* ── Exercise label overlay (top-right) ─────────────────── */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(10,10,12,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">{selected.label}</p>
          </div>

          {/* ── Rep + accuracy floating panel (bottom centre) ───────── */}
          {isActive && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-2xl"
              style={{ background: "rgba(10,10,12,0.85)", border: "1px solid rgba(249,115,22,0.2)", backdropFilter: "blur(16px)" }}>
              <div className="text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Reps</p>
                <p className="font-black text-white" style={{ fontFamily: "Oswald", fontSize: 44, lineHeight: 1 }}>{reps}</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <AccuracyRing score={accuracy} />
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Sets</p>
                <p className="font-black text-white" style={{ fontFamily: "Oswald", fontSize: 44, lineHeight: 1 }}>1</p>
              </div>
            </div>
          )}

          {/* ── Controls overlay (bottom-right) ────────────────────── */}
          <div className="absolute bottom-5 right-4 flex flex-col gap-2">
            {!isActive ? (
              <button onClick={handleStart}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", boxShadow: "0 0 20px rgba(249,115,22,0.5)" }}>
                ▶ Start Session
              </button>
            ) : (
              <button onClick={handleStop}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}>
                ⏹ Stop & Save
              </button>
            )}
          </div>
        </div>

        {/* ── Right: AI feedback panel ─────────────────────────────────────── */}
        <GlassPanel className="w-56 shrink-0 p-4 flex flex-col">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.15em] mb-3">AI Feedback</p>

          {/* Accuracy ring */}
          <div className="flex justify-center mb-4">
            <AccuracyRing score={accuracy} />
          </div>
          <p className="text-center text-[10px] text-white/30 mb-4 uppercase tracking-wider">Posture Score</p>

          {/* Feedback ticker */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {feedback.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg"
                style={{ background: i === 0 ? "rgba(249,115,22,0.08)" : "transparent", border: i === 0 ? "1px solid rgba(249,115,22,0.15)" : "none" }}>
                <span style={{ color: "#F97316" }}>›</span>
                <span style={{ color: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>{msg}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
