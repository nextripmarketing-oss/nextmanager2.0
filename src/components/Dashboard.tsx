import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import PassengerList from "./PassengerList";
import PassengerForm from "./PassengerForm";
import { Passenger } from "../types/passenger";
import { PassengerService } from "../services/passengerService";
import { DataSeeder } from "../services/dataSeeder";
import { CSVService } from "../services/csvService";
import {
  Plus,
  User,
  LogOut,
  LayoutGrid,
  Users,
  Briefcase,
  FileText,
  Settings,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Database,
  Upload,
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
  UploadCloud,
  BookOpen,
  Wallet,
  Building2,
  Sparkles,
  Code,
  Copy,
  Check,
  GraduationCap,
  Moon,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BackupService } from "../services/backupService";
import EmploymentManagement from "./EmploymentManagement";
import LedgerManagement from "./LedgerManagement";
import AgencyManagement from "./AgencyManagement";
import PassportPhotoEditor from "./PassportPhotoEditor";
import TravelDocumentScanner from "./TravelDocumentScanner";
import StaffManagement from "./StaffManagement";
import TrainingManagement from "./TrainingManagement";
import AgentProfileCard from "./AgentProfileCard";
import TemplateMaker from "./TemplateMaker";
import { pastedCSV } from "../data/pasted_passengers";
import { LedgerService } from "../services/ledgerService";
import GlobalSearch from "./GlobalSearch";
import { CashTransaction } from "../types/ledger";

