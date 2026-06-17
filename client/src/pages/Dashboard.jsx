import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Flame, Timer, BarChart3, Activity, Salad, ClipboardList,
  Coffee, Sun, Moon, Apple, Plus, Trash2, ChevronDown,
  UtensilsCrossed, Dumbbell, TrendingUp, Clock, Zap,
  Repeat, Target,
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import useAuthStore from "../store/useAuthStore";

const API_URL = import.meta.env.VITE_API_BASE_URL;

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
  borderRadius: "16px",
};

const cardAnim = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
});

/* ─── Animated counter ────────────────────────────────────────────────────── */
function Counter({ target, decimals = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const dur = 1200;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(Number((e * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}</>;
}

/* ─── Shared section label ────────────────────────────────────────────────── */
const SLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3"
    style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
    {children}
  </p>
);

/* ─── Chart tooltip ───────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...GLASS, padding: "8px 14px", borderRadius: "12px" }}>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1"
        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{label}</p>
      <p className="text-white text-sm font-semibold"
        style={{ fontFamily: "'Oswald','Poppins',sans-serif" }}>
        {payload[0].value} kg
      </p>
    </div>
  );
};

/* ─── Calorie donut ───────────────────────────────────────────────────────── */
function CalorieDonut({ consumed, goal, size = 160 }) {
  const sw = 12;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / (goal || 1), 1);
  const offset = circ - pct * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="transparent" stroke="rgba(51,65,85,0.5)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="transparent" stroke="url(#calorieGrad)" strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{
          fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "30px",
          fontWeight: 700, lineHeight: 1,
          background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          <Counter target={consumed} />
        </span>
        <span className="text-slate-500 text-[10px] mt-0.5"
          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
          / {goal} kcal
        </span>
      </div>
    </div>
  );
}

/* ─── Meal section constants ──────────────────────────────────────────────── */
const MEAL_META = {
  breakfast: { label: "Breakfast", Icon: Coffee, color: "#f97316" },
  lunch: { label: "Lunch", Icon: Sun, color: "#22d3ee" },
  dinner: { label: "Dinner", Icon: Moon, color: "#a78bfa" },
  snack: { label: "Snacks", Icon: Apple, color: "#3b82f6" },
};

const MACRO_META = [
  { key: "protein", label: "Protein", color: "#22d3ee", goal: 150 },
  { key: "carbs", label: "Carbs", color: "#a78bfa", goal: 250 },
  { key: "fat", label: "Fat", color: "#f97316", goal: 65 },
];

const CALORIE_GOAL = 2200;
const WORKOUT_TYPE_COLOR = { PUSH: "#3b82f6", PULL: "#22d3ee", LEGS: "#a78bfa", "FULL BODY": "#f97316" };

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  /* ── data state ─────────────────────────────────────────────────────────── */
  const [stats, setStats] = useState({ totalCalories: 0, totalMinutes: 0, totalVolume: 0, totalWorkouts: 0 });
  const [chartData, setChartData] = useState([]);
  const [goals, setGoals] = useState({ workoutsCompletedThisWeek: 0, weeklyTarget: 4 });
  const [recentWk, setRecentWk] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("7D");
  const [expandedMeals, setExpandedMeals] = useState({ breakfast: true, lunch: true, dinner: false, snack: false });
  const [loading, setLoading] = useState(true);

  /* ── fetch ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API_URL}/analytics/dashboard`, h),
      axios.get(`${API_URL}/workouts/recent`, h),
      axios.get(`${API_URL}/nutrition/log?limit=30`, h),
    ]).then(([dash, wk, nutr]) => {
      const d = dash.data.data;
      setStats(d.stats || {});
      setChartData(d.chartData || []);
      setGoals(d.goals || {});
      setRecentWk(wk.data.data || []);
      setNutritionLogs(nutr.data.scans || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  /* ── derived nutrition ──────────────────────────────────────────────────── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLogs = nutritionLogs.filter(s =>
    s.scannedAt?.slice(0, 10) === todayStr || s.createdAt?.slice(0, 10) === todayStr
  );

  const totalConsumed = todayLogs.reduce((a, s) => a + (s.totals?.calories || 0), 0);
  const totalProtein = todayLogs.reduce((a, s) => a + (s.totals?.protein || 0), 0);
  const totalCarbs = todayLogs.reduce((a, s) => a + (s.totals?.carbs || 0), 0);
  const totalFat = todayLogs.reduce((a, s) => a + (s.totals?.fat || 0), 0);

  /* group by mealType */
  const groupedMeals = todayLogs.reduce((acc, scan) => {
    const t = scan.mealType || "snack";
    if (!acc[t]) acc[t] = [];
    acc[t].push(scan);
    return acc;
  }, {});

  /* streak: count consecutive days with a workout */
  const streak = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let count = 0, d = new Date(today);
    const wkDates = new Set(recentWk.map(w => new Date(w.date).toISOString().slice(0, 10)));
    while (wkDates.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  /* heading date */
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  /* ── loading skeleton ───────────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border border-slate-700 border-t-blue-500 animate-spin" />
    </div>
  );

  const progressPct = Math.min((goals.workoutsCompletedThisWeek / (goals.weeklyTarget || 4)) * 100, 100);

  return (
    <PageTransition className="bg-[#020617] min-h-screen pt-24 pb-20 relative overflow-hidden">

      {/* Noise layer */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.035,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ── ROW 1: Header ─────────────────────────────────────────────────── */}
        <motion.div {...cardAnim(0)} className="flex items-start justify-between mb-8">
          <div>
            <h1 style={{
              fontFamily: "'Oswald','Poppins',sans-serif",
              background: "linear-gradient(180deg,#fff,rgba(255,255,255,0.6))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              fontSize: "30px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.1,
            }}>
              Dashboard
            </h1>
            <p className="text-slate-500 text-xs mt-1.5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
              {dateStr} · {greeting}, {user?.name?.split(" ")[0] || "Athlete"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/nutrition-scanner")}
              style={{ ...GLASS, borderRadius: "12px", padding: "9px 16px", border: "1px solid rgba(59,130,246,0.45)" }}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>Log Meal</span>
            </button>
            <button
              onClick={() => navigate("/track-workout")}
              style={{ ...GLASS, borderRadius: "12px", padding: "9px 16px", border: "1px solid rgba(59,130,246,0.45)" }}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              <Dumbbell className="w-4 h-4" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>Log Workout</span>
            </button>
          </div>
        </motion.div>

        {/* ── ROW 2: Stat Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { icon: <Flame className="w-4 h-4" strokeWidth={1.5} />, label: "Calories Burned", value: stats.totalCalories || 0, color: "#f97316", sub: "+12% from yesterday", subIcon: <TrendingUp className="w-3 h-3" strokeWidth={1.5} />, subColor: "#22d3ee" },
            { icon: <Timer className="w-4 h-4" strokeWidth={1.5} />, label: "Workout Minutes", value: stats.totalMinutes || 0, color: "#3b82f6", sub: "Active minutes today", subColor: "#64748b" },
            { icon: <BarChart3 className="w-4 h-4" strokeWidth={1.5} />, label: "Volume (kg)", value: stats.totalVolume || 0, color: "#22d3ee", sub: "Total weight lifted", subColor: "#64748b" },
            { icon: <Activity className="w-4 h-4" strokeWidth={1.5} />, label: "Sessions", value: stats.totalWorkouts || 0, color: "#a78bfa", sub: `${goals.workoutsCompletedThisWeek} of ${goals.weeklyTarget} this week`, subColor: "#64748b" },
          ].map((c, i) => (
            <motion.div key={c.label} {...cardAnim(1 + i)}
              style={GLASS}
              className="p-5 hover:border-blue-600/50 transition-all duration-300 group cursor-default"
            >
              <div className="flex items-center justify-between mb-4">
                <span style={{ color: c.color }}>{c.icon}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{c.label}</span>
              </div>
              <p style={{
                fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "42px",
                fontWeight: 700, lineHeight: 1, color: "#f1f5f9", letterSpacing: "-0.01em",
              }}>
                <Counter target={c.value} />
              </p>
              <div className="flex items-center gap-1 mt-2">
                {c.subIcon && <span style={{ color: c.subColor }}>{c.subIcon}</span>}
                <span className="text-[11px]" style={{ color: c.subColor, fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  {c.sub}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── ROW 3: Chart + Weekly Ring ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">

          {/* Volume chart */}
          <motion.div {...cardAnim(5)} style={GLASS} className="lg:col-span-8 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "18px", fontWeight: 600, color: "#f1f5f9" }}>
                  Volume Progression
                </h2>
                <p className="text-slate-500 text-xs mt-0.5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  Total weight lifted per session
                </p>
              </div>
              <div className="flex items-center gap-1">
                {["7D", "30D", "90D"].map(p => (
                  <button key={p} onClick={() => setChartPeriod(p)}
                    style={{
                      fontFamily: "'Poppins',system-ui,sans-serif",
                      fontSize: "11px", padding: "4px 12px", borderRadius: "9999px",
                      ...(chartPeriod === p
                        ? { background: "rgba(37,99,235,0.2)", border: "1px solid #3b82f6", color: "#3b82f6" }
                        : { background: "transparent", border: "1px solid rgba(51,65,85,0.6)", color: "#64748b" })
                    }}
                    className="transition-all duration-150"
                  >{p}</button>
                ))}
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" axisLine={false} tickLine={false}
                    tick={{ fill: "rgba(241,245,249,0.4)", fontSize: 11, fontFamily: "'Poppins',sans-serif" }} dy={8} />
                  <YAxis stroke="transparent" axisLine={false} tickLine={false}
                    tick={{ fill: "rgba(241,245,249,0.4)", fontSize: 11, fontFamily: "'Poppins',sans-serif" }}
                    tickFormatter={v => `${v}`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(51,65,85,0.5)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#volGrad)" fillOpacity={1}
                    dot={{ fill: "#020617", stroke: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#22d3ee", stroke: "#020617", strokeWidth: 2, r: 6 }}
                    isAnimationActive animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Weekly ring */}
          <motion.div {...cardAnim(6)} style={GLASS} className="lg:col-span-4 p-6 flex flex-col items-center justify-center">
            <SLabel>Weekly Target</SLabel>

            {/* SVG ring */}
            {(() => {
              const sz = 150, sw = 12, r = (sz - sw) / 2, circ = 2 * Math.PI * r;
              const off = circ - (progressPct / 100) * circ;
              return (
                <div className="relative flex items-center justify-center" style={{ width: sz, height: sz }}>
                  <svg className="-rotate-90" width={sz} height={sz}>
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <circle cx={sz / 2} cy={sz / 2} r={r} fill="transparent"
                      stroke="rgba(51,65,85,0.5)" strokeWidth={sw} />
                    <circle cx={sz / 2} cy={sz / 2} r={r} fill="transparent"
                      stroke="url(#ringGrad)" strokeWidth={sw} strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={off}
                      style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{
                      fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "44px", fontWeight: 700, lineHeight: 1,
                      background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                      {goals.workoutsCompletedThisWeek}
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                      of {goals.weeklyTarget}
                    </span>
                  </div>
                </div>
              );
            })()}

            <p className="text-slate-500 text-xs text-center mt-4" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
              {goals.workoutsCompletedThisWeek} of {goals.weeklyTarget} sessions completed
            </p>
          </motion.div>
        </div>

        {/* ── ROW 4: Nutrition + Food Log ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">

          {/* Nutrition summary */}
          <motion.div {...cardAnim(7)} style={GLASS} className="lg:col-span-5 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Salad className="w-[18px] h-[18px] text-[#22d3ee]" strokeWidth={1.5} />
                <h2 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "18px", fontWeight: 600, color: "#f1f5f9" }}>
                  Today's Nutrition
                </h2>
              </div>
              <button onClick={() => navigate("/nutrition-scanner")}
                className="text-blue-400 hover:underline text-xs transition-colors"
                style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                View Full Log →
              </button>
            </div>

            {/* Calorie donut */}
            <div className="flex justify-center mb-6">
              <CalorieDonut consumed={totalConsumed} goal={CALORIE_GOAL} />
            </div>

            {/* Macro pills */}
            <div className="grid grid-cols-3 gap-3">
              {MACRO_META.map(({ key, label, color, goal }, i) => {
                const val = key === "protein" ? totalProtein : key === "carbs" ? totalCarbs : totalFat;
                const pct = Math.min((val / goal) * 100, 100);
                return (
                  <motion.div key={key} style={BUBBLE} className="p-3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500"
                        style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{label}</span>
                    </div>
                    <span style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "20px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1 }}>
                      {Math.round(val)}
                    </span>
                    <span className="text-slate-600 text-[10px] ml-1" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                      / {goal}g
                    </span>
                    <div className="mt-2 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.7 + i * 0.1, ease: "easeOut" }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Food Log */}
          <motion.div {...cardAnim(8)} style={GLASS} className="lg:col-span-7 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-[18px] h-[18px] text-[#3b82f6]" strokeWidth={1.5} />
                <h2 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "18px", fontWeight: 600, color: "#f1f5f9" }}>
                  Food Log
                </h2>
                <span className="text-slate-500 text-xs ml-1" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  · Today
                </span>
              </div>
              <button
                onClick={() => navigate("/nutrition-scanner")}
                style={{ ...BUBBLE, padding: "5px 12px", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.4)" }}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Add Food
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "340px" }}>
              {Object.keys(MEAL_META).map((mealKey) => {
                const meta = MEAL_META[mealKey];
                const items = groupedMeals[mealKey] || [];
                const mealCal = items.reduce((a, s) => a + (s.totals?.calories || 0), 0);
                const isOpen = expandedMeals[mealKey];

                return (
                  <div key={mealKey} style={{ borderRadius: "14px", border: "1px solid rgba(51,65,85,0.4)", overflow: "hidden" }}>
                    {/* Section header */}
                    <button
                      onClick={() => setExpandedMeals(p => ({ ...p, [mealKey]: !p[mealKey] }))}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        <meta.Icon className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: meta.color }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{meta.label}</span>
                        {items.length > 0 && (
                          <span className="text-[10px] text-blue-500 border border-blue-800/50 bg-blue-950/30 rounded-full px-1.5 py-0.5"
                            style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{items.length}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {mealCal > 0 && (
                          <span style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "13px", color: "#f1f5f9" }}>
                            {Math.round(mealCal)} kcal
                          </span>
                        )}
                        <ChevronDown
                          className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200"
                          strokeWidth={1.5}
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </div>
                    </button>

                    {/* Items */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden" }}
                        >
                          {items.length === 0 ? (
                            <div className="px-4 py-3 border-t border-slate-800/60">
                              <p className="text-slate-600 text-xs" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                                No items logged
                              </p>
                            </div>
                          ) : (
                            items.map((scan, si) => {
                              const name = (scan.detectedFoods?.[0]?.display_name ||
                                scan.detectedFoods?.[0]?.displayName ||
                                scan.detectedFoods?.[0]?.name || "Meal").split(",")[0].trim();
                              const cal = Math.round(scan.totals?.calories || 0);
                              const time = new Date(scan.scannedAt || scan.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                              const imgQ = encodeURIComponent(name.split(" ")[0]);

                              return (
                                <div key={scan._id}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors duration-150 cursor-pointer group"
                                  style={{ borderTop: "1px solid rgba(51,65,85,0.3)" }}
                                >
                                  {/* Thumbnail */}
                                  <img
                                    src={`https://source.unsplash.com/80x80/?${imgQ},food`}
                                    alt={name}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                                    style={{ border: "1px solid rgba(51,65,85,0.6)" }}
                                    onError={e => { e.target.style.display = "none"; }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-200 text-sm font-medium capitalize truncate"
                                      style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>{name}</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5"
                                      style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                                      {scan.detectedFoods?.length || 1} item{(scan.detectedFoods?.length || 1) !== 1 ? "s" : ""} · {time}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span style={{
                                      fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "15px",
                                      background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
                                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                                    }}>
                                      {cal} <span style={{ fontSize: "10px", WebkitTextFillColor: "#64748b" }}>kcal</span>
                                    </span>
                                    <Trash2 className="w-3.5 h-3.5 text-slate-700 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150" strokeWidth={1.5} />
                                  </div>
                                </div>
                              );
                            })
                          )}
                          {/* "+ Add to meal" */}
                          <div className="px-4 py-2 border-t border-slate-800/40">
                            <button onClick={() => navigate("/nutrition-scanner")}
                              className="text-blue-500 hover:underline text-xs"
                              style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                              + Add to {MEAL_META[mealKey].label}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Daily total bar */}
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold"
                  style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>Daily Total</span>
                <span style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "13px", color: "#f1f5f9" }}>
                  {Math.round(totalConsumed)} / {CALORIE_GOAL} kcal
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: totalConsumed > CALORIE_GOAL
                      ? "linear-gradient(90deg,#f97316,#fbbf24)"
                      : "linear-gradient(90deg,#22d3ee,#3b82f6)"
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalConsumed / CALORIE_GOAL) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── ROW 5: Recent Sessions ────────────────────────────────────────── */}
        <motion.div {...cardAnim(9)} style={GLASS} className="p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "18px", fontWeight: 600, color: "#f1f5f9" }}>
              Recent Sessions
            </h2>
            <button onClick={() => navigate("/track-workout")}
              className="text-blue-400 hover:underline text-xs"
              style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
              View All →
            </button>
          </div>

          {recentWk.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
              No sessions logged yet. Start your first workout!
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {recentWk.map((wk, i) => {
                const types = ["PUSH", "PULL", "LEGS", "FULL BODY"];
                const type = types[i % types.length];
                const vol = wk.exercises?.reduce((a, ex) =>
                  a + (ex.sets?.reduce((b, s) => b + (s.isCompleted ? (s.weight || 0) * (s.reps || 0) : 0), 0) || 0), 0) || 0;
                const sets = wk.exercises?.reduce((a, ex) => a + (ex.sets?.length || 0), 0) || 0;
                const pct = Math.min(((wk.durationMinutes || 0) / 60) * 100, 100);
                const tColor = WORKOUT_TYPE_COLOR[type] || "#3b82f6";

                return (
                  <motion.div key={wk._id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + i * 0.07 }}
                    whileHover={{ y: -2 }}
                    style={{ ...BUBBLE, minWidth: "200px", padding: "16px", cursor: "pointer" }}
                    className="shrink-0 transition-all duration-200"
                  >
                    <span style={{
                      fontFamily: "'Poppins',system-ui,sans-serif",
                      fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
                      background: `rgba(37,99,235,0.15)`, border: `1px solid rgba(59,130,246,0.3)`,
                      color: tColor, borderRadius: "9999px", padding: "2px 10px",
                    }}>
                      {type}
                    </span>
                    <p className="text-slate-200 text-sm font-medium mt-3 leading-snug"
                      style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                      {wk.title}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5"
                      style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                      {new Date(wk.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      {[
                        { Icon: Clock, val: `${wk.durationMinutes || 0}m` },
                        { Icon: Zap, val: `${Math.round(vol)}kg` },
                        { Icon: Repeat, val: `${sets} sets` },
                      ].map(({ Icon, val }) => (
                        <span key={val} className="flex items-center gap-1 text-[11px] text-slate-500"
                          style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                          <Icon className="w-3 h-3 text-[#3b82f6]" strokeWidth={1.5} />
                          {val}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#22d3ee)", transition: "width 0.8s ease" }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── ROW 6: Activity Panel ─────────────────────────────────────────── */}
        <motion.div {...cardAnim(10)} style={GLASS} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">

            {/* Col 1: Streak */}
            <div className="pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-8 h-8 text-[#f97316]" strokeWidth={1} />
                <span style={{
                  fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "52px", fontWeight: 700, lineHeight: 1,
                  background: "linear-gradient(180deg,#fff,rgba(255,255,255,0.6))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {streak}
                </span>
              </div>
              <SLabel>Day Streak</SLabel>
              {/* 7-day heatmap */}
              <div className="flex gap-2 mt-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const ds = d.toISOString().slice(0, 10);
                  const isToday = i === 6;
                  const hasWk = recentWk.some(w => new Date(w.date).toISOString().slice(0, 10) === ds);
                  return (
                    <div key={i} className="w-3 h-3 rounded-full"
                      style={{
                        background: hasWk ? "#3b82f6" : "rgba(51,65,85,0.5)",
                        outline: isToday ? "2px solid #22d3ee" : "none",
                        outlineOffset: "2px",
                      }} />
                  );
                })}
              </div>
            </div>

            {/* Col 2: Target workouts */}
            <div className="py-6 md:py-0 md:px-6">
              <h3 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "17px", fontWeight: 600, color: "#f1f5f9" }}>
                Target Workouts
              </h3>
              <div className="flex items-end gap-2 mt-2 mb-3">
                <span style={{
                  fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "44px", fontWeight: 700, lineHeight: 1,
                  background: "linear-gradient(135deg,#22d3ee,#3b82f6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {goals.workoutsCompletedThisWeek}
                </span>
                <span className="text-slate-500 text-xl mb-1" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  / {goals.weeklyTarget}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(51,65,85,0.5)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#3b82f6,#22d3ee)" }}
                  initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }} />
              </div>
              <span style={{
                fontFamily: "'Poppins',system-ui,sans-serif", fontSize: "10px",
                background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e", borderRadius: "9999px", padding: "3px 10px",
                display: "inline-flex", alignItems: "center", gap: "5px",
              }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Col 3: Calories burned */}
            <div className="pt-6 md:pt-0 md:pl-6">
              <h3 style={{ fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "17px", fontWeight: 600, color: "#f1f5f9" }}>
                Calories Burned
              </h3>
              <div className="flex items-end gap-2 mt-2 mb-3">
                <span style={{
                  fontFamily: "'Oswald','Poppins',sans-serif", fontSize: "44px", fontWeight: 700, lineHeight: 1,
                  background: "linear-gradient(135deg,#f97316,#fbbf24)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  <Counter target={stats.totalCalories || 0} />
                </span>
                <span className="text-slate-500 text-xl mb-1" style={{ fontFamily: "'Poppins',system-ui,sans-serif" }}>
                  / 2500
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#f97316,#fbbf24)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((stats.totalCalories || 0) / 2500) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.9, ease: "easeOut" }} />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
}
