import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import PageTransition from "../components/PageTransition";
import {
  Dumbbell, Activity, ArrowDownUp, Heart, Plus, Minus,
  Check, CheckCircle2, Trash2, X, Pencil, StickyNote,
  Layers, Repeat, Flame, ChevronDown,
  Play, Zap, Trophy, TrendingUp, MoreHorizontal, SkipForward, Search,
} from "lucide-react";

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const GLASS = {
  background: "rgba(30,41,59,0.45)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(51,65,85,0.6)",
  borderRadius: "20px",
};
const BUBBLE = {
  background: "rgba(30,41,59,0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(51,65,85,0.65)",
  borderRadius: "14px",
};

/* ─── Exercise database grouped by muscle ─────────────────────────────────── */
const EXERCISE_GROUPS = {
  CHEST:     ["Bench Press", "Incline Press", "Cable Fly", "Push-up", "Dumbbell Flyes", "Chest Dip"],
  BACK:      ["Deadlift", "Pull-up", "Barbell Row", "Lat Pulldown", "Seated Cable Row", "T-Bar Row"],
  LEGS:      ["Squat", "Leg Press", "Romanian Deadlift", "Lunges", "Leg Curl", "Leg Extension", "Calf Raise"],
  SHOULDERS: ["Overhead Press", "Lateral Raise", "Face Pull", "Front Raise", "Arnold Press"],
  ARMS:      ["Bicep Curl", "Hammer Curl", "Incline Curl", "Tricep Pushdown", "Skullcrusher", "Dips"],
  CORE:      ["Plank", "Crunches", "Cable Crunch", "Hanging Leg Raise", "Ab Rollout"],
  CARDIO:    ["Treadmill", "Cycling", "Jump Rope", "Rowing Machine", "Stair Climber"],
};

const ALL_EXERCISES = Object.entries(EXERCISE_GROUPS).flatMap(([group, names]) =>
  names.map(name => ({ name, group }))
);

const MUSCLE_ICON = {
  CHEST:     { Icon: Dumbbell,    color: "#3b82f6" },
  BACK:      { Icon: ArrowDownUp, color: "#22d3ee" },
  LEGS:      { Icon: Activity,    color: "#a78bfa" },
  SHOULDERS: { Icon: Zap,         color: "#f97316" },
  ARMS:      { Icon: Dumbbell,    color: "#22d3ee" },
  CORE:      { Icon: Repeat,      color: "#a78bfa" },
  CARDIO:    { Icon: Heart,       color: "#f97316" },
};

const getExerciseGroup = name => {
  const found = ALL_EXERCISES.find(e => e.name.toLowerCase() === name.toLowerCase());
  return found?.group || "CHEST";
};

const getSmartTitle = () => {
  const h = new Date().getHours();
  if (h < 12) return "Morning Workout";
  if (h < 17) return "Afternoon Session";
  if (h < 21) return "Evening Session";
  return "Night Session";
};

