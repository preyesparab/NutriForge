import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import MiniCart from "./MiniCart";
import toast from "react-hot-toast";

function scrollToSection(id, navigate, pathname) {
  if (pathname !== "/") { navigate(`/#${id}`); return; }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconUser     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>;
const IconActivity = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const IconSettings = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IconLogout   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  
  const isAuthenticated = !!token;

  const [dropOpen,   setDropOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const dropRef  = useRef(null);
  const cartRef  = useRef(null);

  const totalItems = useCartStore((s) => s.totalItems)();

  const AUTH_LINKS = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/track-workout",  label: "Workouts" },
    { to: "/nutrition-scanner", label: "Nutrition Scanner" },
    { to: "/ai-plans",  label: "AI Plans" },
    { to: "/shop",      label: "Shop" },
  ];

  const publicNavItems = [
    { label: "Home",    action: () => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
    { label: "About",   action: () => scrollToSection("about",   navigate, pathname) },
    { label: "Contact", action: () => scrollToSection("contact", navigate, pathname) },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // MiniCart closes on outside click (handled inside MiniCart itself via onClose prop)

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center font-poppins">
      <div className="max-w-7xl w-full mx-auto px-6 flex items-center justify-between">
        
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 no-underline shrink-0">
          <div className="w-[32px] h-[32px] rounded-lg bg-blue-600 flex items-center justify-center font-oswald font-bold text-[15px] text-white">
            N
          </div>
          <span className="font-oswald text-[17px] font-bold text-white uppercase tracking-[0.12em]">
            NutriForge
          </span>
        </Link>

        {/* ── Left/Center Navigation ─────────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-2 px-8">
          {isAuthenticated ? (
             AUTH_LINKS.map(({ to, label }) => {
                const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                return (
                  <Link key={label} to={to}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      active 
                        ? "text-white bg-slate-800/50" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                    }`}
                  >
                    {label}
                  </Link>
                );
             })
          ) : (
            publicNavItems.map(({ label, action }) => (
              <button key={label} onClick={action}
                className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                {label}
              </button>
            ))
          )}
        </div>

        {/* ── Right Side ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* ── Cart Icon (always visible) ─────────────────────────────────── */}
          <div className="relative" ref={cartRef}>
            <button
              id="navbar-cart-btn"
              onClick={() => setCartOpen((o) => !o)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            {cartOpen && <MiniCart onClose={() => setCartOpen(false)} />}
          </div>

          {!isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md transition-colors">
                Get Started
              </Link>
            </div>
          ) : (
            /* Authenticated — Profile Dropdown */
            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen((o) => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {(user?.name?.[0] || "U").toUpperCase()}
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-60 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 mb-1 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white truncate">{user?.name || "Athlete User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || "athlete@forge.com"}</p>
                  </div>

                  <Link to="/profile" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <IconUser /> Profile & Goals
                  </Link>
                  <Link to="/history" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <IconActivity /> History & Analytics
                  </Link>
                  <Link to="/settings" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                    <IconSettings /> Settings
                  </Link>

                  <div className="border-t border-slate-800 my-1 pb-1 pt-1" />
                  
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors text-left"
                  >
                    <IconLogout /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-[16px] h-[1.5px] bg-current rounded-full block" />
            ))}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ─────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="absolute top-[64px] left-0 w-full bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col gap-2 shadow-2xl md:hidden">
          {isAuthenticated
            ? AUTH_LINKS.map(({ to, label }) => (
                <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                  className="block py-3 text-sm font-medium text-slate-400 hover:text-white border-b border-slate-900 last:border-0">
                  {label}
                </Link>
              ))
            : publicNavItems.map(({ label, action }) => (
                <button key={label} onClick={() => { action(); setMobileOpen(false); }}
                  className="block w-full text-left py-3 text-sm font-medium text-slate-400 hover:text-white border-b border-slate-900 last:border-0">
                  {label}
                </button>
              ))
          }
          {!isAuthenticated && (
            <div className="flex gap-3 mt-4">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-medium text-slate-300 border border-slate-800 rounded-lg hover:bg-slate-900">
                Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
