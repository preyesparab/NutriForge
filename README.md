# 🏋️‍♂️ NutriForge

![NutriForge Banner](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop&q=80)

**NutriForge** is a next-generation, AI-powered gym trainer platform. It leverages advanced machine learning models for real-time pose estimation and food recognition, coupled with a robust full-stack ecosystem to track your workouts, manage your nutrition, and provide personalized fitness plans.

---

## Key Features

- 📸 **AI Nutrition Scanner:** Upload a photo of your meal and our YOLOv8 vision model automatically segments ingredients and fetches lab-tested USDA macro-nutritional values.
-  **Real-time Pose Tracking:** Uses Google's MediaPipe via your webcam to track your exercise form and count repetitions in real time.
-  **AI Protocol Generator:** Input your weight, goals, and dietary preferences to generate a highly-personalized 7-day workout split and 5-meal diet plan using Gemini 2.5 Flash.
-  **Integrated Shop:** An e-commerce module for purchasing fitness gear and supplements.
- **Dynamic Dashboard:** Track your daily calorie intake, workout volume, and progress through interactive charts.

---

## 🛠️ Technology Stack

This application is built using a microservices-inspired Monorepo architecture:

**Frontend (Client)**
- React 18 & Vite
- Tailwind CSS (Glassmorphism design system)
- Zustand (State Management)
- Framer Motion (Animations)
- Chart.js & Recharts

**Backend (Server)**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcryptjs
- Google Generative AI (Gemini)

**AI Microservice**
- Python 3 & FastAPI
- PyTorch & Ultralytics (YOLOv8)
- MediaPipe (Pose Estimation)
- OpenCV

---

## 📁 Monorepo Structure

```text
NutriForge/
├── client/          # React (Vite) User Dashboard & UI
├── server/          # Node.js + Express MERN API
├── ai_service/      # Python FastAPI ML Microservice
└── docker-compose.yml
```
> For a detailed, file-by-file breakdown of the architecture, see the [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

---

## Quick Start Guide  

You will need three separate terminal windows to run all microservices locally.

### 1. Configure Environment Variables
Copy the `.env.example` file in each directory to `.env` and fill in your credentials.
- `server/.env` requires a MongoDB URI and a Gemini API Key.
- `client/.env` requires the API URLs.
- `ai_service/.env` requires the YOLO model path.
> See the root `.env.example` file for a master guide of all required variables.

### 2. Start the Backend Server (Node.js)
```bash
cd server
npm install
npm run dev
```
*Runs on `http://localhost:5000`*

### 3. Start the AI Microservice (Python)
```bash
cd ai_service
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Runs on `http://localhost:8000`*

### 4. Start the Frontend Client (React)
```bash
cd client
npm install
npm run dev
```
*Runs on `http://localhost:3000`*

---

##  Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).


Implemented an in-memory caching layer using node-cache on the product listing endpoint (GET /api/products) to reduce redundant database queries for data that doesn't change on every request. The cache stores the full product list with a 60-second time-to-live (TTL); repeated requests within that window are served directly from memory instead of querying MongoDB, while the cache transparently refreshes from the database once the TTL expires. The implementation preserves the existing response shape and error handling, requiring no changes to the frontend or any other backend routes.
