import { useState, useEffect, useMemo } from "react";
import { Passenger, PassengerStatus, BranchId } from "../types/passenger";
import { PassengerService } from "../services/passengerService";
import { useBranch } from "../contexts/BranchContext";
import {
  Search,
  Edit3,
  MoreHorizontal,
  FileText,
  ChevronRight,
  Download,
  Trash2,
  Printer,
  Database,
  User,
  QrCode,
  AlertTriangle,
  Building2,
  Plane,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./AuthProvider";
import { PDFService } from "../services/pdfService";
import { PrintService } from "../services/printService";
import { QRCodeSVG } from "qrcode.react";

export type WorkflowStage = "All" | "Pending" | "In Progress" | "Cleared";

export const getWorkflowStage = (
  status: PassengerStatus,
): "Pending" | "In Progress" | "Cleared" => {
  switch (status || "") {
    case "Passport Submit":
    case "Passport Return":
    case "Visa Reject":
    case "Processing Cancelled":
    case "Others":
      return "Pending";
    case "Medical Done":
    case "Workpermit Issue":
    case "Visa Online":
    case "Embassy Submit":
    case "Manpower Done":
      return "In Progress";
    case "Flight Done":
      return "Cleared";
    default:
      return "Pending";
  }
};

export const getStageStyle = (status: PassengerStatus) => {
  const stage = getWorkflowStage(status);
  switch (stage) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    case "In Progress":
      return "bg-blue-50 text-blue-700 border-blue-200/60";
    case "Cleared":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
};

export const getStageDot = (status: PassengerStatus) => {
  const stage = getWorkflowStage(status);
  switch (stage) {
    case "Pending":
      return "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]";
    case "In Progress":
      return "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]";
    case "Cleared":
      return "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]";
    default:
      return "bg-slate-400";
  }
};

const NeedsWorkPermitWarning = ({ passenger }: { passenger: Passenger }) => {
  if (!passenger.createdAt) return null;
  
  let createdTime = 0;
  if (typeof (passenger.createdAt as any).toDate === "function") {
    createdTime = (passenger.createdAt as any).toDate().getTime();
  } else if ((passenger.createdAt as any).seconds) {
    createdTime = (passenger.createdAt as any).seconds * 1000;
  } else {
    createdTime = new Date(passenger.createdAt as any).getTime();
  }
  
  if (isNaN(createdTime) || createdTime === 0) return null;

  const daysDiff = Math.floor((new Date().getTime() - createdTime) / (1000 * 3600 * 24));
  
  if (daysDiff >= 7 && (passenger.status === "Passport Submit" || passenger.status === "Medical Done")) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60 w-fit shrink-0">
        <AlertTriangle size={12} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Please issue work permit for him ({daysDiff} days ago)</span>
      </div>
    );
  }
  return null;
};

interface Props {
  onEdit: (p: Passenger) => void;
  limit?: number;
  hideControls?: boolean;
}

