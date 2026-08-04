import React from "react";
import { X, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DocumentModal({
  doc,
  onClose,
}: {
  doc: { url: string; name: string; type?: string } | null;
  onClose: () => void;
}) {
  if (!doc) return null;

  const isPdf =
    doc.url.startsWith("data:application/pdf") ||
    doc.url.includes(".pdf") ||
    doc.type === "application/pdf";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/90 z-[300] flex flex-col items-center justify-center p-6 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] relative flex flex-col gap-4 shadow-2xl"
        >
          <div className="w-full flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-sm uppercase font-extrabold tracking-widest text-slate-300 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              {doc.name}
            </span>
            <button
              onClick={onClose}
              className="bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full flex-1 overflow-hidden rounded-2xl bg-black flex items-center justify-center border border-slate-800 relative">
            {isPdf ? (
              <iframe
                src={doc.url}
                className="w-full h-full min-h-[60vh] border-0 bg-white"
                title={doc.name}
              />
            ) : (
              <img
                src={doc.url}
                alt={doc.name}
                className="max-h-[60vh] max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="w-full flex justify-center pt-2">
            <a
              href={doc.url}
              download={doc.name}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <Download size={16} />
              Download Document
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
