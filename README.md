# 🏋️ AI Gym Trainer — PoseNutri

An AI-powered gym trainer platform with real-time pose estimation, food recognition, and personalised fitness plans.

## Monorepo Structure

```
pose_nutri/
├── client/          # React (Vite) — User Dashboard
├── server/          # Node.js + Express — MERN API
├── ai_service/      # Python FastAPI — ML Microservice
└── docker-compose.yml
```

## Quick Start

### 1. Server (Node/Express)
```bash
cd server && npm install && npm run dev
```

### 2. Client (React/Vite)
```bash
cd client && npm install && npm run dev
```

### 3. AI Service (Python FastAPI)
```bash
cd ai_service
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```




### 🎨 Brand Design System & UI Specifications

**1. Core Colors & Theming**
- **Base Background:** Deep Slate/Dark Background (`#020617` / `slate-950`) or Black (`#0a0a0c`).
- **Primary Text:** Light Slate (`#f1f5f9`).
- **Blue Accent Theme (Active):** 
  - Blue (`#2563eb`)
  - Blue-Light (`#3b82f6`)
  - Cyan (`#22d3ee`)
  - Blue Glow (`rgba(37,99,235,0.35)`)
- **Orange Accent Theme (Secondary/Legacy):**
  - Orange (`#F97316`)
  - Orange-Light (`#FB923C`)
  - Orange-Dark (`#EA580C`)

**2. Typography Structure**
- **Headings (h1, h2, h3, .headline):** `'Oswald', 'Poppins', sans-serif`. Use for bold, impactful titles.
- **Body Text:** `'Poppins', 'Inter', system-ui, sans-serif`. Use for legibility on dark modes.

**3. Surface Styles & Glassmorphism**
- **Glass Panels (`.glass` class):**
  - Background: `rgba(30,41,59,0.45)` (Frosted Slate)
  - Blur: `backdrop-filter: blur(24px)`
  - Border: `1px solid rgba(51,65,85,0.6)`
  - Border Radius: `20px`
- **Stat Bubbles (`.stat-bubble` class):**
  - Background: `rgba(30,41,59,0.55)`
  - Blur: `backdrop-filter: blur(20px)`
  - Border: `1px solid rgba(51,65,85,0.65)`
  - Border Radius: `16px`

**4. Effects, Glows, and Gradients**
- **Subtle Texture:** The app uses a fixed subtle noise/grain SVG background texture layer (`opacity: 0.35`).
- **Blue Glow Elements (`.glow-blue` class):** `box-shadow: 0 0 30px rgba(37,99,235,0.35), 0 8px 32px rgba(0,0,0,0.5)`
- **Small Blue Glow (`.glow-blue-sm` class):** `box-shadow: 0 0 14px rgba(37,99,235,0.45)`
- **Blue Text Gradient (`.text-gradient-blue` class):** `linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)`
- **White Fade Text Gradient (`.text-gradient-white` class):** `linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)`

**5. Micro-Animations**
- **Pulse Ring (`.ring-glow` class):** A slow, infinite pulsating effect with a 3-second ease-in-out cycle. Scales up to 1.04x size and fades opacity.
