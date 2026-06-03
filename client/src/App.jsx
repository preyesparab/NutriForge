import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import "./index.css";

import Layout      from "./components/Layout";
import Home        from "./pages/Home";
import Dashboard   from "./pages/Dashboard";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import AITracker   from "./pages/AITracker";
import NutritionScanner from "./pages/NutritionScanner";
import Shop        from "./pages/Shop";
import CartPage    from "./pages/CartPage";
import TrackWorkout from "./pages/TrackWorkout";
import AIPlans      from "./pages/AIPlans";

// Stub pages (Phase 3+)
const Profile  = () => <Layout><div className="max-w-4xl mx-auto px-6 py-16 text-white text-2xl" style={{ fontFamily: "Oswald" }}>PROFILE — Coming Soon</div></Layout>;
const Orders   = () => <Layout><div className="max-w-4xl mx-auto px-6 py-16 text-white text-2xl" style={{ fontFamily: "Oswald" }}>ORDERS — Coming Soon</div></Layout>;
const Checkout = () => <Layout><div className="max-w-4xl mx-auto px-6 py-16 text-white text-2xl" style={{ fontFamily: "Oswald" }}>CHECKOUT — Coming Soon</div></Layout>;

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15,17,21,0.97)",
            color: "#f1f5f9",
            border: "1px solid rgba(249,115,22,0.2)",
            fontFamily: "Poppins, sans-serif",
            fontSize: 13,
          },
          success: { iconTheme: { primary: "#F97316", secondary: "#0a0a0c" } },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth — full-page (no Layout navbar, they have their own) */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App routes — all wrapped in Layout */}
        <Route path="/"           element={<Layout><Home /></Layout>} />
        <Route path="/dashboard"  element={<Layout><Dashboard /></Layout>} />
        <Route path="/ai-tracker" element={<Layout><AITracker /></Layout>} />
        <Route path="/nutrition-scanner" element={<Layout><NutritionScanner /></Layout>} />
        <Route path="/shop"       element={<Layout><Shop /></Layout>} />
        <Route path="/cart"       element={<Layout><CartPage /></Layout>} />
        <Route path="/checkout"   element={<Checkout />} />
        <Route path="/track-workout" element={<Layout><TrackWorkout /></Layout>} />
        <Route path="/ai-plans"      element={<Layout><AIPlans /></Layout>} />
        <Route path="/profile"    element={<Profile />} />
        <Route path="/orders"     element={<Orders />} />

        {/* Legacy redirects from old sidebar routes */}
        <Route path="/workout"   element={<Navigate to="/ai-tracker" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
