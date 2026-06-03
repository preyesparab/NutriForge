import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/dashboard",  label: "Dashboard",  icon: "▣" },
  { to: "/workout",    label: "Workout",     icon: "◈" },
  { to: "/nutrition",  label: "Nutrition",   icon: "◉" },
  { to: "/shop",       label: "Shop",        icon: "◫" },
  { to: "/plans",      label: "My Plans",    icon: "◧" },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{
        background: "rgba(10,10,12,0.85)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="px-7 pt-8 pb-10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-glow-orange-sm"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}
          >
            K
          </div>
          <div>
            <p className="text-white font-black text-xl tracking-[0.12em] font-headline uppercase leading-none">
              Kinetiq
            </p>
            <p className="text-white/25 text-[9px] uppercase tracking-widest mt-0.5">
              AI Fitness Platform
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex flex-col px-4 flex-1 gap-0.5">
        <p className="text-[9px] text-white/20 font-semibold uppercase tracking-[0.18em] px-3 mb-3">
          Navigate
        </p>

        {navLinks.map(({ to, label, icon }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden"
              style={isActive ? {
                background: "rgba(249,115,22,0.08)",
                color: "#ffffff",
              } : {
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {/* Orange left-bar accent */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300"
                style={{
                  height: isActive ? "60%" : "0%",
                  background: "linear-gradient(180deg, #F97316, #EA580C)",
                  boxShadow: isActive ? "0 0 10px rgba(249,115,22,0.7)" : "none",
                }}
              />

              {/* Icon */}
              <span
                className="text-base transition-colors duration-200"
                style={{ color: isActive ? "#F97316" : "rgba(255,255,255,0.2)" }}
              >
                {icon}
              </span>

              {label}

              {/* Subtle hover bg */}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "rgba(255,255,255,0.03)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User card ─────────────────────────────────────────────────────── */}
      <div
        className="mx-4 mb-7 p-4 rounded-2xl flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Avatar with orange ring */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
            A
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2"
            style={{ borderColor: "#0a0a0c", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">Athlete</p>
          <p className="text-white/25 text-[10px] truncate">Pro Member</p>
        </div>
        <div className="ml-auto">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            ⚙
          </button>
        </div>
      </div>
    </aside>
  );
}
