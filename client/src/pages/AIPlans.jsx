import { useState, useEffect, useRef } from "react";
import { usePDF }              from "react-to-pdf";
import { useNavigate }         from "react-router-dom";
import axios                   from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast                   from "react-hot-toast";
import useAuthStore            from "../store/useAuthStore";

// ── Form options ─────────────────────────────────────────────────────────────
const GOALS = [
  "Lose Fat",
  "Build Muscle",
  "Improve Endurance",
  "Body Recomposition",
  "Maintain & Tone",
];
const DIETS = [
  "Balanced (No restriction)",
  "High Protein",
  "Vegetarian",
  "Vegan",
  "Keto / Low-Carb",
  "Intermittent Fasting",
];

// ── SVG Icons (Lucide-style) ─────────────────────────────────────────────────
const IconClipboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconCpu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);
const IconDownload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconDumbbell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6 2L6 22M18 2l0 20M2 6h4M2 18h4M18 6h4M18 18h4M2 12h20" />
  </svg>
);
const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconFileText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

// ── useInView hook (IntersectionObserver) ─────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, inView];
}

// ── Stagger-item component ───────────────────────────────────────────────────
function FadeInItem({ inView, delay = 0, children, className = "" }) {
  return (
    <div
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 400ms ease-out ${delay}ms, transform 400ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function AIPlans() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const { token, authHeaders } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error("Please log in to access the plan generator.");
      navigate("/login");
    }
  }, [token, navigate]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    weight:            "",
    goal:              GOALS[0],
    timeframeWeeks:    "8",
    dietaryPreference: DIETS[0],
  });

  // ── Result & loading state ─────────────────────────────────────────────────
  const [plan,         setPlan]        = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab,    setActiveTab]    = useState("workout");

  // ── PDF hook ───────────────────────────────────────────────────────────────
  const { toPDF, targetRef } = usePDF({
    filename: "NutriForge_Protocol.pdf",
    page: { margin: 24, format: "a4" },
  });

  // ── IntersectionObserver refs ──────────────────────────────────────────────
  const [stepsRef,    stepsInView]    = useInView();
  const [benefitsRef, benefitsInView] = useInView();

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!token) { toast.error("Please log in to generate a plan."); return; }
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0) {
      toast.error("Please enter a valid body weight.");
      return;
    }
    setIsGenerating(true);
    setPlan(null);
    try {
      const { data } = await axios.post(
        "/api/ai/generate-plan",
        { ...form, weight: Number(form.weight) },
        authHeaders()
      );
      if (data.success) {
        setPlan(data.plan);
        toast.success("Protocol generated.");
      } else {
        toast.error(data.message || "Generation failed.");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else if (status === 429) {
        toast.error("The AI is busy — please wait 30–60 seconds and try again.", { duration: 6000 });
      } else {
        toast.error(err?.response?.data?.message || "Server error. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Inline styles (no Tailwind token drift) ────────────────────────────────
  const s = {
    page:       { background: "#020617", minHeight: "100vh", paddingTop: 64, fontFamily: "Poppins, Inter, sans-serif" },
    container:  { maxWidth: 1120, margin: "0 auto", padding: "0 24px" },
    accent:     "#3b82f6",
    accentHov:  "#2563eb",
    textHi:     "#ffffff",
    textMid:    "#94a3b8",
    textLo:     "#64748b",
    bg2:        "#0f172a",
    bg3:        "#0f172a",
    border:     "#1e293b",
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.container, paddingTop: 56, paddingBottom: 56 }}>
        <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>

          {/* ── Left column (60%) ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ flex: "1 1 540px", minWidth: 300 }}
          >
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.15em",
              textTransform: "uppercase", color: s.accent, marginBottom: 14,
            }}>
              AI-Powered Protocol
            </p>

            <h1 style={{
              fontSize: 52, fontWeight: 800, color: s.textHi,
              lineHeight: 1.15, margin: 0, marginBottom: 20,
              fontFamily: "Poppins, Inter, sans-serif",
            }}>
              Your Body. Your Plan.<br />Built by AI.
            </h1>

            <p style={{
              fontSize: 16, color: s.textMid, lineHeight: 1.7,
              maxWidth: 520, marginBottom: 28,
            }}>
              Answer four questions and receive a fully periodised workout split and
              precision nutrition protocol — built around your weight, goal, timeline,
              and dietary preference.
            </p>

            {/* Stat pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["7-Day Workout Split", "5 Precision Meals", "Macro Targets Included"].map((label) => (
                <span key={label} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: "8px 16px", fontSize: 12, fontWeight: 500, color: s.textHi,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: s.accent, flexShrink: 0,
                  }} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── Right column (40%) ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
            style={{ flex: "1 1 360px", minWidth: 280, position: "relative" }}
          >
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 340 }}>
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80"
                alt="Athlete training in gym"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Dark overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.25)",
              }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS STRIP
          ════════════════════════════════════════════════════════════════════ */}
      <section
        ref={stepsRef}
        style={{
          background: s.bg3,
          borderTop: `1px solid ${s.border}`,
          borderBottom: `1px solid ${s.border}`,
          padding: "28px 0",
        }}
      >
        <div style={{
          ...s.container,
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          flexWrap: "wrap", gap: 0,
        }}>
          {[
            { num: "01", icon: <IconClipboard />, title: "Enter Your Profile", desc: "Weight, goal, duration, diet" },
            { num: "02", icon: <IconCpu />,       title: "AI Builds Your Plan", desc: "Gemini analyses your inputs" },
            { num: "03", icon: <IconDownload />,   title: "Download & Execute", desc: "Get your PDF and start today" },
          ].map((step, i) => (
            <FadeInItem key={step.num} inView={stepsInView} delay={i * 100}>
              <div style={{
                display: "flex", alignItems: "flex-start",
              }}>
                {/* Vertical divider before steps 2 and 3 */}
                {i > 0 && (
                  <div style={{
                    width: 1, background: s.border, alignSelf: "stretch",
                    margin: "0 36px", minHeight: 48, flexShrink: 0,
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 200 }}>
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>{step.icon}</div>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: s.accent,
                      letterSpacing: "0.08em", display: "block", marginBottom: 4,
                    }}>
                      STEP {step.num}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: s.textHi, margin: 0, marginBottom: 3 }}>
                      {step.title}
                    </p>
                    <p style={{ fontSize: 13, color: s.textLo, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              </div>
            </FadeInItem>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FORM + BENEFITS
          ════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.container, paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {/* ── Profile inputs card ───────────────────────────────────────── */}
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: 36, marginBottom: 40,
          }}>
            <p style={{
              fontSize: 13, fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase", color: s.accent, marginBottom: 6, marginTop: 0,
            }}>
              Configure Your Protocol
            </p>
            <p style={{ fontSize: 13, color: s.textLo, margin: 0, marginBottom: 28 }}>
              Fill in your details — generation takes under 10 seconds
            </p>

            <form onSubmit={handleGenerate}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20, marginBottom: 28,
              }}>
                {/* Weight */}
                <FormField label="Body Weight (kg)">
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    min="30" max="300" step="0.5"
                    placeholder="e.g. 82"
                    value={form.weight}
                    onChange={handleChange}
                    required
                    style={inputStyle(s)}
                    onFocus={onFocusStyle} onBlur={onBlurStyle}
                  />
                </FormField>

                {/* Timeframe */}
                <FormField label="Program Duration (weeks)">
                  <input
                    id="timeframeWeeks"
                    name="timeframeWeeks"
                    type="number"
                    min="1" max="52" step="1"
                    placeholder="e.g. 8"
                    value={form.timeframeWeeks}
                    onChange={handleChange}
                    required
                    style={inputStyle(s)}
                    onFocus={onFocusStyle} onBlur={onBlurStyle}
                  />
                </FormField>

                {/* Goal */}
                <FormField label="Primary Goal">
                  <select
                    id="goal"
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    style={{ ...inputStyle(s), cursor: "pointer" }}
                    onFocus={onFocusStyle} onBlur={onBlurStyle}
                  >
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>

                {/* Dietary preference */}
                <FormField label="Dietary Preference">
                  <select
                    id="dietaryPreference"
                    name="dietaryPreference"
                    value={form.dietaryPreference}
                    onChange={handleChange}
                    style={{ ...inputStyle(s), cursor: "pointer" }}
                    onFocus={onFocusStyle} onBlur={onBlurStyle}
                  >
                    {DIETS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Generate button */}
              <button
                id="btn-generate-plan"
                type="submit"
                disabled={isGenerating}
                style={{
                  width: "100%",
                  maxWidth: 220,
                  height: 48,
                  background: isGenerating ? "#2563EB80" : s.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  transition: "background 150ms ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.background = s.accentHov; }}
                onMouseLeave={(e) => { if (!isGenerating) e.currentTarget.style.background = s.accent; }}
              >
                {isGenerating ? "Generating..." : "Generate Protocol"}
              </button>
            </form>
          </div>

          {/* ── Loading state ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: s.bg2, border: `1px solid ${s.border}`,
                  borderRadius: 10, padding: "48px 24px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                  marginBottom: 40,
                }}
              >
                {/* Pulsing spinner */}
                <div style={{ position: "relative", width: 56, height: 56 }}>
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: `2px solid ${s.accent}`, animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                    opacity: 0.3,
                  }} />
                  <span style={{
                    position: "absolute", inset: 8, borderRadius: "50%",
                    border: `2px solid ${s.accent}`, animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                    animationDelay: "0.2s", opacity: 0.5,
                  }} />
                  <span style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%", background: s.accent,
                      animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                    }} />
                  </span>
                </div>
                <p style={{
                  fontSize: 12, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: s.accent, margin: 0,
                }}>
                  Synthesizing your custom protocol...
                </p>
                <p style={{ fontSize: 13, color: s.textMid, margin: 0, maxWidth: 320, textAlign: "center" }}>
                  The AI is crafting your personalised training and nutrition plan. This takes a moment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <AnimatePresence>
            {plan && !isGenerating && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{ marginBottom: 48 }}
              >
                {/* Header bar */}
                <div style={{
                  display: "flex", flexWrap: "wrap", alignItems: "center",
                  justifyContent: "space-between", gap: 16, marginBottom: 20,
                }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 700, color: s.textHi, margin: 0,
                    fontFamily: "Oswald, Poppins, sans-serif", letterSpacing: "0.04em",
                  }}>
                    YOUR PROTOCOL
                  </h2>
                  <button
                    id="btn-download-pdf"
                    onClick={() => toPDF()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: s.accent, color: "#fff", border: "none",
                      borderRadius: 6, padding: "10px 20px",
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                      textTransform: "uppercase", cursor: "pointer",
                      transition: "background 150ms ease", fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = s.accentHov}
                    onMouseLeave={(e) => e.currentTarget.style.background = s.accent}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>

                {/* Tab switcher */}
                <div style={{
                  display: "flex", gap: 4, padding: 4,
                  background: s.bg2, borderRadius: 8,
                  border: `1px solid ${s.border}`, width: "fit-content", marginBottom: 20,
                }}>
                  {["workout", "diet"].map((tab) => (
                    <button
                      key={tab}
                      id={`tab-${tab}`}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "10px 22px", borderRadius: 6,
                        fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
                        textTransform: "uppercase", border: "none", cursor: "pointer",
                        background: activeTab === tab ? s.accent : "transparent",
                        color: activeTab === tab ? "#fff" : "#94A3B8",
                        transition: "all 200ms ease", fontFamily: "inherit",
                      }}
                    >
                      {tab === "workout" ? "Workout Plan" : "Diet Plan"}
                    </button>
                  ))}
                </div>

                {/* ── Printable / PDF target ───────────────────────────────── */}
                <div
                  ref={targetRef}
                  style={{
                    background: "#020617", padding: "32px",
                    borderRadius: 10, border: `1px solid ${s.border}`,
                  }}
                >
                  {/* PDF header */}
                  <div style={{
                    borderBottom: `1px solid ${s.border}`, paddingBottom: 20, marginBottom: 28,
                  }}>
                    <p style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: s.accent, margin: 0, marginBottom: 6,
                    }}>
                      NutriForge — AI Protocol Dossier
                    </p>
                    <h2 style={{
                      fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, marginBottom: 8,
                      fontFamily: "Oswald, Poppins, sans-serif",
                    }}>
                      PERSONALISED FITNESS &amp; NUTRITION PLAN
                    </h2>
                    <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                      Goal: {form.goal} &nbsp;|&nbsp;
                      Duration: {form.timeframeWeeks} weeks &nbsp;|&nbsp;
                      Diet: {form.dietaryPreference} &nbsp;|&nbsp;
                      Weight: {form.weight} kg
                    </p>
                  </div>

                  {/* Workout section */}
                  {activeTab === "workout" && (
                    <div>
                      <SectionHeading label="Workout Protocol" accent={s.accent} />
                      {plan.workoutPlan.map((day, i) => (
                        <DayBlock key={i} day={day} s={s} />
                      ))}
                    </div>
                  )}

                  {/* Diet section */}
                  {activeTab === "diet" && (
                    <div>
                      <SectionHeading label="Nutrition Protocol" accent={s.accent} />
                      <MealTable meals={plan.dietPlan} s={s} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Benefit cards ─────────────────────────────────────────────── */}
          <div ref={benefitsRef} style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {[
              {
                icon: <IconDumbbell />,
                title: "Science-Backed Training",
                desc: "Progressive overload split designed around your goal — push, pull, legs or full-body.",
              },
              {
                icon: <IconTarget />,
                title: "Precision Nutrition",
                desc: "Every meal calculated to hit your calorie and macro targets for your specific body weight.",
              },
              {
                icon: <IconFileText />,
                title: "Exportable Protocol",
                desc: "Download your full plan as a PDF and take it to the gym or kitchen immediately.",
              },
            ].map((card, i) => (
              <FadeInItem key={card.title} inView={benefitsInView} delay={i * 80}>
                <div style={{
                  background: s.bg2, border: `1px solid ${s.border}`,
                  borderLeft: `3px solid ${s.accent}`,
                  borderRadius: 8, padding: 24,
                  height: "100%",
                }}>
                  <div style={{ marginBottom: 14 }}>{card.icon}</div>
                  <p style={{
                    fontSize: 15, fontWeight: 700, color: s.textHi,
                    margin: 0, marginBottom: 8,
                  }}>
                    {card.title}
                  </p>
                  <p style={{ fontSize: 13, color: s.textMid, margin: 0, lineHeight: 1.6 }}>
                    {card.desc}
                  </p>
                </div>
              </FadeInItem>
            ))}
          </div>

        </div>
      </section>

      {/* Keyframe animations via style tag */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        /* Custom select arrow for dark selects */
        select option {
          background: #0f172a;
          color: #ffffff;
        }
        /* Remove number input spinners for clean look */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

// ── Helper: Input style object ───────────────────────────────────────────────
function inputStyle(s) {
  return {
    width: "100%",
    height: 48,
    background: "#020617",
    border: `1px solid ${s.border}`,
    borderRadius: 6,
    padding: "0 16px",
    color: s.textHi,
    fontSize: 14,
    outline: "none",
    transition: "border-color 150ms ease",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
}
function onFocusStyle(e) { e.currentTarget.style.borderColor = "#3b82f6"; }
function onBlurStyle(e)  { e.currentTarget.style.borderColor = "#1e293b"; }

// ── FormField wrapper ────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: "#94A3B8", marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ label, accent }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 600, letterSpacing: "0.18em",
      textTransform: "uppercase", color: accent, marginBottom: 16, marginTop: 0,
    }}>
      {label}
    </p>
  );
}

