import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { Camera, CheckCircle2, Flame, Dumbbell, Zap, Leaf, ArrowRight } from "lucide-react";
import PageTransition from "../components/PageTransition";
import UploadZone from "../components/NutritionScanner/UploadZone";
import ScanResult from "../components/NutritionScanner/ScanResult";
import useAuthStore from "../store/useAuthStore";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto items-center">
      <motion.div
        className="lg:col-span-7 flex flex-col items-start text-left z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.span variants={fadeInUp} className="text-blue-500 text-xs tracking-[0.2em] uppercase font-bold mb-4 block">
          AI-Powered · YOLOv8 · USDA FoodData Central
        </motion.span>
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-tight font-sans"
        >
          Know exactly what you're eating.
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-slate-400 text-lg max-w-md mt-6 font-sans leading-relaxed">
          Snap a photo and our YOLOv8 vision model identifies every ingredient and
          fetches lab-tested nutritional values directly from the USDA database —
          zero manual entry.
        </motion.p>
        <motion.div variants={fadeInUp}>
          <a
            href="#upload"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors mt-8 flex items-center gap-2 group inline-flex"
          >
            Try it now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="lg:col-span-5 relative"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div
          className="w-full aspect-square md:aspect-[4/5] shadow-md shadow-black/40"
          style={{
            clipPath: "polygon(10% 0, 100% 0%, 90% 100%, 0% 100%)",
            backgroundImage: 'url("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </motion.div>
    </div>
  );
}

// ── Why It Matters editorial section ─────────────────────────────────────────
function WhyItMatters() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="max-w-5xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-2 gap-16"
    >
      <div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight font-sans">
          Manual tracking is why most diets fail.
        </h2>
      </div>
      <div className="flex flex-col gap-6">
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-white font-semibold font-sans">Frictionless Logging</h4>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed font-sans">
            Reduce the 5-minute ordeal of searching and weighing ingredients down to a 3-second camera snap.
          </p>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-white font-semibold font-sans">Lab-Tested Precision</h4>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed font-sans">
            Every calorie and macro value comes from USDA FoodData Central — the same database nutritionists use.
          </p>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-white font-semibold font-sans">Portion Estimation</h4>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed font-sans">
            YOLOv8 estimates serving size from bounding-box area so values reflect what's actually on your plate.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── How It Works timeline ─────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "01", title: "Take a Photo",   desc: "Snap or upload a picture of your plate before the first bite." },
    { num: "02", title: "AI Detection",   desc: "YOLOv8 (trained on 256 food classes) segments each ingredient and draws bounding boxes." },
    { num: "03", title: "USDA Lookup",    desc: "Each detected food is looked up in the USDA FoodData Central database for lab-verified macros." },
    { num: "04", title: "Instant Log",    desc: "Review your full macro breakdown and save to your daily journal with one click." },
  ];
  return (
    <div className="max-w-3xl mx-auto mt-32">
      {steps.map((st, i) => (
        <motion.div
          key={st.num}
          initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="relative pl-8 py-6 ml-4 border-l border-slate-800"
        >
          <span className="absolute text-[120px] text-slate-800/30 font-black leading-none select-none -top-8 -left-6 z-0 font-sans tracking-tighter">
            {st.num}
          </span>
          <div className="relative z-10 pl-6">
            <h3 className="text-white text-xl font-bold font-sans">{st.title}</h3>
            <p className="text-slate-400 mt-2 font-sans max-w-sm">{st.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Goal tags ─────────────────────────────────────────────────────────────────
function GoalTags() {
  const tags = [
    { icon: <Flame className="w-4 h-4" strokeWidth={1.5} />, label: "Fat Loss" },
    { icon: <Dumbbell className="w-4 h-4" strokeWidth={1.5} />, label: "Hypertrophy" },
    { icon: <Zap className="w-4 h-4" strokeWidth={1.5} />, label: "Performance" },
    { icon: <Leaf className="w-4 h-4" strokeWidth={1.5} />, label: "Longevity" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-16 max-w-4xl mx-auto">
      {tags.map((t, idx) => (
        <div
          key={idx}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900 text-slate-300 font-medium text-sm hover:border-blue-500 hover:text-white cursor-default font-sans"
        >
          {t.icon}{t.label}
        </div>
      ))}
    </div>
  );
}

// ── Stat strip ────────────────────────────────────────────────────────────────
function StatStrip() {
  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 py-16 mt-32">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {[
          { val: "~2s",  label: "Inference Time" },
          { val: "256",  label: "Food Classes" },
          { val: "USDA", label: "Nutrition Source" },
        ].map(({ val, label }) => (
          <div key={label} className="flex-1 py-4 w-full">
            <p className="text-5xl font-black text-blue-500 font-sans">{val}</p>
            <p className="text-xs tracking-[0.15em] uppercase text-slate-400 mt-2 font-bold font-sans">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scan loading overlay ──────────────────────────────────────────────────────
function AnalyzingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
    >
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-blue-500/50 animate-pulse" />
        <Camera className="absolute inset-0 m-auto w-10 h-10 text-blue-400" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-xl font-sans tracking-tight">Running YOLOv8 Detection…</p>
        <p className="text-slate-400 text-sm mt-2 font-sans">Querying USDA FoodData Central for each item</p>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NutritionScannerPage() {
  const { token } = useAuthStore();
  const [scanResult, setScanResult]   = useState(null);   // { scanId, detectedFoods, totals, imageWithBoxes }
  const [analyzing,  setAnalyzing]    = useState(false);
  const [progress,   setProgress]     = useState(0);

  const handleAnalyze = async (file) => {
    if (!token) {
      toast.error("Please log in to use the nutrition scanner.");
      return;
    }
    setAnalyzing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post(`${API_URL}/nutrition/analyze`, formData, {
        headers: {
          "Content-Type":  "multipart/form-data",
          Authorization:   `Bearer ${token}`,
        },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
        timeout: 90_000,
      });

      const { scanId, detectedFoods, totals, imageWithBoxes } = res.data;

      if (!detectedFoods?.length) {
        const msg = res.data.message || "No food items detected. Try a clearer photo of just the food.";
        toast(msg, { icon: "🍽️", duration: 5000 });
        setAnalyzing(false);
        return;
      }

      setScanResult({ scanId, detectedFoods, totals, imageWithBoxes });
    } catch (err) {
      const msg = err.response?.data?.message || "Analysis failed. Is the AI service running?";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setProgress(0);
  };

  return (
    <PageTransition className="bg-slate-950 pt-24 pb-24 overflow-hidden font-sans">
      {/* Full-screen analyzing overlay */}
      <AnimatePresence>
        {analyzing && <AnalyzingOverlay />}
      </AnimatePresence>

      <div className="px-6">
        <AnimatePresence mode="wait">
          {scanResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              <ScanResult
                scanId={scanResult.scanId}
                detectedFoods={scanResult.detectedFoods}
                totals={scanResult.totals}
                imageWithBoxes={scanResult.imageWithBoxes}
                onReset={handleReset}
              />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeroSection />

              {/* Upload zone */}
              <div id="upload" className="max-w-3xl mx-auto mt-24">
                <UploadZone
                  onFileSelected={() => {}}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                  progress={progress}
                />
              </div>

              <WhyItMatters />
              <HowItWorks />
              <GoalTags />
              <StatStrip />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
