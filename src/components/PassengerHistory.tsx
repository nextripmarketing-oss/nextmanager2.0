import React from "react";
import { HistoryEntry, PassengerStatus } from "../types/passenger";
import { Clock, User as UserIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Props {
  history: HistoryEntry[];
}

export default function PassengerHistory({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
        No history records available
      </div>
    );
  }

  const getStatusColor = (status: PassengerStatus) => {
    switch (status) {
      case "Visa Online":
        return "text-blue-600";
      case "Medical Done":
        return "text-emerald-600";
      case "Embassy Submit":
        return "text-amber-600";
      case "Visa Reject":
        return "text-red-600";
      case "Manpower Done":
        return "text-purple-600";
      case "Flight Done":
        return "text-emerald-700";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
          <Clock size={16} className="text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-display font-bold text-slate-900 leading-none">
            Process Timeline
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Audit Trail
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-10">
        {history
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .map((entry, index) => (
            <div key={index} className="relative group">
              <div
                className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-white transition-all duration-300 ${index === 0 ? "bg-blue-600 ring-8 ring-blue-50 group-hover:scale-125" : "bg-slate-200 group-hover:bg-slate-400"}`}
              />

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className={`text-[13px] font-bold uppercase tracking-widest ${getStatusColor(entry.status)} px-2 py-0.5 bg-slate-50 rounded border border-slate-100`}
                  >
                    {entry.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {format(new Date(entry.timestamp), "MMM dd, yyyy • HH:mm")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 self-start px-3 py-1.5 rounded-xl border border-slate-100">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <UserIcon size={10} className="text-slate-400" />
                  </div>
                  <span className="font-medium">
                    Modified by{" "}
                    <span className="font-bold text-slate-900">
                      {entry.updatedBy}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
