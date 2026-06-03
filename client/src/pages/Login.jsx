import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

const BG_IMG = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80&fit=crop&crop=center";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const EyeOpen  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClosed= () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.08 10.08 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const LockIcon = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#ffffff">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form,      setForm]      = useState({ email: "", password: "" });
  const [errors,    setErrors]    = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [capsLock,  setCapsLock]  = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((err) => ({ ...err, [e.target.name]: "" }));
  };

  // Caps lock detection
  const handleKeyUp = (e) => setCapsLock(e.getModifierState("CapsLock"));

  // Client-side validation
  function validate() {
    const errs = {};
    if (!form.email)                          errs.email    = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.password)                       errs.password = "Password is required";
    return errs;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success("Welcome back, Athlete!");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Style helpers ───────────────────────────────────────────────────────────
  const getInputStyle = (field) => ({
    width: "100%", padding: "11px 14px",
    background: "#0a0f1a",
    border: `1px solid ${errors[field] ? "#ef4444" : "#1e293b"}`,
    borderRadius: "8px", color: "#ffffff",
    fontFamily: "Poppins, sans-serif", fontSize: "14px",
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  });
  const onF = (e) => { if (!errors[e.target.name]) e.target.style.borderColor = "#2563eb"; };
  const onB = (e) => { if (!errors[e.target.name]) e.target.style.borderColor = "#1e293b"; };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: 600,
    color: "#cbd5e1",                                   // slate-300 — brighter
    textTransform: "uppercase", letterSpacing: "0.14em",
    marginBottom: "7px", fontFamily: "Poppins, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "row-reverse", fontFamily: "Poppins, sans-serif", background: "#020617" }}>

      {/* RIGHT — image panel (desktop) */}
      <div className="hidden lg:block" style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
        <img src={BG_IMG} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        {/* FIX 4: Heavier overlay + backdrop blur on the overlay div */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.85) 100%)",
          backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "1px", background: "#0f172a" }} />

        <div style={{ position: "absolute", bottom: "10%", left: "10%", right: "10%", zIndex: 10 }}>
          <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "52px", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: "14px" }}>
            Every Rep.<br />
            <span style={{ background: "linear-gradient(90deg, #60a5fa, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Tracked.</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.7, maxWidth: "280px" }}>
            AI nutrition analysis and personalised workout plans — built for athletes.
          </p>
        </div>
      </div>

      {/* LEFT — form */}
      <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#020617", minHeight: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "32px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "16px", color: "#ffffff" }}>N</div>
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: "18px", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.12em" }}>NutriForge</span>
        </Link>

        {/* ── FORM PANEL ─────────────────────────────────────────────── */}
        <div style={{ width: "100%", maxWidth: "400px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>

          {/* Heading */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "10px", fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "6px" }}>Sign In</p>
            <h1 style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "6px" }}>Welcome Back</h1>
            <p style={{ color: "#64748b", fontSize: "13px" }}>Enter your credentials to access your dashboard.</p>
          </div>

          {/* FIX 1: Social login buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "Continue with Google", Icon: GoogleIcon },
              { label: "Continue with Apple",  Icon: AppleIcon  },
            ].map(({ label, Icon }) => (
              <button key={label} type="button"
                onClick={() => toast("Social login coming soon.", { icon: null, style: { background: "#0f172a", color: "#e2e8f0", border: "1px solid #1e293b", fontFamily: "Poppins, sans-serif", fontSize: 13 } })}
                style={{ width: "100%", padding: "11px 16px", background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "8px", color: "#ffffff", fontFamily: "Poppins, sans-serif", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.borderColor = "#334155"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0a0f1a"; e.currentTarget.style.borderColor = "#1e293b"; }}>
                <Icon />{label}
              </button>
            ))}
          </div>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
            <span style={{ color: "#334155", fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", fontFamily: "Poppins, sans-serif" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
          </div>

          {/* ── FORM ──────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} autoComplete="on" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input id="login-email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@nutriforge.ai" required
                autoComplete="email" style={getInputStyle("email")} onFocus={onF} onBlur={onB} />
              {errors.email && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "5px", fontFamily: "Poppins, sans-serif" }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                <span style={labelStyle}>Password</span>
                <a href="#" onClick={(e) => e.preventDefault()}
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", color: "#3b82f6", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#60a5fa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#3b82f6"; }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <input id="login-password" name="password" type={showPw ? "text" : "password"}
                  value={form.password} onChange={handleChange} placeholder="••••••••" required
                  autoComplete="current-password"
                  style={{ ...getInputStyle("password"), paddingRight: "44px" }}
                  onFocus={onF} onBlur={onB}
                  onKeyUp={handleKeyUp} />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", padding: 0, transition: "color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}>
                  {showPw ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {/* FIX 2: Caps lock warning */}
              {capsLock && <p style={{ color: "#f59e0b", fontSize: "11px", marginTop: "5px", fontFamily: "Poppins, sans-serif" }}>Caps Lock is ON</p>}
              {errors.password && <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "5px", fontFamily: "Poppins, sans-serif" }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={isLoading}
              style={{ width: "100%", padding: "13px", marginTop: "4px", borderRadius: "8px", background: "#2563eb", color: "#ffffff", fontFamily: "Poppins, sans-serif", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.75 : 1, transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#1d4ed8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}>
              {isLoading ? "Processing..." : "Sign In"}
            </button>

            {/* FIX 5: Trust signal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ color: "#475569" }}><LockIcon /></span>
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "11px", color: "#475569" }}>Your data is securely encrypted.</span>
            </div>
          </form>

          {/* FIX 6: Pill-shaped footer CTA */}
          <p style={{ textAlign: "center", fontSize: "13px", color: "#475569", marginTop: "20px" }}>
            New to NutriForge?{" "}
            <Link to="/register"
              style={{ display: "inline-block", padding: "3px 12px", background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "999px", color: "#22d3ee", fontWeight: 600, fontSize: "12px", textDecoration: "none", transition: "color 0.15s, border-color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#67e8f9"; e.currentTarget.style.borderColor = "#334155"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#22d3ee"; e.currentTarget.style.borderColor = "#1e293b"; }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
