import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

// ── Theme tokens ──────────────────────────────────────────────────────────────
const C = {
  blue600:  "#2563eb",
  blue700:  "#1d4ed8",
  slate950: "#020617",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  panel:    "#0f172a",
  panelBorder: "#1e293b",
};

// ── Images ────────────────────────────────────────────────────────────────────
const HERO_BG = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1800&q=90&fit=crop&crop=edges";

const TEAM = [
  { name: "Dr. Aryan Mehta",  role: "Lead AI Engineer",      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&crop=faces" },
  { name: "Priya Sharma",     role: "Head of Nutrition",     image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&crop=faces" },
  { name: "Marcus Cole",      role: "Senior Fitness Coach",  image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80&fit=crop&crop=faces" },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name:  "Rohan Verma",
    role:  "Marathon Runner",
    quote: "NutriForge's AI diet plan reduced my body fat by 6% in 10 weeks without losing any running performance. The macro breakdowns are frighteningly accurate.",
  },
  {
    name:  "Sneha Kapoor",
    role:  "Fitness Coach",
    quote: "I recommend it to every client now. The meal scanner catches nutritional details I miss manually, and the plan adapts weekly. It's like having a nutrition PhD on demand.",
  },
  {
    name:  "James Okafor",
    role:  "Competitive Bodybuilder",
    quote: "Three months on the NutriForge workout plan and I added 4 kg of lean muscle while staying in my weight class. The periodisation logic is elite-level.",
  },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconScale    = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v4" /><path d="M7 16s1-2 5-2 5 2 5 2" /></svg>;
const IconScan     = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>;
const IconDumbbell = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 4v16M18 4v16M6 12h12" /><rect x="2" y="7" width="4" height="10" rx="1" /><rect x="18" y="7" width="4" height="10" rx="1" /></svg>;
const IconShop     = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>;
const IconLock     = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
const IconArrow    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const IconCheck    = () => <svg width="13" height="13" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>;
const IconMail     = () => <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" /></svg>;
const IconPhone    = () => <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>;
const IconPin      = () => <svg width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;

// Star rating SVG (5 stars, no emojis)
const StarRow = ({ count = 5 }) => (
  <div style={{ display: "flex", gap: "3px" }}>
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#2563eb" stroke="none">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </div>
);

// ── Feature Pillars ───────────────────────────────────────────────────────────
const FEATURES = [
  { id: "bmi",       icon: <IconScale />,    title: "BMI Calculator",       desc: "Instantly calculate your Body Mass Index with personalised health insights.", route: "/dashboard",  cta: "Calculate BMI",     requiresAuth: true  },
  { id: "nutrition", icon: <IconScan />,     title: "Nutrition Scanner",    desc: "Snap a photo of any meal — AI identifies ingredients and delivers a full macro breakdown.", route: "/nutrition",   cta: "Scan a Meal",       requiresAuth: true  },
  { id: "plans",     icon: <IconDumbbell />, title: "Diet & Workout Plans", desc: "Fully custom diet and training programmes built around your goals.", route: "/ai-tracker",  cta: "Generate My Plan",  requiresAuth: true  },
  { id: "shop",      icon: <IconShop />,     title: "Shop",                 desc: "Curated supplements, equipment, and wellness products.", route: "/shop",        cta: "Browse Shop",       requiresAuth: false },
];

// ── Section Heading ───────────────────────────────────────────────────────────
function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "56px" }}>
      <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: "10px" }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "14px" }}>
        {title}
      </h2>
      <div style={{ width: "36px", height: "2px", background: "#2563eb", margin: "0 auto" }} />
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ feat, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: C.panel, border: `1px solid ${C.panelBorder}`,
      borderRadius: "14px", padding: "20px", textAlign: "left",
      cursor: "pointer", transition: "border-color 0.15s",
      display: "flex", flexDirection: "column", gap: "10px",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.panelBorder; }}
    >
      {/* Icon */}
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
        {feat.icon}
      </div>
      <div>
        <p style={{ fontFamily: "Oswald, sans-serif", fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {feat.title}
        </p>
        <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", color: "#64748b", lineHeight: 1.55, margin: 0 }}>
          {feat.desc}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {feat.cta}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {feat.requiresAuth && <span style={{ color: "#475569" }}><IconLock /></span>}
          <span style={{ color: "#475569" }}><IconArrow /></span>
        </div>
      </div>
    </button>
  );
}