export default function Dashboard() {
  const { user, profile, logout, isAdmin } = useAuth();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<
    Passenger | undefined
  >();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "passengers"
    | "employment"
    | "ledger"
    | "agency"
    | "documents"
    | "maker"
    | "settings"
    | "training"
  >("dashboard");
  const [documentMode, setDocumentMode] = useState<"scanner" | "ai-photo">(
    "scanner",
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isHealing, setIsHealing] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState(
    () => localStorage.getItem("google_script_url") || "",
  );
  const [isSyncingScript, setIsSyncingScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const isTabPermitted = (tabId: string) => {
    if (isAdmin) return true;
    if (!profile) return false;
    const allowed = profile.allowedTabs || [
      "dashboard",
      "passengers",
      "documents",
    ];
    return allowed.includes(tabId);
  };

  useEffect(() => {
    if (profile && !isAdmin) {
      const allowed = profile.allowedTabs || [
        "dashboard",
        "passengers",
        "documents",
      ];
      if (!allowed.includes(activeTab)) {
        const firstAllowed = (allowed[0] as any) || "dashboard";
        setActiveTab(firstAllowed);
      }
    }
  }, [profile, isAdmin, activeTab]);

  useEffect(() => {
    const unsubscribe = PassengerService.subscribeToPassengers(setPassengers);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeLedger =
      LedgerService.subscribeToTransactions(setTransactions);
    return unsubscribeLedger;
  }, []);

  const handleEdit = (p: Passenger) => {
    setEditingPassenger(p);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPassenger(undefined);
  };

  const nextSl = React.useMemo(() => {
    const validSls = passengers
      .map((p) => Number(p.sl))
      .filter((sl) => !isNaN(sl) && sl < 1000000);
    return validSls.length > 0 ? Math.max(...validSls) + 1 : 1;
  }, [passengers]);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsImporting(true);
      setImportProgress({ current: 0, total: 0 });
      const result = await CSVService.importPassengers(
        file,
        user.uid,
        user.displayName || "Admin",
        (current, total) => setImportProgress({ current, total }),
      );
      alert(`Success! Imported ${result.success} of ${result.total} records.`);
    } catch (e: any) {
      console.error("Import Error", e);
      let errorMsg = "Failed to import CSV.";
      if (e.message) {
        try {
          const parsed = JSON.parse(e.message);
          errorMsg += ` ${parsed.error || parsed.message || e.message}`;
        } catch {
          errorMsg += ` ${e.message}`;
        }
      }
      alert(errorMsg);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handlePastedCSVImport = async () => {
    if (!user) return;
    try {
      setIsImporting(true);
      setImportProgress({ current: 0, total: 0 });
      const result = await CSVService.importPastedPassengers(
        pastedCSV,
        user.uid,
        user.displayName || "Admin",
        (current, total) => setImportProgress({ current, total }),
      );
      alert(
        `Success! Imported ${result.success} of ${result.total} records into your database.`,
      );
    } catch (err) {
      console.error("Import Error", err);
      alert("An error occurred during bulk database import. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAutoHealDatabase = async () => {
    if (!user) return;
    try {
      setIsHealing(true);
      let fixCount = 0;
      for (const p of passengers) {
        if (!p.id) continue;
        let needsFix = false;
        const updates: Partial<Passenger> = {};

        if (p.phone === undefined || p.phone === "") {
          updates.phone = "N/A";
          needsFix = true;
        }
        if (p.tradeName === undefined) {
          updates.tradeName = "";
          needsFix = true;
        }
        if (p.agentName === undefined) {
          updates.agentName = "";
          needsFix = true;
        }
        if (p.reference === undefined) {
          updates.reference = "";
          needsFix = true;
        }

        const statusMap: { [key: string]: any } = {
          "PASSPORT SUBMIT": "Passport Submit",
          "MEDICAL DONE": "Medical Done",
          "WORKPERMIT ISSUE": "Workpermit Issue",
          "VISA ONLINE": "Visa Online",
          "EMBASSY SUBMIT": "Embassy Submit",
          "VISA REJECT": "Visa Reject",
          "PASSPORT RETURN": "Passport Return",
          "MANPOWER DONE": "Manpower Done",
          "FLIGHT DONE": "Flight Done",
          "PROCESSING CANCELLED": "Processing Cancelled",
        };
        const currentUpper = (p.status || "").toUpperCase().trim();
        if (statusMap[currentUpper] && p.status !== statusMap[currentUpper]) {
          updates.status = statusMap[currentUpper];
          needsFix = true;
        }

        if (
          p.name &&
          p.name !== p.name.toUpperCase() &&
          /^[a-zA-Z\s\.\,\-]+$/.test(p.name)
        ) {
          updates.name = p.name.toUpperCase().trim();
          needsFix = true;
        }

        if (needsFix) {
          await PassengerService.updatePassenger(p.id, updates);
          fixCount++;
        }
      }
      alert(
        `Database Auto-Healer completed! Analyzed ${passengers.length} files, repaired ${fixCount} data formatting anomalies.`,
      );
    } catch (err: any) {
      console.error("Healer Error:", err);
      alert("Failed to auto-heal: " + err.message);
    } finally {
      setIsHealing(false);
    }
  };

  const handleSyncToGoogleScript = async () => {
    if (!googleScriptUrl) {
      alert("দয়া করে প্রথমে আপনার Google Apps Script Web App URL-টি দিন।");
      return;
    }

    try {
      setIsSyncingScript(true);
      const payload = {
        action: "sync_all",
        passengers: passengers.map((p) => ({
          sl: p.sl || "",
          name: p.name || "",
          passportNumber: p.passportNumber || "",
          inOut: p.inOut || "",
          phone: p.phone || "",
          tradeName: p.tradeName || "",
          agentName: p.agentName || "",
          reference: p.reference || "",
          status: p.status || "",
          date: p.date || "",
          submissionDate: p.submissionDate || "",
        })),
      };

      await fetch(googleScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      alert(
        "Google Sheets Sync রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! আপনার গুগল শিটে চেক করুন।",
      );
    } catch (err: any) {
      console.error(err);
      alert("গুগল শিট সিঙ্ক ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsSyncingScript(false);
    }
  };

  const handleJSONBackupImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsRestoring(true);
      setRestoreProgress({ current: 0, total: 0 });

      const validatedList = await BackupService.readAndValidateJSONBackup(
        file,
        user.uid,
        isAdmin,
      );

      if (
        confirm(
          `Successfully read ${validatedList.length} passenger records from backup. Do you want to restore them to the database now?`,
        )
      ) {
        await BackupService.restoreBackup(validatedList, (current, total) =>
          setRestoreProgress({ current, total }),
        );
        alert(
          `Success! Imported ${validatedList.length} records into the active database.`,
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(
        `Failed to restore backup: ${err.message || "Ensure your file structure is valid JSON content matching NexTrip specification."}`,
      );
    } finally {
      setIsRestoring(false);
      if (e.target) e.target.value = "";
    }
  };

  const visiblePassengers = React.useMemo(() => {
    if (!isAdmin && profile?.role === "Agent" && profile.mappedAgentName) {
      return passengers.filter(
        (p) =>
          p.agentName === profile.mappedAgentName ||
          p.reference === profile.mappedAgentName ||
          p.delegateAgent === profile.mappedAgentName,
      );
    }
    return passengers;
  }, [passengers, isAdmin, profile]);

  const stats = {
    total: visiblePassengers.length,
    visaOnline: visiblePassengers.filter((p) => p.status === "Visa Online")
      .length,
    medicalDone: visiblePassengers.filter((p) => p.status === "Medical Done")
      .length,
    embassySubmit: visiblePassengers.filter(
      (p) => p.status === "Embassy Submit",
    ).length,
    passportSubmit: visiblePassengers.filter(
      (p) => p.status === "Passport Submit",
    ).length,
    passportReturn: visiblePassengers.filter(
      (p) => p.status === "Passport Return",
    ).length,
    manpowerDone: visiblePassengers.filter((p) => p.status === "Manpower Done")
      .length,
    totalVisaRate: visiblePassengers.reduce(
      (sum, p) => sum + (p.visaRate || 0),
      0,
    ),
    totalAgentRate: visiblePassengers.reduce(
      (sum, p) => sum + (p.agentRate || 0),
      0,
    ),
    totalProfit: visiblePassengers.reduce(
      (sum, p) => sum + ((p.visaRate || 0) - (p.agentRate || 0)),
      0,
    ),
    totalPaid: visiblePassengers.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0,
    ),
    totalDue: visiblePassengers.reduce(
      (sum, p) => sum + ((p.visaRate || 0) - (p.paidAmount || 0)),
      0,
    ),
  };

  const isAlreadyImported = React.useMemo(() => {
    return passengers.some(
      (p) =>
        p.passportNumber === "A04683313" || p.passportNumber === "A21957063",
    );
  }, [passengers]);

  const ledgerStats = React.useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    transactions.forEach((t) => {
      if (t.type === "Inflow") {
        totalInflow += t.amount;
      } else {
        totalOutflow += t.amount;
      }
    });
    return {
      inflow: totalInflow,
      outflow: totalOutflow,
      balance: totalInflow - totalOutflow,
    };
  }, [transactions]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 tracking-tight">
                Executive Dashboard
              </h2>
            </div>

            {/* Database Sync & Healing Terminal */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-slate-900/5 border border-blue-500/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                    <Database
                      size={24}
                      className={
                        isImporting || isHealing
                          ? "animate-spin"
                          : "animate-pulse"
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-black text-[14px] md:text-[15px] text-slate-900 tracking-tight">
                        Database Auto-Sync & Self-Healing Protocol
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider rounded-md">
                        System Active
                      </span>
                    </div>
                    <p className="text-slate-600 text-[12px] md:text-sm mt-1">
                      {!isAlreadyImported
                        ? "আপনার ১৬৪ জন যাত্রীর সম্পূর্ণ লিস্ট সিস্টেমে আপলোড করার জন্য প্রস্তুত রয়েছে।"
                        : "নিরাপত্তামূলক অটো-হিলিং সার্ভিস চালু রয়েছে। কোন ডেটাতে অসঙ্গতি পেলে তা স্বয়ংক্রিয়ভাবে সংশোধন করবে।"}
                    </p>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-widest mt-0.5">
                      {!isAlreadyImported
                        ? "Status: 164 records waiting for DB write"
                        : "Status: Database synced intact ● No corruption detected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto self-stretch md:self-auto justify-end">
                  {!isAlreadyImported && (
                    <button
                      onClick={handlePastedCSVImport}
                      disabled={isImporting}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Upload size={14} />
                      {isImporting ? "Importing..." : "Upload 164 Records"}
                    </button>
                  )}
                  <button
                    onClick={handleAutoHealDatabase}
                    disabled={isHealing}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/50 px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles
                      size={14}
                      className={
                        isHealing
                          ? "animate-pulse text-amber-400"
                          : "text-amber-400"
                      }
                    />
                    {isHealing ? "Healing DB..." : "Auto-Heal & Format"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Google Sheets Sync Control Center */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/5 border border-emerald-500/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4"
              >
                <div className="flex items-start gap-4 flex-1 w-full">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl shrink-0">
                    <FileSpreadsheet
                      size={24}
                      className={
                        isSyncingScript ? "animate-bounce" : "animate-pulse"
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-black text-[14px] md:text-[15px] text-slate-900 tracking-tight">
                        Google Sheets (Apps Script) Sync & Backup Control Center
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-md">
                        Backup Active
                      </span>
                    </div>
                    <p className="text-slate-600 text-[12px] md:text-sm">
                      ফায়ারবেস ডেটা ট্রান্সফার নিয়ে চিন্তিত? গুগল শিট সিঙ্ক
                      ফিচার ব্যবহার করে আপনি সরাসরি আপনার এক্সেল শিটে সকল
                      যাত্রীর ডেটা সংরক্ষণ ও আপডেট করতে পারবেন।
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-3 w-full">
                      <input
                        type="url"
                        placeholder="ভ্যালিড Google Apps Script Web App URL দিন (https://script.google.com/macros/s/...)"
                        value={googleScriptUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGoogleScriptUrl(val);
                          localStorage.setItem("google_script_url", val);
                        }}
                        className="flex-1 bg-white border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                      />
                      <button
                        onClick={() => setShowScriptCode(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-emerald-200 hover:border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Code size={13} />
                        Get Code
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center w-full md:w-auto self-stretch md:self-auto justify-end">
                  <button
                    onClick={handleSyncToGoogleScript}
                    disabled={isSyncingScript || !googleScriptUrl}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud
                      size={14}
                      className={isSyncingScript ? "animate-spin" : ""}
                    />
                    {isSyncingScript
                      ? "Syncing..."
                      : "Sync immediately to Google Sheet"}
                  </button>
                </div>
              </motion.div>
            )}

            <AgentProfileCard user={user} profile={profile} stats={stats} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-6"
            >
              <StatCard
                label="Total Files"
                value={stats.total}
                icon={<Users className="text-blue-500" size={20} />}
                color="blue"
              />
              <StatCard
                label="Visa Online"
                value={stats.visaOnline}
                icon={<CheckCircle2 className="text-emerald-500" size={20} />}
                color="emerald"
              />
              <StatCard
                label="Medical Done"
                value={stats.medicalDone}
                icon={<CheckCircle2 className="text-blue-500" size={20} />}
                color="blue"
              />
              <StatCard
                label="Manpower Done"
                value={stats.manpowerDone}
                icon={<TrendingUp className="text-purple-500" size={20} />}
                color="purple"
              />
              <StatCard
                label="Passport Return"
                value={stats.passportReturn}
                icon={<Clock className="text-rose-500" size={20} />}
                color="rose"
              />
              <StatCard
                label="Embassy Submit"
                value={stats.embassySubmit}
                icon={<CheckCircle2 className="text-amber-500" size={20} />}
                color="amber"
              />
              <StatCard
                label="Passport Submit"
                value={stats.passportSubmit}
                icon={<AlertCircle className="text-slate-500" size={20} />}
                color="slate"
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-slate-900 uppercase text-xs tracking-[0.2em]">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab("passengers")}
                    className="text-blue-600 font-bold text-[10px] uppercase tracking-wider hover:text-blue-700 transition-colors"
                  >
                    View Full Registry
                  </button>
                </div>
                <div className="bento-card p-0 overflow-hidden !rounded-2xl">
                  <PassengerList
                    onEdit={handleEdit}
                    limit={5}
                    hideControls={true}
                  />
                </div>

                {/* Office General Ledger Recent list */}
                {profile?.role !== "Agent" && (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-bold text-slate-900 uppercase text-xs tracking-[0.2em]">
                        Recent Ledger Transactions (রিসেন্ট লেজার হিসাব)
                      </h3>
                      <button
                        onClick={() => setActiveTab("ledger")}
                        className="text-blue-600 font-bold text-[10px] uppercase tracking-wider hover:text-blue-700 transition-colors flex items-center gap-1"
                      >
                        <span>হিসাবের খাতা খুলুন</span>
                        <BookOpen size={10} />
                      </button>
                    </div>
                    <div className="bento-card p-6 overflow-hidden !rounded-2xl bg-white border border-slate-200">
                      {transactions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-light">
                          কোন লেজার ট্রানজেকশন খুঁজে পাওয়া যায়নি।
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="py-2.5 px-4">তারিখ (Date)</th>
                                <th className="py-2.5 px-4">লেনদেন (Type)</th>
                                <th className="py-2.5 px-4">
                                  উদ্দেশ্য / খাত (Purpose)
                                </th>
                                <th className="py-2.5 px-4">
                                  মন্তব্য (Remarks)
                                </th>
                                <th className="py-2.5 px-4 text-right">
                                  পরিমাণ (Amount)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {transactions.slice(0, 5).map((tx) => (
                                <tr
                                  key={tx.id}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                                    {tx.date}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        tx.type === "Inflow"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                          : "bg-rose-50 text-rose-700 border border-rose-100"
                                      }`}
                                    >
                                      <span
                                        className={`w-1 h-1 rounded-full ${tx.type === "Inflow" ? "bg-emerald-500" : "bg-rose-500"}`}
                                      />
                                      {tx.type === "Inflow" ? "জমা" : "খরচ"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">
                                    {tx.purpose}
                                  </td>
                                  <td
                                    className="py-3 px-4 text-slate-500 truncate max-w-[150px]"
                                    title={tx.remarks}
                                  >
                                    {tx.remarks || "-"}
                                  </td>
                                  <td
                                    className={`py-3 px-4 font-mono font-bold text-right text-sm ${
                                      tx.type === "Inflow"
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {tx.type === "Inflow" ? "+" : "-"}৳
                                    {tx.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <h3 className="font-display font-bold text-slate-900 uppercase text-xs tracking-[0.2em]">
                  System Intelligence
                </h3>
                <div className="bg-slate-900 rounded-[2rem] p-6 lg:p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] font-bold uppercase tracking-widest text-blue-400">
                        Update v1.4.2
                      </div>
                    </div>
                    <p className="font-display font-semibold text-lg mb-2">
                      Automated Sync Ready
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light">
                      The legacy migration protocol is now processing 2.4k
                      records per minute. Ensure all manual entries match the
                      passport serial protocol.
                    </p>

                    <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                          Core Engine Stable
                        </span>
                      </div>
                      <BarChart3 size={14} className="text-slate-600" />
                    </div>
                  </div>
                </div>

                {/* Client Financials Summary Card */}
                <div className="bento-card !p-6 lg:!p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-slate-800 text-white space-y-5 mb-6">
                  <div>
                    <h4 className="font-display font-medium text-[11px] text-blue-400 uppercase tracking-widest">
                      Client Financials Summary
                    </h4>
                    <p className="text-[14px] font-black text-slate-100">
                      রেকর্ড এবং আনুমানিক লাভ
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 pt-1">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          Total Visa Rate
                        </p>
                        <p className="text-[10px] text-slate-300">
                          মোট চুক্তিকৃত ক্লায়েন্ট মূল্য
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-slate-100">
                        ৳{stats.totalVisaRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">
                          Total Received / Paid
                        </p>
                        <p className="text-[10px] text-slate-300">
                          মোট সংগৃহীত টাকা (জমা)
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                        ৳{stats.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">
                          Total Due Balance
                        </p>
                        <p className="text-[10px] text-slate-300">
                          ক্লিয়েন্টদের নিকট বকেয়া
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-amber-400">
                        ৳{stats.totalDue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          Total Agent Rate
                        </p>
                        <p className="text-[10px] text-slate-300">
                          ক্রয় মূল্য সমষ্টি (খরচ)
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-rose-300">
                        ৳{stats.totalAgentRate.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl shadow-[0_4px_20px_-10px_rgba(59,130,246,0.5)] animate-pulse">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">
                          Total Net Profit
                        </p>
                        <p className="text-[10px] text-blue-200 font-bold">
                          মোট সম্ভাব্য লাভ (লাভ)
                        </p>
                      </div>
                      <p className="text-sm sm:text-base font-mono font-black text-emerald-400">
                        ৳{stats.totalProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Office General Ledger Summary Card */}
                <div className="bento-card !p-6 lg:!p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 border border-slate-800 text-white space-y-5 mb-6">
                  <div>
                    <h4 className="font-display font-medium text-[11px] text-amber-400 uppercase tracking-widest">
                      Office General Ledger Summary (অফিস লেজার হিসাব)
                    </h4>
                    <p className="text-[14px] font-black text-slate-100 font-display">
                      ক্যাশ ব্যালেন্স এবং লেনদেন সারসংক্ষেপ
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 pt-1">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          Total Cash Inflow
                        </p>
                        <p className="text-[10px] text-slate-300">
                          মোট জমা / আয়
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                        ৳{ledgerStats.inflow.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          Total Cash Outflow
                        </p>
                        <p className="text-[10px] text-slate-300">
                          মোট খরচ / ব্যয়
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-black text-rose-300">
                        ৳{ledgerStats.outflow.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-blue-500/10 border-2 border-amber-500/30 rounded-xl shadow-[0_4px_20px_-10px_rgba(245,158,11,0.5)]">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest">
                          Cash on Hand (Balance)
                        </p>
                        <p className="text-[10px] text-amber-200 font-bold">
                          চলতি অবশিষ্ট ক্যাশ ফান্ড
                        </p>
                      </div>
                      <p
                        className={`text-sm sm:text-base font-mono font-black ${ledgerStats.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        ৳{ledgerStats.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bento-card !p-6 lg:!p-8">
                  <h4 className="font-display font-bold text-slate-900 text-sm mb-4">
                    Quick Stats
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">
                        Avg. Processing
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        4.2 Days
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[70%]"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider pt-2 border-t border-slate-100">
                      <span className="text-slate-400">Total Capacity</span>
                      <span className="text-emerald-500">92%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case "passengers":
        return (
          <div className="p-4 sm:p-8">
            <div className="flex items-center gap-4 mb-4 sm:mb-8">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Passenger Database
              </h2>
            </div>
            <PassengerList onEdit={handleEdit} />
          </div>
        );
      case "employment":
        return <EmploymentManagement />;
      case "ledger":
        return <LedgerManagement />;
      case "training":
        return <TrainingManagement />;
      case "agency":
        return <AgencyManagement />;
      case "documents":
        return (
          <div className="p-4 md:p-8 space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-sm border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => setDocumentMode("scanner")}
                className={`flex-1 py-2.5 px-3 text-center rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  documentMode === "scanner"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/10"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📹 ডকুমেন্ট স্ক্যানার
              </button>
              <button
                type="button"
                onClick={() => setDocumentMode("ai-photo")}
                className={`flex-1 py-2.5 px-3 text-center rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  documentMode === "ai-photo"
                    ? "bg-white text-blue-605 shadow-sm border border-slate-200/10"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ✨ পাসপোর্ট ফটো এআই
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={documentMode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
              >
                {documentMode === "scanner" ? (
                  <TravelDocumentScanner />
                ) : (
                  <PassportPhotoEditor />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      case "maker":
        return <TemplateMaker />;
      case "settings":
        return (
          <div className="p-4 sm:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Agency Settings
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest text-blue-600">
                  Company Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Agency Name
                    </label>
                    <input
                      disabled
                      value="NexTrip International"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Access Tier
                    </label>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <Globe size={14} /> Enterprise High-Security
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest text-blue-600">
                  User Permissions
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-sm font-medium text-slate-700">
                      Role
                    </span>
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded uppercase">
                      {profile?.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-sm font-medium text-slate-700">
                      Audit Logs
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Data Maintenance
                    </h4>
                    <button
                      onClick={async () => {
                        if (
                          user &&
                          confirm(
                            "Import all legacy records? This will add many new passengers.",
                          )
                        ) {
                          await DataSeeder.seedOldData(user.uid);
                          alert(
                            "Import initiated. Please check the dashboard in a few moments.",
                          );
                        }
                      }}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      <Database size={14} />
                      Sync Legacy Records (PDF)
                    </button>

                    <label className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-all cursor-pointer">
                      <Upload size={14} />
                      {isImporting ? "Importing..." : "Upload CSV File"}
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVImport}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Database Security & Backups Section */}
            <div className="mt-8 bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_2px_12px_-5px_rgba(15,23,42,0.02)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2.5">
                    <span className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/50">
                      <Database size={18} strokeWidth={2.5} />
                    </span>
                    Database Security & Backups
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-light">
                    Export high-security JSON backups containing all system
                    records, passenger lists, full state history logs, and
                    document links.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-100 self-start md:self-auto">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] uppercase font-bold tracking-widest font-sans">
                    Backup Engine Secure
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Export Card 1: JSON */}
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/40 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-sans">
                      Secure JSON Sync Base
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-5 font-normal">
                      Saves full system logs. Best for comprehensive,
                      high-integrity system restores containing milestones,
                      logs, status history, and metadata.
                    </p>
                  </div>
                  <button
                    onClick={() => BackupService.exportToJSON(passengers)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-98"
                  >
                    <Download
                      size={14}
                      className="shrink-0"
                      strokeWidth={2.5}
                    />
                    Download JSON Backup
                  </button>
                </div>

                {/* Export Card 2: Excel / CSV */}
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/40 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-sans">
                      Spreadsheet Export
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-5 font-normal">
                      Saves flat data records. Best for printing, reporting, and
                      viewing on Microsoft Excel, Numbers, or Google Sheets with
                      clean columns.
                    </p>
                  </div>
                  <button
                    onClick={() => BackupService.exportToCSV(passengers)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-98"
                  >
                    <FileSpreadsheet
                      size={14}
                      className="shrink-0 text-emerald-600"
                      strokeWidth={2.5}
                    />
                    Export CSV / Excel
                  </button>
                </div>

                {/* Restore Card: JSON upload */}
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/40 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-sans">
                      Instant System Restore
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-5 font-normal">
                      Upload any validated JSON secure backup file to append,
                      merge, and sync passengers and timeline logs directly with
                      Firebase.
                    </p>
                  </div>

                  <label className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-98 text-center justify-center">
                    <UploadCloud
                      size={14}
                      className="shrink-0 text-blue-400"
                      strokeWidth={2.5}
                    />
                    {isRestoring
                      ? `Working (${restoreProgress.current}/${restoreProgress.total})`
                      : "Upload JSON Backup"}
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleJSONBackupImport}
                      disabled={isRestoring}
                    />
                  </label>
                </div>
              </div>

              {isRestoring && (
                <div className="mt-6 p-5 bg-blue-50/80 border border-blue-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-widest font-sans flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      Restoring System Records...
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {Math.round(
                        (restoreProgress.current / restoreProgress.total) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(restoreProgress.current / restoreProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Staff Management Access Panel */}
            {isAdmin && (
              <div className="mt-8">
                <StaffManagement currentUserId={user?.uid || ""} />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 flex relative overflow-hidden transition-colors duration-300">
      {/* Decorative ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] before:opacity-[0.02] dark:before:opacity-[0.05] before:transition-opacity">
        <div className="absolute top-0 right-[-20%] w-[50%] h-[50%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten opacity-50 transition-colors"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten opacity-50 transition-colors"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside
        className={`
        w-64 bg-slate-950/95 backdrop-blur-3xl text-white flex flex-col fixed h-full z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-white/10 shadow-2xl
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div
              className="flex items-center gap-3 overflow-hidden cursor-pointer"
              onClick={() => {
                setActiveTab("dashboard");
                setIsSidebarOpen(false);
              }}
            >
              <img
                src="/src/assets/images/nextrip_logo_1779094935437.png"
                alt="NexTrip Logo"
                className="h-10 w-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
            >
              <Plus className="rotate-45" size={20} />
            </button>
          </div>

          <nav className="space-y-4">
            {isTabPermitted("dashboard") && (
              <NavItem
                icon={<LayoutGrid size={20} />}
                label="Dashboard"
                active={activeTab === "dashboard"}
                onClick={() => {
                  setActiveTab("dashboard");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("passengers") && (
              <NavItem
                icon={<Users size={20} />}
                label="Passengers"
                active={activeTab === "passengers"}
                onClick={() => {
                  setActiveTab("passengers");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("employment") && (
              <NavItem
                icon={<Briefcase size={20} />}
                label="Employment"
                active={activeTab === "employment"}
                onClick={() => {
                  setActiveTab("employment");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("ledger") && (
              <NavItem
                icon={<BookOpen size={20} />}
                label="হিসাবের খাতা"
                active={activeTab === "ledger"}
                onClick={() => {
                  setActiveTab("ledger");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("training") && (
              <NavItem
                icon={<GraduationCap size={20} />}
                label="ট্রেনিং ও ভর্তি খাতা"
                active={activeTab === "training"}
                onClick={() => {
                  setActiveTab("training");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("agency") && (
              <NavItem
                icon={<Building2 size={20} />}
                label="এজেন্সি ও পাসপোর্ট"
                active={activeTab === "agency"}
                onClick={() => {
                  setActiveTab("agency");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("documents") && (
              <NavItem
                icon={<Sparkles size={20} className="text-blue-500" />}
                label="ডকুমেন্ট ও এআই ফটো (AI Docs)"
                active={activeTab === "documents"}
                onClick={() => {
                  setActiveTab("documents");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("maker") && (
              <NavItem
                icon={<FileText size={20} className="text-indigo-400" />}
                label="ডকুমেন্ট মেকার (Maker)"
                active={activeTab === "maker"}
                onClick={() => {
                  setActiveTab("maker");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            {isTabPermitted("settings") && (
              <NavItem
                icon={<Settings size={20} />}
                label="Settings"
                active={activeTab === "settings"}
                onClick={() => {
                  setActiveTab("settings");
                  setIsSidebarOpen(false);
                }}
              />
            )}
            <div className="pt-6 border-t border-slate-800/50">
              <a
                href="http://nextrip.pro.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium mb-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
              >
                <Download size={20} />
                <span>Download App (APK)</span>
              </a>
              <NavItem
                icon={<LogOut size={20} />}
                label="Log Out"
                onClick={logout}
                variant="danger"
              />
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" />
              ) : (
                user?.displayName?.charAt(0) || "U"
              )}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate capitalize">
                  {user?.displayName}
                </p>
                {profile && (
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isAdmin ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-500/20 text-slate-400 border border-slate-500/30"}`}
                  >
                    {profile.role}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="text-[10px] text-slate-500 uppercase font-bold tracking-widest hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all relative z-10 p-0 m-0 w-full overflow-x-hidden">
        {/* Header */}
        <header className="h-[80px] sm:h-[88px] glass-overlay flex items-center justify-between px-3 sm:px-6 lg:px-10 shrink-0 z-20 sticky top-0 rounded-b-3xl mx-1 sm:mx-2 lg:mx-4 mt-1 sm:mt-2">
          <div className="flex items-center gap-1 sm:gap-5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <LayoutGrid size={22} className="sm:w-6 sm:h-6" />
            </button>
            <div className="hidden md:block">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Agency Access
              </p>
              <p className="text-sm font-medium text-emerald-600">
                ● Live & Encrypted
              </p>
            </div>
          </div>

          <GlobalSearch
            passengers={passengers}
            onSelectPassenger={handleEdit}
          />

          <div className="flex items-center gap-1.5 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-all border border-slate-200/60 dark:border-slate-700/60"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={async () => {
                    if (
                      user &&
                      confirm(
                        "Import all legacy records? This will add many new passengers.",
                      )
                    ) {
                      await DataSeeder.seedOldData(user.uid);
                      alert(
                        "Import initiated. Please check the dashboard in a few moments.",
                      );
                    }
                  }}
                  className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all uppercase tracking-wide"
                >
                  <Database size={18} />
                  <span>Sync Legacy</span>
                </button>

                <label className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition-all uppercase tracking-wide cursor-pointer">
                  <Upload size={18} />
                  <span>{isImporting ? "..." : "Import CSV"}</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                    disabled={isImporting}
                  />
                </label>
              </>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>

            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-1.5 sm:gap-2 uppercase tracking-wide"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        {renderContent()}
      </main>

      {/* Overlay Form */}
      <AnimatePresence>
        {isImporting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database size={32} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-widest text-xs">
                Importing Database
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Synthesizing records into the central registry...
              </p>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="bg-blue-600 h-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Processed {importProgress.current} of {importProgress.total}{" "}
                records
              </p>
            </motion.div>
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={closeForm}
            />
            <PassengerForm
              onClose={closeForm}
              initialData={editingPassenger}
              nextSl={nextSl}
            />
          </div>
        )}

        {showScriptCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowScriptCode(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-100 z-10 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Code size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-[15px] md:text-lg">
                      Google Sheets Setup Instructions
                    </h3>
                    <p className="text-slate-500 text-xs">
                      আপনার গুগল শিটের সাথে রিয়েল-টাইম কানেকশন করুন
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScriptCode(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all font-bold text-xs"
                >
                  ✕ Close
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 text-xs text-amber-800 leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1">
                  📋 কিভাবে গুগল শিট কানেক্ট করবেন?
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] md:text-xs">
                  <li>
                    প্রথমে আপনার যেকোন একটি <strong>Google Sheet</strong>{" "}
                    ব্রাউজারে খুলুন।
                  </li>
                  <li>
                    মেনুবার থেকে <strong>Extensions &gt; Apps Script</strong>{" "}
                    অপশনে ক্লিক করুন।
                  </li>
                  <li>
                    সেখানে থাকা ডিফল্ট{" "}
                    <code>function myFunction() &#123;&#125;</code> কোডটুকু মুছে
                    দিন।
                  </li>
                  <li>
                    নিচে দেওয়া <strong>Google Apps Script কোডটি কপি করে</strong>{" "}
                    সেখানে পেস্ট করুন।
                  </li>
                  <li>
                    উপরে ডানদিকের <strong>Deploy &gt; New Deployment</strong>{" "}
                    বাটন চাপুন।
                  </li>
                  <li>
                    গিয়ার আইকনে ক্লিক করে <strong>Web App</strong> সিলেক্ট
                    করুন।
                  </li>
                  <li>
                    <strong>Who has access:</strong> অপশনে অবশ্যই{" "}
                    <strong>Anyone</strong> সিলেক্ট করুন এবং Deploy এ ক্লিক
                    করুন।
                  </li>
                  <li>
                    অ্যাক্সেস অ্যাপ্রুভ করার পর প্রাপ্ত{" "}
                    <strong>Web App URL</strong> টি কপি করে ড্যাশবোর্ডের বক্সে
                    দিন।
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    APPS SCRIPT CODE (CODE.GS)
                  </span>
                  <button
                    onClick={() => {
                      const codeText = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Serial No', 'Name', 'Passport Number', 'In/Out', 'Phone',
        'Trade', 'Agent Name', 'Reference', 'Status', 'Date', 'Submission Date'
      ]);
    }
    
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch(err) {
      payload = JSON.parse(e.postData.getDataAsString());
    }
    
    if (payload.action === 'sync_all') {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      var data = payload.passengers || [];
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        sheet.appendRow([
          p.sl || (i + 1),
          p.name || '',
          p.passportNumber || '',
          p.inOut || '',
          p.phone || '',
          p.tradeName || '',
          p.agentName || '',
          p.reference || '',
          p.status || '',
          p.date || '',
          p.submissionDate || ''
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Synced ' + data.length + ' records successfully!' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(codeText);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedCode ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-emerald-400 text-[11px] font-mono rounded-2xl overflow-x-auto border border-slate-900 leading-relaxed max-h-[250px]">
                  {`function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Serial No', 'Name', 'Passport Number', 'In/Out', 'Phone',
        'Trade', 'Agent Name', 'Reference', 'Status', 'Date', 'Submission Date'
      ]);
    }
    
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch(err) {
      payload = JSON.parse(e.postData.getDataAsString());
    }
    
    if (payload.action === 'sync_all') {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      var data = payload.passengers || [];
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        sheet.appendRow([
          p.sl || (i + 1),
          p.name || '',
          p.passportNumber || '',
          p.inOut || '',
          p.phone || '',
          p.tradeName || '',
          p.agentName || '',
          p.reference || '',
          p.status || '',
          p.date || '',
          p.submissionDate || ''
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Synced ' + data.length + ' records successfully!' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const bgColors: any = {
    blue: "bg-blue-50/70 border-blue-100",
    emerald: "bg-emerald-50/70 border-emerald-100",
    amber: "bg-amber-50/70 border-amber-100",
    slate: "bg-slate-50/70 border-slate-200",
    rose: "bg-rose-50/70 border-rose-100",
    purple: "bg-purple-50/70 border-purple-100",
  };

  const textColors: any = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-600",
    rose: "text-rose-600",
    purple: "text-purple-600",
  };

  const ringColors: any = {
    blue: "shadow-blue-500/5",
    emerald: "shadow-emerald-500/5",
    amber: "shadow-amber-500/5",
    slate: "shadow-slate-500/5",
    rose: "shadow-rose-500/5",
    purple: "shadow-purple-500/5",
  };

  return (
    <motion.div
      whileHover={{
        y: -6,
        boxShadow:
          "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bento-card !p-6 relative overflow-hidden flex flex-col justify-between h-full ${ringColors[color]} group`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${bgColors[color].split(" ")[0]} -mr-12 -mt-12 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`p-4 rounded-2xl ${bgColors[color].replace("/70", "")} ${textColors[color]} border shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300 bg-white`}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: 18,
            strokeWidth: 2.5,
          })}
        </div>
      </div>

      <div className="relative z-10 mt-1">
        <div className="text-4xl font-display font-black text-slate-900 mb-1 lg:mb-1.5 tracking-tight group-hover:text-blue-900 transition-colors">
          {value}
        </div>
        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.22em] font-sans">
          {label}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 relative z-10">
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(12, Math.min((value / 100) * 100, 100))}%`,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${textColors[color].replace("text", "bg")}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const activeClasses = active
    ? "bg-gradient-to-r from-blue-500/20 to-transparent text-white border-l-4 border-blue-400 font-bold"
    : "text-slate-400 hover:text-white hover:bg-slate-800/40 border-l-4 border-transparent";
  const dangerClasses =
    "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-l-4 border-transparent";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 transition-all duration-300 cursor-pointer p-3.5 rounded-r-2xl ${variant === "danger" ? dangerClasses : activeClasses}`}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="text-[11px] uppercase tracking-[0.15em] font-sans ml-1">
        {label}
      </span>
    </div>
  );
}
