import React from "react";
import { useBranch, BRANCH_METAS } from "../contexts/BranchContext";
import { Plane, Building2, ChevronDown, Repeat } from "lucide-react";

export default function BranchSwitcherPill() {
  const { currentBranch, setBranch, openBranchModal, branchMeta } = useBranch();

  const isDiabari = currentBranch === "diabari";

  const toggleBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBranch(isDiabari ? "nextrip" : "diabari");
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Interactive Switcher Button */}
      <button
        type="button"
        onClick={openBranchModal}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          isDiabari
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
            : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60"
        }`}
        title="ক্লিক করে ব্রাঞ্চ বা কর্মক্ষেত্র পরিবর্তন করুন"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
          {isDiabari ? (
            <Building2 size={13} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Plane size={13} className="text-blue-600 dark:text-blue-400" />
          )}
        </span>

        <div className="flex items-center gap-1.5 text-left">
          <span className="font-black tracking-tight text-[12px] sm:text-[13px]">
            {isDiabari ? "দিয়াবাড়ী (হেড অফিস)" : "নেক্সট্রিপ"}
          </span>
          {isDiabari && (
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded text-[10px] font-black">
              RL2572
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5"
        />
      </button>

      {/* Quick 1-click Toggle Button */}
      <button
        type="button"
        onClick={toggleBranch}
        className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs hover:border-slate-300"
        title={`সরাসরি ${isDiabari ? "নেক্সট্রিপ" : "দিয়াবাড়ী"} এ সুইচ করুন`}
      >
        <Repeat size={12} />
        <span className="hidden md:inline">
          {isDiabari ? "নেক্সট্রিপ এ যান" : "দিয়াবাড়ী এ যান"}
        </span>
      </button>
    </div>
  );
}
