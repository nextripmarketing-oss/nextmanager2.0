import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  Check,
  RefreshCw,
  User,
  FileImage,
  UserCheck,
  AlertCircle,
  Trash2,
  X,
  FileText,
  Eye,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PassengerService } from "../services/passengerService";
import { Passenger, PassengerDoc } from "../types/passenger";
import DocumentModal from "./DocumentModal";

export default function TravelDocumentScanner() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Real-time passengers sync
  useEffect(() => {
    const unsub = PassengerService.subscribeToPassengers((data) => {
      setPassengers(data);
    });
    return () => unsub();
  }, []);

  // Filter passengers by search term
  const filteredPassengers = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.passportNumber &&
        p.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.agentName &&
        p.agentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.phone.includes(searchTerm),
  );

  const currentPassenger = passengers.find((p) => p.id === selectedPassengerId);

  // States for Camera & Capture
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  // Document Name State
  const [docName, setDocName] = useState<string>("Passport Copy");
  const [customDocName, setCustomDocName] = useState<string>("");

  // Save/Upload state helpers
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "err"
  >("idle");
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Lightbox view for documents
  const [activePreviewDoc, setActivePreviewDoc] = useState<PassengerDoc | null>(
    null,
  );

  // Camera references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera Stream
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
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
        "Camera access denied or could not configure selected camera. Please verify permission settings.",
      );
      setIsCameraActive(false);
    }
  };

  // Toggle Camera lens front/back
  const toggleCameraDirection = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video snapshot
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImageSrc(dataUrl);
        setSaveStatus("idle");
        setSaveProgress(0);
        stopCamera();
      }
    }
  };

  // Discard captured photo
  const discardCapture = () => {
    setImageSrc(null);
    setSaveStatus("idle");
    setSaveProgress(0);
  };

  // File Upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setSaveStatus("idle");
          setSaveProgress(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Clean-up on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Handle Save captured travel document to Selected Passenger Profile
  const handleSaveToPassenger = async () => {
    if (!imageSrc || !selectedPassengerId || !currentPassenger) return;

    setIsSaving(true);
    setSaveStatus("saving");
    setSaveProgress(20);
    setSaveErrorMsg(null);

    try {
      // 1. Convert base64 DataURL to File
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const fileTitle =
        docName === "Others" ? customDocName.trim() || "Document" : docName;
      const file = new File(
        [blob],
        `${fileTitle.replace(/\s+/g, "_")}_${Date.now()}.jpg`,
        { type: "image/jpeg" },
      );

      setSaveProgress(50);

      // 2. Upload file through fallback service
      const downloadUrl = await PassengerService.uploadDocument(
        file,
        selectedPassengerId,
        (prog) => {
          setSaveProgress(Math.min(90, 50 + Math.round(prog / 2)));
        },
      );

      setSaveProgress(95);

      // 3. Update passenger profile documents list
      const newDoc: PassengerDoc = {
        name: fileTitle,
        url: downloadUrl,
      };

      const updatedDocs = [...(currentPassenger.documents || []), newDoc];

      await PassengerService.updatePassenger(
        selectedPassengerId,
        { documents: updatedDocs },
        {
          status: currentPassenger.status,
          updatedBy: "Travel Document Scanner",
          updatedByUid: "doc-scanner-bot",
          timestamp: new Date().toISOString(),
        },
      );

      setSaveProgress(100);
      setSaveStatus("success");

      // Auto reset capture state after a success delay, but keep the passenger selection
      setTimeout(() => {
        setImageSrc(null);
        setSaveStatus("idle");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setSaveStatus("err");
      setSaveErrorMsg(
        err.message || "Error occurred while saving travel document.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete matching document from Passenger Profile Documents
  const handleDeleteDoc = async (indexToDelete: number) => {
    if (!currentPassenger || !selectedPassengerId) return;

    const docName =
      currentPassenger.documents[indexToDelete]?.name || "document";
    if (
      !confirm(
        `আপনি কি নিশ্চিত যে এই যাত্রীর "${docName}" ডকুমেন্টটি মুছতে চান?`,
      )
    ) {
      return;
    }

    try {
      const updatedDocs = currentPassenger.documents.filter(
        (_, i) => i !== indexToDelete,
      );
      await PassengerService.updatePassenger(
        selectedPassengerId,
        { documents: updatedDocs },
        {
          status: currentPassenger.status,
          updatedBy: "Travel Document Scanner (Deletion)",
          updatedByUid: "doc-scanner-bot",
          timestamp: new Date().toISOString(),
        },
      );
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  return (
    <div className="space-y-8" id="travel-doc-scanner-hub">
      {/* Title & Banner Info Section */}
      <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Camera size={13} className="text-blue-400" />
              <span>High-Precision Camera Scanner</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              ডকুমেন্ট স্ক্যানার ও প্রোফাইল ভল্ট
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed font-light">
              যাত্রী আসার পর তাদের পাসপোর্ট কপি, ভিসা পেপার বা মেডিকেল রিপোর্ট
              সরাসরি ওয়েবক্যাম বা মোবাইল ক্যামেরা দিয়ে ফটো ধারণ করে যাত্রীর
              ফোল্ডারে ও প্রোফাইলে ডিজিটাল কপি সংরক্ষণ করুন।
            </p>
          </div>
          <div className="bg-slate-800/40 px-5 py-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
            🛡️{" "}
            <span className="font-bold text-white">
              Firestore Secure Storage:
            </span>{" "}
            Directly synchronized & stored in secure cloud nodes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Capture Panel */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <Camera className="text-blue-600" size={18} />
              ডকুমেন্ট ফটো ধারণ করুন (Capture Document Copy)
            </h3>
            {imageSrc && (
              <button
                onClick={discardCapture}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100"
              >
                <X size={12} /> Discard Image
              </button>
            )}
          </div>

          {/* Step 1: Select Passenger */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-450 uppercase tracking-widest block">
              ১. যাত্রী নির্বাচন করুন{" "}
            </label>
            <div className="relative">
              <select
                id="doc-passenger-select"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm appearance-none cursor-pointer pr-10 font-medium text-slate-700"
                value={selectedPassengerId}
                onChange={(e) => {
                  setSelectedPassengerId(e.target.value);
                  discardCapture();
                }}
              >
                <option value="">
                  -- যাত্রী সিলেক্ট করুন (Select Passenger to attach) --
                </option>
                {passengers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{" "}
                    {p.passportNumber
                      ? `(${p.passportNumber})`
                      : `[SL: ${p.sl}]`}{" "}
                    — {p.phone}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <User size={16} />
              </div>
            </div>

            {/* Direct Instant Searching inside selected dropdown */}
            <div className="relative mt-2">
              <input
                type="text"
                placeholder="যাত্রীর নাম, পাসপোর্ট, ফোন অথবা এজেন্টের নাম টাইপ করে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-2.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition-all font-light text-slate-600"
              />
              {searchTerm && (
                <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                  {filteredPassengers.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPassengerId(p.id!);
                        setSearchTerm("");
                        discardCapture();
                      }}
                      className="p-3 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-bold">{p.name}</span>
                      <span className="text-slate-400 font-mono">
                        {p.passportNumber || "No Passport"} | {p.phone}
                      </span>
                    </div>
                  ))}
                  {filteredPassengers.length === 0 && (
                    <p className="p-3 text-xs italic text-slate-400 text-center">
                      কোনো যাত্রী খুঁজে পাওয়া যায়নি।
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Camera Frame / Capture Sandbox */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-450 uppercase tracking-widest block">
              ২. ছবি স্ন্যাপ নিন বা ড্রপ করুন
            </label>

            {isCameraActive ? (
              /* ACTIVE CAMERA PREVIEW */
              <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] border border-slate-800 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Rectangular scanning template for Travel documents (Passport Copy/Visa Copy etc) */}
                <div className="absolute inset-0 border-[30px] sm:border-[40px] border-black/50 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-full border-2 border-dashed border-blue-400/80 rounded-2xl relative bg-blue-500/5">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-sm"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-sm"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-sm"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-sm"></div>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                      <span className="text-[9px] text-blue-300 font-bold bg-slate-900/80 px-2 py-1 rounded-full uppercase tracking-wider">
                        ডকুমেন্টটি এখানে রাখুন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 px-4 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isCameraReady}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-full flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  >
                    <Check size={14} /> Capture Document
                  </button>
                  <button
                    type="button"
                    onClick={toggleCameraDirection}
                    className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs px-3 py-3.5 rounded-full flex items-center gap-1 border border-slate-700"
                  >
                    <RefreshCw size={12} /> Flip
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-800/80 hover:bg-slate-900 text-slate-200 text-xs px-3 py-3.5 rounded-full"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ) : imageSrc ? (
              /* TAKEN SCAN PREVIEW SCREEN */
              <div className="relative border border-slate-200 rounded-3xl overflow-hidden aspect-[4/3] bg-slate-50 flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt="Captured scan preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                {/* Stamp */}
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow border border-emerald-400 flex items-center gap-1">
                  <Check size={12} /> captured
                </div>
              </div>
            ) : (
              /* EMPTY CHOOSE SOURCE CONTAINER */
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50 hover:bg-slate-50/80 text-center transition-all flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Camera size={26} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">
                    কোন ছবি বা স্ক্যান এখনও তোলা হয়নি
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light max-w-xs mx-auto leading-relaxed mt-1">
                    মোবাইল ক্যামেরা বা ওয়েবক্যাম দিয়ে পাসপোর্ট বা ট্রাভেল
                    ডকুমেন্টস স্ক্যান করুন, অথবা ডিভাইস গ্যালারি থেকে লোকাল ছবি
                    আপলোড করুন
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow"
                  >
                    <Camera size={13} /> ক্যামেরা অন করুন
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("travel-doc-pic")?.click()
                    }
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Upload size={13} /> ফাইল আপলোড
                  </button>
                  <input
                    type="file"
                    id="travel-doc-pic"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Step 3: Document Title Configuration */}
          {imageSrc && (
            <div className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  ৩. ডকুমেন্টের ধরন বা টাইটেল (Document Category)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Passport Copy",
                    "Visa Page",
                    "Medical Report",
                    "Flight Ticket",
                    "Manpower Sheet",
                    "Others",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDocName(preset)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                        docName === preset
                          ? "bg-blue-600 text-white border-blue-600 shadow"
                          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {docName === "Others" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 block">
                    অন্যান্য ডকুমেন্টের নাম লিখুন (Custom Title):
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="যেমন- Police Clearance, COVID Certificate..."
                    value={customDocName}
                    onChange={(e) => setCustomDocName(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl p-3 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-700"
                  />
                </div>
              )}

              {/* SAVE ACTION TRIGGER */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-save-doc"
                  disabled={!selectedPassengerId || isSaving}
                  onClick={handleSaveToPassenger}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed select-none text-white font-black text-xs uppercase tracking-widest rounded-2xl py-4 flex items-center justify-center gap-2 group shadow-lg active:scale-[0.99] transition-all"
                >
                  <UserCheck size={14} />
                  <span>যাত্রীর প্রোফাইল ও ডকুমেন্টে ডাইরেক্ট সেভ করুন</span>
                </button>

                {saveStatus === "saving" && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>ডকু-ফাইল সিংক্রোনাইজ হচ্ছে...</span>
                      <span>{saveProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${saveProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {saveStatus === "success" && (
                  <div className="mt-3 p-3 text-xs bg-green-50 text-green-700 border border-green-150 rounded-xl font-bold text-center flex items-center justify-center gap-1.5 animate-bounce">
                    <Check size={14} /> যাত্রী প্রোফাইলে ডকুমেন্ট সফলভাবে সেভ
                    করা হয়েছে!
                  </div>
                )}

                {saveStatus === "err" && (
                  <div className="mt-3 p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-xl font-medium flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>ব্যর্থ: {saveErrorMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Documents Vault & History */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-4 uppercase tracking-tight flex items-center gap-2 mb-4">
              <FileText className="text-emerald-600" size={18} />
              যাত্রীর বর্তমান স্ক্যানিং রেকর্ডস (Stored Travel Vault)
            </h3>

            {currentPassenger ? (
              <div className="space-y-4">
                <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-4 flex gap-4.5 items-center">
                  <div className="w-11 h-11 bg-blue-100/60 text-blue-700 rounded-xl flex items-center justify-center font-bold font-mono shadow-sm">
                    {currentPassenger.documents
                      ? currentPassenger.documents.length
                      : 0}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {currentPassenger.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      সব ডকুমেন্টস সুরক্ষিত আছে
                    </p>
                  </div>
                </div>

                {/* Stored Document List */}
                <div className="space-y-2.5">
                  {!currentPassenger.documents ||
                  currentPassenger.documents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-slate-150">
                      কোথাও কোনো স্ক্যান কপি বা ছবি পাওয়া যায়নি।
                    </div>
                  ) : (
                    currentPassenger.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs hover:bg-slate-100/45 transition-all"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {doc.url.startsWith("data:image") ||
                            doc.url.includes(".jpg") ||
                            doc.url.includes(".png") ||
                            doc.url.includes(".jpeg") ? (
                              <img
                                src={doc.url}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <FileText className="text-slate-400" size={16} />
                            )}
                          </div>
                          <div className="truncate">
                            <p
                              className="font-semibold text-slate-800 truncate"
                              title={doc.name}
                            >
                              {doc.name}
                            </p>
                            <span className="text-[8px] font-extrabold text-blue-500 uppercase tracking-wider block mt-0.5">
                              secured registry
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActivePreviewDoc(doc)}
                            className="bg-white hover:bg-slate-150 border border-slate-200 text-slate-700 font-bold p-1.5 rounded-lg shadow-sm transition-all"
                            title="View Document"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(i)}
                            className="bg-white hover:bg-red-50 hover:text-red-700 border border-slate-200 text-slate-400 font-bold p-1.5 rounded-lg shadow-sm transition-all"
                            title="Delete Document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs italic px-6 leading-relaxed">
                <User size={30} className="mx-auto text-slate-350 mb-3" />
                ডকুমেন্ট ভল্ট অ্যাক্টিভেট করতে উপরে থেকে একজন যাত্রী নির্বাচন
                করুন। তাঁর পূর্বের সংরক্ষিত স্ক্যান ও ফাইল কপি দেখতে পাবেন।
              </div>
            )}
          </div>

          {currentPassenger && (
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50/50 p-4.5 rounded-2xl">
              <span>authorized registry bot</span>
              <span>v2.0 LTS</span>
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX POPUP MODAL FOR DOCUMENT DIRECT VIEWS */}
      {activePreviewDoc && (
        <DocumentModal
          doc={activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}
    </div>
  );
}
