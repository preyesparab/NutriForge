import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const EXERCISES = [
  { id: "squat",          label: "Squat",           muscles: "Quads · Glutes" },
  { id: "dumbbell_curl",  label: "Dumbbell Curl",   muscles: "Biceps · Forearms" },
  { id: "push_up",        label: "Push Up",          muscles: "Chest · Triceps" },
  { id: "lunge",          label: "Lunge",            muscles: "Quads · Hamstrings" },
  { id: "shoulder_press", label: "Shoulder Press",  muscles: "Deltoids · Traps" },
  { id: "plank",          label: "Plank",            muscles: "Core · Shoulders" },
];

const AccuracyBar = ({ score }) => {
  const color = score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-800 rounded-full h-2.5 mt-1">
      <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  );
};

export default function WorkoutTracker() {
  const webcamRef  = useRef(null);
  const [selected, setSelected]  = useState(EXERCISES[0]);
  const [isActive, setIsActive]  = useState(false);
  const [reps,     setReps]      = useState(0);
  const [accuracy, setAccuracy]  = useState(0);
  const [feedback, setFeedback]  = useState(["Select an exercise and press Start."]);

  const handleStart = () => {
    setIsActive(true);
    setReps(0);
    setAccuracy(0);
    setFeedback(["Tracking started… ensure full body is visible."]);
    // TODO: start sending webcam frames to POST /pose/analyze on the AI service
  };

  const handleStop = () => {
    setIsActive(false);
    setFeedback((prev) => [...prev, "Session ended. Good job!"]);
  };

  return (
    <div className="ml-60 min-h-screen p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">Workout Tracker 🏋️</h2>
        <p className="text-gray-400 mt-1">Real-time pose estimation via MediaPipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Exercise Selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Select Exercise</h3>
          <div className="flex flex-col gap-2">
            {EXERCISES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { setSelected(ex); setIsActive(false); setReps(0); setFeedback(["Select an exercise and press Start."]); }}
                className={`text-left px-4 py-3 rounded-xl border transition-all
                  ${selected.id === ex.id
                    ? "border-green-500 bg-green-500/10 text-white"
                    : "border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white"
                  }`}
              >
                <p className="font-medium text-sm">{ex.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ex.muscles}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Webcam Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-gray-800">
            {isActive ? (
              <Webcam
                ref={webcamRef}
                mirrored
                className="w-full h-full object-cover"
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
              />
            ) : (
              <div className="text-center text-gray-600">
                <p className="text-5xl mb-3">📷</p>
                <p className="text-sm">Press <strong className="text-green-400">Start</strong> to activate camera</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={isActive}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              ▶ Start Session
            </button>
            <button
              onClick={handleStop}
              disabled={!isActive}
              className="flex-1 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              ⏹ Stop &amp; Save
            </button>
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Exercise</p>
              <p className="text-green-400 font-bold mt-1">{selected.label}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Reps</p>
              <p className="text-4xl font-bold text-white mt-1">{reps}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{accuracy}%</p>
              <AccuracyBar score={accuracy} />
            </div>
          </div>

          {/* Feedback Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Posture Feedback</h3>
            <ul className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {feedback.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-0.5">›</span> {msg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
