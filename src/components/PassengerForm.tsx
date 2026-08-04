import React, { useState, useEffect } from "react";
import {
  Passenger,
  PassengerStatus,
  PassengerDoc,
  PassengerType,
} from "../types/passenger";
import { PassengerService } from "../services/passengerService";
import { AgencyService } from "../services/agencyService";
import { Agency } from "../types/agency";
import { useAuth } from "./AuthProvider";
import { X, Send, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import FileUploader from "./FileUploader";
import PassengerHistory from "./PassengerHistory";
import DocumentScanner from "./DocumentScanner";
import PhotoUploader from "./PhotoUploader";

interface Props {
  onClose: () => void;
  initialData?: Passenger;
  nextSl?: number;
}

const JOB_SUMMARIES: Record<string, string> = {
  "STEEL FIXER": "Positioning and securing steel bars or mesh in concrete forms to reinforce concrete structures. Reading and interpreting working plans and steel lists. Setting out the work from these instructions.",
  "CLEANER": "Performing general cleaning duties to maintain a clean and sanitary environment. Sweeping, mopping, vacuuming, and dusting as required.",
  "DRIVER": "Safely operating vehicles to transport passengers or cargo. Adhering to traffic laws and maintaining vehicle logs. Conducting basic vehicle maintenance and inspections.",
  "ELECTRICIAN": "Installing, maintaining, and repairing electrical wiring, equipment, and fixtures. Ensuring that work is in accordance with relevant codes.",
  "PLUMBER": "Installing, repairing, and maintaining pipes, fixtures, and other plumbing used for water distribution and wastewater disposal.",
  "LABOUR": "Performing general physical labor tasks. Loading and unloading materials, operating basic hand tools, and assisting skilled tradespeople on site.",
  "MASON": "Laying building materials, including concrete and brick, and constructs or repairs surfaces or structures.",
  "WELDER": "Joining metal parts using various welding techniques. Interpreting blueprints and ensuring work meets safety and quality standards."
};

export default function PassengerForm({ onClose, initialData, nextSl }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "cv" | "history" | "documents"
  >("profile");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storageDest, setStorageDest] = useState<"Firebase" | "Drive">(
    "Firebase",
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  const [isCustomTrade, setIsCustomTrade] = useState(
    initialData?.tradeName ? !Object.keys(JOB_SUMMARIES).includes(initialData.tradeName) : false
  );
  
  const [duplicateInfo, setDuplicateInfo] = useState<{ show: boolean, duplicateSl?: number | string | null } | null>(null);

  const [formData, setFormData] = useState<Partial<Passenger>>(
    initialData || {
      sl: 0,
      name: "",
      passportNumber: "",
      inOut: "Out",
      phone: "",
      companyName: "",
      tradeName: "",
      agentName: "",
      agentNumber: "",
      reference: "",
      date: new Date().toISOString().split("T")[0],
      status: "Passport Submit",
      country: "",
      passengerType: "Worker",
      documents: [],
    },
  );

  useEffect(() => {
    const unsubscribe = AgencyService.subscribeToAgencies(setAgencies);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialData && nextSl && (formData.sl === 0 || !formData.sl)) {
      setFormData((prev) => ({ ...prev, sl: nextSl }));
    }
  }, [nextSl, initialData]);

  const statusOptions: PassengerStatus[] = [
    "Passport Submit",
    "Medical Done",
    "Workpermit Issue",
    "Visa Online",
    "Embassy Submit",
    "Passport Return",
    "Manpower Done",
    "Flight Done",
    "Processing Cancelled",
    "Visa Reject",
    "Others",
  ];

  const typeOptions: PassengerType[] = [
    "Tourist",
    "Worker",
    "Business Visitor",
    "Family Visit",
    "Student",
    "STEEL FIXER",
    "CLEANER",
    "DRIVER",
    "ELECTRICIAN",
    "PLUMBER",
    "LABOUR",
    "MASON",
    "WELDER",
    "Others",
  ];

  const handleWorkDescriptionTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const upperValue = value.toUpperCase().trim();
    const newSummary = JOB_SUMMARIES[upperValue];
    
    let updatedFormData = { ...formData, workDescriptionTitle: value };
    
    if (newSummary) {
      const currentText = (formData.workDescriptionText || '').trim();
      const isCurrentTextPredefined = Object.values(JOB_SUMMARIES).includes(currentText);
      
      if (!currentText || isCurrentTextPredefined) {
        updatedFormData.workDescriptionText = newSummary;
      }
    }
    
    setFormData(updatedFormData);
  };

  const handleFileSelect = async (files: File[]) => {
    if (initialData?.id) {
      // Direct upload if editing
      setUploading(true);
      try {
        const uploadPromises = files.map(async (file) => {
          const uploadFn =
            storageDest === "Drive"
              ? PassengerService.uploadToDrive.bind(PassengerService)
              : PassengerService.uploadDocument.bind(PassengerService);

          const url = await uploadFn(
            file,
            initialData.id!,
            (progress: number) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            },
          );
          return { name: file.name, url };
        });

        const newDocs = await Promise.all(uploadPromises);
        const updatedDocs = [...(formData.documents || []), ...newDocs];
        await PassengerService.updatePassenger(initialData.id, {
          documents: updatedDocs,
        });
        setFormData({ ...formData, documents: updatedDocs });

        // Finalize state after delay
        setTimeout(() => {
          setUploading(false);
          setUploadProgress({});
        }, 1500);
      } catch (error: any) {
        alert("Upload failed: " + (error.message || "Unknown error"));
        console.error(error);
        setUploading(false);
        setUploadProgress({});
      }
    } else {
      // Buffer files for new entries
      setPendingFiles([...pendingFiles, ...files]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.passportNumber) {
      setLoading(true);
      const duplicateResult = await PassengerService.checkDuplicatePassport(formData.passportNumber, initialData?.id);
      setLoading(false);
      
      if (duplicateResult.isDuplicate) {
        setDuplicateInfo({ show: true, duplicateSl: duplicateResult.duplicateSl });
        return;
      }
    }

    setLoading(true);
    try {
      let passengerId = initialData?.id;
      const historyEntry = {
        status: formData.status as PassengerStatus,
        updatedBy: user.displayName || "Staff",
        updatedByUid: user.uid,
        timestamp: new Date().toISOString(),
      };

      if (passengerId) {
        // Only add history if status changed or it's an explicit update
        const hasStatusChanged = initialData?.status !== formData.status;
        await PassengerService.updatePassenger(
          passengerId,
          formData,
          hasStatusChanged ? historyEntry : undefined,
        );
      } else {
        const docRef = await PassengerService.addPassenger({
          ...(formData as any),
          createdBy: user.uid,
          history: [historyEntry],
        });
        passengerId = docRef?.id;

        // Handle pending files for new entries
        if (passengerId && pendingFiles.length > 0) {
          setUploading(true);
          const uploadPromises = pendingFiles.map(async (file) => {
            const uploadFn =
              storageDest === "Drive"
                ? PassengerService.uploadToDrive.bind(PassengerService)
                : PassengerService.uploadDocument.bind(PassengerService);

            const url = await uploadFn(
              file,
              passengerId!,
              (progress: number) => {
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: progress,
                }));
              },
            );
            return { name: file.name, url };
          });
          const newDocs = await Promise.all(uploadPromises);
          await PassengerService.updatePassenger(passengerId, {
            documents: newDocs,
          });
          // Delay before closing to show success
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      onClose();
    } catch (error: any) {
      alert("Error saving data: " + (error.message || "Unknown error"));
      console.error(error);
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-8 lg:p-10 w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-slate-200/60 shadow-2xl relative z-10 scrollbar-hide"
    >
      {duplicateInfo?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-rose-100 p-6 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Duplicate Passport</h3>
            <p className="text-slate-600 mb-6">
              This passport number already exists in the system.
              <br />
              <span className="font-bold text-slate-900 mt-2 block">
                Duplicate ID: #{duplicateInfo.duplicateSl?.toString().padStart(3, "0") || "---"}
              </span>
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDuplicateInfo(null)}
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-1">
            System Registry
          </p>
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight leading-none">
            {initialData ? "Update Profile" : "New Transaction"}
          </h2>
        </div>
        <div className="flex w-full md:w-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === "profile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("cv")}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === "cv" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            CV Info
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === "documents" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Docs
          </button>
          {initialData && (
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              History
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-50 md:bg-transparent border border-slate-100 md:border-none rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
        >
          <X size={18} />
        </button>
      </div>

      {activeTab === "profile" ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="col-span-2">
            <PhotoUploader
              label="যাত্রীর ছবি (Passenger Profile Photo)"
              photoUrl={formData.photoUrl || ""}
              onPhotoUploaded={(url) =>
                setFormData({ ...formData, photoUrl: url })
              }
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Serial Number (SL)
            </label>
            <input
              required
              type="number"
              className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-bold text-blue-700"
              value={formData.sl || ""}
              onChange={(e) =>
                setFormData({ ...formData, sl: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Passenger Name
            </label>
            <input
              required
              placeholder="Full legal name"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Passport Number (Optional)
            </label>
            <input
              placeholder="A04683313"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-mono"
              value={formData.passportNumber}
              onChange={(e) =>
                setFormData({ ...formData, passportNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Primary Contact
            </label>
            <input
              required
              placeholder="+880 17..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-mono"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Logistics Direction
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-bold appearance-none cursor-pointer"
              value={formData.inOut}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inOut: e.target.value as "In" | "Out",
                })
              }
            >
              <option value="In">Inbound Entry</option>
              <option value="Out">Outbound Departure</option>
            </select>
          </div>

          <div className="col-span-2 p-4 sm:p-6 bg-slate-900 rounded-[1.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3 block">
                  Process Control Tower
                </label>
                <select
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 sm:p-4 text-sm font-bold text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as PassengerStatus,
                    })
                  }
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3 block">
                  Passenger Category
                </label>
                <select
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 sm:p-4 text-sm font-bold text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                  value={formData.passengerType}
                  onChange={(e) => {
                    const val = e.target.value as PassengerType;
                    const newSummary = JOB_SUMMARIES[val.toUpperCase()];
                    const updates: any = { passengerType: val };
                    
                    if (newSummary) {
                      updates.workDescriptionTitle = val;
                      updates.workDescriptionText = newSummary;
                      updates.tradeName = val; // Also update trade specialty
                    }
                    
                    setFormData({
                      ...formData,
                      ...updates,
                    });
                  }}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Nationality / Region
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-medium"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
            >
              <option value="">Select Country</option>
              {["ALGERIA", "MARITIUS", "SAUDI ARABIA", "QATAR", "BAHRAIN", "KUWET", "MALAYSHIA"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 flex justify-between">
              <span>Trade Specialty</span>
              {isCustomTrade && (
                <button 
                  type="button" 
                  onClick={() => setIsCustomTrade(false)} 
                  className="text-blue-500 hover:underline capitalize"
                >
                  Select from List
                </button>
              )}
            </label>
            {isCustomTrade ? (
              <input
                placeholder="Contractor"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-medium"
                value={formData.tradeName}
                onChange={(e) =>
                  setFormData({ ...formData, tradeName: e.target.value })
                }
              />
            ) : (
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-medium"
                value={formData.tradeName || ""}
                onChange={(e) => {
                  if (e.target.value === "ADD_NEW") {
                    setIsCustomTrade(true);
                    setFormData({ ...formData, tradeName: "" });
                  } else {
                    setFormData({ ...formData, tradeName: e.target.value });
                  }
                }}
              >
                <option value="">Select Trade</option>
                {Object.keys(JOB_SUMMARIES).map(trade => (
                  <option key={trade} value={trade}>{trade}</option>
                ))}
                <option value="ADD_NEW">+ Add New Trade</option>
              </select>
            )}
          </div>

          <div>
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              Company Name
            </label>
            <input
              placeholder="e.g. Saudi AramCO"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm font-medium"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Registration Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Submission Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.submissionDate}
                onChange={(e) =>
                  setFormData({ ...formData, submissionDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Reference
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
            >
              <option value="">Select Reference</option>
              {["AHAD", "MINA", "ARMAN", "EMON", "SOHEL", "ATIK"].map(ref => (
                <option key={ref} value={ref}>{ref}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Agent Name
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.agentName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const agent = agencies.find(a => a.name === selectedName);
                  setFormData({ 
                    ...formData, 
                    agentName: selectedName,
                    agentNumber: agent?.phone || formData.agentNumber 
                  });
                }}
              >
                <option value="">Select Agent</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.name}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Delegate Agent
              </label>
              <input
                placeholder="Optional"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                value={formData.delegateAgent || ""}
                onChange={(e) =>
                  setFormData({ ...formData, delegateAgent: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Agent Phone
              </label>
              <input
                placeholder="+880..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:border-blue-500 outline-none transition-all"
                value={formData.agentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, agentNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Financial Details (Visa & Agent Rates, Paid, Due & Profit) */}
          <div className="col-span-2 p-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-slate-50 border border-slate-150 rounded-[1.5rem] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100/50 pb-2">
              <h4 className="text-[11px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <span>Financial Ledger (হিসাবের বিবরণ)</span>
              </h4>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                BDT (৳)
              </span>
            </div>

            {/* Section 1: Client Ledger */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Client Ledger (গ্রাহক জমা ও বকেয়া)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 block">
                    Visa Rate / Client Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-6 text-xs text-slate-800 font-mono font-bold focus:border-blue-500 outline-none transition-all"
                      value={
                        formData.visaRate === undefined ||
                        formData.visaRate === null
                          ? ""
                          : formData.visaRate
                      }
                      onChange={(e) => {
                        const v =
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value);
                        const a = formData.agentRate || 0;
                        const p = v !== undefined ? v - a : undefined;
                        const paid = formData.paidAmount || 0;
                        const d = v !== undefined ? v - paid : undefined;
                        setFormData({
                          ...formData,
                          visaRate: v,
                          profit: p,
                          dueAmount: d,
                        });
                      }}
                    />
                    <span className="absolute left-2.5 top-3.5 font-mono text-xs font-bold text-slate-400">
                      ৳
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1 block">
                    Client Paid / Received
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-6 text-xs text-emerald-700 font-mono font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      value={
                        formData.paidAmount === undefined ||
                        formData.paidAmount === null
                          ? ""
                          : formData.paidAmount
                      }
                      onChange={(e) => {
                        const paid =
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value);
                        const v = formData.visaRate || 0;
                        const d = paid !== undefined ? v - paid : undefined;
                        setFormData({
                          ...formData,
                          paidAmount: paid,
                          dueAmount: d,
                        });
                      }}
                    />
                    <span className="absolute left-2.5 top-3.5 font-mono text-xs font-bold text-emerald-400">
                      ৳
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mb-1 block">
                    Outstanding Due
                  </label>
                  <div className="bg-white border border-slate-200 rounded-xl px-3 p-3 flex flex-col justify-center h-[46px] relative">
                    <p
                      className={`font-mono text-xs font-black ${(formData.visaRate || 0) - (formData.paidAmount || 0) > 0 ? "text-amber-600 animate-pulse" : "text-slate-500"}`}
                    >
                      ৳
                      {(
                        (formData.visaRate || 0) - (formData.paidAmount || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Agent and Profit ledger */}
            <div className="space-y-3 pt-2 border-t border-slate-150/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Office Profitability (অফিসের খরচ ও লাভ)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 block">
                    Agent Rate / Cost
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-6 text-xs text-slate-800 font-mono font-bold focus:border-blue-500 outline-none transition-all"
                      value={
                        formData.agentRate === undefined ||
                        formData.agentRate === null
                          ? ""
                          : formData.agentRate
                      }
                      onChange={(e) => {
                        const a =
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value);
                        const v = formData.visaRate || 0;
                        const p = a !== undefined ? v - a : undefined;
                        setFormData({ ...formData, agentRate: a, profit: p });
                      }}
                    />
                    <span className="absolute left-2.5 top-3.5 font-mono text-xs font-bold text-slate-400">
                      ৳
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 block">
                    Net Profit (অফিসিয়াল লাভ)
                  </label>
                  <div className="bg-white border border-slate-200 rounded-xl px-3 p-3 flex flex-col justify-center h-[46px] relative">
                    <p
                      className={`font-mono text-xs font-black ${(formData.profit || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                    >
                      ৳
                      {(
                        (formData.visaRate || 0) - (formData.agentRate || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">
              সিস্টেম নোট / মন্তব্য (System Note / Custom Memo)
            </label>
            <textarea
              placeholder="যেমন: মেডিকেল ফি বকেয়া আছে বা বিশেষ কোনো নির্দেশনা (This note will appear above the footer on the profile print sheet)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-xs font-medium font-sans min-h-[80px] resize-y"
              value={formData.systemNote || ""}
              onChange={(e) =>
                setFormData({ ...formData, systemNote: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 mt-8">
            <button
              disabled={loading || uploading}
              className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-2xl font-display font-bold uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
            >
              <Send
                size={18}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
              {loading
                ? "Processing Registry..."
                : initialData
                  ? "Update Record"
                  : "Finalize Registry"}
            </button>
            {!initialData && (
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                Authorized by NexTrip Cloud Security Layer
              </p>
            )}
          </div>
        </form>
      ) : activeTab === "cv" ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div className="col-span-2 mt-2 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Family Information</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Father's Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.fatherName || ''} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Father's DOB</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.fatherDOB || ''} onChange={e => setFormData({ ...formData, fatherDOB: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mother's Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.motherName || ''} onChange={e => setFormData({ ...formData, motherName: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mother's DOB</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.motherDOB || ''} onChange={e => setFormData({ ...formData, motherDOB: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Wife's Name</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.wifeName || ''} onChange={e => setFormData({ ...formData, wifeName: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Wife's DOB</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.wifeDOB || ''} onChange={e => setFormData({ ...formData, wifeDOB: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Children</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.children || ''} onChange={e => setFormData({ ...formData, children: e.target.value })} />
          </div>

          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Personal Information</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nationality</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.nationality || ''} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Candidate DOB</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.candidateDOB || ''} onChange={e => setFormData({ ...formData, candidateDOB: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Age</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Place of Birth</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.placeOfBirth || ''} onChange={e => setFormData({ ...formData, placeOfBirth: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Religion</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.religion || ''} onChange={e => setFormData({ ...formData, religion: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Marital Status</label>
            <select className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.maritalStatus || ''} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Height</label>
            <input type="text" placeholder="e.g. 5'8&quot;" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.height || ''} onChange={e => setFormData({ ...formData, height: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Weight</label>
            <input type="text" placeholder="e.g. 70 kg" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
          </div>

          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Passport Extra Details</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Place of Issue</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.placeOfIssue || ''} onChange={e => setFormData({ ...formData, placeOfIssue: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Date of Issue</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.dateOfIssue || ''} onChange={e => setFormData({ ...formData, dateOfIssue: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Date of Expire</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.dateOfExpire || ''} onChange={e => setFormData({ ...formData, dateOfExpire: e.target.value })} />
          </div>

          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Skills & Experience</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Computer Skill</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.computerSkill || ''} onChange={e => setFormData({ ...formData, computerSkill: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">English Level</label>
            <select className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.englishLevel || ''} onChange={e => setFormData({ ...formData, englishLevel: e.target.value })}>
              <option value="">Select...</option>
              <option value="Poor">Poor</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Bangla Level</label>
            <select className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.banglaLevel || ''} onChange={e => setFormData({ ...formData, banglaLevel: e.target.value })}>
              <option value="">Select...</option>
              <option value="Poor">Poor</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Experience Certificate No.</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.experienceCertificateNo || ''} onChange={e => setFormData({ ...formData, experienceCertificateNo: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Primary Skill</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.primarySkill || ''} onChange={e => setFormData({ ...formData, primarySkill: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">License No.</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.licenseNo || ''} onChange={e => setFormData({ ...formData, licenseNo: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Overseas Country</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.overseasCountry || ''} onChange={e => setFormData({ ...formData, overseasCountry: e.target.value })} />
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Work Description Title</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.workDescriptionTitle || ''} onChange={handleWorkDescriptionTitleChange} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Work Description Text</label>
            <textarea rows={4} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.workDescriptionText || ''} onChange={e => setFormData({ ...formData, workDescriptionText: e.target.value })} />
          </div>

          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Status & Qualifications</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Selection Status</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.selectionStatus || ''} onChange={e => setFormData({ ...formData, selectionStatus: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Grade</label>
            <input type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.grade || ''} onChange={e => setFormData({ ...formData, grade: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Educational Qualification</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.educationalQualification || ''} onChange={e => setFormData({ ...formData, educationalQualification: e.target.value })} placeholder="e.g. SSC - 2018 - 4.50" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Experience Details</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.experienceDetails || ''} onChange={e => setFormData({ ...formData, experienceDetails: e.target.value })} placeholder="e.g. 5 Years - ABC Tech - UAE - Technician - YES" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Remarks</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.remarks || ''} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
          </div>

          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Contact & Address</h3>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Permanent Address</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.permanentAddress || ''} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Present Address</label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" value={formData.presentAddress || ''} onChange={e => setFormData({ ...formData, presentAddress: e.target.value })} />
          </div>

          <div className="col-span-2 mt-6 mb-8 border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Send size={16} /> Save CV Details
                </>
              )}
            </button>
            {initialData && (
              <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                Authorized by NexTrip Cloud Security Layer
              </p>
            )}
          </div>
        </form>
      ) : activeTab === "history" ? (
        <PassengerHistory history={formData.history || []} />
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-widest mb-4">
              Required Documents Tracker
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Visa", "Passport", "Insurance"].map((docType) => {
                const doc = formData.requiredDocs?.[docType] || {
                  type: docType,
                  status: "Pending",
                };
                return (
                  <div
                    key={docType}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700 text-sm">
                        {docType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${doc.status === "Verified" ? "bg-emerald-100 text-emerald-700" : doc.status === "Uploaded" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none"
                      value={doc.status}
                      onChange={(e) => {
                        const newDocs = { ...formData.requiredDocs };
                        newDocs[docType] = {
                          ...doc,
                          status: e.target.value as any,
                        };
                        setFormData({ ...formData, requiredDocs: newDocs });
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Uploaded">Uploaded</option>
                      <option value="Verified">Verified</option>
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                {loading ? "Saving..." : "Save Document Status"}
              </button>
            </div>
          </div>

          <div className="bg-slate-100/50 h-px w-full" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Document Repository & Scans
              </label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors"
              >
                <Camera size={14} />
                Scan Identity
              </button>
            </div>
            <FileUploader
              existingDocs={formData.documents || []}
              onFileSelect={handleFileSelect}
              uploading={uploading}
              progress={uploadProgress}
              pendingFiles={pendingFiles}
              storageDest={storageDest}
              onStorageDestChange={setStorageDest}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {isScannerOpen && (
          <DocumentScanner
            onCapture={handleFileSelect}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
