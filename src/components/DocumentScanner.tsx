import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RefreshCw, Check, X, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onCapture: (files: File[]) => void;
  onClose: () => void;
}

export default function DocumentScanner({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    const tryStream = async (constraints: MediaStreamConstraints) => {
      try {
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
        return true;
      } catch (err) {
        return false;
      }
    };

    // Attempt 1: Back camera with high resolution
    let success = await tryStream({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    // Attempt 2: Any camera with high resolution (fallback for desktops/laptops)
    if (!success) {
      success = await tryStream({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    }

    // Attempt 3: Basic video (last resort)
    if (!success) {
      success = await tryStream({
        video: true,
        audio: false,
      });
    }

    if (!success) {
      setError(
        "Camera not found or permission denied. Please ensure your camera is connected and allowed.",
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const nextCapture = () => {
    if (capturedImage) {
      setScannedItems([...scannedItems, capturedImage]);
      setCapturedImage(null);
    }
  };

  const handleFinishBatch = async () => {
    const finalItems = [...scannedItems];
    if (capturedImage) {
      finalItems.push(capturedImage);
    }

    if (finalItems.length === 0) return;

    try {
      const filePromises = finalItems.map(async (dataUrl, index) => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], `scan_${Date.now()}_${index}.jpg`, {
          type: "image/jpeg",
        });
      });

      const files = await Promise.all(filePromises);
      onCapture(files);
      onClose();
    } catch (err) {
      console.error("Error creating files:", err);
      setError("Failed to process scanned images. Please try again.");
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl relative h-full sm:h-auto sm:aspect-[3/4] bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl border-x-0 border-y-0 sm:border-4 sm:border-slate-800">
        {/* Progress Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              Batch Mode
            </div>
            <span className="text-white text-xs font-bold">
              {scannedItems.length + (capturedImage ? 1 : 0)} Captured
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-900 z-30">
            <X className="text-red-500 mb-4" size={48} />
            <p className="text-lg font-bold mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
            >
              Close
            </button>
          </div>
        )}

        {/* Live View */}
        {!capturedImage && !error && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Camera Overlay Guide */}
            <div className="absolute inset-0 border-[40px] md:border-[60px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-white/50 rounded-xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>

            {/* Scanning Animation */}
            <motion.div
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
            />
          </div>
        )}

        {/* Preview Captured */}
        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full"
          >
            <img
              src={capturedImage}
              alt="Capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none"></div>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Scanned Items Strip */}
        {scannedItems.length > 0 && !capturedImage && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 px-6 overflow-x-auto scrollbar-hide py-4">
            {scannedItems.map((img, i) => (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={i}
                className="w-12 h-16 rounded-lg border-2 border-white/30 overflow-hidden shrink-0 bg-slate-800 shadow-xl"
              >
                <img
                  src={img}
                  className="w-full h-full object-cover"
                  alt={`scan-${i}`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent z-20">
          {!capturedImage ? (
            <div className="w-full flex items-center justify-between">
              <div className="w-12 h-12 flex items-center justify-center">
                {scannedItems.length > 0 && (
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <span className="text-sm font-black">
                      {scannedItems.length}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-slate-900 border-8 border-white/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full border-2 border-slate-900"></div>
              </button>

              <button
                onClick={handleFinishBatch}
                disabled={scannedItems.length === 0}
                className="flex flex-col items-center gap-1.5 text-white disabled:opacity-30 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check size={20} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  Done
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-8">
              <button
                onClick={retake}
                className="flex flex-col items-center gap-2 text-white group"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <RefreshCw size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Discard
                </span>
              </button>

              <button
                onClick={nextCapture}
                className="flex flex-col items-center gap-2 text-white group"
              >
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-all shadow-[0_0_25px_rgba(59,130,246,0.5)] border-4 border-white/20">
                  <Camera size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  Keep & Next
                </span>
              </button>

              <button
                onClick={handleFinishBatch}
                className="flex flex-col items-center gap-2 text-white group"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20">
                  <Check size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Save All
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 hidden sm:block text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
        NexTrip High-Precision Batch Scanner v2.0
      </p>
    </div>
  );
}
