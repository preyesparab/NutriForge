/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base:   "#0a0a0c",
        orange: { DEFAULT: "#F97316", light: "#FB923C", dark: "#EA580C" },
      },
      fontFamily: {
        headline: ["Oswald", "Poppins", "sans-serif"],
        body:     ["Poppins", "Inter", "system-ui", "sans-serif"],
        sans:     ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-orange":    "0 0 30px rgba(249,115,22,0.35), 0 8px 32px rgba(0,0,0,0.5)",
        "glow-orange-sm": "0 0 14px rgba(249,115,22,0.4)",
        "card":           "0 8px 40px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gradient-orange": "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
        "gradient-dark":   "linear-gradient(180deg, rgba(10,10,12,0) 0%, #0a0a0c 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":       { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
