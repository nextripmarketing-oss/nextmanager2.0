import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { AgencyService } from "../services/agencyService";
import { PassengerService } from "../services/passengerService";
import { Agency, PassportLog } from "../types/agency";
import { Passenger } from "../types/passenger";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building2,
  BookOpen,
  Clock,
  X,
  ChevronRight,
  Printer,
  AlertTriangle,
  Settings,
  HelpCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AgencyManagement() {
  const { user, profile } = useAuth();

  // Real-time states synchronized with Firestore
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [passportLogs, setPassportLogs] = useState<PassportLog[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  // UI views / sub-tabs
  const [activeTab, setActiveTab] = useState<"agencies" | "logs">("agencies");
  const [searchText, setSearchText] = useState("");
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState("");

  // Modal toggle states
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Operation target states
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [selectedAgencyDetails, setSelectedAgencyDetails] =
    useState<Agency | null>(null);

  // Agency form fields
  const [agencyName, setAgencyName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyRemarks, setAgencyRemarks] = useState("");

  // Passport log form fields
  const [logAgencyId, setLogAgencyId] = useState("");
  const [logDirection, setLogDirection] = useState<
    "ReceivedFromAgency" | "DeliveredToAgency"
  >("ReceivedFromAgency");
  const [logCount, setLogCount] = useState("1");
  const [logDescription, setLogDescription] = useState("");
  const [logDate, setLogDate] = useState(() => {
    const localD = new Date(Date.now() + 6 * 60 * 60 * 1000); // UTC+6 timezone padding
    return localD.toISOString().split("T")[0];
  });
  const [logRemarks, setLogRemarks] = useState("");

  // Synchronize Firestore subscriptions
  useEffect(() => {
    const unsubAgencies = AgencyService.subscribeToAgencies(setAgencies);
    const unsubLogs = AgencyService.subscribeToPassportLogs(setPassportLogs);
    const unsubPassengers =
      PassengerService.subscribeToPassengers(setPassengers);

    return () => {
      unsubAgencies();
      unsubLogs();
      unsubPassengers();
    };
  }, []);

  // Compute stats per agency
  const agencyMetrics = useMemo(() => {
    const metrics: {
      [key: string]: { received: number; delivered: number; net: number };
    } = {};

    // Initialize
    agencies.forEach((ag) => {
      if (ag.id) {
        metrics[ag.id] = { received: 0, delivered: 0, net: 0 };
      }
    });

    // Accumulate logs
    passportLogs.forEach((log) => {
      if (metrics[log.agencyId]) {
        if (log.direction === "ReceivedFromAgency") {
          metrics[log.agencyId].received += log.passportCount;
          metrics[log.agencyId].net += log.passportCount;
        } else {
          metrics[log.agencyId].delivered += log.passportCount;
          metrics[log.agencyId].net -= log.passportCount;
        }
      }
    });

    return metrics;
  }, [agencies, passportLogs]);

  // Overall counts for summary cards
  const statsSummary = useMemo(() => {
    let totalReceived = 0;
    let totalDelivered = 0;

    passportLogs.forEach((log) => {
      if (log.direction === "ReceivedFromAgency") {
        totalReceived += log.passportCount;
      } else {
        totalDelivered += log.passportCount;
      }
    });

    return {
      totalAgencies: agencies.length,
      totalReceived,
      totalDelivered,
      netHeld: totalReceived - totalDelivered,
    };
  }, [agencies, passportLogs]);

  // Handle open agency modal
  const openAddAgency = () => {
    setEditingAgency(null);
    setAgencyName("");
    setAgencyPhone("");
    setAgencyEmail("");
    setAgencyAddress("");
    setAgencyRemarks("");
    setIsAgencyModalOpen(true);
  };

  const openEditAgency = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgency(agency);
    setAgencyName(agency.name);
    setAgencyPhone(agency.phone);
    setAgencyEmail(agency.email || "");
    setAgencyAddress(agency.address || "");
    setAgencyRemarks(agency.remarks || "");
    setIsAgencyModalOpen(true);
  };

  // Submit Agency profile
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!agencyName.trim() || !agencyPhone.trim()) {
      alert("এজেন্সির নাম এবং ফোন নাম্বার আবশ্যক।");
      return;
    }

    const payload: any = {
      name: agencyName.trim(),
      phone: agencyPhone.trim(),
      createdByUid: user.uid,
      createdByEmail: user.email || "unknown@nextrip.com",
    };

    if (agencyEmail.trim()) payload.email = agencyEmail.trim();
    if (agencyAddress.trim()) payload.address = agencyAddress.trim();
    if (agencyRemarks.trim()) payload.remarks = agencyRemarks.trim();

    try {
      if (editingAgency && editingAgency.id) {
        await AgencyService.updateAgency(editingAgency.id, payload);
      } else {
        await AgencyService.addAgency(payload);
      }
      setIsAgencyModalOpen(false);
    } catch (err) {
      alert("এজেন্সি সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  // Delete Agency
  const handleAgencyDelete = async (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      confirm(
        `আপনি কি নিশ্চিত যে "${name}" এজেন্সির প্রোফাইল ডিলিট করতে চান? এর সাথে যুক্ত সমস্ত ট্রানজেকশন ডেটা অকার্যকর হয়ে যেতে পারে।`,
      )
    ) {
      try {
        await AgencyService.deleteAgency(id);
        if (selectedAgencyDetails?.id === id) {
          setIsDetailModalOpen(false);
        }
      } catch (err) {
        alert("ত্রুটি! এজেন্সি প্রোফাইল ডিলিট করা যায়নি।");
      }
    }
  };

  // Handle open log modal
  const openAddLog = (initialAgencyId = "") => {
    setLogAgencyId(initialAgencyId || agencies[0]?.id || "");
    setLogDirection("ReceivedFromAgency");
    setLogCount("1");
    setLogDescription("");
    setLogRemarks("");
    setIsLogModalOpen(true);
  };

  // Submit Passport Log
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const countNum = parseInt(logCount);
    if (!logAgencyId) {
      alert("অনুগ্রহ করে এজেন্সি নির্বাচন করুন।");
      return;
    }
    if (isNaN(countNum) || countNum <= 0) {
      alert("পাসপোর্টের পরিমাণ সঠিক নয়।");
      return;
    }
    if (!logDescription.trim()) {
      alert("পাসপোর্ট বিবরণ বা ক্লায়েন্ট নামসমূহ উল্ল্যেখ করুন।");
      return;
    }

    const matchedAgency = agencies.find((a) => a.id === logAgencyId);
    if (!matchedAgency) return;

    const payload: any = {
      agencyId: logAgencyId,
      agencyName: matchedAgency.name,
      direction: logDirection,
      passportCount: countNum,
      description: logDescription.trim(),
      date: logDate,
      createdByUid: user.uid,
      createdByEmail: user.email || "unknown@nextrip.com",
    };
    if (logRemarks.trim()) payload.remarks = logRemarks.trim();

    try {
      await AgencyService.addPassportLog(payload);
      setIsLogModalOpen(false);
    } catch (err) {
      alert("পাসপোর্ট আদান-প্রদান ট্রানজেকশন সফল হয়নি।");
    }
  };

  // Delete log
  const handleLogDelete = async (id: string) => {
    if (
      confirm("আপনি কি নিশ্চিত যে এই পাসপোর্ট ট্রানজেকশন ভাউচারটি মুছতে চান?")
    ) {
      try {
        await AgencyService.deletePassportLog(id);
      } catch (err) {
        alert("মুছতে ব্যর্থ হয়েছে।");
      }
    }
  };

  // Filtered lists
  const filteredAgencies = useMemo(() => {
    return agencies.filter((ag) => {
      const matchSearch =
        ag.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ag.phone.includes(searchText) ||
        (ag.email &&
          ag.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (ag.address &&
          ag.address.toLowerCase().includes(searchText.toLowerCase()));
      return matchSearch;
    });
  }, [agencies, searchText]);

  const filteredLogs = useMemo(() => {
    return passportLogs.filter((log) => {
      const matchesAgency = selectedAgencyFilter
        ? log.agencyId === selectedAgencyFilter
        : true;
      const matchesSearch =
        log.agencyName.toLowerCase().includes(searchText.toLowerCase()) ||
        log.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (log.remarks &&
          log.remarks.toLowerCase().includes(searchText.toLowerCase()));
      return matchesAgency && matchesSearch;
    });
  }, [passportLogs, selectedAgencyFilter, searchText]);

  // Passengers matching specific agency/agentName from passenger list
  const getLinkedPassengers = (agencyNameStr: string) => {
    return passengers.filter(
      (p) =>
        (p.agentName &&
          p.agentName.toLowerCase() === agencyNameStr.toLowerCase()) ||
        (p.reference &&
          p.reference.toLowerCase() === agencyNameStr.toLowerCase()),
    );
  };

  // View individual agency dashboard details
  const openAgencyDetails = (agency: Agency) => {
    setSelectedAgencyDetails(agency);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"></div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 tracking-tight">
              এজেন্ট ও এজেন্সি পার্টনার্স (Agent Ledger)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ডেলিভারি এবং পার্টনার এজেন্সি অনুযায়ী পাসপোর্টের আদান-প্রদান
              হিসাবের খাতা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-add-partner-agency"
            onClick={openAddAgency}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={14} strokeWidth={3} />
            <span>নতুন এজেন্সি যোগ করুন</span>
          </button>
          <button
            id="btn-add-passport-log"
            onClick={() => openAddLog()}
            disabled={agencies.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen size={14} />
            <span>পাসপোর্ট ট্রানজেকশন (Record Passports)</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-250/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
              মোট পার্টনার এজেন্সি
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {statsSummary.totalAgencies}
            </span>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={20} />
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-250/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
              পাসপোর্ট রিসিভড (গৃহীত)
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600">
              +{statsSummary.totalReceived}
            </span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownLeft size={20} />
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-250/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
              পাসপোর্ট ডেলিভারড
            </span>
            <span className="text-xl font-bold font-mono text-rose-600">
              -{statsSummary.totalDelivered}
            </span>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpRight size={20} />
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-250/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
              নেট অবশিষ্টাংশ
            </span>
            <span
              className={`text-xl font-bold font-mono ${statsSummary.netHeld >= 0 ? "text-blue-600" : "text-amber-600"}`}
            >
              {statsSummary.netHeld} টি
            </span>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </span>
        </div>
      </div>

      {/* Tabs and Searching Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200/85 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Sub tabs switch */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab("agencies");
                setSearchText("");
              }}
              className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "agencies"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-100/30"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={14} />
              এজেন্সি পার্টনার্স তালিকা ({agencies.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("logs");
                setSearchText("");
              }}
              className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "logs"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-100/30"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen size={14} />
              পাসপোর্ট ট্রানজেকশন ট্র্যাকার ({passportLogs.length})
            </button>
          </div>

          {/* Filtering and Searches */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {activeTab === "logs" && (
              <select
                value={selectedAgencyFilter}
                onChange={(e) => setSelectedAgencyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer text-slate-700"
              >
                <option value="">সমস্ত এজেন্সি ফিল্টার</option>
                {agencies.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder={
                  activeTab === "agencies"
                    ? "এজেন্সি খুঁজুন (নাম, ফোন)..."
                    : "পাসপোর্ট নাম্বার বা লগ খুঁজুন..."
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:bg-white text-slate-800 font-medium sm:w-64 w-full"
              />
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={14}
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Agencies list */}
        {activeTab === "agencies" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {filteredAgencies.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-50/20">
                <Building2 className="mx-auto text-slate-200" size={48} />
                <p className="text-sm font-semibold">
                  কোনো এজেন্সি পাওয়া যায়নি।
                </p>
                <p className="text-xs text-slate-400">
                  নতুন এজেন্সি যোগ করতে উপরের বোতামটি ব্যবহার করুন।
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      এজেন্সি তথ্য (Agency Profile)
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      রিসিভড পাসপোর্ট
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      ডেলিভারড পাসপোর্ট
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      নেট ব্যালেন্স (হাতে থাকা)
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      যাত্রী ফাইল লিঙ্ক
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAgencies.map((agency) => {
                    const metrics = agencyMetrics[agency.id || ""] || {
                      received: 0,
                      delivered: 0,
                      net: 0,
                    };
                    const linkedPassCount = getLinkedPassengers(
                      agency.name,
                    ).length;

                    return (
                      <tr
                        key={agency.id}
                        onClick={() => openAgencyDetails(agency)}
                        className="hover:bg-slate-50/50 transition-all duration-150 cursor-pointer text-slate-700"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 border border-amber-100/50 rounded-xl flex items-center justify-center text-amber-600 font-bold shrink-0">
                              {agency.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-snug">
                                {agency.name}
                              </p>
                              <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5 font-medium">
                                <span className="flex items-center gap-1">
                                  <Phone size={10} />
                                  {agency.phone}
                                </span>
                                {agency.address && (
                                  <span className="flex items-center gap-1 max-w-[200px] truncate">
                                    <MapPin size={10} />
                                    {agency.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-emerald-600 text-[13px]">
                          {metrics.received}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-rose-600 text-[13px]">
                          {metrics.delivered}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                              metrics.net > 0
                                ? "bg-blue-50 text-blue-700 border border-blue-100/30"
                                : metrics.net < 0
                                  ? "bg-amber-50 text-amber-700 border border-amber-100/30"
                                  : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            {metrics.net} টি
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              linkedPassCount > 0
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100/30"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {linkedPassCount} জন যাত্রী
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddLog(agency.id);
                              }}
                              title="পাসপোর্ট রিসিভ বা সেন্ড ট্রানজেকশন লিখুন"
                              className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-lg text-slate-500 transition-all cursor-pointer"
                            >
                              <BookOpen size={13} />
                            </button>
                            <button
                              onClick={(e) => openEditAgency(agency, e)}
                              title="এডিট করুন"
                              className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-lg text-slate-500 transition-all cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            {profile?.role === "Admin" && (
                              <button
                                onClick={(e) =>
                                  handleAgencyDelete(agency.id!, agency.name, e)
                                }
                                title="মুছে ফেলুন"
                                className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-slate-400 transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Passport log history */}
        {activeTab === "logs" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-50/20">
                <BookOpen className="mx-auto text-slate-200" size={48} />
                <p className="text-sm font-semibold">
                  কোনো ট্রানজেকশন লগ পাওয়া যায়নি।
                </p>
                <p className="text-xs text-slate-400">
                  পাসপোর্ট আদান-প্রদান করতে উপরের বোতামটি ব্যবহার করুন।
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      তারিখ
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      এজেন্সি পার্টনার
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      লেনদেনের প্রকার
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      পাসপোর্ট সংখ্যা
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      পাসপোর্ট বিবরণী/যাত্রীদের নাম
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      মন্তব্য
                    </th>
                    {profile?.role === "Admin" && (
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                        অ্যাকশন
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-55/40 transition-all font-sans text-slate-700 text-xs"
                    >
                      <td className="p-4 font-mono font-bold whitespace-nowrap text-slate-600">
                        {log.date}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {log.agencyName}
                      </td>
                      <td className="p-4 text-center">
                        {log.direction === "ReceivedFromAgency" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100/30">
                            <ArrowDownLeft size={10} />
                            গৃহীত (Received)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-100/30">
                            <ArrowUpRight size={10} />
                            প্রেরিত (Delivered)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono font-extrabold text-sm text-slate-900">
                        {log.passportCount} টি
                      </td>
                      <td className="p-4 font-semibold whitespace-pre-line text-slate-800 max-w-[280px]">
                        {log.description}
                      </td>
                      <td className="p-4 text-slate-500 italic max-w-[200px] truncate">
                        {log.remarks || "---"}
                      </td>
                      {profile?.role === "Admin" && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleLogDelete(log.id!)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                            title="লগ ডিলিট করুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT AGENCY PROFILE */}
      <AnimatePresence>
        {isAgencyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAgencyModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] p-7 max-w-md w-full shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Building2 size={16} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingAgency
                      ? "এজেন্সি প্রোফাইল আপডেট (Update)"
                      : "নতুন এজেন্সি প্রোফাইল যোগ (New Agency)"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAgencySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    এজেন্সির নাম (Agency Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: NexTrip Partners, Rahim Agent ইত্যাদি"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all focus:bg-white text-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    মোবাইল ফোন নাম্বার (Phone)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: +8801700000000"
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all focus:bg-white text-slate-800 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    ইমেইল ঠিকানা (Email - ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    placeholder="যেমন: info@agencyname.com"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all focus:bg-white text-slate-850"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    ঠিকানা (Location - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: দিলকুশা, মতিঝিল, ঢাকা"
                    value={agencyAddress}
                    onChange={(e) => setAgencyAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all focus:bg-white text-slate-850"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    অতিরিক্ত রেডি বা মন্তব্য (Remarks)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="পার্টনার সম্পর্ক বা ট্রানজেকশন কন্ডিশন..."
                    value={agencyRemarks}
                    onChange={(e) => setAgencyRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all focus:bg-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAgencyModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
                  >
                    বাতিল (Close)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
                  >
                    {editingAgency
                      ? "হালনাগাদ (Update)"
                      : "সম্পূর্ণ করুন (Add Agency)"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: NEW PASSPORT TRANSACTION LOGENTRY */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] p-7 max-w-md w-full shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <BookOpen size={16} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    নতুন পাসপোর্ট ট্রানজেকশন (Passport Exchange Record)
                  </h3>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    পার্টনার এজেন্সি নির্বাচন করুন
                  </label>
                  <select
                    value={logAgencyId}
                    onChange={(e) => setLogAgencyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:bg-white text-slate-800 font-bold cursor-pointer"
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {agencies.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    লেনদেনের ধরণ (Handoff Flow)
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLogDirection("ReceivedFromAgency")}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        logDirection === "ReceivedFromAgency"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <ArrowDownLeft size={12} />
                      রিসিভড (কোল্ড ইন)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogDirection("DeliveredToAgency")}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        logDirection === "DeliveredToAgency"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <ArrowUpRight size={12} />
                      ডেলিভারড (টপ আউট)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      পাসপোর্ট পরিমাপ / সংখ্যা
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="পাসপোর্টের সংখ্যা"
                      value={logCount}
                      onChange={(e) => setLogCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      লেনদেন তারিখ (Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    পাসপোর্ট বিবরণী ও যাত্রীদের নাম (Passport Lists & Names)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="যেমন:-&#10;1. Rahim Uddin (EE098322)&#10;2. Selim Khan (EE018243) ইত্যাদি"
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none transition-all text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    অতিরিক্ত বিষয়াবলি বা নোট (Remarks)
                  </label>
                  <input
                    type="text"
                    placeholder="হাতে-হাতে ফাইল ডেলিভারি বা ইত্যাদি"
                    value={logRemarks}
                    onChange={(e) => setLogRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md"
                  >
                    লগ সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: AGENCY DETAIL DASHBOARD (CROSS REFERENCE FILE INTEGRATION) */}
      <AnimatePresence>
        {isDetailModalOpen && selectedAgencyDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-7 md:p-8 max-w-2xl w-full shadow-2xl relative z-10 space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm">
                    {selectedAgencyDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {selectedAgencyDetails.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Phone size={10} /> {selectedAgencyDetails.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Core metrics for selected agency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/40 text-center space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block font-sans">
                    রিসিভড পাসপোর্ট
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600">
                    {agencyMetrics[selectedAgencyDetails.id || ""]?.received ||
                      0}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/40 text-center space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block font-sans">
                    ডেলিভারড পাসপোর্ট
                  </span>
                  <span className="text-lg font-black font-mono text-rose-500">
                    {agencyMetrics[selectedAgencyDetails.id || ""]?.delivered ||
                      0}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/40 text-center space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block font-sans">
                    নেট হাতে থাকা
                  </span>
                  <span className="text-lg font-black font-mono text-blue-600">
                    {agencyMetrics[selectedAgencyDetails.id || ""]?.net || 0}
                  </span>
                </div>
              </div>

              {/* Grid detail card block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-650">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-400 text-[10px] uppercase font-sans tracking-wide">
                    ইমেইল ঠিকানা
                  </p>
                  <p className="font-bold text-slate-800">
                    {selectedAgencyDetails.email || "নাই (Not Added)"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-400 text-[10px] uppercase font-sans tracking-wide">
                    এজেন্সি ঠিকানা
                  </p>
                  <p className="font-bold text-slate-800">
                    {selectedAgencyDetails.address || "নাই"}
                  </p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="font-extrabold text-slate-400 text-[10px] uppercase font-sans tracking-wide">
                    মতামত ও মন্তব্য
                  </p>
                  <p className="font-medium text-slate-700 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100/30 whitespace-pre-wrap">
                    {selectedAgencyDetails.remarks || "কোনো মন্তব্য লেখা হয়নি।"}
                  </p>
                </div>
              </div>

              {/* Segment: Passports in the main Passenger Database where AgentName matches this Agency */}
              <div className="space-y-3.5 pt-3 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={14} className="text-violet-600" />
                    যাত্রী ফাইল ডাটাবেস লিঙ্ক (
                    {getLinkedPassengers(selectedAgencyDetails.name).length} জন
                    যাত্রী)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">
                    যাত্রী ডাটাবেস এ যে সমস্ত ফাইলের এজেন্টের নামের সাথে এই
                    এজেন্সির নাম মেলা আছে
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200/60 rounded-xl pr-1 bg-slate-50/20">
                  {getLinkedPassengers(selectedAgencyDetails.name).length ===
                  0 ? (
                    <p className="py-8 text-center text-slate-400 text-xs italic">
                      যাত্রী ডাটাবেসে এই এজেন্টের বা রেফারেন্সের সাথে যুক্ত কোনো
                      সক্রিয় যাত্রী ফাইল পাওয়া যায়নি।
                    </p>
                  ) : (
                    getLinkedPassengers(selectedAgencyDetails.name).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 text-xs flex justify-between items-center hover:bg-slate-50"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="font-medium font-mono text-[10px] text-slate-500">
                            পাসপোর্ট:{" "}
                            <span className="font-bold text-slate-700">
                              {p.passportNumber || "N/A"}
                            </span>{" "}
                            • স্লিপ: {p.sl}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === "Visa Online"
                                ? "bg-emerald-50 text-emerald-700"
                                : p.status === "Flight Done"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Segment: Passport movement list for this specific Agency */}
              <div className="space-y-3.5 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={14} className="text-amber-600" />
                    এই এজেন্সির পাসপোর্ট আদান প্রদান ইতিহাস
                  </h4>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openAddLog(selectedAgencyDetails.id);
                    }}
                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/50 py-1.5 px-3 rounded-lg font-bold uppercase transition-all"
                  >
                    আদান-প্রদান ট্রানজেকশন লিখুন
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200/60 rounded-xl pr-1">
                  {passportLogs.filter(
                    (log) => log.agencyId === selectedAgencyDetails.id,
                  ).length === 0 ? (
                    <p className="py-8 text-center text-slate-400 text-xs italic">
                      এই এজেন্সির সাথে পাসপোর্ট লেনদেনের কোনো পূর্ববর্তী
                      ট্রানজেকশন লগ করা হয়নি।
                    </p>
                  ) : (
                    passportLogs
                      .filter(
                        (log) => log.agencyId === selectedAgencyDetails.id,
                      )
                      .map((log) => (
                        <div
                          key={log.id}
                          className="p-3 text-xs flex justify-between items-start gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-500 text-[10px]">
                                {log.date}
                              </span>
                              {log.direction === "ReceivedFromAgency" ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                                  গৃহীত
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded">
                                  পাঠানো হয়েছে
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-800 leading-normal whitespace-pre-line">
                              {log.description}
                            </p>
                            {log.remarks && (
                              <p className="text-[10px] text-slate-400 italic font-medium">
                                নোট: {log.remarks}
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-black text-sm text-slate-900 shrink-0">
                            {log.passportCount} টি
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Action operations in footer */}
              <div className="flex gap-2.5 pt-5 border-t border-slate-100 justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
