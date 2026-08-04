import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Download,
  Check,
  RefreshCw,
  User,
  FileImage,
  UserCheck,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  X,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PassengerService } from "../services/passengerService";
import { Passenger } from "../types/passenger";

export default function PassportPhotoEditor() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>("");

  // Real-time passenger subscription
  useEffect(() => {
    const unsub = PassengerService.subscribeToPassengers((data) => {
      setPassengers(data);
    });
    return () => unsub();
  }, []);

  // Image source modes
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

  // Custom configuration presets
  const [bgColor, setBgColor] = useState<"white" | "light-blue" | "royal-blue">(
    "white",
  );
  const [attire, setAttire] = useState<
    "black-suit" | "navy-suit" | "white-shirt" | "original"
  >("black-suit");
  const [faceFidelity, setFaceFidelity] = useState<"high" | "ultra">("ultra");

  // Prompt states
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [userTweakText, setUserTweakText] = useState<string>("");

  // Editing stages
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [editedImageResult, setEditedImageResult] = useState<string | null>(
    null,
  );
  const [savedToPassenger, setSavedToPassenger] = useState<boolean>(false);

  // Camera references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-compile prompt based on user presets & personal tweaks
  const compilePrompt = useCallback(() => {
    let bgText = "solid clean bright studio white (#FFFFFF) background";
    if (bgColor === "light-blue")
      bgText = "solid clean studio soft light blue (#D0E1FD) background";
    if (bgColor === "royal-blue")
      bgText = "solid clean studio crisp royal blue (#1E40AF) background";

    let attireText =
      "a classic formal tailored black suit, pristine white dress shirt, and a clean formal necktie";
    if (attire === "navy-suit")
      attireText =
        "a classic professional navy blue blazer suit, white dress shirt, and a dark sleek tie";
    if (attire === "white-shirt")
      attireText =
        "a crisp, ironed formal white button-up dress shirt with neat collar lines";
    if (attire === "original")
      attireText = "their original clothing without modification";

    const basePrompt = `Convert this portrait photo into a premium, standard official passport photo style. 
Replace the background with a ${bgText}. 
Overlay and dress the subject in ${attireText}. 
The person's face structure, micro-expressions, hair textures, eyes shape, skin tone and identity MUST remain 100% same, authentic, matching, and unchanged from the source photo (100% face fidelity).
Center the subject, looking straight into the camera, with a professional slight smile or neutral expression, studio lighting, high resolution, and sharp balanced focus. No blurring over face areas.`;

    if (userTweakText.trim()) {
      return `${basePrompt}\nAdditionally apply these modifications: ${userTweakText.trim()}`;
    }
    return basePrompt;
  }, [bgColor, attire, userTweakText]);

  // Track modification changes and update prompt preview
  useEffect(() => {
    setCustomPrompt(compilePrompt());
  }, [compilePrompt]);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setEditedImageResult(null);
        setSavedToPassenger(false);
        setProcessingError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop mechanics
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      loadImage(file);
    }
  };

  // Camera streaming mechanics
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraReady(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setIsCameraReady(false);

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isMobile ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.error(err);
      setCameraError(
        "Camera access denied or device not found. Please verify permissions.",
      );
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw video frame to canvas
        ctx.scale(-1, 1); // mirror flip matching preview
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.scale(-1, 1); // restore

        const dataUrl = canvas.toDataURL("image/png");
        setImageSrc(dataUrl);
        setEditedImageResult(null);
        setSavedToPassenger(false);
        setProcessingError(null);
        stopCamera();
      }
    }
  };

  // Safe camera turndown on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Loading indicator step cycles
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Execute Gemini AI Passport Image Generation
  const processWithGemini = async () => {
    if (!imageSrc) return;

    setIsProcessing(true);
    setProcessingError(null);
    setProcessingStep(0);
    setEditedImageResult(null);
    setSavedToPassenger(false);

    try {
      const response = await fetch("/api/gemini/edit-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageSrc,
          prompt: customPrompt,
          modelName: "gemini-2.5-flash-image",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to process photo with Gemini AI.",
        );
      }

      setEditedImageResult(data.image);
    } catch (err: any) {
      console.error(err);
      setProcessingError(
        err.message ||
          "Something went wrong while connecting with Gemini AI. Make sure GEMINI_API_KEY is configured.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Download resulting png
  const downloadResult = () => {
    if (!editedImageResult) return;
    const link = document.createElement("a");

    // Attempt naming based on selected passenger
    const matched = passengers.find((p) => p.id === selectedPassengerId);
    const passengerName = matched
      ? matched.name.toLowerCase().replace(/\s+/g, "_")
      : "passenger";

    link.href = editedImageResult;
    link.download = `${passengerName}_passport_photo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save generated image to selected Firestore Passenger's Document List
  const saveToPassengerDocuments = async () => {
    if (!editedImageResult || !selectedPassengerId) return;

    try {
      const matchedPassenger = passengers.find(
        (p) => p.id === selectedPassengerId,
      );
      if (!matchedPassenger) return;

      // Base64 is supported gracefully under Document center sync
      const newDoc = {
        name: "Passport Size Photo (A.I. generated)",
        url: editedImageResult,
      };

      const updatedDocs = [...(matchedPassenger.documents || []), newDoc];

      // Save
      await PassengerService.updatePassenger(
        matchedPassenger.id!,
        { documents: updatedDocs },
        {
          status: matchedPassenger.status,
          updatedBy: "Gemini AI Portrait Hub",
          updatedByUid: "gemini-portrait-bot",
          timestamp: new Date().toISOString(),
        },
      );

      setSavedToPassenger(true);
    } catch (err: any) {
      alert(
        "Failed to update passenger's records in database. Error: " +
          err.message,
      );
    }
  };

  // Find currently selected passenger
  const currentPassenger = passengers.find((p) => p.id === selectedPassengerId);

  // Auto-select passenger initial source photo if they have one under documents
  useEffect(() => {
    if (currentPassenger && currentPassenger.documents) {
      const candidate = currentPassenger.documents.find(
        (doc) =>
          doc.name.toLowerCase().includes("photo") ||
          doc.name.toLowerCase().includes("portrait"),
      );
      if (candidate && candidate.url.startsWith("data:image")) {
        setImageSrc(candidate.url);
        setEditedImageResult(null);
        setSavedToPassenger(false);
      }
    }
  }, [currentPassenger]);

  return (
    <div className="space-y-8" id="passport-ai-hub">
      {/* Header section with branding and tagline */}
      <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-blue-400 animate-pulse" />
              <span>Real-time Passport Generator</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              পাসপোর্ট সাইজ ফটো এআই স্টুডিও
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed font-light">
              যাত্রীর সাধারণ ক্যাজুয়াল ছবি আপলোড দিন এবং আমাদের Gemini ২.৫
              ফ্ল্যাশ এআই মডেল দিয়ে চোখের পলকে হোয়াইট ব্যাকগ্রাউন্ড ও কালো
              স্যুট বা ফরমাল পোশাকে নিখুঁত পাসপোর্ট সাইজ ফটো এডিট করে নিন।
            </p>
          </div>

          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">
              দ্রুত রানিং সেটিংস
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Check size={14} className="text-green-500" /> White Bg
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Check size={14} className="text-green-500" /> Black Suit
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Check size={14} className="text-green-500" /> 100% Face Match
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            {/* Passenger Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                ১. যাত্রী নির্বাচন করুন (Passenger - Optional)
              </label>
              <div className="relative">
                <select
                  id="passenger-ai-select"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm appearance-none cursor-pointer pr-10 font-medium text-slate-700"
                  value={selectedPassengerId}
                  onChange={(e) => {
                    setSelectedPassengerId(e.target.value);
                    setSavedToPassenger(false);
                  }}
                >
                  <option value="">
                    -- শুধু ফ্রি এডিট / যেকোনো ছবি আপলোড --
                  </option>
                  {passengers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{" "}
                      {p.passportNumber
                        ? `(${p.passportNumber})`
                        : `[SL: ${p.sl}]`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
              </div>
              {currentPassenger && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs flex justify-between items-center text-slate-600">
                  <span>
                    ফোন: <strong>{currentPassenger.phone}</strong>
                  </span>
                  <span>
                    বর্তমান স্ট্যাটাস:{" "}
                    <strong className="text-blue-600">
                      {currentPassenger.status}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Input Selection Interface */}
            <div className="space-y-3.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                ২. যাত্রীর মূল ছবি দিন (Source Image)
              </label>

              {isCameraActive ? (
                /* Live Camera Capture Interface */
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />

                  {/* Target Passport Headshot Frame Guide */}
                  <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-64 border-2 border-dashed border-blue-400/80 rounded-full bg-blue-500/5 flex items-center justify-center">
                      <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded-full">
                        মুখমণ্ডল মিলাবেন
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 px-4">
                    <button
                      type="button"
                      id="btn-shoot-capture"
                      onClick={capturePhoto}
                      disabled={!isCameraReady}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-full flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      <Check size={14} /> Capture
                    </button>
                    <button
                      type="button"
                      id="btn-cancel-camera"
                      onClick={stopCamera}
                      className="bg-slate-800/90 hover:bg-slate-900 hover:text-white text-slate-200 text-xs px-3.5 py-3 rounded-full flex items-center gap-1.5 shadow"
                    >
                      <X size={14} /> Bondho
                    </button>
                  </div>
                </div>
              ) : (
                /* Drag-and-Drop / Browse Interface */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all space-y-4 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/40 scale-[0.99]"
                      : "border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                  onClick={() =>
                    document.getElementById("passport-pic-file")?.click()
                  }
                >
                  <input
                    type="file"
                    id="passport-pic-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {imageSrc ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                        <img
                          src={imageSrc}
                          alt="Source uploaded"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <Check size={14} /> ছবি যুক্ত হয়েছে
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ক্লিক বা ড্রপ করে পরিবর্তন করুন
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Upload size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">
                          ড্রপ করুন অথবা কম্পিউটার থেকে আপলোড দিন
                        </p>
                        <p className="text-[10px] text-slate-400 font-light max-w-xs mx-auto leading-relaxed">
                          মোবাইল ক্যামেরা দিয়ে সরাসরি ছবি তুলতে পারেন অথবা ড্রপ
                          করুন
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Camera access trigger if not in capture mode */}
              {!isCameraActive && (
                <button
                  type="button"
                  id="btn-active-cam"
                  onClick={startCamera}
                  className="w-full border border-slate-200/80 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest text-slate-700 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera size={14} className="text-slate-500" />
                  সরাসরি ক্যামেরা দিয়ে ছবি তুলুন
                </button>
              )}

              {cameraError && (
                <div className="text-rose-500 text-xs flex items-start gap-1.5 p-2 bg-rose-50 rounded-xl">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Custom Interactive Presets */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                ৩. ডিজাইন সেটিংস (Design Presets)
              </label>

              {/* Bg Choice */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  ব্যাকগ্রাউন্ডের কালার (Background):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgColor("white")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all outline-none ${
                      bgColor === "white"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-inner"></span>
                    হোয়াইট (White)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("light-blue")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all outline-none ${
                      bgColor === "light-blue"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#D0E1FD] border border-slate-300"></span>
                    হালকা ব্লু
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor("royal-blue")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all outline-none ${
                      bgColor === "royal-blue"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-700"></span>
                    নীল (Blue)
                  </button>
                </div>
              </div>

              {/* Attire Choice */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  পোশাকের ধরন (Attire Overlay):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttire("black-suit")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left flex items-center gap-1.5 transition-all outline-none ${
                      attire === "black-suit"
                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    👔 কালো স্যুট (Black Suit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttire("navy-suit")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left flex items-center gap-1.5 transition-all outline-none ${
                      attire === "navy-suit"
                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    👔 নীল ব্লেজার (Navy Suit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttire("white-shirt")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left flex items-center gap-1.5 transition-all outline-none ${
                      attire === "white-shirt"
                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    👕 ফরমাল শার্ট (Shirt Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttire("original")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left flex items-center gap-1.5 transition-all outline-none ${
                      attire === "original"
                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    🧒 আগের পোশাক রাখুন
                  </button>
                </div>
              </div>

              {/* Prompt Tweak Modifiers */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 block">
                  অন্যান্য নির্দেশনা বা টুইক (Tweak Prompt - Omit if basic):
                </span>
                <input
                  type="text"
                  placeholder="যেমন: remove spectacles, adjust lighting of hair, smile"
                  value={userTweakText}
                  onChange={(e) => setUserTweakText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700"
                />
              </div>

              {/* Show Compiled Prompt collapsible details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] space-y-1 text-slate-500">
                <div className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-slate-700 text-[10px]">
                  <FileText size={12} className="text-slate-400" />
                  Compiled API Prompt Preview
                </div>
                <div
                  className="font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto pt-1 break-words leading-relaxed select-all cursor-pointer"
                  title="ক্লিক করে কপি করুন"
                >
                  {customPrompt}
                </div>
              </div>
            </div>

            {/* Run Action Trigger */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-trigger-ai-crop"
                disabled={!imageSrc || isProcessing}
                onClick={processWithGemini}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed select-none text-white font-black text-sm uppercase tracking-widest rounded-2xl py-4 flex items-center justify-center gap-2 group shadow-xl hover:shadow-blue-500/10 hover:scale-[1.01] transition-all"
              >
                <Sparkles size={16} className="text-white animate-pulse" />
                <span>Gemini এআই এডিট করুন (Generate)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Comparison Columns */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
            {/* Top Bar Status */}
            <div className="bg-slate-50/80 px-6 py-4.5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <FileImage size={14} className="text-blue-500" />
                ৩ডি পোর্ট্রেট ক্যানভাস রিঅ্যাকশন (Result Workspace)
              </span>

              {editedImageResult && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-green-50 text-green-700 border border-green-200 font-extrabold uppercase tracking-wide">
                  <Check size={10} /> Edited Ready
                </span>
              )}
            </div>

            {/* Middle Container */}
            <div className="flex-1 p-6 flex flex-col justify-center items-center">
              {isProcessing ? (
                /* Processing Animates */
                <div className="flex flex-col items-center py-16 space-y-6 max-w-sm text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin flex items-center justify-center"></div>
                    <Sparkles
                      size={20}
                      className="text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase">
                      {processingStep === 0 &&
                        "১. যাত্রীর মুখমণ্ডল ডিটেক্ট করছে..."}
                      {processingStep === 1 &&
                        "২. হোয়াইট স্টুডিও ব্যাকগ্রাউন্ড যুক্ত করছে..."}
                      {processingStep === 2 &&
                        "৩. এআই স্যুট ফিটিং করা হচ্ছে..."}
                      {processingStep === 3 &&
                        "৪. জেমিনি ড্রয়িং সমাপ্ত করছে..."}
                      {processingStep === 4 &&
                        "৫. ছবি রেন্ডারিং সম্পূর্ণ হচ্ছে..."}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      এটি একটি জেনারেটিভ এআই ইমেজ মডেল টাস্ক। অনুগ্রহ করে ২০
                      থেকে ৪৫ সেকেন্ড সময় দিন। এই সময়ে উইন্ডোটি বন্ধ করবেন না।
                    </p>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-700 ease-out"
                      style={{ width: `${(processingStep + 1) * 20}%` }}
                    />
                  </div>
                </div>
              ) : processingError ? (
                /* Error Feedback */
                <div className="max-w-md p-6 border border-rose-100 bg-rose-50 rounded-2xl text-center space-y-4">
                  <AlertCircle size={42} className="text-rose-500 mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      এডিট সম্পূর্ণ করতে ব্যর্থ হয়েছে
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-mono break-all font-light">
                      {processingError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={processWithGemini}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} /> পুনরায় চেষ্টা করুন
                  </button>
                </div>
              ) : editedImageResult && imageSrc ? (
                /* Compare / Interactive Slider Result */
                <div className="w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
                    {/* Original Source */}
                    <div className="space-y-2 text-center">
                      <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                        মূল ছবি (Original Captured)
                      </p>
                      <div className="aspect-[3/4] max-w-[210px] mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={imageSrc}
                          alt="Original subject source"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Gemini AI result */}
                    <div className="space-y-2 text-center">
                      <p className="text-[10px] text-blue-600 font-extrabold tracking-widest uppercase flex items-center justify-center gap-1">
                        <Sparkles size={12} className="animate-pulse" />
                        AI ছবি (New Passport Size)
                      </p>
                      <div className="aspect-[3/4] max-w-[210px] mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-lg relative group">
                        <img
                          src={editedImageResult}
                          alt="Gemini AI generated passport portrait"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : imageSrc ? (
                /* Ready State but Not Generated Yet */
                <div className="text-center space-y-4 py-12 max-w-sm">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 mx-auto shadow-sm">
                    <img
                      src={imageSrc}
                      className="w-full h-full object-cover"
                      alt="Thumbnail uploaded"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-700">
                      জেমিনী এডিটর প্রস্তুত!
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      যাত্রীর ছবি আপলোড সম্পন্ন হয়েছে। এখন পাসপোর্ট সাইজ
                      রূপান্তর করতে **"Gemini এআই এডিট করুন"** এ ক্লিক করুন।
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-slate-300 mx-auto animate-pulse"
                  />
                </div>
              ) : (
                /* Welcome / Placeholder State */
                <div className="text-center space-y-6 py-20 max-w-md">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mx-auto">
                      <User size={42} className="stroke-[1.5]" />
                    </div>
                    <div className="absolute -bottom-1 right-[calc(50%-28px)] bg-slate-900 text-white rounded-full p-2 border-2 border-white shadow">
                      <Sparkles size={16} className="text-green-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-800">
                      কোন ছবি আপলোড করা হয়নি
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                      পাসপোর্ট সাইজ ছবি জেনারেট করার জন্য বাম পাশ থেকে যাত্রীর
                      নাম নির্বাচন করুন অথবা কম্পিউটার/মোবাইল থেকে সরাসরি যেকোনো
                      ছবি আপলোড বা স্ন্যাপ নিন।
                    </p>
                  </div>

                  {/* Features Highlights */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-left grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        👔 স্বয়ংক্রিয় স্যুট ফিটিং
                      </p>
                      <p className="text-slate-400 font-light">
                        নিখুঁত অফিসিয়াল ফরমাল পোশাক সেট করে দেয়।
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        🖼️ স্টুডিও ব্যাকগ্রাউন্ড
                      </p>
                      <p className="text-slate-400 font-light">
                        সলিড হোয়াইট বা ব্লু পাসপোর্ট স্ক্রিন ব্যাকগ্রাউন্ড।
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        🎯 ১০০% ফেস মিল
                      </p>
                      <p className="text-slate-400 font-light">
                        আসল ছবি থেকে মুখের অবয়ব শতভাগ একই রাখবে।
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        📁 ডাইরেক্ট প্রোফাইল সেভ
                      </p>
                      <p className="text-slate-400 font-light">
                        যাত্রীর ডকুমেন্টস ফাইলে সরাসরি ওয়ান-ক্লিক সংরক্ষণ।
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Hub */}
            {editedImageResult && !isProcessing && (
              <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row gap-4.5">
                <button
                  type="button"
                  id="btn-download-passport"
                  onClick={downloadResult}
                  className="flex-1 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-4.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Download size={14} />
                  কম্পিউটার বা ফোনে ডাউনলোড দিন
                </button>

                {selectedPassengerId ? (
                  <button
                    type="button"
                    id="btn-save-database"
                    disabled={savedToPassenger}
                    onClick={saveToPassengerDocuments}
                    className={`flex-1 font-extrabold text-xs uppercase tracking-widest py-3.5 px-4.5 rounded-2xl flex items-center justify-center gap-2 transition-all outline-none ${
                      savedToPassenger
                        ? "bg-green-100 text-green-705 border border-green-200 cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                    }`}
                  >
                    {savedToPassenger ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        যাত্রীর ফাইলে সেভ হয়েছে
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        যাত্রীর ডকুমেন্টস ফাইলে সেভ করুন
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-slate-100 text-slate-500 rounded-2xl px-4.5 py-3 text-center sm:text-left text-xs font-semibold flex items-center justify-center gap-2">
                    <HelpCircle size={14} className="text-slate-400 shrink-0" />
                    কোনো নির্দিষ্ট যাত্রী সিলেক্ট নিলেই ফাইলে সেভ করতে পাবেন।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
