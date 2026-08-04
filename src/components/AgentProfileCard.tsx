import React from "react";
import { User } from "firebase/auth";
import { UserProfile } from "../types/user";

interface Stats {
  total: number;
  totalPaid: number;
  totalDue: number;
  totalVisaRate: number;
}

interface AgentProfileCardProps {
  user: User | null;
  profile: UserProfile | null;
  stats: Stats;
}

export default function AgentProfileCard({
  user,
  profile,
  stats,
}: AgentProfileCardProps) {
  if (!user || profile?.role !== "Agent") return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Agent Authorized Profile
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3 tracking-tight">
            {profile.mappedAgentName || "Unassigned Agent"}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Registered Email:{" "}
            <span className="text-slate-700">{user.email}</span>
          </p>
          <p className="text-xs font-bold text-slate-400 mt-1">
            System ID: <span className="font-mono">{user.uid}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Passengers
          </span>
          <span className="text-xl font-black text-slate-800">
            {stats.total}
          </span>
        </div>
        <div className="bg-amber-50 border border-amber-100/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
            Total Target
          </span>
          <span className="text-xl font-black text-amber-700">
            ৳{stats.totalVisaRate.toLocaleString()}
          </span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
            Total Paid
          </span>
          <span className="text-xl font-black text-emerald-700">
            ৳{stats.totalPaid.toLocaleString()}
          </span>
        </div>
        <div className="bg-rose-50 border border-rose-100/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">
            Total Due
          </span>
          <span className="text-xl font-black text-rose-700">
            ৳{stats.totalDue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