function DayBlock({ day, s }) {
  const isRest = !day.exercises || day.exercises.length === 0;
  return (
    <div style={{
      border: `1px solid ${s.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 12,
    }}>
      <div style={{
        background: s.bg2, padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{day.dayName}</span>
        {isRest && (
          <span style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#94a3b8", background: "#1e293b", padding: "4px 12px", borderRadius: 20,
          }}>
            Rest
          </span>
        )}
      </div>

      {!isRest && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderTop: `1px solid ${s.border}` }}>
                {["Exercise", "Sets", "Reps", "Rest"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#64748B",
                    width: i === 0 ? "50%" : "auto",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex, idx) => (
                <tr key={idx} style={{
                  borderTop: `1px solid ${s.border}`,
                  background: idx % 2 === 0 ? "transparent" : "rgba(15,23,42,0.4)",
                }}>
                  <td style={{ padding: "12px 20px", color: "#fff", fontWeight: 500 }}>{ex.name}</td>
                  <td style={{ padding: "12px 20px", color: "#CBD5E1" }}>{ex.sets}</td>
                  <td style={{ padding: "12px 20px", color: "#CBD5E1" }}>{ex.reps}</td>
                  <td style={{ padding: "12px 20px", color: "#94A3B8" }}>{ex.rest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MealTable({ meals, s }) {
  return (
    <div>
      {meals.map((meal, i) => (
        <div key={i} style={{
          border: `1px solid ${s.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 12,
        }}>
          <div style={{
            background: s.bg2, padding: "12px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{meal.mealName}</span>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94A3B8" }}>
              <span><span style={{ color: "#fff", fontWeight: 500 }}>{meal.macros.calories}</span> kcal</span>
              <span style={{ color: s.accent, fontWeight: 500 }}>{meal.macros.protein} protein</span>
              <span><span style={{ color: "#CBD5E1" }}>{meal.macros.carbs}</span> carbs</span>
              <span><span style={{ color: "#CBD5E1" }}>{meal.macros.fat}</span> fat</span>
            </div>
          </div>
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${s.border}` }}>
            <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>{meal.food}</p>
          </div>
        </div>
      ))}

      <TotalsRow meals={meals} s={s} />
    </div>
  );
}

function TotalsRow({ meals, s }) {
  const total = meals.reduce(
    (acc, m) => ({
      cal:     acc.cal     + (Number(m.macros.calories) || 0),
      protein: acc.protein + parseFloat(m.macros.protein) || 0,
      carbs:   acc.carbs   + parseFloat(m.macros.carbs)   || 0,
      fat:     acc.fat     + parseFloat(m.macros.fat)     || 0,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div style={{
      border: `1px solid rgba(59,130,246,0.3)`, background: "rgba(59,130,246,0.05)",
      borderRadius: 8, padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
        textTransform: "uppercase", color: s.accent,
      }}>
        Daily Totals
      </span>
      <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
        <span style={{ color: "#fff", fontWeight: 700 }}>{total.cal} kcal</span>
        <span style={{ color: "#60A5FA" }}>{Math.round(total.protein)}g protein</span>
        <span style={{ color: "#CBD5E1" }}>{Math.round(total.carbs)}g carbs</span>
        <span style={{ color: "#CBD5E1" }}>{Math.round(total.fat)}g fat</span>
      </div>
    </div>
  );
}