const formatTime = secs => {
  const h = Math.floor(secs / 3600).toString().padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

/* ─── Shared label ────────────────────────────────────────────────────────── */
const SLabel = ({ children, className = "" }) => (
  <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 ${className}`}
    style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
    {children}
  </p>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function TrackWorkout() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) { toast.error("Please sign in first."); navigate("/login"); }
  }, [token]);

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [isActive,       setIsActive]       = useState(false);
  const [editingTitle,   setEditingTitle]   = useState(false);
  const [elapsedSecs,    setElapsedSecs]    = useState(0);
  const [startTime,      setStartTime]      = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null); // exId
  const [openNotes,      setOpenNotes]      = useState({});   // {exId: bool}
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [openMenus,      setOpenMenus]      = useState({});   // {exId: bool}
  const [showSearch,     setShowSearch]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  // prRecords: { [exerciseName]: maxWeight } — tracks personal bests within this session
  const [prRecords,      setPrRecords]      = useState({});
  // restTimers: { [setId]: { secs: number, active: bool, preset: number } }
  const [restTimers,     setRestTimers]     = useState({});
  const dropRef = useRef(null);

  /* ── Rest timer tick ────────────────────────────────────────────────────── */
  useEffect(() => {
    const iv = setInterval(() => {
      setRestTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id].active && next[id].secs > 0) {
            next[id] = { ...next[id], secs: next[id].secs - 1 };
            changed = true;
          } else if (next[id].active && next[id].secs === 0) {
            next[id] = { ...next[id], active: false };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const startRest = (setId, secs = 90) => {
    setRestTimers(p => ({ ...p, [setId]: { secs, preset: secs, active: true } }));
  };
  const skipRest  = (setId) => setRestTimers(p => ({ ...p, [setId]: { ...p[setId], active: false, secs: 0 } }));
  const resetRest = (setId, secs) => setRestTimers(p => ({ ...p, [setId]: { secs, preset: secs, active: true } }));

  const [workout, setWorkout] = useState({
    title: getSmartTitle(),
    exercises: [{
      id: crypto.randomUUID(), name: "", notes: "",
      sets: [{ id: crypto.randomUUID(), weight: "", reps: "", isCompleted: false }],
    }],
  });

  /* ── Timer ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isActive || !startTime) return;
    const iv = setInterval(() => setElapsedSecs(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [isActive, startTime]);

  /* ── Click outside dropdown ─────────────────────────────────────────────── */
  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveDropdown(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!token) return null;

  /* ── Live stats ─────────────────────────────────────────────────────────── */
  const allSets      = workout.exercises.flatMap(ex => ex.sets);
  const doneSets     = allSets.filter(s => s.isCompleted);
  const totalVolume  = doneSets.reduce((a, s) => a + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
  const totalSetsN   = doneSets.length;
  const totalReps    = doneSets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
  const elapsedMins  = elapsedSecs / 60;
  const estCalories  = Math.round(totalVolume * 0.05 + elapsedMins * 5);
  const totalAllSets = allSets.length;
  const progressPct  = totalAllSets === 0 ? 0 : Math.round((totalSetsN / totalAllSets) * 100);

  /* ── Mutators ────────────────────────────────────────────────────────────── */
  const mu = fn => setWorkout(p => ({ ...p, exercises: fn(p.exercises) }));

  const addExercise = () => mu(ex => [...ex, {
    id: crypto.randomUUID(), name: "", notes: "",
    sets: [{ id: crypto.randomUUID(), weight: "", reps: "", isCompleted: false }],
  }]);

  const removeExercise = id => { mu(ex => ex.filter(e => e.id !== id)); setDeleteConfirm(null); };

  const updateExercise = (id, field, val) =>
    mu(ex => ex.map(e => e.id === id ? { ...e, [field]: val } : e));

  const addSet = exId => mu(ex => ex.map(e => {
    if (e.id !== exId) return e;
    const prev = e.sets[e.sets.length - 1];
    return { ...e, sets: [...e.sets, { id: crypto.randomUUID(), weight: prev?.weight || "", reps: "", isCompleted: false }] };
  }));

  const removeSet = (exId, setId) => mu(ex => ex.map(e =>
    e.id !== exId ? e : { ...e, sets: e.sets.filter(s => s.id !== setId) }
  ));

  const updateSet = (exId, setId, field, val) => mu(ex => ex.map(e =>
    e.id !== exId ? e : { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: val } : s) }
  ));

  const toggleDone = (exId, setId) => mu(ex => ex.map(e =>
    e.id !== exId ? e : {
      ...e, sets: e.sets.map(s => {
        if (s.id !== setId) return s;
        if (!s.isCompleted && !s.weight && !s.reps) return s;
        return { ...s, isCompleted: !s.isCompleted };
      })
    }
  ));

  /* ── Start + Finish ─────────────────────────────────────────────────────── */
  const handleStart = () => { setStartTime(Date.now()); setIsActive(true); };

  const handleFinish = async () => {
    if (allSets.some(s => !s.isCompleted)) {
      if (!window.confirm("Some sets aren't marked complete. Finish anyway?")) return;
    }
    try {
      await axios.post("/api/workouts", {
        title:           workout.title,
        startTime:       startTime || Date.now(),
        durationMinutes: Math.max(1, Math.floor(elapsedSecs / 60)),
        caloriesBurned:  estCalories,
        exercises:       workout.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.filter(s => s.reps > 0 || s.weight > 0 || s.isCompleted)
            .map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 1, isCompleted: s.isCompleted })),
        })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Session saved!");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to save. Try again.");
    }
  };

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <PageTransition className="bg-[#020617] min-h-screen pb-32 relative">

      {/* ── Background layers ─────────────────────────────────────────── */}
      {/* Top-left blue energy glow */}
      <div style={{
        position: "fixed", top: -200, left: -200,
        width: 600, height: 600, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
      }} />
      {/* Bottom-right purple glow */}
      <div style={{
        position: "fixed", bottom: -150, right: -150,
        width: 500, height: 500, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
      }} />
      {/* Noise texture overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.035,
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-8">

        {/* ── START SCREEN ────────────────────────────────────────────────── */}
        {!isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
          >
            {/* Session name editable */}
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3"
                style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                Ready to Train
              </p>
              {editingTitle ? (
                <input
                  autoFocus
                  value={workout.title}
                  onChange={e => setWorkout(p => ({ ...p, title: e.target.value }))}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
                  className="text-4xl font-bold text-center text-white bg-transparent border-b-2 border-blue-500 outline-none w-full"
                  style={{ fontFamily: "'Oswald','Poppins',sans-serif" }}
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  className="group cursor-pointer flex items-center gap-3 justify-center"
                  style={{
                    fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "40px",
                    fontWeight: 700,
                    background: "linear-gradient(180deg,#fff,rgba(255,255,255,0.65))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}
                >
                  {workout.title}
                  <Pencil className="w-5 h-5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" style={{ WebkitTextFillColor: "initial" }} strokeWidth={1.5} />
                </h1>
              )}
              <p className="text-slate-500 text-sm mt-2" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                {dateStr}
              </p>
            </div>

            {/* Start button */}
            <motion.button
              onClick={handleStart}
              whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                border: "1px solid rgba(37,99,235,0.6)",
                borderRadius: "16px",
                padding: "16px 48px",
                boxShadow: "0 0 30px rgba(37,99,235,0.35), 0 8px 32px rgba(0,0,0,0.5)",
                fontFamily: "'Poppins',system-ui,sans-serif",
                fontWeight: 600, fontSize: "15px", color: "#fff",
              }}
              className="flex items-center gap-3 transition-all duration-200"
            >
              <Play className="w-5 h-5" strokeWidth={1.5} />
              Start Session
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── SECTION 1: Page Header (full-width cinematic strip) ───── */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: "linear-gradient(180deg, rgba(37,99,235,0.08) 0%, transparent 100%)",
                borderBottom: "1px solid rgba(51,65,85,0.4)",
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                marginLeft: "-24px",   /* bleed to page edges */
                marginRight: "-24px",
                marginBottom: "32px",
              }}
            >

              {/* ── LEFT ZONE ─────────────────────────────────────────────── */}
              <div style={{ flex: 1 }}>
                {/* "ACTIVE SESSION" badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span style={{
                    fontFamily: "'Poppins',system-ui,sans-serif",
                    fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#22c55e",
                  }}>
                    Active Session
                  </span>
                </div>

                {/* Session name — editable */}
                {editingTitle ? (
                  <input
                    autoFocus
                    value={workout.title}
                    onChange={e => setWorkout(p => ({ ...p, title: e.target.value }))}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
                    style={{
                      fontFamily: "'Oswald','Poppins',sans-serif",
                      fontSize: "60px", fontWeight: 700,
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      borderBottom: "2px solid rgba(37,99,235,0.7)",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                ) : (
                  <h1
                    className="group cursor-pointer flex items-center gap-2"
                    style={{
                      fontFamily: "'Oswald','Poppins',sans-serif",
                      fontSize: "60px", fontWeight: 700, lineHeight: 1,
                      background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}
                  >
                    {workout.title}
                    <Pencil
                      onClick={() => setEditingTitle(true)}
                      size={14}
                      strokeWidth={1.5}
                      className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ WebkitTextFillColor: "initial", color: "#64748b", flexShrink: 0 }}
                    />
                  </h1>
                )}

                {/* Date */}
                <p style={{
                  fontFamily: "'Poppins',system-ui,sans-serif",
                  fontSize: "14px", color: "#64748b", marginTop: "8px",
                }}>
                  {dateStr}
                </p>
              </div>

              {/* ── CENTER ZONE: Timer ─────────────────────────────────────── */}
              <div style={{
                width: 256,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderLeft: "1px solid rgba(51,65,85,0.4)",
                borderRight: "1px solid rgba(51,65,85,0.4)",
                padding: "0 32px",
                alignSelf: "stretch",
                justifyContent: "center",
              }}>
                {/* Timer glass bubble */}
                <div style={{
                  background: "rgba(30,41,59,0.45)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(37,99,235,0.4)",
                  borderRadius: "16px",
                  boxShadow: "0 0 30px rgba(37,99,235,0.2)",
                  padding: "16px 32px",
                  textAlign: "center",
                }}>
                  <span style={{
                    fontFamily: "'Oswald','Poppins',sans-serif",
                    fontSize: "48px", fontWeight: 700, lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    {formatTime(elapsedSecs)}
                  </span>
                  <p style={{
                    fontFamily: "'Poppins',system-ui,sans-serif",
                    fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                    color: "#64748b", marginTop: "8px",
                  }}>
                    Elapsed
                  </p>
                </div>
              </div>

              {/* ── RIGHT ZONE: Buttons ────────────────────────────────────── */}
              <div style={{
                display: "flex", gap: "12px", alignItems: "center",
                paddingLeft: "40px",
              }}>
                {/* Finish Session */}
                <motion.button
                  onClick={handleFinish}
                  whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    border: "1px solid rgba(37,99,235,0.6)",
                    boxShadow: "0 0 30px rgba(37,99,235,0.35)",
                    borderRadius: "14px",
                    height: "52px",
                    padding: "0 32px",
                    display: "flex", alignItems: "center", gap: "8px",
                    fontFamily: "'Oswald','Poppins',sans-serif",
                    fontSize: "16px", fontWeight: 700, color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={18} strokeWidth={1.5} />
                  Finish Session
                </motion.button>

                {/* Discard */}
                <button
                  onClick={() => { if (window.confirm("Discard session?")) navigate("/dashboard"); }}
                  style={{
                    background: "rgba(30,41,59,0.45)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "12px",
                    height: "52px", width: "52px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  className="hover:bg-[rgba(239,68,68,0.1)]"
                >
                  <X size={18} strokeWidth={1.5} style={{ color: "#ef4444" }} />
                </button>
              </div>

            </motion.div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500"
                  style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>Session Progress</p>
                <span className="text-sm text-slate-300" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  {totalSetsN} / {totalAllSets} sets
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                <motion.div className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg,#3b82f6,#22d3ee)",
                    boxShadow: "0 0 8px rgba(59,130,246,0.5)",
                  }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* ── SECTION 2: Stats Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  Icon: Dumbbell, color: "#3b82f6", label: "Volume",
                  val: Math.round(totalVolume), valueSuffix: "kg",
                  valueStyle: {
                    background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  },
                  context: "total weight lifted",
                  watermark: "KG",
                },
                {
                  Icon: Layers, color: "#22d3ee", label: "Sets",
                  val: totalSetsN, valueSuffix: "",
                  valueStyle: { color: "#22d3ee" },
                  context: `${totalSetsN} / ${totalAllSets} completed`,
                  watermark: "SET",
                },
                {
                  Icon: Repeat, color: "#a78bfa", label: "Reps",
                  val: totalReps, valueSuffix: "",
                  valueStyle: { color: "#a78bfa" },
                  context: "total reps logged",
                  watermark: "REP",
                },
                {
                  Icon: Flame, color: "#f97316", label: "Calories",
                  val: estCalories, valueSuffix: "",
                  valueStyle: {
                    background: "linear-gradient(135deg, #f97316, #fb923c)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  },
                  context: `~${Math.round(elapsedMins)} active min`,
                  watermark: "CAL",
                },
              ].map(({ Icon, color, label, val, valueSuffix, valueStyle, context, watermark }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  style={{
                    ...GLASS,
                    padding: "24px",
                    borderRadius: "20px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Background watermark */}
                  <span style={{
                    position: "absolute", bottom: -10, right: -5,
                    fontFamily: "'Oswald','Poppins',sans-serif",
                    fontSize: "80px", fontWeight: 700,
                    color: "rgba(255,255,255,0.025)",
                    userSelect: "none", pointerEvents: "none",
                    lineHeight: 1,
                  }}>
                    {watermark}
                  </span>

                  {/* Top row: icon + label */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    {/* Icon bubble */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "12px",
                      background: "rgba(37,99,235,0.15)",
                      border: "1px solid rgba(37,99,235,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} strokeWidth={1.5} style={{ color }} />
                    </div>
                    {/* Label */}
                    <p style={{
                      fontFamily: "'Poppins',system-ui,sans-serif",
                      fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748b",
                    }}>
                      {label}
                    </p>
                  </div>

                  {/* Value */}
                  <motion.div
                    key={val}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "inline-block", marginBottom: "8px" }}
                  >
                    <span style={{
                      fontFamily: "'Oswald','Poppins',sans-serif",
                      fontSize: "60px", fontWeight: 700, lineHeight: 1,
                      ...valueStyle,
                    }}>
                      {val}
                    </span>
                    {valueSuffix && (
                      <span style={{
                        fontFamily: "'Poppins',system-ui,sans-serif",
                        fontSize: "14px", color: "#64748b", marginLeft: "4px",
                      }}>
                        {valueSuffix}
                      </span>
                    )}
                  </motion.div>

                  {/* Context */}
                  <p style={{
                    fontFamily: "'Poppins',system-ui,sans-serif",
                    fontSize: "13px", color: "#64748b",
                    display: "block",
                  }}>
                    {context}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ── SECTION 3: Exercise Cards ──────────────────────────────── */}
            <div className="flex flex-col" ref={dropRef}>
              {workout.exercises.map((ex, exIdx) => {
                const group    = ex.name ? getExerciseGroup(ex.name) : "CHEST";
                const { Icon: ExIcon, color: exColor } = MUSCLE_ICON[group] || MUSCLE_ICON.CHEST;
                const isDeleting = deleteConfirm === ex.id;
                const notesOpen  = openNotes[ex.id];
                const menuOpen   = openMenus[ex.id];

                /* per-muscle left bar colors */
                const barColor = {
                  CHEST: "#3b82f6", BACK: "#22d3ee", LEGS: "#a78bfa",
                  SHOULDERS: "#3b82f6", ARMS: "#fb923c", CORE: "#22c55e", CARDIO: "#f97316",
                }[group] || "#3b82f6";

                return (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, delay: exIdx * 0.05 }}
                    style={{
                      ...GLASS,
                      borderRadius: "20px",
                      overflow: "hidden",
                      position: "relative",
                      marginBottom: "16px",
                    }}
                  >
                    {/* ── TOP BANNER ─────────────────────────────────────────── */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(30,41,59,0.45))",
                      borderBottom: "1px solid rgba(51,65,85,0.5)",
                      height: 64,
                      padding: "0 24px 0 32px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      position: "relative",
                    }}>
                      {/* Muscle color bar */}
                      <div style={{
                        position: "absolute", left: 0, top: 0,
                        width: 4, height: "100%",
                        background: barColor,
                        borderRadius: "0 0 0 0",
                      }} />

                      {/* Left: icon + name combobox + pill */}
                      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: 12 }}>
                        {/* Icon bubble */}
                        <div style={{
                          width: 40, height: 40, borderRadius: "12px", flexShrink: 0,
                          background: `${barColor}26`,
                          border: `1px solid ${barColor}4d`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <ExIcon size={20} strokeWidth={1.5} style={{ color: barColor }} />
                        </div>

                        {/* Name combobox */}
                        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                          <input
                            type="text"
                            value={ex.name}
                            onChange={e => { updateExercise(ex.id, "name", e.target.value); setActiveDropdown(ex.id); }}
                            onFocus={() => setActiveDropdown(ex.id)}
                            placeholder="Select exercise…"
                            style={{
                              fontFamily: "'Oswald','Poppins',sans-serif",
                              fontSize: "22px", fontWeight: 700, color: "#f1f5f9",
                              background: "transparent",
                              border: "none", outline: "none",
                              width: "100%",
                            }}
                          />
                          {/* Dropdown */}
                          <AnimatePresence>
                            {activeDropdown === ex.id && (
                              <motion.ul
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                  position: "absolute", zIndex: 200, top: "calc(100% + 8px)",
                                  left: 0, right: 0, maxHeight: "260px", overflowY: "auto",
                                  ...GLASS, borderRadius: "14px", padding: "6px",
                                }}
                              >
                                {Object.entries(EXERCISE_GROUPS).map(([grp, names]) => {
                                  const visible = names.filter(n =>
                                    n.toLowerCase().includes(ex.name.toLowerCase())
                                  );
                                  if (visible.length === 0) return null;
                                  return (
                                    <li key={grp}>
                                      <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-600"
                                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{grp}</p>
                                      {visible.map(name => (
                                        <button key={name}
                                          onMouseDown={e => {
                                            e.preventDefault();
                                            updateExercise(ex.id, "name", name);
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white text-sm transition-colors duration-100"
                                          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
                                        >
                                          {name}
                                        </button>
                                      ))}
                                    </li>
                                  );
                                })}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Muscle pill */}
                        {ex.name && (
                          <span style={{
                            fontFamily: "'Poppins',system-ui,sans-serif",
                            fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            background: "rgba(37,99,235,0.15)",
                            border: "1px solid rgba(37,99,235,0.3)",
                            color: "#3b82f6",
                            borderRadius: "9999px", padding: "4px 12px",
                            flexShrink: 0,
                          }}>
                            {group}
                          </span>
                        )}
                      </div>

                      {/* Right: more menu */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12, position: "relative" }}>
                        <button
                          onClick={() => setOpenMenus(p => ({ ...p, [ex.id]: !p[ex.id] }))}
                          style={{ padding: 6, borderRadius: 8, cursor: "pointer", background: "transparent", border: "none" }}
                          className="text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          <MoreHorizontal size={18} strokeWidth={1.5} />
                        </button>

                        <AnimatePresence>
                          {menuOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.92, y: -4 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: "absolute", top: "calc(100% + 6px)", right: 0,
                                zIndex: 200, width: 160,
                                ...GLASS, borderRadius: "14px", padding: "6px",
                              }}
                            >
                              <button
                                onClick={() => { setOpenNotes(p => ({ ...p, [ex.id]: !p[ex.id] })); setOpenMenus(p => ({ ...p, [ex.id]: false })); }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
                              >
                                {notesOpen ? "Hide Notes" : "Add Notes"}
                              </button>
                              {isDeleting ? (
                                <div style={{ padding: "6px 8px" }}>
                                  <p className="text-xs text-slate-400 mb-2" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>Delete exercise?</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => removeExercise(ex.id)}
                                      className="flex-1 text-xs text-red-400 hover:text-red-300 py-1 rounded border border-red-500/30 transition-colors">Yes</button>
                                    <button onClick={() => { setDeleteConfirm(null); setOpenMenus(p => ({ ...p, [ex.id]: false })); }}
                                      className="flex-1 text-xs text-slate-500 hover:text-slate-300 py-1 rounded border border-slate-700 transition-colors">No</button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setDeleteConfirm(ex.id); }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                  style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}
                                >
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Notes area */}
                    <AnimatePresence>
                      {notesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
                            <textarea
                              rows={2}
                              value={ex.notes}
                              onChange={e => updateExercise(ex.id, "notes", e.target.value)}
                              placeholder="Add notes…"
                              style={{
                                width: "100%", resize: "none",
                                background: "rgba(30,41,59,0.6)",
                                border: "1px solid rgba(51,65,85,0.4)",
                                borderRadius: "12px", padding: "10px 14px",
                                color: "rgba(241,245,249,0.6)", fontSize: "13px",
                                fontFamily: "'Poppins',system-ui,sans-serif",
                                outline: "none",
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── SET ROWS ────────────────────────────────────────────── */}
                    <div style={{ padding: "16px 20px 8px" }}>
                      {ex.sets.map((set, si) => {
                        const isDone = set.isCompleted;
                        const vol    = (Number(set.weight) || 0) * (Number(set.reps) || 0);
                        const rest   = restTimers[set.id];
                        const showRest = isDone && rest?.active !== false && rest;

                        return (
                          <div key={set.id}>
                            {/* Set flex row */}
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: si * 0.04 }}
                              style={{
                                height: 64,
                                borderRadius: 14,
                                padding: "0 16px",
                                marginBottom: 8,
                                display: "flex", alignItems: "center", gap: 12,
                                transition: "all 0.3s",
                                ...(isDone
                                  ? {
                                      background: "rgba(34,197,94,0.08)",
                                      border: "1px solid rgba(34,197,94,0.3)",
                                      borderLeft: "3px solid #22c55e",
                                    }
                                  : {
                                      background: "rgba(30,41,59,0.3)",
                                      border: "1px solid rgba(51,65,85,0.4)",
                                    })
                              }}
                            >
                              {/* 1 — Set number / check */}
                              <div style={{ width: 32, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
                                <AnimatePresence mode="wait">
                                  {isDone ? (
                                    <motion.div
                                      key="check"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: [0, 1.4, 1] }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                    >
                                      <Check size={18} strokeWidth={2.5} style={{ color: "#22c55e" }} />
                                    </motion.div>
                                  ) : (
                                    <motion.span
                                      key="num"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      style={{
                                        fontFamily: "'Oswald','Poppins',sans-serif",
                                        fontSize: 22, fontWeight: 700, color: "#64748b",
                                      }}
                                    >
                                      {si + 1}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* 2 — Prev */}
                              <div style={{ width: 56, flexShrink: 0 }}>
                                <p style={{ fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(100,116,139,0.5)", lineHeight: 1.2 }}>PREV</p>
                                <p style={{ fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 11, color: "#64748b", marginTop: 2 }}>—</p>
                              </div>

                              {/* 3 — Weight group */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => !isDone && updateSet(ex.id, set.id, "weight", Math.max(0, (Number(set.weight) || 0) - 2.5).toString())}
                                  style={{
                                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                                    background: "rgba(30,41,59,0.45)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: isDone ? "not-allowed" : "pointer",
                                    opacity: isDone ? 0.4 : 1,
                                  }}
                                  className="text-slate-500 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                                >
                                  <Minus size={14} strokeWidth={2} />
                                </motion.button>

                                <input
                                  type="number" step="0.5" min="0"
                                  value={set.weight}
                                  onChange={e => updateSet(ex.id, set.id, "weight", e.target.value)}
                                  disabled={isDone}
                                  placeholder="0"
                                  style={{
                                    width: 80, height: 48,
                                    textAlign: "center",
                                    background: "rgba(2,6,23,0.6)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    borderRadius: 12,
                                    fontFamily: "'Oswald','Poppins',sans-serif",
                                    fontSize: 22, fontWeight: 700,
                                    color: isDone ? "#64748b" : "#f1f5f9",
                                    outline: "none",
                                    transition: "border 0.15s, box-shadow 0.15s",
                                  }}
                                  onFocus={e => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)";
                                  }}
                                  onBlur={e => {
                                    e.target.style.borderColor = "rgba(51,65,85,0.6)";
                                    e.target.style.boxShadow = "none";
                                  }}
                                />

                                <span style={{ fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748b" }}>KG</span>

                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => !isDone && updateSet(ex.id, set.id, "weight", ((Number(set.weight) || 0) + 2.5).toString())}
                                  style={{
                                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                                    background: "rgba(30,41,59,0.45)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: isDone ? "not-allowed" : "pointer",
                                    opacity: isDone ? 0.4 : 1,
                                  }}
                                  className="text-slate-500 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                                >
                                  <Plus size={14} strokeWidth={2} />
                                </motion.button>
                              </div>

                              {/* 4 — × separator */}
                              <span style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: 20, color: "rgba(100,116,139,0.4)", flexShrink: 0 }}>×</span>

                              {/* 5 — Reps group */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => !isDone && updateSet(ex.id, set.id, "reps", Math.max(0, (Number(set.reps) || 0) - 1).toString())}
                                  style={{
                                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                                    background: "rgba(30,41,59,0.45)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: isDone ? "not-allowed" : "pointer",
                                    opacity: isDone ? 0.4 : 1,
                                  }}
                                  className="text-slate-500 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                                >
                                  <Minus size={14} strokeWidth={2} />
                                </motion.button>

                                <input
                                  type="number" min="0"
                                  value={set.reps}
                                  onChange={e => updateSet(ex.id, set.id, "reps", e.target.value)}
                                  disabled={isDone}
                                  placeholder="0"
                                  style={{
                                    width: 80, height: 48,
                                    textAlign: "center",
                                    background: "rgba(2,6,23,0.6)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    borderRadius: 12,
                                    fontFamily: "'Oswald','Poppins',sans-serif",
                                    fontSize: 22, fontWeight: 700,
                                    color: isDone ? "#64748b" : "#f1f5f9",
                                    outline: "none",
                                    transition: "border 0.15s, box-shadow 0.15s",
                                  }}
                                  onFocus={e => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)";
                                  }}
                                  onBlur={e => {
                                    e.target.style.borderColor = "rgba(51,65,85,0.6)";
                                    e.target.style.boxShadow = "none";
                                  }}
                                />

                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => !isDone && updateSet(ex.id, set.id, "reps", ((Number(set.reps) || 0) + 1).toString())}
                                  style={{
                                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                                    background: "rgba(30,41,59,0.45)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(51,65,85,0.6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: isDone ? "not-allowed" : "pointer",
                                    opacity: isDone ? 0.4 : 1,
                                  }}
                                  className="text-slate-500 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors"
                                >
                                  <Plus size={14} strokeWidth={2} />
                                </motion.button>
                              </div>

                              {/* 6 — Volume + PR badge */}
                              {(() => {
                                const isPR = isDone && ex.name &&
                                  (Number(set.weight) || 0) > 0 &&
                                  (Number(set.weight) || 0) >= (prRecords[ex.name] || 0) &&
                                  ex.sets.filter(s => s.isCompleted).length > 1;
                                return (
                                  <div style={{ width: 64, textAlign: "right", flexShrink: 0, position: "relative" }}>
                                    {vol > 0 ? (
                                      <span style={{
                                        fontFamily: "'Poppins',system-ui,sans-serif",
                                        fontSize: 13,
                                        color: isPR ? "#f97316" : "#64748b",
                                      }}>{vol}</span>
                                    ) : (
                                      <span style={{ fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 13, color: "rgba(100,116,139,0.4)" }}>—</span>
                                    )}
                                    <AnimatePresence>
                                      {isPR && (
                                        <motion.div
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                          style={{
                                            position: "absolute", top: -20, right: 0,
                                            display: "flex", alignItems: "center", gap: 2,
                                            background: "rgba(249,115,22,0.2)",
                                            border: "1px solid rgba(249,115,22,0.4)",
                                            borderRadius: 9999,
                                            padding: "2px 6px",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <TrendingUp size={10} style={{ color: "#f97316" }} />
                                          <span style={{
                                            fontFamily: "'Poppins',system-ui,sans-serif",
                                            fontSize: 9, letterSpacing: "0.08em",
                                            textTransform: "uppercase", color: "#f97316",
                                          }}>PR!</span>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })()}

                              {/* 7 — Remove + Complete button */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                {ex.sets.length > 1 && !isDone && (
                                  <button
                                    onClick={() => removeSet(ex.id, set.id)}
                                    style={{ padding: 4, background: "transparent", border: "none", cursor: "pointer" }}
                                    className="text-slate-700 hover:text-red-400 transition-colors"
                                  >
                                    <X size={12} strokeWidth={2} />
                                  </button>
                                )}
                                <motion.button
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => {
                                    toggleDone(ex.id, set.id);
                                    if (!isDone) {
                                      startRest(set.id, 90);
                                      if (ex.name && (Number(set.weight) || 0) > 0) {
                                        setPrRecords(p => ({
                                          ...p,
                                          [ex.name]: Math.max(p[ex.name] || 0, Number(set.weight) || 0),
                                        }));
                                      }
                                    } else {
                                      skipRest(set.id);
                                    }
                                  }}
                                  style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    ...(isDone
                                      ? { background: "rgba(34,197,94,0.2)", border: "1px solid #22c55e" }
                                      : { background: "rgba(30,41,59,0.45)", border: "1px solid rgba(51,65,85,0.5)" })
                                  }}
                                  className={isDone ? "text-[#22c55e]" : "text-slate-500 hover:text-[#22c55e] hover:border-[#22c55e] hover:bg-[rgba(34,197,94,0.1)]"}
                                >
                                  <Check size={18} strokeWidth={2} />
                                </motion.button>
                              </div>
                            </motion.div>

                            {/* ── REST TIMER ──────────────────────────────────── */}
                            <AnimatePresence>
                              {isDone && rest && rest.secs > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  style={{ overflow: "hidden", marginBottom: 8 }}
                                >
                                  <div style={{
                                    display: "flex", alignItems: "center", gap: 16,
                                    padding: "10px 20px",
                                    background: "rgba(30,41,59,0.45)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(37,99,235,0.3)",
                                    borderRadius: 16,
                                    width: "fit-content",
                                    margin: "0 auto",
                                  }}>
                                    {/* SVG ring */}
                                    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                                      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
                                        <circle cx="22" cy="22" r="16" fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth="3" />
                                        <circle
                                          cx="22" cy="22" r="16" fill="none"
                                          stroke="#3b82f6" strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeDasharray={`${2 * Math.PI * 16}`}
                                          strokeDashoffset={`${2 * Math.PI * 16 * (1 - rest.secs / (rest.preset || 90))}`}
                                          style={{ transition: "stroke-dashoffset 1s linear" }}
                                        />
                                      </svg>
                                      <span style={{
                                        position: "absolute", inset: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontFamily: "'Oswald','Poppins',sans-serif",
                                        fontSize: rest.secs > 0 ? 13 : 12,
                                        fontWeight: 700,
                                        color: rest.secs === 0 ? "#22c55e" : "#f1f5f9",
                                      }}>
                                        {rest.secs > 0 ? rest.secs : "GO!"}
                                      </span>
                                    </div>

                                    {/* Presets */}
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {[60, 90, 120, 180].map(s => (
                                        <button
                                          key={s}
                                          onClick={() => resetRest(set.id, s)}
                                          style={{
                                            fontFamily: "'Poppins',system-ui,sans-serif",
                                            fontSize: 10, padding: "3px 8px",
                                            borderRadius: 9999,
                                            background: rest.preset === s ? "rgba(37,99,235,0.25)" : "rgba(30,41,59,0.6)",
                                            border: `1px solid ${rest.preset === s ? "rgba(37,99,235,0.5)" : "rgba(51,65,85,0.5)"}`,
                                            color: rest.preset === s ? "#93c5fd" : "#64748b",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {s < 60 ? `${s}s` : s === 180 ? "3:00" : `${s}s`}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Skip */}
                                    <button
                                      onClick={() => skipRest(set.id)}
                                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                                      className="text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                      <SkipForward size={14} strokeWidth={1.5} />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* ── ADD SET ROW ─────────────────────────────────────── */}
                      <motion.button
                        whileHover={{ borderColor: "#3b82f6", backgroundColor: "rgba(37,99,235,0.05)" }}
                        onClick={() => addSet(ex.id)}
                        style={{
                          width: "100%", height: 48,
                          borderRadius: 14,
                          border: "1px dashed rgba(51,65,85,0.5)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          cursor: "pointer",
                          background: "transparent",
                          marginBottom: 4,
                          transition: "all 0.2s",
                        }}
                      >
                        <Plus size={16} strokeWidth={2} style={{ color: "#3b82f6" }} />
                        <span style={{ fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 13, color: "#3b82f6" }}>Add Set</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}

              {/* ── SECTION 4: Add Exercise ───────────────────────────────── */}
              <div style={{ width: "100%" }}>
                {/* Trigger card */}
                <motion.button
                  onClick={() => { setShowSearch(s => !s); setSearchQuery(""); }}
                  whileHover={{
                    borderColor: "rgba(37,99,235,0.6)",
                    background: "rgba(37,99,235,0.07)",
                  }}
                  style={{
                    width: "100%", height: 100,
                    border: "2px dashed rgba(37,99,235,0.3)",
                    borderRadius: 24,
                    background: "rgba(37,99,235,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Animated plus bubble */}
                  <motion.div
                    animate={{ rotate: showSearch ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{
                      width: 48, height: 48, borderRadius: 16,
                      background: "rgba(37,99,235,0.15)",
                      border: "1px solid rgba(37,99,235,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={24} style={{ color: "#3b82f6" }} strokeWidth={2} />
                  </motion.div>

                  {/* Text */}
                  <div style={{ textAlign: "left" }}>
                    <p style={{
                      fontFamily: "'Oswald','Poppins',sans-serif",
                      fontSize: 22, fontWeight: 700, color: "#3b82f6",
                    }}>Add Exercise</p>
                    <p style={{
                      fontFamily: "'Poppins',system-ui,sans-serif",
                      fontSize: 13, color: "#64748b", marginTop: 4,
                    }}>Search 50+ exercises by muscle group</p>
                  </div>
                </motion.button>

                {/* Expandable search panel */}
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden", marginTop: 8 }}
                    >
                      <div style={{
                        ...GLASS, borderRadius: 20, padding: 16,
                      }}>
                        {/* Search input */}
                        <div style={{ position: "relative", marginBottom: 12 }}>
                          <Search size={16} style={{
                            position: "absolute", left: 14, top: "50%",
                            transform: "translateY(-50%)", color: "#3b82f6",
                          }} />
                          <input
                            autoFocus
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search exercises…"
                            style={{
                              width: "100%", padding: "12px 16px 12px 40px",
                              fontFamily: "'Poppins',system-ui,sans-serif",
                              fontSize: 14,
                              background: "rgba(2,6,23,0.6)",
                              border: "1px solid rgba(51,65,85,0.6)",
                              borderRadius: 16, color: "#f1f5f9", outline: "none",
                              transition: "border 0.15s",
                            }}
                            onFocus={e => e.target.style.borderColor = "#3b82f6"}
                            onBlur={e => e.target.style.borderColor = "rgba(51,65,85,0.6)"}
                          />
                        </div>

                        {/* Results grouped */}
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                          {Object.entries(EXERCISE_GROUPS).map(([grp, names]) => {
                            const colored = {
                              CHEST: "#3b82f6", BACK: "#22d3ee", LEGS: "#a78bfa",
                              SHOULDERS: "#3b82f6", ARMS: "#fb923c", CORE: "#22c55e", CARDIO: "#f97316",
                            }[grp] || "#64748b";
                            const visible = names.filter(n =>
                              n.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                            if (visible.length === 0) return null;
                            return (
                              <div key={grp}>
                                <p style={{
                                  fontFamily: "'Poppins',system-ui,sans-serif",
                                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                                  color: "#64748b", padding: "8px 16px 6px",
                                  borderBottom: "1px solid rgba(51,65,85,0.3)",
                                }}>{grp}</p>
                                {visible.map(name => (
                                  <button
                                    key={name}
                                    onClick={() => {
                                      addExercise();
                                      setTimeout(() => {
                                        setWorkout(p => {
                                          const exs = [...p.exercises];
                                          exs[exs.length - 1] = { ...exs[exs.length - 1], name };
                                          return { ...p, exercises: exs };
                                        });
                                      }, 0);
                                      setShowSearch(false);
                                      setSearchQuery("");
                                    }}
                                    style={{
                                      width: "100%", display: "flex", alignItems: "center",
                                      padding: "10px 16px", borderRadius: 12,
                                      background: "transparent", border: "none", cursor: "pointer",
                                      gap: 10, transition: "background 0.12s",
                                    }}
                                    className="hover:bg-[rgba(37,99,235,0.1)]"
                                  >
                                    <span style={{
                                      width: 8, height: 8, borderRadius: "50%",
                                      background: colored, flexShrink: 0,
                                    }} />
                                    <span style={{
                                      fontFamily: "'Poppins',system-ui,sans-serif",
                                      fontSize: 13, color: "#f1f5f9", flex: 1, textAlign: "left",
                                    }}>{name}</span>
                                    <span style={{
                                      fontFamily: "'Poppins',system-ui,sans-serif",
                                      fontSize: 11, color: "#64748b",
                                    }}>{grp}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── SECTION 5: Finish CTA (sticky bottom) ────────────────── */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 z-50 px-6"
              style={{
                height: "72px",
                background: "rgba(2,6,23,0.95)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderTop: "1px solid rgba(51,65,85,0.6)",
                display: "flex", alignItems: "center",
              }}
            >
              <div className="max-w-4xl mx-auto w-full flex items-center gap-6">
                {/* 4 mini stats */}
                <div className="flex gap-6 mr-auto">
                  {[
                    { label: "Volume",   val: `${Math.round(totalVolume)}kg`, color: "#3b82f6" },
                    { label: "Sets",     val: `${totalSetsN}`,                color: "#22d3ee" },
                    { label: "Calories", val: `${estCalories}`,               color: "#f97316" },
                    { label: "Time",     val: formatTime(elapsedSecs),        color: "#a78bfa" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{label}</p>
                      <span style={{
                        fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "20px",
                        fontWeight: 700, lineHeight: 1, color,
                      }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={handleFinish}
                  whileHover={{ scale: 1.01, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    border: "1px solid rgba(37,99,235,0.6)",
                    borderRadius: "14px",
                    minWidth: "180px", height: "48px",
                    boxShadow: "0 0 24px rgba(37,99,235,0.35)",
                    fontFamily: "'Oswald','Poppins',sans-serif",
                    fontWeight: 700, fontSize: "16px", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  Finish Session
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