// ── Team Card ─────────────────────────────────────────────────────────────────
function TeamCard({ name, role, image }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "16px", overflow: "hidden", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.panelBorder; }}>
      <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
        <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(to top, #0f172a, transparent)" }} />
      </div>
      <div style={{ padding: "18px 22px 24px" }}>
        <div style={{ width: "28px", height: "2px", background: "#2563eb", marginBottom: "10px" }} />
        <p style={{ fontFamily: "Oswald, sans-serif", fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{name}</p>
        <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, margin: 0 }}>{role}</p>
      </div>
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ name, role, quote }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "16px", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stars */}
      <StarRow count={5} />
      {/* Quote */}
      <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: C.slate300, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
        "{quote}"
      </p>
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "14px", color: "#3b82f6" }}>
          {name[0]}
        </div>
        <div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{name}</p>
          <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", color: "#475569", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: "#0a0f1a", border: "1px solid #1e293b",
    borderRadius: "8px", color: "#ffffff",
    fontFamily: "Poppins, sans-serif", fontSize: "14px",
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  };
  const labelStyle = {
    fontFamily: "Poppins, sans-serif", fontSize: "10px", color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.14em", display: "block",
    marginBottom: "7px", fontWeight: 600,
  };
  const onF = (e) => { e.target.style.borderColor = "#2563eb"; };
  const onB = (e) => { e.target.style.borderColor = "#1e293b"; };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you shortly.");
    e.target.reset();
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "16px", padding: "32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div><label style={labelStyle}>Name</label><input type="text" placeholder="Your name" required style={inputStyle} onFocus={onF} onBlur={onB} /></div>
        <div><label style={labelStyle}>Email</label><input type="email" placeholder="your@email.com" required style={inputStyle} onFocus={onF} onBlur={onB} /></div>
      </div>
      <div style={{ marginBottom: "16px" }}><label style={labelStyle}>Subject</label><input type="text" placeholder="How can we help?" required style={inputStyle} onFocus={onF} onBlur={onB} /></div>
      <div style={{ marginBottom: "24px" }}><label style={labelStyle}>Message</label><textarea rows={4} placeholder="Tell us more..." required style={{ ...inputStyle, resize: "vertical", minHeight: "110px" }} onFocus={onF} onBlur={onB} /></div>
      <button type="submit" style={{ width: "100%", padding: "13px", background: C.blue600, color: "#ffffff", fontFamily: "Poppins, sans-serif", fontSize: "13px", fontWeight: 700, borderRadius: "8px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", transition: "background 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.blue700; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = C.blue600; }}>
        Send Message
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate();
  const { hash }  = useLocation();
  const { token } = useAuthStore();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [hash]);

  function handleFeature(feature) {
    if (feature.requiresAuth && !token) {
      toast("Please login to access this feature", {
        icon: null,
        style: { background: C.panel, color: "#f1f5f9", border: `1px solid ${C.panelBorder}`, fontFamily: "Poppins, sans-serif", fontSize: 13 },
      });
      navigate("/login");
      return;
    }
    navigate(feature.route);
  }

  return (
    <div style={{ background: C.slate950, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════
           HERO — full viewport, single focal point
      ══════════════════════════════════════════════════════════════════ */}
      <section id="home" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>

        {/* Background photo */}
        <img src={HERO_BG} alt="" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%", zIndex: 0 }} />

        {/* FIX 3: Strong directional overlay that protects left text column */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: `linear-gradient(
            to right,
            rgba(2,6,23,1.00) 0%,
            rgba(2,6,23,0.97) 30%,
            rgba(2,6,23,0.85) 50%,
            rgba(2,6,23,0.30) 72%,
            rgba(2,6,23,0.00) 100%
          )`,
        }} />

        {/* Top vignette for navbar legibility */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "180px", background: "linear-gradient(180deg, rgba(2,6,23,0.55) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />

        {/* FIX 4: Floating widgets REMOVED — only headline, sub, CTA */}

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 10,
          minHeight: "100vh", maxWidth: "640px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "120px 6% 80px",
        }}>

          {/* Pill badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "999px", padding: "6px 16px", marginBottom: "24px", width: "fit-content" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              The Best&nbsp;&nbsp;|&nbsp;&nbsp;Fitness Club
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(44px,6.5vw,90px)", fontWeight: 700, color: "#ffffff", lineHeight: 1.03, letterSpacing: "-0.02em", marginBottom: "20px", textTransform: "uppercase" }}>
            Work Hard To<br />
            Get{" "}
            <span style={{ background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Better
            </span>
            <br />Life
          </h1>

          {/* Sub-headline */}
          <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#94a3b8", lineHeight: 1.75, marginBottom: "40px", maxWidth: "420px" }}>
            Calculate your BMI, scan meals with AI, and get fully personalised diet and workout plans — all in one place.
          </p>

          {/* FIX 2: Single dominant CTA — no secondary button clutter */}
          <button
            onClick={() => navigate(token ? "/dashboard" : "/register")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "16px 36px", borderRadius: "10px",
              background: C.blue600, color: "#ffffff",
              fontFamily: "Poppins, sans-serif", fontSize: "16px", fontWeight: 700,
              border: "none", cursor: "pointer",
              width: "fit-content",
              transition: "background 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.blue700; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.blue600; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Track Your Fitness
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* Minimal trust signal below CTA */}
          <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", color: "#475569", marginTop: "16px" }}>
            Free to start. No credit card required.
          </p>
        </div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: `linear-gradient(to top, ${C.slate950}, transparent)`, zIndex: 5, pointerEvents: "none" }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           FIX 5: TRUST BANNER — stats + testimonials
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.panel, borderTop: `1px solid ${C.panelBorder}`, borderBottom: `1px solid ${C.panelBorder}`, padding: "40px 6%" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>

          {/* Stat row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "48px" }}>
            {[
              { value: "10,000+", label: "Active Athletes" },
              { value: "4.9 / 5", label: "Average Rating", stars: true },
              { value: "AI Accuracy", label: "Certified" },
            ].map(({ value, label, stars }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 700, color: "#ffffff", margin: "0 0 4px" }}>
                  {value}
                </p>
                {stars && <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}><StarRow count={5} /></div>}
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>


        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CORE PILLARS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-950 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12 uppercase tracking-tight" style={{ fontFamily: "Oswald, sans-serif" }}>
            Optimize Every Aspect of Your Training
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Track Workout */}
            <Link to="/track-workout" className="bg-slate-900 border border-slate-800 rounded-xl p-8 block transition-colors hover:border-slate-700" style={{ textDecoration: 'none' }}>
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-600 mb-5">
                <IconDumbbell />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "Oswald, sans-serif" }}>Track Workout</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Log sets, reps, and weights in real-time. Built for the gym floor.
              </p>
              <span className="text-blue-500 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Start Logging <IconArrow />
              </span>
            </Link>

            {/* Pillar 2: Nutrition Scanner */}
            <Link to="/nutrition" className="bg-slate-900 border border-slate-800 rounded-xl p-8 block transition-colors hover:border-slate-700" style={{ textDecoration: 'none' }}>
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-600 mb-5">
                <IconScan />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "Oswald, sans-serif" }}>Nutrition Scanner</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Snap a photo to log your meals. AI breaks down macros instantly.
              </p>
              <span className="text-blue-500 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Scan Meal <IconArrow />
              </span>
            </Link>

            {/* Pillar 3: AI Plan Generator */}
            <Link to="/ai-tracker" className="bg-slate-900 border border-slate-800 rounded-xl p-8 block transition-colors hover:border-slate-700" style={{ textDecoration: 'none' }}>
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-600 mb-5">
                <IconScale />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "Oswald, sans-serif" }}>AI Plan Generator</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Get fully custom diet and training programs tailored to your goals.
              </p>
              <span className="text-blue-500 text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Generate Plan <IconArrow />
              </span>
            </Link>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           ABOUT NUTRIFORGE
      ══════════════════════════════════════════════════════════════════ */}
      <section id="about" style={{ background: "#0a0f1a", padding: "100px 6%", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <SectionHeading eyebrow="Who We Are" title="About NutriForge" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "64px", alignItems: "center" }}>
            {/* Story */}
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: C.slate300, lineHeight: 1.85, marginBottom: "20px" }}>
                NutriForge was built on a simple belief — everyone deserves professional-grade fitness and nutrition intelligence, not just elite athletes.
              </p>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "15px", color: C.slate400, lineHeight: 1.85, marginBottom: "32px" }}>
                We combine real-time AI with proven exercise science to give you a true 360° picture of your health — so you move smarter, eat better, and live stronger.
              </p>

              {[
                "Instant BMI analysis with personalised health insights",
                "AI meal scanner — photo to full macro breakdown in seconds",
                "Custom diet and workout plans matched to your exact goals",
                "Curated supplement and equipment shop with expert picks",
              ].map((text) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0, marginTop: "1px", background: "#0f172a", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconCheck />
                  </div>
                  <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: C.slate300, lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { value: "50K+", label: "Active Users"  },
                { value: "98%",  label: "Accuracy Rate" },
                { value: "2M+",  label: "Meals Scanned" },
                { value: "4.9",  label: "App Rating"    },
              ].map(({ value, label }) => (
                <div key={label} style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: "16px", padding: "28px 20px", textAlign: "center" }}>
                  <p style={{ fontFamily: "Oswald, sans-serif", fontSize: "38px", fontWeight: 700, color: C.blue600, lineHeight: 1, margin: "0 0 8px" }}>{value}</p>
                  <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           TESTIMONIALS / COMMENTS
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.slate950, padding: "80px 6%" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <SectionHeading eyebrow="Real Stories" title="What Our Athletes Say" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           MEET OUR EXPERTS
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.slate950, padding: "100px 6%" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading eyebrow="Our Team" title="Meet Our Experts" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {TEAM.map(({ name, role, image }) => <TeamCard key={name} name={name} role={role} image={image} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
           CONTACT US
      ══════════════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ background: C.panel, padding: "100px 6% 120px", scrollMarginTop: "80px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <SectionHeading eyebrow="Get In Touch" title="Contact Us" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px" }}>
            <div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "15px", color: C.slate400, lineHeight: 1.8, marginBottom: "36px" }}>
                Have a question, partnership idea, or just want to say hello? Our team responds within 24 hours.
              </p>
              {[
                { Icon: IconMail,  label: "Email Us",   value: "hello@nutriforge.ai" },
                { Icon: IconPhone, label: "Call Us",    value: "+1 (800) 765-4321"   },
                { Icon: IconPin,   label: "Our Office", value: "San Francisco, CA"   },
              ].map(({ Icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon />
                  </div>
                  <div>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "15px", color: "#ffffff", fontWeight: 500, margin: 0 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ background: C.slate950, borderTop: `1px solid ${C.panelBorder}`, padding: "24px 6%", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontFamily: "Oswald, sans-serif", fontSize: "16px", color: "#ffffff", letterSpacing: "0.1em" }}>NUTRIFORGE</p>
        <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", color: "#475569" }}>
          {new Date().getFullYear()} NutriForge. All rights reserved.
        </p>
      </div>
    </div>
  );
}