export default function PassengerList({
  onEdit,
  limit,
  hideControls = false,
}: Props) {
  const { isAdmin, user, profile } = useAuth();
  const { currentBranch, filterPassengers, branchMeta } = useBranch();
  const [branchFilter, setBranchFilter] = useState<BranchId | "all">(currentBranch);

  useEffect(() => {
    setBranchFilter(currentBranch);
  }, [currentBranch]);

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "date" | "status" | "sl">("sl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<PassengerStatus | "All">(
    "All",
  );
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowStage>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agentFilter, setAgentFilter] = useState("All");
  const [delegateFilter, setDelegateFilter] = useState("All");
  const [referenceFilter, setReferenceFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [passengerToDelete, setPassengerToDelete] = useState<Passenger | null>(
    null,
  );
  const [qrPassenger, setQrPassenger] = useState<Passenger | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSelection = (e: any, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayData.length && displayData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayData.map((p) => p.id as string)));
    }
  };

  useEffect(() => {
    const unsubscribe = PassengerService.subscribeToPassengers((data) => {
      setPassengers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Filter passengers strictly by branch (unless admin overrides to 'all')
  const branchScopedPassengers = useMemo(() => {
    return filterPassengers(passengers, branchFilter);
  }, [passengers, branchFilter, filterPassengers]);

  const suggestions =
    searchTerm.length >= 1
      ? Array.from(
          new Set(
            branchScopedPassengers
              .filter((p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((p) => p.name),
          ),
        ).slice(0, 5)
      : [];

  const uniqueAgents = Array.from(new Set(branchScopedPassengers.map((p) => p.agentName || "").filter(Boolean))).sort();
  const uniqueDelegates = Array.from(new Set(branchScopedPassengers.map((p) => p.delegateAgent || "").filter(Boolean))).sort();
  const uniqueReferences = Array.from(new Set(branchScopedPassengers.map((p) => p.reference || "").filter(Boolean))).sort();
  const uniqueTrades = Array.from(new Set(branchScopedPassengers.map((p) => p.tradeName || "").filter(Boolean))).sort();

  const baseFiltered = branchScopedPassengers.filter((p) => {
    // If user is an agent, restrict to only passengers under their mapped agent name
    if (
      !isAdmin &&
      profile?.role === "Agent" &&
      profile.mappedAgentName
    ) {
      if (
        p.agentName !== profile.mappedAgentName && 
        p.reference !== profile.mappedAgentName &&
        p.delegateAgent !== profile.mappedAgentName
      ) {
        return false;
      }
    }

    const name = p.name || "";
    const phone = p.phone || "";
    const passport = p.passportNumber || "";
    const company = p.companyName || "";
    const trade = p.tradeName || "";
    const country = p.country || "";
    const agentName = p.agentName || "";
    const sl = p.sl ? String(p.sl) : "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sl.includes(searchTerm);

    const pStatus = p.status || "";
    const matchesStatus = statusFilter === "All" || pStatus === statusFilter;

    const pDate = p.date || "";
    const matchesDateRange =
      (!startDate || pDate >= startDate) && (!endDate || pDate <= endDate);

    const matchesAgent = agentFilter === "All" || (p.agentName || "") === agentFilter;
    const matchesDelegate = delegateFilter === "All" || (p.delegateAgent || "") === delegateFilter;
    const matchesReference = referenceFilter === "All" || (p.reference || "") === referenceFilter;
    const matchesTrade = tradeFilter === "All" || (p.tradeName || "") === tradeFilter;

    return matchesSearch && matchesStatus && matchesDateRange && matchesAgent && matchesDelegate && matchesReference && matchesTrade;
  });

  const filteredAndSorted = baseFiltered
    .filter((p) => {
      const stage = getWorkflowStage(p.status);
      const matchesWorkflow =
        workflowFilter === "All" || stage === workflowFilter;

      return matchesWorkflow;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        const nameA = a.name || "";
        const nameB = b.name || "";
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === "date") {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      } else if (sortBy === "status") {
        const statusA = a.status || "";
        const statusB = b.status || "";
        comparison = statusA.localeCompare(statusB);
      } else if (sortBy === "sl") {
        comparison = (a.sl || 0) - (b.sl || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const displayData = limit
    ? filteredAndSorted.slice(0, limit)
    : filteredAndSorted;

  const handleExportCSV = () => {
    const headers = [
      "SL",
      "Name",
      "Phone",
      "Passport",
      "Type",
      "Country",
      "Company",
      "Movement",
      "Trade Name",
      "Status",
      "Agent",
      "Date",
    ];
    const rows = filteredAndSorted.map((p) => [
      p.sl || "",
      p.name,
      p.phone,
      p.passportNumber || "",
      p.passengerType || "",
      p.country || "",
      p.companyName || "",
      p.inOut,
      p.tradeName || "",
      p.status,
      p.agentName || "",
      p.date || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Nextrip_Passengers_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: PassengerStatus) => {
    switch (status) {
      case "Visa Online":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Medical Done":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Embassy Submit":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Visa Reject":
        return "bg-red-100 text-red-700 border-red-200";
      case "Manpower Done":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Flight Done":
        return "bg-emerald-600 text-white border-emerald-700";
      case "Passport Return":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "Passport Submit":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Workpermit Issue":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Processing Cancelled":
        return "bg-slate-900 text-white border-slate-900";
      case "Others":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getDotColor = (status: PassengerStatus) => {
    switch (status) {
      case "Visa Online":
        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      case "Medical Done":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
      case "Embassy Submit":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
      case "Visa Reject":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      case "Manpower Done":
        return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]";
      case "Flight Done":
        return "bg-white shadow-[0_0_8px_rgba(255,255,255,1)]";
      case "Passport Return":
        return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      case "Passport Submit":
        return "bg-slate-400";
      case "Workpermit Issue":
        return "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]";
      case "Processing Cancelled":
        return "bg-gray-400";
      case "Others":
        return "bg-slate-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {!hideControls && (
        <div className="flex flex-col gap-4">
          {/* Branch Header Badge and Scope Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${
                  branchFilter === "diabari"
                    ? "bg-emerald-600 shadow-emerald-500/20"
                    : branchFilter === "all"
                    ? "bg-purple-600 shadow-purple-500/20"
                    : "bg-blue-600 shadow-blue-500/20"
                }`}
              >
                {branchFilter === "diabari" ? (
                  <Building2 size={20} />
                ) : branchFilter === "all" ? (
                  <Filter size={20} />
                ) : (
                  <Plane size={20} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {branchFilter === "diabari"
                      ? "দিয়াবাড়ী (হেড অফিস) ক্লাইন্ট রেজিস্ট্রি"
                      : branchFilter === "all"
                      ? "সকল শাখা ক্লাইন্ট রেজিস্ট্রি (All Branches)"
                      : "নেক্সট্রিপ ক্লাইন্ট রেজিস্ট্রি (NexTrip)"}
                  </h3>
                  {branchFilter === "diabari" && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                      RL2572
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  মোট ক্লাইন্ট: <strong className="text-slate-800 dark:text-slate-200 font-bold">{filteredAndSorted.length}</strong> জন প্রদর্শিত
                </p>
              </div>
            </div>

            {/* Admin Branch Switcher Pill */}
            {isAdmin && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setBranchFilter("nextrip")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    branchFilter === "nextrip"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  ✈️ নেক্সট্রিপ
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter("diabari")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    branchFilter === "diabari"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  🏛️ দিয়াবাড়ী (হেড অফিস)
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter("all")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    branchFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="উভয় শাখার সকল ক্লাইন্ট একসাথে দেখুন"
                >
                  উভয় শাখা
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative group flex-1 max-w-2xl">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm"
                placeholder="Search by passenger, destination (country), passport, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {suggestions.map((name, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchTerm(name);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 group transition-colors"
                      >
                        <Search
                          size={14}
                          className="text-slate-300 group-hover:text-blue-500"
                        />
                        <span className="font-medium text-slate-700">
                          {name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.size > 0 ? (
                <button
                  onClick={() => {
                    const selectedPassengers = displayData.filter((p) =>
                      selectedIds.has(p.id as string),
                    );
                    PrintService.printPassengerList(
                      selectedPassengers,
                      startDate,
                      endDate,
                    );
                  }}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-slate-800 transition-all shadow-sm group"
                >
                  <Printer size={14} className="text-emerald-500" />
                  <span>Print Selected ({selectedIds.size})</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    PrintService.printPassengerList(
                      filteredAndSorted,
                      startDate,
                      endDate,
                    )
                  }
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:bg-slate-800 transition-all shadow-sm group"
                >
                  <Printer size={14} className="text-blue-500" />
                  <span>রিপোর্ট প্রিন্ট করুন (Print List)</span>
                </button>
              )}

              <button
                onClick={handleExportCSV}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
              >
                <Download
                  size={14}
                  className="text-slate-400 group-hover:text-blue-600 transition-colors"
                />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer"
              >
                <option value="sl">Order by Serial</option>
                <option value="name">Order by Name</option>
                <option value="date">Order by Date</option>
                <option value="status">Order by Status</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center border-l border-slate-100"
              >
                <div
                  className={`transition-transform duration-300 ${sortOrder === "desc" ? "rotate-180" : ""}`}
                >
                  <ChevronRight className="rotate-90" size={16} />
                </div>
              </button>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer"
              >
                <option value="All">All Operations</option>
                <option value="Passport Submit">Passport Submit</option>
                <option value="Medical Done">Medical Done</option>
                <option value="Workpermit Issue">Workpermit Issue</option>
                <option value="Visa Online">Visa Online</option>
                <option value="Embassy Submit">Embassy Submit</option>
                <option value="Passport Return">Passport Return</option>
                <option value="Manpower Done">Manpower Done</option>
                <option value="Flight Done">Flight Done</option>
                <option value="Visa Reject">Visa Reject</option>
                <option value="Processing Cancelled">
                  Processing Cancelled
                </option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Date-wise From & To Filter */}
            <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm px-3.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                From:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-[10px] font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer"
              />
              {startDate && (
                <button
                  type="button"
                  onClick={() => setStartDate("")}
                  className="text-slate-400 hover:text-slate-600 font-bold px-1 text-xs"
                  title="Clear start date"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm px-3.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                To:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-[10px] font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer"
              />
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate("")}
                  className="text-slate-400 hover:text-slate-600 font-bold px-1 text-xs"
                  title="Clear end date"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All Agents</option>
                {uniqueAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={delegateFilter}
                onChange={(e) => setDelegateFilter(e.target.value)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All Delegates</option>
                {uniqueDelegates.map((delegate) => (
                  <option key={delegate} value={delegate}>
                    {delegate}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All References</option>
                {uniqueReferences.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-transparent py-2.5 px-3 focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All Trades</option>
                {uniqueTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Workflow Stage Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center gap-1.5 bg-slate-100/65 p-1 rounded-2xl overflow-x-auto max-w-full">
              {(
                ["All", "Pending", "In Progress", "Cleared"] as WorkflowStage[]
              ).map((stage) => {
                const isActive = workflowFilter === stage;
                const count = baseFiltered.filter(
                  (p) => stage === "All" || getWorkflowStage(p.status) === stage,
                ).length;
                return (
                  <button
                    key={stage}
                    onClick={() => setWorkflowFilter(stage)}
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {stage === "Pending" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                      {stage === "In Progress" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                      {stage === "Cleared" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {stage}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${
                        isActive
                          ? "bg-slate-100 text-slate-800"
                          : "bg-slate-200/30 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap px-2 flex gap-1.5">
              <span>Showing</span>
              <span className="font-black text-blue-600">{filteredAndSorted.length}</span>
              <span>Passengers</span>
            </div>
          </div>
        </div>
      )}

      <div className="bento-card !p-0 overflow-hidden shadow-[0_2px_15px_-5px_rgba(37,99,235,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] flex items-center gap-3"
                >
                  <div className="relative cursor-pointer flex items-center" onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}>
                     <input 
                       type="checkbox" 
                       className="peer sr-only"
                       checked={selectedIds.size === displayData.length && displayData.length > 0}
                       readOnly
                     />
                     <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-all">
                       <svg className={`w-3 h-3 text-white ${selectedIds.size === displayData.length && displayData.length > 0 ? "opacity-100" : "opacity-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     </div>
                  </div>
                  SL
                </motion.th>
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]"
                >
                  Identity / Contact
                </motion.th>
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]"
                >
                  Global Logistics
                </motion.th>
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]"
                >
                  Financials
                </motion.th>
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center"
                >
                  Process Status
                </motion.th>
                <motion.th
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-6 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-right pr-6"
                >
                  Management
                </motion.th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {displayData.map((p, index) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    key={p.id}
                    className="hover:bg-blue-50/50 transition-all duration-200 group cursor-pointer border-l-2 border-l-transparent hover:border-l-blue-500"
                    onClick={() => onEdit(p)}
                  >
                    <td className="px-6 py-5 font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative cursor-pointer flex items-center" onClick={(e) => toggleSelection(e, p.id as string)}>
                          <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={selectedIds.has(p.id as string)}
                            readOnly
                          />
                          <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-all">
                            <svg className={`w-3 h-3 text-white ${selectedIds.has(p.id as string) ? "opacity-100" : "opacity-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        </div>
                        {p.sl?.toString().padStart(3, "0") || "---"}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                            <User size={16} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-display font-bold text-slate-900 text-[15px] leading-tight group-hover:text-blue-700 transition-colors">
                              {p.name}
                            </p>
                            {branchFilter === "all" && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${p.branch === "diabari" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                                {p.branch === "diabari" ? "দিয়াবাড়ী" : "নেক্সট্রিপ"}
                              </span>
                            )}
                            {p.passengerType && (
                              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                {p.passengerType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] font-mono text-slate-500 tracking-tight">
                              {p.phone}
                            </p>
                            {p.passportNumber && (
                              <>
                                <span className="text-slate-300">|</span>
                                <p className="text-[11px] font-mono text-blue-500 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                  {p.passportNumber}
                                  {p.delegateAgent && (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full border border-rose-200">
                                      (- MINUS)
                                    </span>
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                          <NeedsWorkPermitWarning passenger={p} />
                          {p.date && (
                            <div className="mt-1 flex items-center gap-1 text-slate-400">
                              <span className="text-[10px] font-bold uppercase tracking-widest">Date:</span>
                              <p className="text-[10px] font-mono font-medium">
                                {p.date}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-700">
                          {p.country || "N/A"}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${p.inOut === "In" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                        >
                          {p.inOut}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                          {p.tradeName || "General"}
                        </p>
                        {p.companyName && (
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            @{p.companyName}
                          </p>
                        )}
                        {p.submissionDate && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                            <p className="text-[9px] font-bold uppercase">
                              Sub: {p.submissionDate}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {p.agentName && (
                          <div className="flex items-center gap-1">
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Agt:</span>
                             <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{p.agentName}</span>
                          </div>
                        )}
                        {p.delegateAgent && (
                          <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                             <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Del:</span>
                             <span className="text-[10px] font-bold text-rose-600 truncate max-w-[100px] line-through">{p.delegateAgent}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4 max-w-[170px]">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            Visa Rate:
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            {p.visaRate !== undefined && p.visaRate !== null
                              ? `৳${p.visaRate.toLocaleString()}`
                              : "---"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 max-w-[170px]">
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">
                            Paid:
                          </span>
                          <span className="font-mono font-bold text-emerald-600">
                            {p.paidAmount !== undefined && p.paidAmount !== null
                              ? `৳${p.paidAmount.toLocaleString()}`
                              : "৳0"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 max-w-[170px]">
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">
                            Due:
                          </span>
                          <span
                            className={`${(p.visaRate || 0) - (p.paidAmount || 0) > 0 ? "text-amber-600 font-black" : "text-slate-500 font-bold"} font-mono`}
                          >
                            ৳
                            {(
                              (p.visaRate || 0) - (p.paidAmount || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                        {isAdmin && (
                          <>
                            <div className="flex items-center justify-between gap-4 max-w-[170px] border-t border-slate-100 pt-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                Agent Rate:
                              </span>
                              <span className="font-mono font-bold text-slate-500">
                                {p.agentRate !== undefined && p.agentRate !== null
                                  ? `৳${p.agentRate.toLocaleString()}`
                                  : "---"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 max-w-[170px] border-t border-slate-100/50 pt-0.5 animate-pulse">
                              <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-widest">
                                Profit:
                              </span>
                              <span
                                className={`font-mono font-black ${(p.visaRate || 0) - (p.agentRate || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                              >
                                ৳
                                {(
                                  (p.visaRate || 0) - (p.agentRate || 0)
                                ).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col items-center gap-2">
                        {/* Visual Workflow Stage Indicator (Tag) */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStageStyle(p.status)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getStageDot(p.status)}`}
                          />
                          {getWorkflowStage(p.status)}
                        </span>

                        {/* Specific Process Status Tag with Overlay Select */}
                        <div className="relative group/status cursor-pointer">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border text-slate-600 bg-slate-50 border-slate-200 shadow-sm transition-all group-hover/status:shadow-md group-hover/status:border-blue-300 group-hover/status:text-blue-700 group-hover/status:bg-blue-50`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full animate-pulse shrink-0 ${getDotColor(p.status)}`}
                            />
                            {p.status}
                          </span>
                          {user && (
                            <select
                              value={p.status || ""}
                              onChange={async (e) => {
                                const newStatus = e.target
                                  .value as PassengerStatus;
                                if (
                                  newStatus &&
                                  newStatus !== p.status &&
                                  p.id
                                ) {
                                  try {
                                    await PassengerService.updatePassenger(
                                      p.id,
                                      { status: newStatus },
                                      {
                                        status: newStatus,
                                        updatedBy:
                                          profile?.name ||
                                          profile?.email ||
                                          "Unknown User",
                                        updatedByUid:
                                          user?.uid || "Unknown UID",
                                      },
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Failed to update status",
                                      err,
                                    );
                                  }
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              title="Click to update status"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {[
                                "Passport Submit",
                                "Medical Done",
                                "Workpermit Issue",
                                "Visa Online",
                                "Embassy Submit",
                                "Visa Reject",
                                "Passport Return",
                                "Manpower Done",
                                "Flight Done",
                                "Processing Cancelled",
                                "Others",
                              ].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right pr-6">
                      <div className="flex justify-end items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrPassenger(p);
                          }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all"
                          title="Generate QR Code"
                        >
                          <QrCode size={16} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            PrintService.printPassengerCV(p);
                          }}
                          className="p-2 text-slate-500 hover:text-green-600 hover:bg-white border border-transparent hover:border-green-100 rounded-xl transition-all"
                          title="Print Passenger CV"
                        >
                          <FileText size={16} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            PrintService.printSingleProfile(p);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-100 rounded-xl transition-all"
                          title="Print Passenger Profile"
                        >
                          <FileText size={16} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(p);
                          }}
                          className="bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                          Edit
                        </motion.button>

                        {user && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPassengerToDelete(p);
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100 rounded-xl transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {passengerToDelete && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !deleting && setPassengerToDelete(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white rounded-[2rem] w-full max-w-md p-8 relative z-10 shadow-2xl border border-slate-100"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <Trash2 className="text-red-500" size={32} />
                  </div>

                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                    Delete Record?
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    You are about to permanently remove{" "}
                    <span className="font-bold text-slate-900">
                      {passengerToDelete.name}
                    </span>{" "}
                    from the central registry. This action cannot be undone.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      disabled={deleting}
                      onClick={() => setPassengerToDelete(null)}
                      className="flex-1 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await PassengerService.deletePassenger(
                            passengerToDelete.id!,
                          );
                          setPassengerToDelete(null);
                        } catch (error) {
                          alert("Failed to delete record.");
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      className="flex-1 px-6 py-3.5 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing</span>
                        </>
                      ) : (
                        <span>Delete Forever</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Mobile Card Layout */}
          <div className="lg:hidden divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {displayData.map((p, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  key={p.id}
                  className="p-5 active:bg-slate-50 transition-colors"
                  onClick={() => onEdit(p)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative cursor-pointer flex items-center" onClick={(e) => toggleSelection(e, p.id as string)}>
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={selectedIds.has(p.id as string)}
                          readOnly
                        />
                        <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-all">
                          <svg className={`w-3.5 h-3.5 text-white ${selectedIds.has(p.id as string) ? "opacity-100" : "opacity-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 py-1 px-2 bg-slate-50 rounded">
                        #{p.sl?.toString().padStart(3, "0") || "---"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStageStyle(p.status)}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${getStageDot(p.status)}`}
                        />
                        {getWorkflowStage(p.status)}
                      </span>
                      <div className="relative group/status cursor-pointer">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border text-slate-600 bg-slate-50 border-slate-200 group-hover/status:shadow-md group-hover/status:border-blue-300 group-hover/status:text-blue-700 transition-all`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full animate-pulse shrink-0 ${getDotColor(p.status)}`}
                          />
                          {p.status}
                        </span>
                        {user && (
                          <select
                            value={p.status || ""}
                            onChange={async (e) => {
                              const newStatus = e.target
                                .value as PassengerStatus;
                              if (newStatus && newStatus !== p.status && p.id) {
                                try {
                                  await PassengerService.updatePassenger(
                                    p.id,
                                    { status: newStatus },
                                    {
                                      status: newStatus,
                                      updatedBy:
                                        profile?.name ||
                                        profile?.email ||
                                        "Unknown User",
                                      updatedByUid: user?.uid || "Unknown UID",
                                    },
                                  );
                                } catch (err) {
                                  console.error("Failed to update status", err);
                                }
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Click to update status"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[
                              "Passport Submit",
                              "Medical Done",
                              "Workpermit Issue",
                              "Visa Online",
                              "Embassy Submit",
                              "Visa Reject",
                              "Passport Return",
                              "Manpower Done",
                              "Flight Done",
                              "Processing Cancelled",
                              "Others",
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrPassenger(p);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          PrintService.printPassengerCV(p);
                        }}
                        className="p-2 text-slate-400 hover:text-green-600"
                        title="Print Passenger CV"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          PrintService.printSingleProfile(p);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600"
                      >
                        <FileText size={18} />
                      </button>
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPassengerToDelete(p);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                        <User size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold text-slate-900 text-base leading-tight flex items-center gap-2">
                        {p.name}
                        {p.passengerType && (
                          <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                            {p.passengerType}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
                    <p className="text-[11px] font-mono text-slate-500 tracking-tight">
                      {p.phone}
                    </p>
                    <span className="text-slate-300 text-[10px]">|</span>
                    <p className="text-[11px] font-mono text-blue-500 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                      {p.passportNumber || "No Passport"}
                      {p.delegateAgent && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full border border-rose-200">
                          (- MINUS)
                        </span>
                      )}
                    </p>
                    {p.date && (
                      <>
                        <span className="text-slate-300 text-[10px]">|</span>
                        <p className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                          {p.date}
                        </p>
                      </>
                    )}
                  </div>
                  <NeedsWorkPermitWarning passenger={p} />

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Destination
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700">
                          {p.country}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 rounded uppercase ${p.inOut === "In" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {p.inOut}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Occupation
                      </p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {p.tradeName || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 mt-1 border-t border-slate-50">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Agent
                      </p>
                      <p className="text-[10px] font-bold text-slate-600 truncate">
                        {p.agentName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Delegate
                      </p>
                      <p className={`text-[10px] font-bold truncate ${p.delegateAgent ? "text-rose-600 line-through" : "text-slate-600"}`}>
                        {p.delegateAgent || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Visa Rate
                        </p>
                        <p className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                          {p.visaRate !== undefined && p.visaRate !== null
                            ? `৳${p.visaRate.toLocaleString()}`
                            : "---"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest leading-none">
                          Received
                        </p>
                        <p className="text-[11px] font-mono font-bold text-emerald-600 mt-1">
                          {p.paidAmount !== undefined && p.paidAmount !== null
                            ? `৳${p.paidAmount.toLocaleString()}`
                            : "৳0"}
                        </p>
                      </div>
                      <div className="border-l border-slate-200 pl-2">
                        <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest leading-none">
                          Due Balance
                        </p>
                        <p
                          className={`text-[11px] font-mono font-black mt-1 ${(p.visaRate || 0) - (p.paidAmount || 0) > 0 ? "text-amber-600" : "text-slate-500"}`}
                        >
                          ৳
                          {(
                            (p.visaRate || 0) - (p.paidAmount || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-dashed border-slate-200">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Agent Rate / Cost
                        </p>
                        <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">
                          {p.agentRate !== undefined && p.agentRate !== null
                            ? `৳${p.agentRate.toLocaleString()}`
                            : "---"}
                        </p>
                      </div>
                      <div className="border-l border-slate-200 pl-2">
                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest leading-none">
                          Net Profit
                        </p>
                        <p
                          className={`text-[11px] font-mono font-black mt-1 ${(p.visaRate || 0) - (p.agentRate || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                        >
                          ৳
                          {(
                            (p.visaRate || 0) - (p.agentRate || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {loading && (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                Registry Sync In Progress
              </p>
            </div>
          )}
          {!loading && filteredAndSorted.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 grayscale opacity-50">
              <Database size={48} className="text-slate-200" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                No Match In Central Registry
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrPassenger && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrPassenger(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] w-full max-w-sm p-8 relative z-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="text-indigo-600" size={32} />
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900 mb-1">
                {qrPassenger.name}
              </h3>
              <p className="text-slate-500 font-mono text-sm mb-6 uppercase tracking-wider">
                {qrPassenger.passportNumber || "N/A"}
              </p>

              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-8 inline-block shadow-inner ring-1 ring-black/5">
                <QRCodeSVG
                  value={`Name: ${qrPassenger.name}\nPassport: ${qrPassenger.passportNumber || "N/A"}\nStatus: ${qrPassenger.status}\nDestination: ${qrPassenger.country}\nID: ${qrPassenger.id}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
              </div>

              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => setQrPassenger(null)}
                  className="px-8 py-3.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
