import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Paperclip, X, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { PassengerDoc } from "../types/passenger";
import DocumentModal from "./DocumentModal";

interface Props {
  onUpload?: (docs: PassengerDoc[]) => void;
  existingDocs: PassengerDoc[];
  passengerId?: string;
  onFileSelect: (files: File[]) => void;
  uploading?: boolean;
  progress?: Record<string, number>;
  pendingFiles?: File[];
  uploadingFiles?: string[]; // IDs or names of files currently being uploaded
  storageDest: "Firebase" | "Drive";
  onStorageDestChange: (dest: "Firebase" | "Drive") => void;
}

export default function FileUploader({
  existingDocs,
  onFileSelect,
  uploading,
  progress = {},
  pendingFiles = [],
  storageDest,
  onStorageDestChange,
}: Props) {
  const [activePreviewDoc, setActivePreviewDoc] = useState<any | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFileSelect(acceptedFiles);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
    },
  } as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onStorageDestChange("Firebase")}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${storageDest === "Firebase" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
          >
            Internal
          </button>
          <button
            type="button"
            onClick={() => onStorageDestChange("Drive")}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${storageDest === "Drive" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
          >
            Drive
          </button>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Dest: {storageDest === "Drive" ? "Google Cloud" : "NexRegistry"}
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        <Paperclip
          size={20}
          className={`mx-auto mb-2 ${isDragActive ? "text-blue-500" : "text-slate-300"}`}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Processing Files...
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isDragActive
              ? "Drop files here"
              : "Click to sync Passport / Medical / Visa docs"}
          </p>
        )}
      </div>

      {existingDocs.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {existingDocs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-blue-50/30 rounded-xl border border-blue-100/50 text-xs text-slate-600"
            >
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span className="truncate max-w-[200px] font-medium">
                  {doc.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewDoc(doc)}
                className="text-blue-600 hover:text-blue-700 font-bold uppercase text-[9px] px-2 py-1 bg-white rounded-md shadow-sm transition-colors"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {activePreviewDoc && (
        <DocumentModal
          doc={activePreviewDoc}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}

      {/* Pending Files Indicator */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest pl-1">
            Staged for Upload
          </p>
          <div className="grid grid-cols-1 gap-2">
            {pendingFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                    <Paperclip size={14} className="text-slate-400" />
                  </div>
                  <span className="truncate max-w-[180px] font-medium text-slate-700">
                    {file.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[9px] font-bold uppercase rounded-md border border-yellow-100">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Upload Progress */}
      {Object.entries(progress).length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">
              Live Transaction Sync
            </p>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(progress).map(([fileName, percent]) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={fileName}
                className="group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Paperclip size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
                        {fileName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {Math.round(percent) < 100
                          ? "Encrypting Packet..."
                          : "Registry Authenticated"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-blue-600 tabular-nums">
                      {Math.round(percent)}%
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                  />
                  {percent < 100 && (
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Math.round(percent) === 100 ? (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <Check size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          Success
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Loader2 size={10} className="animate-spin" />
                        <span className="text-[9px] font-bold uppercase tracking-wider italic">
                          Transferring...
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="h-4 w-px bg-slate-100 mx-2" />
                  <span className="text-[9px] text-slate-300 font-mono tracking-tighter">
                    OBJ_{Math.random().toString(36).substring(7).toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
