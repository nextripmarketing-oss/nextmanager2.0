import { motion, AnimatePresence } from "motion/react";
import { useBranch, BRANCH_METAS } from "../contexts/BranchContext";
import {
  Building2,
  Plane,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { BranchId } from "../types/passenger";

interface Props {
  canClose?: boolean;
}

export default function BranchSelectorModal({ canClose = true }: Props) {
  const { currentBranch, setBranch, isBranchModalOpen, closeBranchModal } =
    useBranch();

  if (!isBranchModalOpen) return null;

  const handleSelect = (branch: BranchId) => {
    setBranch(branch);
    closeBranchModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="relative px-6 pt-7 pb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-indigo-200 border border-white/10">
                  <Sparkles size={13} className="text-amber-300" />
                  কর্মক্ষেত্র ও অফিস নির্বাচন (Select Workspace)
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  আপনি কোন শাখায় কাজ করতে চান?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                  নেক্সট্রিপ ও দিয়াবাড়ী (হেড অফিস) এর ক্লাইন্ট ডাটাবেস ও হিসাব সম্পূর্ণ আলাদা রাখা হয়েছে। আপনার শাখা নির্বাচন করুন:
                </p>
              </div>

              {canClose && (
                <button
                  onClick={closeBranchModal}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Cards Section */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Option 1: NexTrip */}
              <div
                onClick={() => handleSelect("nextrip")}
                className={`group relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                  currentBranch === "nextrip"
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-slate-850"
                }`}
              >
                {currentBranch === "nextrip" && (
                  <div className="absolute top-4 right-4 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 size={22} className="fill-blue-100 dark:fill-blue-950" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <Plane size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                      অপারেশন শাখা
                    </span>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mt-0.5">
                      নেক্সট্রিপ (NexTrip)
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  নেক্সট্রিপ ক্লাইন্ট ডাটাবেস, পাসপোর্ট ও নিয়মিত ভিসা প্রসেসিং এবং অফিস ট্রাভেল লেজার।
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    নেক্সট্রিপ ক্লাইন্ট রেজিস্ট্রি
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    ভিসা ও ম্যানপাওয়ার ওয়ার্কফ্লো
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    নেক্সট্রিপ লেজার ও হিসাব
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    currentBranch === "nextrip"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white"
                  }`}
                >
                  <span>নেক্সট্রিপ এ প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Option 2: Diabari (Head Office) */}
              <div
                onClick={() => handleSelect("diabari")}
                className={`group relative p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                  currentBranch === "diabari"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-white dark:bg-slate-850"
                }`}
              >
                {currentBranch === "diabari" && (
                  <div className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={22} className="fill-emerald-100 dark:fill-emerald-950" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        প্রধান কার্যালয়
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950 px-1.5 py-0.5 rounded-md">
                        RL2572
                      </span>
                    </div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mt-0.5">
                      দিয়াবাড়ী (Diabari)
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  দিয়াবাড়ী হেড অফিস ক্লাইন্ট ডাটাবেস, আলাদা সিরিয়াল নম্বর, হেড অফিস ক্যাশ বুক ও ট্রেনিং সেন্টার।
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    দিয়াবাড়ী স্বতন্ত্র ক্লাইন্ট তালিকা
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    স্বতন্ত্র সিরিয়াল ও ফাইল নাম্বারিং
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    হেড অফিস হিসাব ও ক্যাশ লেজার
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    currentBranch === "diabari"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-emerald-600 group-hover:text-white"
                  }`}
                >
                  <span>দিয়াবাড়ী হেড অফিসে প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Note at bottom */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>যেকোনো সময় উপরের হেডার থেকে ব্রাঞ্চ বদলানো যাবে।</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Active: {BRANCH_METAS[currentBranch].shortName}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
