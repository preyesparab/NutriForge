import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, ImageIcon } from "lucide-react";

/**
 * UploadZone
 * Props:
 *   onFileSelected(file: File, previewUrl: string) — called when user drops/selects an image
 *   onAnalyze(file: File)                           — called when user clicks "Analyze"
 *   analyzing: boolean                              — disables button while request is in flight
 *   progress: number (0–100)                        — upload progress %
 */
export default function UploadZone({ onFileSelected, onAnalyze, analyzing, progress }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const f = acceptedFiles[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      setFile(f);
      setPreview(url);
      onFileSelected(f, url);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop:   handleDrop,
    accept:   { "image/*": [] },
    multiple: false,
    disabled: analyzing,
  });

  const clearImage = (e) => {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    onFileSelected(null, null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto"
    >
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
          ${isDragActive
            ? "border-blue-500 bg-blue-900/10 scale-[1.01]"
            : preview
            ? "border-slate-700 bg-slate-900/50"
            : "border-slate-700 bg-slate-900 hover:border-blue-500/70 hover:bg-slate-800/60"
          }
          ${analyzing ? "pointer-events-none opacity-80" : ""}
        `}
        style={{ minHeight: preview ? "0" : "220px" }}
      >
        <input {...getInputProps()} capture="environment" />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img
                src={preview}
                alt="Selected meal"
                className="w-full max-h-96 object-cover rounded-2xl"
              />
              {/* Clear button */}
              {!analyzing && (
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Filename label */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent rounded-b-2xl">
                <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  {file?.name}
                  <span className="ml-auto text-slate-500">
                    {(file?.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 px-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
                <Camera className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-white font-sans mb-1">
                {isDragActive ? "Drop the meal here" : "Drop your meal photo"}
              </h3>
              <p className="text-sm text-slate-500 font-sans">
                or{" "}
                <span className="text-blue-400 hover:underline">browse files</span>
                {" "}— JPG, PNG, WEBP · max 15 MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {analyzing && progress > 0 && progress < 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right font-sans">
              Uploading… {Math.round(progress)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      <motion.button
        onClick={() => file && onAnalyze(file)}
        disabled={!file || analyzing}
        whileHover={file && !analyzing ? { scale: 1.02 } : {}}
        whileTap={file && !analyzing ? { scale: 0.98 } : {}}
        className={`mt-5 w-full py-4 rounded-xl font-bold text-sm font-sans flex items-center justify-center gap-2.5 transition-all
          ${file && !analyzing
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {analyzing ? (
          <>
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing with YOLOv8…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Analyze Meal
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
