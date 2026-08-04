import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Check,
  RefreshCw,
  User,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";

interface Props {
  photoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  label?: string;
}

// Client-side lightweight image compression
async function compressImage(
  file: File,
  maxSizeInput = 400,
  qualityInput = 0.5,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxSize = maxSizeInput;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", qualityInput);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploader({
  photoUrl,
  onPhotoUploaded,
  label = "ছবি যোগ করুন (Attach Photo)",
}: Props) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start webcam
  const startCamera = async () => {
    setErrorMessage(null);
    setIsCameraActive(true);
    setProcessing(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn(err));
      }
    } catch (err) {
      console.error("Camera access failed", err);
      setErrorMessage(
        "ক্যামেরা অন করা সম্ভব হয়নি। অনুগ্রহ করে অনুমুতি দিন অথবা ক্যাবল চেক করুন।",
      );
      setIsCameraActive(false);
    } finally {
      setProcessing(false);
    }
  };

  // Safe release of streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Handle uploaded files through Drag-Drop or Dialog
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const compressedBase64 = await compressImage(files[0]);
      onPhotoUploaded(compressedBase64);
    } catch (err: any) {
      setErrorMessage(err?.message || "ছবি প্রসেস করতে ব্যর্থ হয়েছে।");
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileSelect(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".webp"],
    },
    multiple: false,
  } as any);

  // Capture current webcam frame
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Crop center squared image
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        onPhotoUploaded(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">
          {label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-150 rounded-[1.5rem]">
        {/* Photo Slot Preview / Camera Box */}
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0 shadow-inner group">
          {isCameraActive ? (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <button
                type="button"
                onClick={stopCamera}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X size={12} />
              </button>
            </div>
          ) : photoUrl ? (
            <div className="absolute inset-0 bg-white">
              <img
                src={photoUrl}
                alt="Profile photo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => onPhotoUploaded("")}
                className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="মুছে ফেলুন"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-300 flex flex-col items-center">
              <User size={36} className="text-slate-300 mb-1" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                No Photo
              </span>
            </div>
          )}

          {/* Loader Overlay */}
          {processing && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 size={20} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Custom Actions */}
        <div className="flex-1 space-y-2 w-full">
          {isCameraActive ? (
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm shadow-emerald-600/10"
            >
              <Check size={14} />
              <span>ছবি তুলুন (Take Snap)</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div {...getRootProps()} className="col-span-1">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className={`w-full h-full max-h-[38px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-sm ${isDragActive ? "border-primary bg-primary/10" : ""}`}
                >
                  <Upload size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate">ফাইলের ছবি</span>
                </button>
              </div>

              <button
                type="button"
                onClick={startCamera}
                className="col-span-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-sm shadow-blue-500/10"
              >
                <Camera size={13} className="shrink-0" />
                <span className="truncate">ক্যামেরা অন</span>
              </button>
            </div>
          )}

          <p className="text-[9px] text-slate-400 leading-normal font-sans font-medium">
            * পাসপোর্ট বা আইডি সাইজ ছবি আপলোড করুন অথবা ক্যামেরা অন করে সরাসরি
            ছবি ক্যাপচার করুন। ফাইলটি স্বয়ংক্রিয়ভাবে প্রসেস এবং কম্প্রেস হবে।
          </p>

          {errorMessage && (
            <p className="text-[9.5px] font-bold text-rose-600 font-sans mt-1">
              ⚠️ {errorMessage}
            </p>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
