import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import {
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Filter,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  IndianRupee,
  Check,
  AlertTriangle,
  Printer,
  Calculator,
  PlusCircle,
  MinusCircle,
  Stethoscope,
  Award,
  Users,
  User,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Settings,
  Building2,
  Plane,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LedgerService } from "../services/ledgerService";
import { PDFService } from "../services/pdfService";
import { PrintService } from "../services/printService";
import { PassengerService } from "../services/passengerService";
import { EmploymentService } from "../services/employmentService";
import { CashTransaction } from "../types/ledger";
import { Passenger, BranchId } from "../types/passenger";
import { StaffMember } from "../types/employment";
import { useBranch } from "../contexts/BranchContext";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

const INCOME_CATEGORIES = [
  "Passenger Payment (যাত্রী পেমেন্ট)",
  "Visa Fees Received (ভিসা ফি জমা)",
  "Medical Fees Received (মেডিকেল ফি জমা)",
  "Agency Commission (কমিশন)",
  "Other Income (অন্যান্য আয়/জমা)",
];

const EXPENSE_CATEGORIES = [
  "Staff Salary Output (স্টাফ বেতন)",
  "Advance Disbursal (অগ্রিম প্রদান)",
  "Direct Visa/Embassy Cost (ভিসা ও এম্বাসি খরচ)",
  "Ticket Booking Cost (টিকিট বুকিং)",
  "Office Rent & Electricity (অফিস ভাড়া ও বিদ্যুৎ)",
  "MEDICAL BILL (মেডিকেল বিল)",
  "MEDICAL COMMISSION (মেডিকেল কমিশন)",
  "APPAYAON KHOROC (আপ্যায়ন খরচ)",
  "ZATAYAT KHOROC (যাতায়াত খরচ)",
  "Mobile Recharge (মোবাইল রিচার্জ)",
  "Stationary (স্টেশনারী)",
  "ONNANNO KHOROC (অন্যান্য খরচ)",
];

export default function LedgerManagement() {
  const { user, isAdmin } = useAuth();
  const { currentBranch, filterTransactions, filterPassengers, branchMeta } =
    useBranch();
  const [branchFilter, setBranchFilter] = useState<BranchId | "all">(
    currentBranch,
  );

  useEffect(() => {
    setBranchFilter(currentBranch);
  }, [currentBranch]);

  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Inflow" | "Outflow">(
    "All",
  );
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All"); // "YYYY-MM" or "All"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Customizable category arrays managed dynamically
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("custom_income_categories");
    return saved ? JSON.parse(saved) : INCOME_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("custom_expense_categories");
    return saved ? JSON.parse(saved) : EXPENSE_CATEGORIES;
  });

  const [isCategoryConfigOpen, setIsCategoryConfigOpen] = useState(false);
  const [categorySettingsTab, setCategorySettingsTab] = useState<
    "Inflow" | "Outflow"
  >("Inflow");
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (categorySettingsTab === "Inflow") {
      if (incomeCategories.includes(trimmed)) {
        alert("এই আয়ের খাতটি ইতিমধ্যে তালিকায় বিদ্যমান রয়েছে!");
        return;
      }
      const updated = [...incomeCategories, trimmed];
      setIncomeCategories(updated);
      localStorage.setItem("custom_income_categories", JSON.stringify(updated));
    } else {
      if (expenseCategories.includes(trimmed)) {
        alert("এই ব্যয়ের খাতটি ইতিমধ্যে তালিকায় বিদ্যমান রয়েছে!");
        return;
      }
      const updated = [...expenseCategories, trimmed];
      setExpenseCategories(updated);
      localStorage.setItem(
        "custom_expense_categories",
        JSON.stringify(updated),
      );
    }
    setNewCategoryInput("");
  };

  const handleRemoveCategory = (catName: string) => {
    if (
      !confirm(
        `আপনি কি নিশ্চিত যে "${catName}" খাতটি ড্রপডাউন তালিকা থেকে ডিলিট করতে চান?`,
      )
    ) {
      return;
    }
    if (categorySettingsTab === "Inflow") {
      const updated = incomeCategories.filter((c) => c !== catName);
      setIncomeCategories(updated);
      localStorage.setItem("custom_income_categories", JSON.stringify(updated));
    } else {
      const updated = expenseCategories.filter((c) => c !== catName);
      setExpenseCategories(updated);
      localStorage.setItem(
        "custom_expense_categories",
        JSON.stringify(updated),
      );
    }
  };

  const handleResetCategoriesToDefault = () => {
    if (
      confirm(
        "আপনি কি নিশ্চিত যে কারেন্ট ক্যাটাগরি তালিকা রিসেট করে সিস্টেম ডিফল্ট তালিকা ফিরে পেতে চান?",
      )
    ) {
      if (categorySettingsTab === "Inflow") {
        setIncomeCategories(INCOME_CATEGORIES);
        localStorage.removeItem("custom_income_categories");
      } else {
        setExpenseCategories(EXPENSE_CATEGORIES);
        localStorage.removeItem("custom_expense_categories");
      }
    }
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTxPayload, setPendingTxPayload] = useState<Omit<
    CashTransaction,
    "id" | "createdAt"
  > | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formType, setFormType] = useState<"Inflow" | "Outflow">("Inflow");
  const [formAmount, setFormAmount] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [formDate, setFormDate] = useState(() => {
    // Current date in local BDT timezone (UTC+6)
    const localD = new Date(Date.now() + 6 * 60 * 60 * 1000);
    return localD.toISOString().split("T")[0];
  });
  const [formRemarks, setFormRemarks] = useState("");

  // Tab/View selector
  const [activeView, setActiveView] = useState<
    "ledger" | "person-tracker" | "medical-commission"
  >("ledger");

  // Database fetched states
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Granular Recipient & Accountability fields (যেমন: আহাদ কত নিল, মেডিকেল করাল, বস কত নিল)
  const [formRecipientType, setFormRecipientType] = useState<
    "Boss" | "Staff" | "Passenger" | "Other" | ""
  >("");
  const [formPersonName, setFormPersonName] = useState("");
  const [formStaffId, setFormStaffId] = useState("");
  const [formMedicalCost, setFormMedicalCost] = useState("");
  const [formMedicalCenter, setFormMedicalCenter] = useState("");

  // Filters & detail views
  const [filterPerson, setFilterPerson] = useState("All");
  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [expandedPersonKey, setExpandedPersonKey] = useState<string | null>(
    null,
  );

  // New Medical Commission Form fields
  const [isMedicalVoucher, setIsMedicalVoucher] = useState(false);
  const [medicalReferenceId, setMedicalReferenceId] = useState("");
  const [medicalReferenceName, setMedicalReferenceName] = useState("");
  const [medicalCommission, setMedicalCommission] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [passengerSearchInput, setPassengerSearchInput] = useState("");
  const [isPassengerSearchDropdownOpen, setIsPassengerSearchDropdownOpen] =
    useState(false);

  // Customizable default commission percentages by role (loaded from localStorage with defaults)
  const [managerRate, setManagerRate] = useState<string>(
    () => localStorage.getItem("commission_manager_rate") || "15",
  );
  const [agentRate, setAgentRate] = useState<string>(
    () => localStorage.getItem("commission_agent_rate") || "20",
  );
  const [accountantRate, setAccountantRate] = useState<string>(
    () => localStorage.getItem("commission_accountant_rate") || "10",
  );
  const [brokerRate, setBrokerRate] = useState<string>(
    () => localStorage.getItem("commission_broker_rate") || "15",
  );
  const [otherRate, setOtherRate] = useState<string>(
    () => localStorage.getItem("commission_other_rate") || "10",
  );
  const [isCommissionConfigOpen, setIsCommissionConfigOpen] = useState(false);

  // Commission calculation configuration
  const [commissionCalcMode, setCommissionCalcMode] = useState<
    "auto" | "manual"
  >("auto");
  const [commissionRatePercent, setCommissionRatePercent] =
    useState<string>(brokerRate);

  // Quick Calculator states
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calcType, setCalcType] = useState<"Inflow" | "Outflow">("Inflow");
  const [calcItems, setCalcItems] = useState<
    { label: string; amount: string }[]
  >([{ label: "", amount: "" }]);
  const [calcPurpose, setCalcPurpose] = useState("");
  const [calcCustomPurpose, setCalcCustomPurpose] = useState("");
  const [calcDate, setCalcDate] = useState(() => {
    const localD = new Date(Date.now() + 6 * 60 * 60 * 1000);
    return localD.toISOString().split("T")[0];
  });
  const [calcRemarks, setCalcRemarks] = useState("");

  const handleAddCalcItem = () => {
    setCalcItems([...calcItems, { label: "", amount: "" }]);
  };

  const handleRemoveCalcItem = (index: number) => {
    if (calcItems.length === 1) {
      setCalcItems([{ label: "", amount: "" }]);
    } else {
      setCalcItems(calcItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateCalcItem = (
    index: number,
    field: "label" | "amount",
    value: string,
  ) => {
    const updated = [...calcItems];
    updated[index][field] = value;
    setCalcItems(updated);
  };

  const calcTotalAmount = useMemo(() => {
    return calcItems.reduce((acc, item) => {
      const amt = parseFloat(item.amount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [calcItems]);

  const handleApplyCalcToForm = () => {
    if (calcTotalAmount <= 0) {
      alert("অনুগ্রহ করে অন্তত একটি পণ্যের সঠিক মূল্য প্রদান করুন।");
      return;
    }

    const finalPurpose =
      calcPurpose === "Other" ? calcCustomPurpose.trim() : calcPurpose.trim();
    if (!finalPurpose) {
      alert("হিসাবের উদ্দেশ্য বা খাত নির্বাচন/উল্লেখ করুন।");
      return;
    }

    const compiledItemsList = calcItems
      .filter((item) => item.label.trim() !== "" || item.amount.trim() !== "")
      .map(
        (item) =>
          `• ${item.label.trim() || "অন্যান্য আইটেম"}: ৳${parseFloat(item.amount || "0").toLocaleString()}`,
      )
      .join("\n");

    const combinedRemarks = [
      calcRemarks.trim() ? `মন্তব্য: ${calcRemarks}` : "",
      "--- ক্যালকুলেটর হিসাব বিবরণী ---",
      compiledItemsList,
    ]
      .filter(Boolean)
      .join("\n");

    setFormType(calcType);
    setFormAmount(calcTotalAmount.toString());
    setFormPurpose(calcPurpose);
    setCustomPurpose(calcCustomPurpose);
    setFormRemarks(combinedRemarks);
    setFormDate(calcDate);

    // Close calculator & Open main entry modal
    setIsCalcModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDirectCalcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (calcTotalAmount <= 0) {
      alert(
        "সটীক মোট মূল্য জেনারেট করার জন্য অনুগ্রহ করে আইটেম ও সঠিক মূল্য দিন।",
      );
      return;
    }

    const finalPurpose =
      calcPurpose === "Other" ? calcCustomPurpose.trim() : calcPurpose.trim();
    if (!finalPurpose) {
      alert("হিসাবের উদ্দেশ্য বা খাত নির্বাচন/উল্লেখ করুন।");
      return;
    }

    const compiledItemsList = calcItems
      .filter((item) => item.label.trim() !== "" || item.amount.trim() !== "")
      .map(
        (item) =>
          `• ${item.label.trim() || "নির্ধারিত খাত"}: ৳${parseFloat(item.amount || "0").toLocaleString()}`,
      )
      .join("\n");

    const combinedRemarks = [
      calcRemarks.trim() ? `মন্তব্য: ${calcRemarks}` : "",
      "--- ক্যালকুলেটর হিসাব বিবরণী ---",
      compiledItemsList,
    ]
      .filter(Boolean)
      .join("\n");

    const payload: Omit<CashTransaction, "id" | "createdAt"> = {
      type: calcType,
      amount: calcTotalAmount,
      purpose: finalPurpose,
      branch: (editingTx?.branch) || (branchFilter !== "all" ? branchFilter : currentBranch),
      date: calcDate,
      remarks: combinedRemarks,
      createdByUid: user.uid,
      createdByEmail: user.email || "unknown@nextrip.com",
    };

    setPendingTxPayload(payload);
    setIsCalcModalOpen(false); // Close calculator modal
    setShowConfirmModal(true); // Open confirmation dialog!
  };

  // Subscribe to ledger, staff, and passengers
  useEffect(() => {
    const unsubscribeTxs =
      LedgerService.subscribeToTransactions(setTransactions);
    const unsubscribeStaff = EmploymentService.subscribeToStaff(setStaffList);
    const unsubscribePassengers =
      PassengerService.subscribeToPassengers(setPassengers);

    return () => {
      unsubscribeTxs();
      unsubscribeStaff();
      unsubscribePassengers();
    };
  }, []);

  // Sync edit mode fields
  useEffect(() => {
    if (editingTx) {
      setFormType(editingTx.type);
      setFormAmount(editingTx.amount.toString());
      setFormDate(editingTx.date);
      setFormRemarks(editingTx.remarks || "");

      const allCategories = [...incomeCategories, ...expenseCategories];
      if (allCategories.includes(editingTx.purpose)) {
        setFormPurpose(editingTx.purpose);
        setCustomPurpose("");
      } else {
        setFormPurpose("Other");
        setCustomPurpose(editingTx.purpose);
      }

      setIsMedicalVoucher(editingTx.isMedicalVoucher || false);
      setMedicalReferenceId(editingTx.medicalReferenceId || "");
      setMedicalReferenceName(editingTx.medicalReferenceName || "");
      setMedicalCommission(
        editingTx.medicalCommission
          ? editingTx.medicalCommission.toString()
          : "",
      );
      setPassengerId(editingTx.passengerId || "");
      setPassengerName(editingTx.passengerName || "");
      setPassengerSearchInput(editingTx.passengerName || "");
      setIsPassengerSearchDropdownOpen(false);

      // Recipient / Person & Medical cost fields
      setFormRecipientType(editingTx.recipientType || "");
      setFormPersonName(editingTx.personName || "");
      setFormStaffId(editingTx.staffId || "");
      setFormMedicalCost(
        editingTx.medicalCost ? editingTx.medicalCost.toString() : "",
      );
      setFormMedicalCenter(editingTx.medicalCenter || "");

      // Set to manual when loading edit mode to prevent automatic overwrite of custom commission values
      setCommissionCalcMode("manual");
    } else {
      // Clear for new entry
      setFormAmount("");
      setFormRemarks("");
      setFormPurpose("");
      setCustomPurpose("");
      const localD = new Date(Date.now() + 6 * 60 * 60 * 1000);
      setFormDate(localD.toISOString().split("T")[0]);

      setFormRecipientType("");
      setFormPersonName("");
      setFormStaffId("");
      setFormMedicalCost("");
      setFormMedicalCenter("");

      setIsMedicalVoucher(false);
      setMedicalReferenceId("");
      setMedicalReferenceName("");
      setMedicalCommission("");
      setPassengerId("");
      setPassengerName("");
      setPassengerSearchInput("");
      setIsPassengerSearchDropdownOpen(false);

      // Ready for automatic predefined percentage updates for new entries
      setCommissionCalcMode("auto");
      setCommissionRatePercent(brokerRate);
    }
  }, [editingTx, brokerRate, incomeCategories, expenseCategories]);

  // Handler to set rate percentage and reference info on reference change
  const handleReferenceChange = (id: string) => {
    setMedicalReferenceId(id);
    if (id !== "custom" && id !== "") {
      const s = staffList.find((st) => st.id === id);
      setMedicalReferenceName(s ? s.name : "");

      // Auto-set predefined percentage rate based on designation or role
      if (s) {
        const des = (s.designation || "").toLowerCase();
        const role = s.role;
        if (
          role === "Manager" ||
          des.includes("manager") ||
          des.includes("ব্যবস্থাপক") ||
          des.includes("marketing") ||
          des.includes("মার্কেটিং")
        ) {
          setCommissionRatePercent(managerRate); // Configured rate for Marketing Managers
        } else if (
          role === "Agent" ||
          des.includes("agent") ||
          des.includes("এজেন্ট")
        ) {
          setCommissionRatePercent(agentRate); // Configured rate for Sales Agents
        } else if (des.includes("accountant") || des.includes("ক্যাশিয়ার")) {
          setCommissionRatePercent(accountantRate); // Configured rate for accounts info
        } else {
          setCommissionRatePercent(otherRate); // Configured rate for others
        }
      }
    } else {
      setMedicalReferenceName("");
      // Configured broker / external referrer rate
      setCommissionRatePercent(brokerRate);
    }
  };

  // Run auto calculation whenever formAmount, calculation mode, or rate percentage changes
  useEffect(() => {
    if (isMedicalVoucher && commissionCalcMode === "auto") {
      const amount = parseFloat(formAmount) || 0;
      const rate = parseFloat(commissionRatePercent) || 0;
      const calculatedValue = (amount * rate) / 100;
      setMedicalCommission(
        calculatedValue > 0 ? Math.round(calculatedValue).toString() : "0",
      );
    }
  }, [formAmount, commissionCalcMode, commissionRatePercent, isMedicalVoucher]);

  // Auto-enable medical sections if medical related purpose is selected
  useEffect(() => {
    if (
      formPurpose &&
      (formPurpose.toLowerCase().includes("medical") ||
        formPurpose.includes("মেডিকেল"))
    ) {
      setIsMedicalVoucher(true);
    }
  }, [formPurpose]);

  // Handle submit (Create or Update)
  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।");
      return;
    }

    const finalPurpose =
      formPurpose === "Other" ? customPurpose.trim() : formPurpose.trim();
    if (!finalPurpose) {
      alert("হিসাবের উদ্দেশ্য বা খাত নির্বাচন/উল্লেখ করুন।");
      return;
    }

    const resolvedRefName = isMedicalVoucher
      ? medicalReferenceId === "custom"
        ? medicalReferenceName.trim()
        : staffList.find((s) => s.id === medicalReferenceId)?.name || ""
      : "";
    const resolvedPassengerName = isMedicalVoucher
      ? passengerId === "custom"
        ? passengerName.trim()
        : passengers.find((p) => p.id === passengerId)?.name || ""
      : "";

    const payload: any = {
      date: formDate,
      type: formType,
      amount: amountNum,
      purpose: finalPurpose,
      branch: (editingTx?.branch) || (branchFilter !== "all" ? branchFilter : currentBranch),
      remarks: formRemarks.trim(),
      createdByUid: user.uid,
      createdByEmail: user.email || "unknown@nextrip.com",
      isMedicalVoucher: isMedicalVoucher,
      medicalReferenceId: isMedicalVoucher ? medicalReferenceId : "",
      medicalReferenceName: resolvedRefName,
      medicalCommission:
        isMedicalVoucher && medicalCommission ? Number(medicalCommission) : 0,
      passengerId: isMedicalVoucher ? passengerId : "",
      passengerName: resolvedPassengerName,
    };

    if (formRecipientType) payload.recipientType = formRecipientType;
    if (formPersonName) payload.personName = formPersonName.trim();
    if (formStaffId) payload.staffId = formStaffId;
    if (isMedicalVoucher && formMedicalCost) payload.medicalCost = Number(formMedicalCost);
    if (isMedicalVoucher && formMedicalCenter) payload.medicalCenter = formMedicalCenter.trim();

    setPendingTxPayload(payload);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingTxPayload) return;
    setIsSubmitting(true);
    try {
      if (editingTx?.id) {
        await LedgerService.updateTransaction(editingTx.id, pendingTxPayload);
      } else {
        await LedgerService.addTransaction(pendingTxPayload);
      }
      setShowConfirmModal(false);
      setPendingTxPayload(null);
      setIsModalOpen(false);
      setEditingTx(null);
    } catch (err: any) {
      console.error(err);
      alert("হিসাব সংরক্ষণ করতে সমস্যা হয়েছে: " + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteTx = async (id: string, detail: string) => {
    if (
      confirm(
        `আপনি কি নিশ্চিত যে এই হিসাবটি তালিকা থেকে ডিলেট করতে চান?\n"${detail}"`,
      )
    ) {
      try {
        await LedgerService.deleteTransaction(id);
      } catch (err) {
        console.error(err);
        alert("হিসাব মুছতে সমস্যা হয়েছে।");
      }
    }
  };

  // Branch-scoped transactions and passengers
  const branchScopedTransactions = useMemo(() => {
    return filterTransactions(transactions, branchFilter);
  }, [transactions, branchFilter, filterTransactions]);

  const branchScopedPassengers = useMemo(() => {
    return filterPassengers(passengers, branchFilter);
  }, [passengers, branchFilter, filterPassengers]);

  // Month options based on existing ledger records
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    branchScopedTransactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7)); // e.g. "2026-05"
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [branchScopedTransactions]);

  // Calculations for filtered list and summaries
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalMedicalCommission = 0;
    let totalBossWithdrawn = 0;
    let totalMedicalCost = 0;
    let totalStaffOutflow = 0;
    let totalStaffInflow = 0;

    branchScopedTransactions.forEach((tx) => {
      // 1. Apply selected month filter ONLY for summary calculations if specified
      if (
        selectedMonth !== "All" &&
        tx.date.substring(0, 7) !== selectedMonth
      ) {
        return;
      }

      // 2. Date Range filter
      const txDate = tx.date || "";
      if (startDate && txDate < startDate) {
        return;
      }
      if (endDate && txDate > endDate) {
        return;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPurpose = (tx.purpose || "").toLowerCase().includes(q);
        const matchesRemarks = tx.remarks?.toLowerCase().includes(q) || false;
        const matchesEmail = (tx.createdByEmail || "")
          .toLowerCase()
          .includes(q);
        const matchesAmount = (tx.amount || 0).toString().includes(q);
        const matchesDate = (tx.date || "").includes(q);
        const matchesPerson = (tx.personName || "").toLowerCase().includes(q);
        const matchesRef = (tx.medicalReferenceName || "")
          .toLowerCase()
          .includes(q);
        const matchesPassenger = (tx.passengerName || "")
          .toLowerCase()
          .includes(q);
        const matchesCenter = (tx.medicalCenter || "").toLowerCase().includes(q);

        if (
          !(
            matchesPurpose ||
            matchesRemarks ||
            matchesEmail ||
            matchesAmount ||
            matchesDate ||
            matchesPerson ||
            matchesRef ||
            matchesPassenger ||
            matchesCenter
          )
        ) {
          return;
        }
      }

      // 4. Category filter
      if (filterCategory !== "All" && tx.purpose !== filterCategory) {
        return;
      }

      const isBoss =
        tx.recipientType === "Boss" ||
        (tx.personName &&
          (tx.personName.includes("বস") ||
            tx.personName.toLowerCase().includes("boss"))) ||
        (tx.purpose &&
          (tx.purpose.includes("বস") ||
            tx.purpose.toLowerCase().includes("boss")));

      if (tx.type === "Inflow") {
        totalInflow += tx.amount;
        if (
          (tx.recipientType === "Staff" || (!isBoss && tx.personName)) &&
          !isBoss
        ) {
          totalStaffInflow += tx.amount;
        }
      } else {
        totalOutflow += tx.amount;
        if (isBoss) {
          totalBossWithdrawn += tx.amount;
        } else if (tx.recipientType === "Staff" || tx.personName) {
          totalStaffOutflow += tx.amount;
        }
      }

      if (tx.isMedicalVoucher) {
        totalMedicalCost += tx.medicalCost || tx.amount;
        if (tx.medicalCommission) {
          totalMedicalCommission += tx.medicalCommission;
        }
      }
    });

    return {
      inflow: totalInflow,
      outflow: totalOutflow,
      balance: totalInflow - totalOutflow,
      medicalCommission: totalMedicalCommission,
      bossWithdrawn: totalBossWithdrawn,
      medicalCost: totalMedicalCost,
      staffOutflow: totalStaffOutflow,
      staffInflow: totalStaffInflow,
    };
  }, [
    branchScopedTransactions,
    selectedMonth,
    startDate,
    endDate,
    searchQuery,
    filterCategory,
  ]);

  // Aggregated Person-wise data (আহাদ কত নিল, কত টাকার মেডিকেল করাল, বস কত নিল)
  const personsLedgerData = useMemo(() => {
    interface PersonSummary {
      key: string;
      name: string;
      role: "Boss" | "Staff" | "Passenger" | "Other";
      totalTaken: number;
      totalDeposited: number;
      netBalance: number;
      medicalsCount: number;
      totalMedicalCost: number;
      totalCommission: number;
      vouchers: CashTransaction[];
    }

    const map: { [key: string]: PersonSummary } = {};

    const getOrCreate = (
      key: string,
      defaultName: string,
      role: "Boss" | "Staff" | "Passenger" | "Other",
    ) => {
      if (!map[key]) {
        map[key] = {
          key,
          name: defaultName,
          role,
          totalTaken: 0,
          totalDeposited: 0,
          netBalance: 0,
          medicalsCount: 0,
          totalMedicalCost: 0,
          totalCommission: 0,
          vouchers: [],
        };
      }
      return map[key];
    };

    // Pre-populate Boss and Staff members
    getOrCreate("boss", "বস / মালিক (Boss)", "Boss");
    staffList.forEach((s) => {
      const key = `staff_${s.id || s.name}`;
      getOrCreate(key, s.name, "Staff");
    });

    // Populate from transactions
    branchScopedTransactions.forEach((tx) => {
      if (
        selectedMonth !== "All" &&
        tx.date.substring(0, 7) !== selectedMonth
      ) {
        return;
      }
      if (startDate && tx.date < startDate) return;
      if (endDate && tx.date > endDate) return;

      const isBoss =
        tx.recipientType === "Boss" ||
        (tx.personName &&
          (tx.personName.includes("বস") ||
            tx.personName.toLowerCase().includes("boss"))) ||
        (tx.purpose &&
          (tx.purpose.includes("বস") ||
            tx.purpose.toLowerCase().includes("boss")));

      let pKey = "";
      let pName = "";
      let pRole: "Boss" | "Staff" | "Passenger" | "Other" = "Other";

      if (isBoss) {
        pKey = "boss";
        pName = "বস / মালিক (Boss)";
        pRole = "Boss";
      } else if (tx.staffId || tx.recipientType === "Staff") {
        const staffObj = staffList.find(
          (s) => s.id === tx.staffId || s.name === tx.personName,
        );
        pKey = tx.staffId
          ? `staff_${tx.staffId}`
          : `staff_${tx.personName || "unknown"}`;
        pName = staffObj ? staffObj.name : tx.personName || "অজ্ঞাত স্টাফ";
        pRole = "Staff";
      } else if (tx.medicalReferenceId || tx.medicalReferenceName) {
        const refName = tx.medicalReferenceName?.trim() || "";
        pKey = tx.medicalReferenceId
          ? `staff_${tx.medicalReferenceId}`
          : `ref_${refName}`;
        pName = refName || "মেডিকেল রেফারেন্স";
        pRole = "Staff";
      } else if (tx.personName?.trim()) {
        const pTrimmed = tx.personName.trim();
        pKey = `person_${pTrimmed}`;
        pName = pTrimmed;
        pRole = tx.recipientType === "Passenger" ? "Passenger" : "Other";
      }

      if (pKey) {
        const item = getOrCreate(pKey, pName, pRole);
        if (tx.type === "Outflow") {
          item.totalTaken += tx.amount;
        } else {
          item.totalDeposited += tx.amount;
        }
        if (tx.isMedicalVoucher) {
          item.medicalsCount += 1;
          item.totalMedicalCost += tx.medicalCost || tx.amount;
          item.totalCommission += tx.medicalCommission || 0;
        }
        item.vouchers.push(tx);
        item.netBalance = item.totalDeposited - item.totalTaken;
      }
    });

    return Object.values(map)
      .filter(
        (p) =>
          p.vouchers.length > 0 ||
          p.role === "Boss" ||
          p.totalTaken > 0 ||
          p.totalDeposited > 0,
      )
      .sort((a, b) => {
        if (a.role === "Boss") return -1;
        if (b.role === "Boss") return 1;
        return (
          b.totalTaken +
          b.totalDeposited -
          (a.totalTaken + a.totalDeposited)
        );
      });
  }, [branchScopedTransactions, staffList, selectedMonth, startDate, endDate]);

  const filteredPersonsLedgerData = useMemo(() => {
    return personsLedgerData.filter((p) => {
      if (personSearchQuery.trim()) {
        const q = personSearchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesVoucher = p.vouchers.some(
          (v) =>
            (v.passengerName && v.passengerName.toLowerCase().includes(q)) ||
            (v.purpose && v.purpose.toLowerCase().includes(q)) ||
            (v.remarks && v.remarks.toLowerCase().includes(q)) ||
            (v.medicalCenter && v.medicalCenter.toLowerCase().includes(q)),
        );
        if (!matchesName && !matchesVoucher) return false;
      }
      return true;
    });
  }, [personsLedgerData, personSearchQuery]);

  // Monthly trends for Recharts Bar Chart
  const trendData = useMemo(() => {
    const monthlyDataMap: {
      [month: string]: { inflow: number; outflow: number };
    } = {};

    branchScopedTransactions.forEach((tx) => {
      if (!tx.date || tx.date.length < 7) return;
      const monthStr = tx.date.substring(0, 7); // e.g. "2026-05"
      if (!monthlyDataMap[monthStr]) {
        monthlyDataMap[monthStr] = { inflow: 0, outflow: 0 };
      }
      if (tx.type === "Inflow") {
        monthlyDataMap[monthStr].inflow += tx.amount;
      } else {
        monthlyDataMap[monthStr].outflow += tx.amount;
      }
    });

    const monthNamesEng = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthNamesBng = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];

    // Sort months chronologically ascending (past -> present)
    const sortedMonths = Object.keys(monthlyDataMap).sort((a, b) =>
      a.localeCompare(b),
    );

    return sortedMonths
      .map((m) => {
        const [year, monthNum] = m.split("-");
        const idx = parseInt(monthNum, 10) - 1;
        const englishLabel =
          idx >= 0 && idx < 12 ? `${monthNamesEng[idx]} ${year}` : m;
        const bengaliLabel =
          idx >= 0 && idx < 12 ? `${monthNamesBng[idx]} ${year}` : m;

        return {
          monthKey: m,
          monthLabel: englishLabel,
          bengaliLabel: bengaliLabel,
          inflow: monthlyDataMap[m].inflow,
          outflow: monthlyDataMap[m].outflow,
        };
      })
      .slice(-12); // Present up to the last 12 active months
  }, [branchScopedTransactions]);

  // Filtering transactions list
  const filteredTransactions = useMemo(() => {
    return branchScopedTransactions.filter((tx) => {
      // 1. Filter Type ("All", "Inflow", "Outflow")
      if (filterType !== "All" && tx.type !== filterType) {
        return false;
      }

      // 2. Filter Month
      if (
        selectedMonth !== "All" &&
        tx.date.substring(0, 7) !== selectedMonth
      ) {
        return false;
      }

      // Date Range filter (Date-wise)
      const txDate = tx.date || "";
      if (startDate && txDate < startDate) {
        return false;
      }
      if (endDate && txDate > endDate) {
        return false;
      }

      // Category filter
      if (filterCategory !== "All" && tx.purpose !== filterCategory) {
        return false;
      }

      // Person / Accountability filter
      if (filterPerson !== "All") {
        const isBoss =
          tx.recipientType === "Boss" ||
          (tx.personName &&
            (tx.personName.includes("বস") ||
              tx.personName.toLowerCase().includes("boss"))) ||
          (tx.purpose &&
            (tx.purpose.includes("বস") ||
              tx.purpose.toLowerCase().includes("boss")));

        if (filterPerson === "Boss") {
          if (!isBoss) return false;
        } else if (filterPerson === "Staff") {
          if (!tx.staffId && tx.recipientType !== "Staff" && isBoss) {
            return false;
          }
        } else {
          const matchP =
            (tx.personName &&
              tx.personName
                .toLowerCase()
                .includes(filterPerson.toLowerCase())) ||
            (tx.medicalReferenceName &&
              tx.medicalReferenceName
                .toLowerCase()
                .includes(filterPerson.toLowerCase())) ||
            tx.staffId === filterPerson;
          if (!matchP) return false;
        }
      }

      // 3. Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPurpose = (tx.purpose || "").toLowerCase().includes(q);
        const matchesRemarks = tx.remarks?.toLowerCase().includes(q) || false;
        const matchesEmail = (tx.createdByEmail || "")
          .toLowerCase()
          .includes(q);
        const matchesAmount = (tx.amount || 0).toString().includes(q);
        const matchesDate = (tx.date || "").includes(q);
        const matchesPerson = (tx.personName || "").toLowerCase().includes(q);
        const matchesRef = (tx.medicalReferenceName || "")
          .toLowerCase()
          .includes(q);
        const matchesPassenger = (tx.passengerName || "")
          .toLowerCase()
          .includes(q);
        const matchesCenter = (tx.medicalCenter || "").toLowerCase().includes(q);

        return (
          matchesPurpose ||
          matchesRemarks ||
          matchesEmail ||
          matchesAmount ||
          matchesDate ||
          matchesPerson ||
          matchesRef ||
          matchesPassenger ||
          matchesCenter
        );
      }

      return true;
    });
  }, [
    branchScopedTransactions,
    filterType,
    selectedMonth,
    searchQuery,
    startDate,
    endDate,
    filterCategory,
    filterPerson,
  ]);

  // Passenger selection autocomplete list filter
  const filteredPassengersForSelect = useMemo(() => {
    if (!passengerSearchInput.trim()) {
      return branchScopedPassengers.slice(0, 5); // Default show first 5 passengers if search is empty
    }
    const q = passengerSearchInput.toLowerCase();
    return branchScopedPassengers.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.passportNumber || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q),
    );
  }, [branchScopedPassengers, passengerSearchInput]);

  // Selected reference for detailed view
  const [selectedReportRef, setSelectedReportRef] = useState<string | null>(
    null,
  );

  const medicalReportData = useMemo(() => {
    // Filter transactions to only medical ones
    let list = branchScopedTransactions.filter((tx) => tx.isMedicalVoucher);

    // Group by reference
    const groups: {
      [refKey: string]: {
        refId: string;
        refName: string;
        medicalsCount: number;
        totalCommission: number;
        vouchers: CashTransaction[];
      };
    } = {};

    list.forEach((tx) => {
      // Group key is ref ID if registered staff, otherwise name
      const refKey =
        tx.medicalReferenceId && tx.medicalReferenceId !== "custom"
          ? tx.medicalReferenceId
          : tx.medicalReferenceName?.trim() || "No-Ref";

      if (!groups[refKey]) {
        groups[refKey] = {
          refId: tx.medicalReferenceId || "custom",
          refName: tx.medicalReferenceName || "অনুল্লিখিত রেফারেন্স",
          medicalsCount: 0,
          totalCommission: 0,
          vouchers: [],
        };
      }

      groups[refKey].medicalsCount += 1;
      groups[refKey].totalCommission += tx.medicalCommission || 0;
      groups[refKey].vouchers.push(tx);
    });

    return Object.values(groups);
  }, [branchScopedTransactions]);

  return (
    <div
      id="ledger-management-container"
      className="p-4 lg:p-8 space-y-6 lg:space-y-8"
    >
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-1.5 h-8 rounded-full ${
              branchFilter === "diabari"
                ? "bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                : branchFilter === "all"
                ? "bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                : "bg-blue-600 shadow-[0_0_15px_rgba(29,78,216,0.4)]"
            }`}
          ></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl lg:text-2xl font-display font-bold text-slate-950 dark:text-white tracking-tight">
                {branchFilter === "diabari"
                  ? "দিয়াবাড়ী (হেড অফিস) - অফিস ক্যাশ খাতা"
                  : branchFilter === "all"
                  ? "সকল শাখা - সমন্বিত ক্যাশ খাতা (All Branches)"
                  : "নেক্সট্রিপ - অফিসিয়াল হিসাবের খাতা"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase ${
                  branchFilter === "diabari"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : branchFilter === "all"
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {branchFilter === "diabari"
                  ? "🏛️ দিয়াবাড়ী (RL2572)"
                  : branchFilter === "all"
                  ? "🌐 উভয় শাখা"
                  : "✈️ নেক্সট্রিপ শাখা"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              {branchFilter === "diabari"
                ? "দিয়াবাড়ী হেড অফিসের দৈনিক আয়-ব্যয়, ক্যাশ ব্যালেন্স ও মেডিকেল কমিশন খাতা।"
                : "নেক্সট্রিপ অফিসের দৈনিক আয়-ব্যয় এবং ক্যাশ ব্যালেন্স রেকর্ড করার কেন্দ্রীয় খাতা।"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Admin Branch Switcher in Ledger */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
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
                title="উভয় শাখার সকল হিসাব একসাথে দেখুন"
              >
                উভয় শাখা
              </button>
            </div>
          )}

          <button
            id="btn-open-ledger-calculator"
            type="button"
            onClick={() => {
              // Initialize fresh state for the calculator
              setCalcType("Inflow");
              setCalcItems([{ label: "", amount: "" }]);
              setCalcPurpose("");
              setCalcCustomPurpose("");
              setCalcRemarks("");
              setIsCalcModalOpen(true);
            }}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Calculator size={14} className="text-amber-600" />
            <span>ক্যালকুলেটর (Quick Calculator)</span>
          </button>

          <button
            id="btn-open-commission-settings"
            type="button"
            onClick={() => setIsCommissionConfigOpen(true)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl py-3 px-[18px] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Settings size={14} className="text-slate-600 animate-spin-slow" />
            <span>কমিশন সেটিংস (Commission Rates)</span>
          </button>

          <button
            id="btn-open-category-settings"
            type="button"
            onClick={() => {
              setNewCategoryInput("");
              setCategorySettingsTab("Inflow");
              setIsCategoryConfigOpen(true);
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Settings size={14} className="text-blue-600" />
            <span>ক্যাটাগরি সেটিংস (Manage Categories)</span>
          </button>

          <button
            id="btn-print-ledger-report"
            type="button"
            onClick={() =>
              PrintService.printLedgerReport(
                filteredTransactions,
                selectedMonth,
                stats.inflow,
                stats.outflow,
                filterType,
                searchQuery,
                startDate,
                endDate,
                filterCategory
              )
            }
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Printer size={14} />
            <span>রিপোর্ট প্রিন্ট করুন (Print Ledger)</span>
          </button>

          <button
            id="btn-add-ledger-entry"
            type="button"
            onClick={() => {
              setEditingTx(null);
              setFormType("Inflow");
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={14} strokeWidth={3} />
            <span>নতুন ভাউচার লিখুন (New Entry)</span>
          </button>
        </div>
      </div>

      {/* Modern View Swapper Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveView("ledger")}
          className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeView === "ledger"
              ? "border-blue-600 text-blue-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wallet size={14} />
          দৈনিক হিসাব খাতা (Cash Book Ledger)
        </button>

        <button
          onClick={() => setActiveView("person-tracker")}
          className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeView === "person-tracker"
              ? "border-blue-600 text-blue-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={14} />
          ব্যক্তি ও বসের হিসাব খাতা (Person & Boss Tracker)
        </button>

        <button
          onClick={() => setActiveView("medical-commission")}
          className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeView === "medical-commission"
              ? "border-blue-600 text-blue-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Stethoscope size={14} />
          মেডিকেল রেফারেন্স ও কমিশন (Medical Report)
        </button>
      </div>

      {activeView === "ledger" ? (
        <>
          {/* Stats Cards Section - 6 Comprehensive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Total Inflow Cash */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm">
                  <ArrowDownLeft size={18} />
                </span>
                {selectedMonth !== "All" && (
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 uppercase">
                    {selectedMonth}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  মোট জমা (Inflow)
                </p>
                <p className="text-xl font-mono font-black text-slate-900 mt-0.5">
                  ৳{stats.inflow.toLocaleString()}
                </p>
                <p className="text-[9px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <TrendingUp size={10} />
                  অফিসে জমা
                </p>
              </div>
            </motion.div>

            {/* Total Outflow Cash */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-sm">
                  <ArrowUpRight size={18} />
                </span>
                {selectedMonth !== "All" && (
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 uppercase">
                    {selectedMonth}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  মোট খরচ (Outflow)
                </p>
                <p className="text-xl font-mono font-black text-slate-900 mt-0.5">
                  ৳{stats.outflow.toLocaleString()}
                </p>
                <p className="text-[9px] text-rose-500 font-medium mt-0.5 flex items-center gap-1">
                  <TrendingDown size={10} />
                  মোট ব্যয়
                </p>
              </div>
            </motion.div>

            {/* Net Cash Balance */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shadow-sm">
                  <Wallet size={18} />
                </span>
                {selectedMonth !== "All" && (
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 uppercase">
                    {selectedMonth}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  হাতে ক্যাশ (Balance)
                </p>
                <p
                  className={`text-xl font-mono font-black mt-0.5 ${stats.balance >= 0 ? "text-blue-900" : "text-rose-600"}`}
                >
                  ৳{stats.balance.toLocaleString()}
                </p>
                <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <Sparkles size={10} className="text-blue-500" />
                  বর্তমান উদ্বৃত্ত
                </p>
              </div>
            </motion.div>

            {/* Boss Total Taken */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => setActiveView("person-tracker")}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-amber-100 rounded-xl text-amber-700 border border-amber-200 shadow-sm">
                  👑
                </span>
                <span className="text-[8px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                  বসের উত্তোলন
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-amber-900 uppercase tracking-wider">
                  বস কত টাকা নিছে
                </p>
                <p className="text-xl font-mono font-black text-amber-900 mt-0.5">
                  ৳{stats.bossWithdrawn.toLocaleString()}
                </p>
                <p className="text-[9px] text-amber-700 font-bold mt-0.5">
                  ক্লিক করে বিস্তারিত দেখুন →
                </p>
              </div>
            </motion.div>

            {/* Total Medical Test Cost */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => setActiveView("person-tracker")}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-sky-100 rounded-xl text-sky-700 border border-sky-200 shadow-sm">
                  <Stethoscope size={18} />
                </span>
                <span className="text-[8px] font-extrabold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded uppercase">
                  মেডিকেল খরচ
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-sky-900 uppercase tracking-wider">
                  কত টাকার মেডিকেল
                </p>
                <p className="text-xl font-mono font-black text-sky-900 mt-0.5">
                  ৳{stats.medicalCost.toLocaleString()}
                </p>
                <p className="text-[9px] text-sky-700 font-bold mt-0.5">
                  কমিশন: ৳{stats.medicalCommission.toLocaleString()}
                </p>
              </div>
            </motion.div>

            {/* Staff Cash Handed Out */}
            <motion.div
              whileHover={{ y: -3 }}
              className="bg-purple-50/40 border border-purple-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => setActiveView("person-tracker")}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-purple-100 rounded-xl text-purple-700 border border-purple-200 shadow-sm">
                  <Users size={18} />
                </span>
                <span className="text-[8px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded uppercase">
                  স্টাফের টাকা
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[9px] font-extrabold text-purple-900 uppercase tracking-wider">
                  স্টাফ কত টাকা নিল
                </p>
                <p className="text-xl font-mono font-black text-purple-900 mt-0.5">
                  ৳{stats.staffOutflow.toLocaleString()}
                </p>
                <p className="text-[9px] text-purple-700 font-bold mt-0.5">
                  আহাদ ও অন্যান্য স্টাফ
                </p>
              </div>
            </motion.div>
          </div>

          {/* Monthly Trends Bar Chart Section */}
          <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-6 lg:p-8 shadow-[0_2px_12px_-5px_rgba(15,23,42,0.02)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">
                    ট্রেণ্ডস এনালাইসিস (Monthly Ledger Analytics)
                  </h3>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    মাসিক আয় বনাম ব্যয়ের তুলনামূলক চিত্র
                  </h4>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                সর্বশেষ ১২ মাসের বিবরণী
              </p>
            </div>

            {trendData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-150 rounded-3xl p-6">
                <span className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-100 mb-3 animate-pulse">
                  <FileSpreadsheet size={24} />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  পর্যাপ্ত হিসাবের তথ্য পাওয়া যায়নি
                </p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] text-center">
                  আয় অথবা ব্যয়ের ভাউচার যোগ করা শুরু করার সাথে সাথে এই চার্টটি
                  স্বয়ংক্রিয়ভাবে জেনারেট হবে।
                </p>
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={trendData}
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    barGap={5}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F1F5F9"
                    />
                    <XAxis
                      dataKey="monthLabel"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 9, fontWeight: 700 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `৳${(v / 1000).toLocaleString()}k`}
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 9,
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "#F8FAFC", radius: 4 }}
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const inflowValue = payload[0]?.value || 0;
                          const outflowValue = payload[1]?.value || 0;
                          const netValue = inflowValue - outflowValue;
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-xl text-white font-sans text-xs space-y-1.5 z-50">
                              <p className="font-black text-[9px] text-slate-400 uppercase tracking-widest border-b border-white/10 pb-1 mb-1">
                                {label}
                              </p>
                              <div className="flex items-center gap-6 justify-between">
                                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
                                  Inflow (জমা):
                                </span>
                                <span className="font-mono font-black text-emerald-300">
                                  ৳{inflowValue.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-6 justify-between">
                                <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider">
                                  Outflow (খরচ):
                                </span>
                                <span className="font-mono font-black text-rose-300">
                                  ৳{outflowValue.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-6 justify-between border-t border-white/10 pt-1.5 mt-1.5 font-bold">
                                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                                  Net (লভ্যাংশ/অবশিষ্ট):
                                </span>
                                <span
                                  className={`font-mono font-black ${netValue >= 0 ? "text-emerald-300" : "text-rose-400"}`}
                                >
                                  ৳{netValue.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={30}
                      iconType="circle"
                      iconSize={6}
                      formatter={(value) => {
                        return (
                          <span className="text-[9px] font-sans font-black uppercase tracking-widest text-slate-500 pl-1">
                            {value === "inflow"
                              ? "আয় / জমা (Inflow)"
                              : "ব্যয় / খরচ (Outflow)"}
                          </span>
                        );
                      }}
                    />
                    <Bar
                      dataKey="inflow"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      name="inflow"
                    />
                    <Bar
                      dataKey="outflow"
                      fill="#F43F5E"
                      radius={[4, 4, 0, 0]}
                      name="outflow"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Filters and Searching Panel */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-[0_2px_12px_-5px_rgba(15,23,42,0.02)] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Filter size={14} />
                </span>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                  অ্যাডভান্সড ফিল্টারিং অপশনস (Filter Ledger)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search inputs */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="হিসাব বা তথ্য খুঁজুন..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2 pl-9 pr-4 text-xs outline-none transition-all"
                  />
                  <Search
                    size={14}
                    className="absolute left-3.5 top-3 text-slate-400"
                  />
                </div>

                {/* Selected Month option */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <CalendarDays size={13} className="text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="All">সকল মাস (All Months)</option>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date-wise From & To Filter */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-sans">
                    From:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
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

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-sans">
                    To:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
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

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Filter size={13} className="text-slate-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="All">সকল খাত (All Categories)</option>
                    <optgroup label="Income Categories">
                      {incomeCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Expense Categories">
                      {expenseCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                </div>

                {/* Person / Staff / Boss Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <User size={13} className="text-slate-400" />
                  <select
                    value={filterPerson}
                    onChange={(e) => setFilterPerson(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer max-w-[160px] truncate"
                  >
                    <option value="All">ব্যক্তি/স্টাফ ফিল্টার (সবাই)</option>
                    <option value="Boss">👑 বস / মালিক (Boss)</option>
                    <option value="Staff">👥 সকল স্টাফ (All Staff)</option>
                    {staffList.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name} ({s.designation || s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tab filters */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-3">
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setFilterType("All")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === "All"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  সব হিসাব
                </button>
                <button
                  onClick={() => setFilterType("Inflow")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === "Inflow"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ArrowDownLeft size={13} />
                  টাকা আসছে (আয়)
                </button>
                <button
                  onClick={() => setFilterType("Outflow")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === "Outflow"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ArrowUpRight size={13} />
                  টাকা গেছে (ব্যয়)
                </button>
              </div>

              <div className="text-[11px] font-medium text-slate-400 italic">
                মোট{" "}
                <span className="font-bold text-slate-700">
                  {filteredTransactions.length}
                </span>{" "}
                টি হিসাব ভাউচার পাওয়া গেছে।
              </div>
            </div>
          </div>

          {/* Ledger History List Table */}
          <div className="bg-white border border-slate-200/50 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-150">
                    <th className="py-4.5 px-6 w-32">ভাউচার তারিখ (Date)</th>
                    <th className="py-4.5 px-6 w-36">লেনদেনের ধরণ (Type)</th>
                    <th className="py-4.5 px-6 w-44">
                      উদ্দেশ্য / খাত (Purpose)
                    </th>
                    <th className="py-4.5 px-6">
                      অতিরিক্ত তথ্য / বিবরণ (Remarks)
                    </th>
                    <th className="py-4.5 px-6 w-36">টাকার পরিমাণ (Amount)</th>
                    <th className="py-4.5 px-4 w-48 font-mono text-center">
                      Logged By
                    </th>
                    <th className="py-4.5 px-6 text-right w-28">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 text-[11px]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 p-8 text-center text-slate-400 italic"
                      >
                        কোন হিসাব পাওয়া যায়নি। অনুগ্রহ করে "নতুন ভাউচার লিখুন"
                        বাটনে ক্লিক করে প্রথম হিসাবটি যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`transition-all duration-150 border-b border-slate-100 ${
                          tx.type === "Inflow"
                            ? "bg-emerald-50/[0.12] hover:bg-emerald-50/[0.3]"
                            : "bg-rose-50/[0.08] hover:bg-rose-50/[0.22]"
                        }`}
                      >
                        <td
                          className={`py-4 px-6 font-mono text-[11px] font-semibold transition-all border-l-4 ${
                            tx.type === "Inflow"
                              ? "border-l-emerald-500 text-emerald-800"
                              : "border-l-rose-500 text-rose-800"
                          }`}
                        >
                          {tx.date}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-sans font-black px-2.5 py-1 rounded-lg border ${
                              tx.type === "Inflow"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                : "bg-rose-50 text-rose-600 border-rose-150"
                            }`}
                          >
                            {tx.type === "Inflow" ? (
                              <ArrowDownLeft size={11} className="stroke-[3]" />
                            ) : (
                              <ArrowUpRight size={11} className="stroke-[3]" />
                            )}
                            {tx.type === "Inflow" ? "আয় (In)" : "ব্যয় (Out)"}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          <div>{tx.purpose}</div>

                          {/* Recipient / Accountability Badges */}
                          <div className="flex flex-wrap gap-1 mt-1 font-sans">
                            {tx.recipientType === "Boss" ||
                            (tx.personName &&
                              (tx.personName.includes("বস") ||
                                tx.personName.toLowerCase().includes("boss"))) ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md font-black">
                                👑 বস / মালিক
                              </span>
                            ) : tx.personName ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md font-bold">
                                👤 {tx.personName}
                              </span>
                            ) : null}

                            {tx.isMedicalVoucher && (
                              <>
                                {tx.passengerName && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] bg-sky-50 text-sky-700 border border-sky-100 px-1 py-0.2 rounded font-black max-w-[120px] truncate">
                                    যাত্রী: {tx.passengerName}
                                  </span>
                                )}
                                {tx.medicalReferenceName && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1 py-0.2 rounded font-black max-w-[120px] truncate">
                                    রেফ: {tx.medicalReferenceName}
                                  </span>
                                )}
                                {tx.medicalCenter && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] bg-teal-50 text-teal-700 border border-teal-100 px-1 py-0.2 rounded font-medium max-w-[120px] truncate">
                                    🏥 {tx.medicalCenter}
                                  </span>
                                )}
                                {tx.medicalCost !== undefined &&
                                  tx.medicalCost > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-sky-50 text-sky-800 border border-sky-200 px-1 py-0.2 rounded font-mono font-bold">
                                      মেডিকেল: ৳{tx.medicalCost.toLocaleString()}
                                    </span>
                                  )}
                                {tx.medicalCommission !== undefined &&
                                  tx.medicalCommission > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-1 py-0.2 rounded font-mono font-bold">
                                      কমিশন: ৳
                                      {tx.medicalCommission.toLocaleString()}
                                    </span>
                                  )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium italic">
                          {tx.remarks || (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p
                            className={`font-mono text-sm font-black flex items-center ${
                              tx.type === "Inflow"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {tx.type === "Inflow" ? "+" : "-"}৳
                            {tx.amount.toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-mono text-[9px] text-slate-450 text-center">
                          {tx.createdByEmail}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTx(tx);
                                setIsModalOpen(true);
                              }}
                              title="সম্পাদনা করুন"
                              className="p-1 px-2 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteTx(
                                  tx.id!,
                                  `${tx.purpose} - ৳${tx.amount}`,
                                )
                              }
                              title="মুছে ফেলুন"
                              className="p-1 px-2 border border-slate-200 hover:border-red-400 hover:bg-red-50/50 hover:text-red-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeView === "person-tracker" ? (
        /* Person & Boss Accountability Tracker View */
        <div id="person-boss-tracker-view" className="space-y-6">
          {/* Top Banner */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="p-3 bg-purple-50 border border-purple-100/50 text-purple-600 rounded-2xl shadow-sm inline-block mt-0.5">
                <Users size={20} />
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">
                  ব্যক্তিভিত্তিক হিসাব ও জবাবদিহিতা (Person & Boss Accountability Tracker)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                  আহাদ কত টাকা নিল, কত টাকার মেডিকেল করালো, এবং বস কত টাকা নিয়েছে — প্রত্যেক ব্যক্তি ও স্টাফের হিসাব খাতা ও ভাউচার তালিকা। এখানে যেকোনো স্টাফ বা ব্যক্তির নামের পাশে ক্লিক করে তাদের বিস্তারিত ভাউচার খতিয়ে দেখতে পারেন।
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={personSearchQuery}
                  onChange={(e) => setPersonSearchQuery(e.target.value)}
                  placeholder="নাম বা ভাউচার খুঁজুন (যেমন: আহাদ)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-auto">
                <CalendarDays size={14} className="text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="All">সকল মাস (All Months)</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <Printer size={13} />
                প্রিন্ট রিপোর্ট
              </button>
            </div>
          </div>

          {/* 4 KPI Summary Cards for Accountability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Boss Taken */}
            <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200 shadow-sm text-lg">
                👑
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-widest block font-sans">
                  বস কত টাকা নিছে (Boss Taken)
                </span>
                <p className="text-xl font-mono font-black text-amber-900 mt-0.5">
                  ৳{stats.bossWithdrawn.toLocaleString()}
                </p>
                <span className="text-[9px] text-amber-700 font-medium mt-0.5 block">
                  বসের উত্তোলন ও ক্যাশ ড্রইং
                </span>
              </div>
            </div>

            {/* Card 2: Medical Cost */}
            <div className="bg-sky-50/50 border border-sky-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-sky-100 text-sky-800 rounded-2xl border border-sky-200 shadow-sm">
                <Stethoscope size={20} />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-sky-800 uppercase tracking-widest block font-sans">
                  কত টাকার মেডিকেল (Medicals)
                </span>
                <p className="text-xl font-mono font-black text-sky-900 mt-0.5">
                  ৳{stats.medicalCost.toLocaleString()}
                </p>
                <span className="text-[9px] text-sky-700 font-medium mt-0.5 block">
                  রেফারেন্স কমিশন: ৳{stats.medicalCommission.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card 3: Staff Outflow */}
            <div className="bg-purple-50/50 border border-purple-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl border border-purple-200 shadow-sm">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-purple-800 uppercase tracking-widest block font-sans">
                  স্টাফ ও অন্যান্যদের খরচ (Outflow)
                </span>
                <p className="text-xl font-mono font-black text-purple-900 mt-0.5">
                  ৳{stats.staffOutflow.toLocaleString()}
                </p>
                <span className="text-[9px] text-purple-700 font-medium mt-0.5 block">
                  আহাদ ও অন্যান্যদের দেওয়া অফিসের টাকা
                </span>
              </div>
            </div>

            {/* Card 4: Staff Inflow */}
            <div className="bg-emerald-50/50 border border-emerald-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200 shadow-sm">
                <ArrowDownLeft size={20} />
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest block font-sans">
                  স্টাফদের ফেরত/জমা (Inflow)
                </span>
                <p className="text-xl font-mono font-black text-emerald-900 mt-0.5">
                  ৳{stats.staffInflow.toLocaleString()}
                </p>
                <span className="text-[9px] text-emerald-700 font-medium mt-0.5 block">
                  স্টাফদের থেকে অফিসে জমা হওয়া টাকা
                </span>
              </div>
            </div>
          </div>

          {/* Persons List & Details Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-blue-600" />
                ব্যক্তিভিত্তিক হিসাব বিবরণী (Person-wise Statements)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                মোট {filteredPersonsLedgerData.length} জন অন্তর্ভুক্ত
              </span>
            </div>

            {filteredPersonsLedgerData.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <Users size={32} className="mx-auto text-slate-300 opacity-60" />
                <p className="text-xs font-bold text-slate-600">কোন ব্যক্তির হিসাব খুঁজে পাওয়া যায়নি</p>
                <p className="text-[10px] text-slate-400">
                  নতুন ভাউচার যোগ করার সময় "টাকা কার খাতে / কে নিল" অপশন থেকে স্টাফ, বস বা ব্যক্তির নাম নির্বাচন করুন।
                </p>
              </div>
            ) : (
              filteredPersonsLedgerData.map((person) => {
                const isExpanded = expandedPersonKey === person.key;
                const isBoss = person.role === "Boss";
                return (
                  <div
                    key={person.key}
                    className={`bg-white border rounded-[2rem] shadow-sm transition-all overflow-hidden ${
                      isBoss
                        ? "border-amber-200/80 bg-gradient-to-r from-white via-white to-amber-50/20"
                        : "border-slate-200/60 hover:border-slate-300"
                    }`}
                  >
                    {/* Header bar of Person Card */}
                    <div className="p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                            isBoss
                              ? "bg-amber-100 text-amber-800 border-amber-200 text-xl"
                              : person.role === "Staff"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : person.role === "Passenger"
                                  ? "bg-sky-50 text-sky-700 border-sky-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isBoss ? (
                            "👑"
                          ) : person.role === "Staff" ? (
                            <Users size={20} />
                          ) : person.role === "Passenger" ? (
                            <User size={20} />
                          ) : (
                            <User size={20} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 truncate">
                              {person.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isBoss
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : person.role === "Staff"
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : person.role === "Passenger"
                                      ? "bg-sky-100 text-sky-700 border border-sky-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {isBoss
                                ? "👑 বস / মালিক"
                                : person.role === "Staff"
                                  ? "অফিস স্টাফ"
                                  : person.role === "Passenger"
                                    ? "যাত্রী"
                                    : "ব্যক্তি / পার্টনার"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-0.5 font-medium">
                            মোট ভাউচার সংখ্যা: <strong className="text-slate-700">{person.vouchers.length} টি</strong>
                            {person.medicalsCount > 0 && (
                              <span className="ml-2 text-sky-700 font-bold">
                                • মেডিকেল করিয়েছে: {person.medicalsCount} টি
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right stats and expand button */}
                      <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
                        {/* Outflow / Taken */}
                        <div className="bg-rose-50/70 border border-rose-100 px-3.5 py-2 rounded-xl text-center min-w-[100px]">
                          <span className="text-[8px] font-black text-rose-600 uppercase tracking-wider block">
                            টাকা নিয়েছে (Outflow)
                          </span>
                          <span className="font-mono text-xs font-black text-rose-700">
                            ৳{person.totalTaken.toLocaleString()}
                          </span>
                        </div>

                        {/* Inflow / Deposited */}
                        <div className="bg-emerald-50/70 border border-emerald-100 px-3.5 py-2 rounded-xl text-center min-w-[100px]">
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">
                            টাকা দিয়েছে (Inflow)
                          </span>
                          <span className="font-mono text-xs font-black text-emerald-700">
                            ৳{person.totalDeposited.toLocaleString()}
                          </span>
                        </div>

                        {/* Net Balance */}
                        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center min-w-[100px]">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">
                            নীট স্থিতি (Balance)
                          </span>
                          <span
                            className={`font-mono text-xs font-black ${
                              person.netBalance >= 0 ? "text-blue-700" : "text-rose-600"
                            }`}
                          >
                            ৳{person.netBalance.toLocaleString()}
                          </span>
                        </div>

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPersonKey(isExpanded ? null : person.key)
                          }
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isExpanded
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>ভাউচার ({person.vouchers.length})</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Voucher Table */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-150 bg-slate-50/50 overflow-hidden"
                        >
                          <div className="p-4 md:p-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                {person.name} - এর বিস্তারিত ভাউচার খাতা
                              </h5>
                              {person.totalMedicalCost > 0 && (
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                                    মোট মেডিকেল খরচ: ৳{person.totalMedicalCost.toLocaleString()}
                                  </span>
                                  {person.totalCommission > 0 && (
                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                                      মোট কমিশন: ৳{person.totalCommission.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {person.vouchers.length === 0 ? (
                              <p className="text-xs text-slate-400 py-4 italic text-center">
                                এই ব্যক্তির নামে নির্দিষ্ট কোন ভাউচার এন্ট্রি পাওয়া যায়নি।
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                                      <th className="py-2.5 px-4">তারিখ</th>
                                      <th className="py-2.5 px-3 text-center">লেনদেন ধরণ</th>
                                      <th className="py-2.5 px-4">উদ্দেশ্য / খাত</th>
                                      <th className="py-2.5 px-4">যাত্রী / মেডিকেল তথ্য</th>
                                      <th className="py-2.5 px-4">মন্তব্য</th>
                                      <th className="py-2.5 px-4 text-right">টাকার পরিমাণ</th>
                                      <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {person.vouchers.map((v) => (
                                      <tr key={v.id || Math.random()} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                                          {v.date}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span
                                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-black ${
                                              v.type === "Inflow"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                            }`}
                                          >
                                            {v.type === "Inflow" ? "আয় (In)" : "ব্যয় (Out)"}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-800">
                                          {v.purpose}
                                        </td>
                                        <td className="py-3 px-4">
                                          {v.isMedicalVoucher ? (
                                            <div className="flex flex-wrap gap-1 font-sans">
                                              {v.passengerName && (
                                                <span className="text-[8px] bg-sky-50 text-sky-700 border border-sky-100 px-1 py-0.2 rounded font-black">
                                                  যাত্রী: {v.passengerName}
                                                </span>
                                              )}
                                              {v.medicalCenter && (
                                                <span className="text-[8px] bg-teal-50 text-teal-700 border border-teal-100 px-1 py-0.2 rounded font-medium">
                                                  🏥 {v.medicalCenter}
                                                </span>
                                              )}
                                              {v.medicalCost !== undefined && v.medicalCost > 0 && (
                                                <span className="text-[8px] bg-sky-50 text-sky-800 border border-sky-200 px-1 py-0.2 rounded font-mono font-bold">
                                                  মেডিকেল: ৳{v.medicalCost.toLocaleString()}
                                                </span>
                                              )}
                                              {v.medicalCommission !== undefined && v.medicalCommission > 0 && (
                                                <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono font-bold">
                                                  কমিশন: ৳{v.medicalCommission.toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-slate-350 text-[10px]">-</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 font-medium italic text-[10px] max-w-[150px] truncate">
                                          {v.remarks || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                          <span
                                            className={`font-mono text-xs font-black ${
                                              v.type === "Inflow" ? "text-emerald-600" : "text-rose-600"
                                            }`}
                                          >
                                            {v.type === "Inflow" ? "+" : "-"}৳{v.amount.toLocaleString()}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingTx(v);
                                              setIsModalOpen(true);
                                            }}
                                            className="p-1 px-1.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                            title="সম্পাদনা করুন"
                                          >
                                            <Edit2 size={11} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Custom Medical Commissions Report View */
        <div id="medical-commission-statement-view" className="space-y-6">
          {/* Explanation banner */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="p-3 bg-blue-50 border border-blue-100/50 text-blue-600 rounded-2xl shadow-sm inline-block mt-0.5">
                <Award size={20} />
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">
                  মেডিকেল কমিশন ও রেফারেন্স বিবরণী (Medical Commissions Ledger)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                  অফিসের মার্কেটিং ম্যানেজার বা ব্রোকারদের রেফারেল মেডিকেল টেস্ট
                  এবং তাদের প্রদেয় কমিশন ট্র্যাক করার কেন্দ্রীয় প্ল্যাটফর্ম।
                  বাম পাশের টেবিলে রেফারেন্স অনুযায়ী পারফরম্যান্স এবং ডান পাশে
                  তাদের যাত্রী তালিকা বিস্তারিত দেখতে পারবেন।
                </p>
              </div>
            </div>

            {/* Selected Month option filter */}
            <div className="space-y-1.5 w-full md:w-64">
              <label className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest block">
                ফিল্টার মাস (Statement Month)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <CalendarDays size={14} className="text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full"
                >
                  <option value="All">
                    সকল সময়ের হিসাব (All Months Ledger)
                  </option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200/50 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-70"></div>
              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-2xl text-sky-600 shadow-sm">
                <Users size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                  মোট রেফারেন্স মেডিকেল
                </span>
                <p className="text-2xl font-mono font-black text-slate-900 mt-1">
                  {medicalReportData.reduce(
                    (acc, c) => acc + c.medicalsCount,
                    0,
                  )}{" "}
                  টি
                </p>
                <span className="text-[10px] text-sky-600 font-bold mt-0.5 block">
                  যাত্রী মেডিকেল জমা হয়েছে
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/50 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-70"></div>
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 shadow-sm">
                <Award size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans font-sans">
                  সর্বমোট রেফারেন্স কমিশন
                </span>
                <p className="text-2xl font-mono font-black text-slate-900 mt-1">
                  ৳
                  {medicalReportData
                    .reduce((acc, c) => acc + c.totalCommission, 0)
                    .toLocaleString()}
                </p>
                <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
                  কমিশন বাবদ মোট বরাদ্দ
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/50 p-6 rounded-[2rem] shadow-sm flex items-center gap-4 relative overflow-hidden border-r-4 border-r-blue-600">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-70"></div>
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shadow-sm">
                <UserCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                  টপ পারফর্মার ম্যানেজার
                </span>
                <p className="text-md font-black text-slate-800 mt-1 truncate max-w-[180px]">
                  {medicalReportData.length > 0
                    ? [...medicalReportData].sort(
                        (a, b) => b.medicalsCount - a.medicalsCount,
                      )[0].refName
                    : "কোন তথ্য নেই"}
                </p>
                <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">
                  সর্বোচ্চ মেডিকেল প্রদানকারী
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
            {/* Left pane: Summary Grid */}
            <div className="bg-white border border-slate-200/50 rounded-[2.2rem] shadow-sm overflow-hidden lg:col-span-6 h-fit">
              <div className="p-5.5 border-b border-slate-100 bg-slate-50/10">
                <h3 className="text-xs font-black text-slate-900">
                  রেফারেন্স তালিকা ও পারফরম্যান্স (Performance League)
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  সব রেফারেন্স ম্যানেজার ও এজেন্টদের সংকলিত তথ্য
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 uppercase text-[9px] font-extrabold tracking-wider text-slate-500">
                      <th className="py-3 px-5">রেফারেন্স নাম (Reference)</th>
                      <th className="py-3 px-4 text-center">মেডিকেল সংখ্যা</th>
                      <th className="py-3 px-5 text-right">মোট কমিশন (BDT)</th>
                      <th className="py-3 px-5 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicalReportData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-slate-400 italic"
                        >
                          নির্বাচিত মাসে নির্দিষ্ট কোন মেডিকেল রেফারেন্স ভাউচার
                          পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      medicalReportData.map((item) => {
                        const uniqueKey =
                          item.refId === "custom" ? item.refName : item.refId;
                        const isSelected = selectedReportRef === uniqueKey;
                        return (
                          <tr
                            key={uniqueKey}
                            className={`transition-all duration-150 ${
                              isSelected
                                ? "bg-blue-50/60 font-semibold"
                                : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="py-3.5 px-5 font-bold text-slate-800">
                              <div>{item.refName}</div>
                              {item.refId !== "custom" ? (
                                <div className="text-[8px] text-blue-600 font-extrabold tracking-wider uppercase">
                                  নিবন্ধিত অফিস স্টাফ
                                </div>
                              ) : (
                                <div className="text-[8px] text-slate-450 font-bold uppercase">
                                  বহিরাগত এজেন্ট বা ব্রোকার
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-150/50 font-sans px-2.5 py-0.5 rounded-full text-[10px]">
                                {item.medicalsCount} টি
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right font-mono font-black text-slate-900">
                              ৳{item.totalCommission.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedReportRef(uniqueKey)}
                                className={`px-3 py-1.5 text-[9px] font-bold rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md font-bold"
                                    : "bg-white border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 shadow-sm shadow-slate-100"
                                }`}
                              >
                                যাত্রী বিবরণী
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right pane: Detailed Passengers Drill-down */}
            <div className="bg-white border border-slate-200/50 rounded-[2.2rem] shadow-sm overflow-hidden lg:col-span-6 h-fit">
              {(() => {
                const selectedItem = medicalReportData.find(
                  (item) =>
                    (item.refId === "custom" ? item.refName : item.refId) ===
                    selectedReportRef,
                );

                if (!selectedItem) {
                  return (
                    <div className="p-12 text-center text-slate-400 italic space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                        <Stethoscope size={20} />
                      </div>
                      <p className="text-xs leading-relaxed max-w-sm mx-auto">
                        যেকোনো রেফারেন্সের পাশে থাকা{" "}
                        <strong className="text-slate-600">
                          "যাত্রী বিবরণী"
                        </strong>{" "}
                        ট্যাপ করে মেডিকেল করানো যাত্রীদের বিস্তারিত নামের তালিকা
                        ও তারিখভিত্তিক কমিশনের ইতিহাস লোড করুন।
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/40">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          <span className="text-blue-600 font-extrabold">
                            {selectedItem.refName}
                          </span>{" "}
                          - এর মেডিকেল যাত্রী তালিকা
                        </h4>
                        <p className="text-[9px] text-slate-450 mt-0.5 font-medium">
                          সর্বমোট {selectedItem.medicalsCount} জন যাত্রী মেডিকেল
                          করেছেন
                        </p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 border border-blue-150 rounded-xl px-3 py-1.5 font-mono font-black text-[11px] shadow-sm">
                        মোট কমিশন BDT ৳
                        {selectedItem.totalCommission.toLocaleString()}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 uppercase text-[8px] font-extrabold text-slate-500 tracking-wider">
                            <th className="py-2.5 px-4 font-bold">তারিখ</th>
                            <th className="py-2.5 px-4 font-bold">
                              যাত্রীর নাম (Passenger)
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold font-sans">
                              মেডিকেল ভাউচার
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold font-sans">
                              প্রাপ্ত কমিশন
                            </th>
                            <th className="py-2.5 px-4 font-bold">
                              মন্তব্য/ বিবরণ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedItem.vouchers.map((v, idx) => (
                            <tr
                              key={v.id || idx}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono font-semibold text-slate-500">
                                {v.date}
                              </td>
                              <td className="py-3 px-4 font-black text-slate-800">
                                {v.passengerName || "নামবিহীন যাত্রী"}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                                ৳{v.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-amber-600">
                                ৳{v.medicalCommission?.toLocaleString() || 0}
                              </td>
                              <td
                                className="py-3 px-4 max-w-[110px] truncate text-slate-450"
                                title={v.remarks || "কোন বিবরণ নেই"}
                              >
                                {v.remarks || v.purpose || "---"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Commission Percentages Settings Modal */}
      <AnimatePresence>
        {isCommissionConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommissionConfigOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative z-10 border border-slate-100"
            >
              {/* Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                    <Settings size={18} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-sans">
                      কমিশন সেটিংস (Commission Rules)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium font-sans">
                      পদভিত্তিক ডিফল্ট কমিশন কনফিগারেশন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCommissionConfigOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Save to localStorage
                  localStorage.setItem("commission_manager_rate", managerRate);
                  localStorage.setItem("commission_agent_rate", agentRate);
                  localStorage.setItem(
                    "commission_accountant_rate",
                    accountantRate,
                  );
                  localStorage.setItem("commission_broker_rate", brokerRate);
                  localStorage.setItem("commission_other_rate", otherRate);
                  setIsCommissionConfigOpen(false);
                }}
                className="p-6 space-y-4"
              >
                <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-3.5 text-[11px] text-blue-700 leading-relaxed font-medium">
                  রেফারেন্স মেডিকেল ভাউচার যোগ করার সময় নির্বাচিত কর্মকর্তা বা
                  বহিরাগত দালালের পদের ভিত্তিতে এই কমিশন হারগুলো স্বয়ংক্রিয়ভাবে
                  সাজেস্ট করা হবে।
                </div>

                <div className="space-y-3.5">
                  {/* Marketing Managers */}
                  <div className="flex items-center justify-between gap-4 p-1">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        মার্কেটিং ম্যানেজার (Marketing Manager)
                      </label>
                      <span className="text-[9px] text-slate-450 block">
                        ডিজাইনেশন ও ম্যানেজার রোলধারী কর্মকর্তা
                      </span>
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={managerRate}
                        onChange={(e) => setManagerRate(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-8 text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs font-sans">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Sales Agents */}
                  <div className="flex items-center justify-between gap-4 p-1 border-t border-slate-100 pt-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        সেলস এজেন্ট (Sales Agent / Agent)
                      </label>
                      <span className="text-[9px] text-slate-450 block">
                        রেজিস্টার্ড ও নিয়োগপ্রাপ্ত এজেন্ট বা রিপ্রেজেন্টেটিভ
                      </span>
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={agentRate}
                        onChange={(e) => setAgentRate(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-8 text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs font-sans">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Accountants */}
                  <div className="flex items-center justify-between gap-4 p-1 border-t border-slate-100 pt-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        ক্যাশিয়ার/একাউন্টস (Accountant)
                      </label>
                      <span className="text-[9px] text-slate-450 block">
                        ক্যাশ এন্ড একাউন্টিং ডিপার্টমেন্ট মেম্বার
                      </span>
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={accountantRate}
                        onChange={(e) => setAccountantRate(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-8 text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs font-sans">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Brokers / External Referrers */}
                  <div className="flex items-center justify-between gap-4 p-1 border-t border-slate-100 pt-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        দালাল বা বহিরাগত (Broker / External)
                      </label>
                      <span className="text-[9px] text-slate-450 block">
                        বাইরের ব্রোকার, এজেন্সি দল এবং ফ্রিল্যান্সিং রেফ
                      </span>
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={brokerRate}
                        onChange={(e) => {
                          setBrokerRate(e.target.value);
                          if (commissionRatePercent === brokerRate) {
                            setCommissionRatePercent(e.target.value);
                          }
                        }}
                        min="0"
                        max="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-8 text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs font-sans">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Standard / Others */}
                  <div className="flex items-center justify-between gap-4 p-1 border-t border-slate-100 pt-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-extrabold text-slate-700 block">
                        অন্যান্য কর্মকর্তা (Others / Staff)
                      </label>
                      <span className="text-[9px] text-slate-450 block">
                        অন্যান্য সাধারণ পদের রেজিস্টার্ড কর্মকর্তা
                      </span>
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={otherRate}
                        onChange={(e) => setOtherRate(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pr-8 text-center text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 font-bold text-slate-400 text-xs font-sans">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => {
                      setManagerRate("15");
                      setAgentRate("20");
                      setAccountantRate("10");
                      setBrokerRate("15");
                      setOtherRate("10");
                    }}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-xs font-extrabold tracking-wider transition-all cursor-pointer active:scale-98"
                  >
                    আগের মান (Reset)
                  </button>
                  <button
                    type="submit"
                    className="flex-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold tracking-wider shadow-md shadow-blue-500/10 transition-all cursor-pointer active:scale-98"
                  >
                    সংরক্ষণ করুন (Save Rules)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Category Settings Modal */}
      <AnimatePresence>
        {isCategoryConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryConfigOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden relative z-10 border border-slate-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-sans">
                      হিসাবের খাত সেটিংস (Manage Categories)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium font-sans font-sans">
                      পছন্দ মতো আয়ের খাত ও ব্যয়ের খাতের তালিকা পরিবর্তন করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryConfigOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Toggle Tab */}
              <div className="px-6 pt-4 flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategorySettingsTab("Inflow")}
                  className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    categorySettingsTab === "Inflow"
                      ? "border-emerald-600 text-emerald-600 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  আয়ের খাতসমূহ (Inflow Categories)
                </button>
                <button
                  type="button"
                  onClick={() => setCategorySettingsTab("Outflow")}
                  className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    categorySettingsTab === "Outflow"
                      ? "border-rose-600 text-rose-600 font-extrabold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  ব্যয়ের খাতসমূহ (Outflow Categories)
                </button>
              </div>

              {/* Scrollable List */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[50vh]">
                {/* Add Category Form Inside */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    নতুন খাত যোগ করুন (Add New Category)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder={
                        categorySettingsTab === "Inflow"
                          ? "যেমন: বিশেষ অনুদান (Inflow)"
                          : "যেমন: চা-নাস্তা খরচ (Outflow)"
                      }
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4 text-xs font-extrabold tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      যোগ করুন (Add)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    বিদ্যমান খাত তালিকা (Active Categories)
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                    {(categorySettingsTab === "Inflow"
                      ? incomeCategories
                      : expenseCategories
                    ).map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/50 transition-all"
                      >
                        <span className="text-xs font-bold text-slate-800 font-sans">
                          {cat}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-all cursor-pointer"
                          title="সরিয়ে ফেলুন (Remove)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {(categorySettingsTab === "Inflow"
                      ? incomeCategories
                      : expenseCategories
                    ).length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-400 font-sans">
                        কোন ক্যাটাগরি নেই। অনুগ্রহ করে উপরে টাইপ করে নতুন
                        ক্যাটাগরি তৈরি করুন।
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetCategoriesToDefault}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 px-4 text-xs font-bold transition-all cursor-pointer"
                >
                  ডিফল্ট রিসেট (Reset Defaults)
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryConfigOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl py-2.5 px-6 text-xs font-bold transition-all cursor-pointer"
                >
                  বন্ধ করুন (Close Status)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Entry/Edit Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingTx(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-7 md:p-8 max-w-lg w-full shadow-2xl relative z-10 space-y-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-sm">
                    <IndianRupee size={16} />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                      {editingTx
                        ? "সম্পাদনা করুন (Update Voucher)"
                        : "আজকের হিসাব জমা করুন (Office Voucher Entry)"}
                    </h3>
                    <p className="text-[14px] font-black text-slate-900 mt-0.5">
                      {editingTx
                        ? "Modify Transaction Entry"
                        : "নতুন ক্যাশ লেনদেন যুক্ত করুন"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTx(null);
                  }}
                  className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmitTx} className="space-y-4">
                {/* 1. Transaction Type Toggle Inflow vs Outflow */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] font-sans block">
                    লেনদেনের ধরণ (Cash Direction)
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("Inflow");
                        setFormPurpose("");
                      }}
                      className={`py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formType === "Inflow"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <ArrowDownLeft size={14} />
                      টাকা আসছে (আয় / জমা)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("Outflow");
                        setFormPurpose("");
                      }}
                      className={`py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formType === "Outflow"
                          ? "bg-rose-600 text-white shadow"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <ArrowUpRight size={14} />
                      টাকা গেছে (ব্যয় / খরচ)
                    </button>
                  </div>
                </div>

                {/* 2. Transaction Amount and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">
                      টাকার পরিমাণ (Amount in BDT)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        step="any"
                        className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 border-slate-200 rounded-xl p-3 pl-8 text-xs font-mono font-bold outline-none transition-all"
                      />
                      <span className="absolute left-3.5 top-3.5 font-bold text-slate-400 text-xs">
                        ৳
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">
                      ভাউচার তারিখ (Voucher Date)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 border-slate-200 rounded-xl p-3 pl-9 text-xs outline-none transition-all"
                      />
                      <Calendar
                        size={14}
                        className="absolute left-3 top-3.5 text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2b. Recipient / Accountability Section (আহাদ কত নিল, বস কত নিল) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                      <User size={13} className="text-blue-600" />
                      টাকা কার খাতে / কে নিল বা দিল? (Person / Accountability)
                    </label>
                    {formRecipientType && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormRecipientType("");
                          setFormPersonName("");
                          setFormStaffId("");
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                      >
                        রিসেট
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormRecipientType("Boss");
                        setFormPersonName("বস / মালিক (Boss)");
                        setFormStaffId("");
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        formRecipientType === "Boss"
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>👑</span>
                      <span>বস (Boss)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormRecipientType("Staff");
                        if (!formStaffId && staffList.length > 0) {
                          setFormStaffId(staffList[0].id || "");
                          setFormPersonName(staffList[0].name);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        formRecipientType === "Staff"
                          ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Users size={12} />
                      <span>স্টাফ (Staff)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormRecipientType("Passenger");
                        setFormStaffId("");
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        formRecipientType === "Passenger"
                          ? "bg-sky-600 text-white border-sky-700 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🎫</span>
                      <span>যাত্রী</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormRecipientType("Other");
                        setFormStaffId("");
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                        formRecipientType === "Other"
                          ? "bg-slate-700 text-white border-slate-800 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <User size={12} />
                      <span>অন্যান্য</span>
                    </button>
                  </div>

                  {/* If Staff is selected */}
                  {formRecipientType === "Staff" && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <label className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                        স্টাফ নির্বাচন করুন (Select Staff - e.g. আহাদ)
                      </label>
                      <select
                        value={formStaffId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormStaffId(val);
                          if (val === "custom") {
                            setFormPersonName("");
                          } else {
                            const s = staffList.find((st) => st.id === val);
                            if (s) setFormPersonName(s.name);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-purple-500 font-bold text-slate-800"
                      >
                        <option value="">স্টাফ তালিকা থেকে বেছে নিন...</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.designation || s.role})
                          </option>
                        ))}
                        <option value="custom">নতুন বা অন্য স্টাফের নাম লিখুন...</option>
                      </select>
                      {(formStaffId === "custom" || staffList.length === 0) && (
                        <input
                          type="text"
                          value={formPersonName}
                          onChange={(e) => setFormPersonName(e.target.value)}
                          placeholder="স্টাফের নাম লিখুন (যেমন: আহাদ)"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-purple-500 font-bold"
                        />
                      )}
                    </div>
                  )}

                  {/* If Passenger or Other */}
                  {(formRecipientType === "Passenger" ||
                    formRecipientType === "Other") && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <input
                        type="text"
                        value={formPersonName}
                        onChange={(e) => setFormPersonName(e.target.value)}
                        placeholder="ব্যক্তি, গ্রাহক বা প্রতিষ্ঠানের নাম লিখুন..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Purpose Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">
                    কোথায় আসছে / ব্যয় হচ্ছে (Ledger Purpose / Category)
                  </label>
                  <select
                    required
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 border-slate-200 rounded-xl p-3 text-xs outline-none transition-all cursor-pointer font-bold"
                  >
                    <option value="">নির্বাচন করুন...</option>
                    {formType === "Inflow"
                      ? incomeCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))
                      : expenseCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                    <option value="Other">
                      অন্যান্য খাত (Other Specific Purpose)
                    </option>
                  </select>
                </div>

                {/* 3b Custom purpose */}
                {formPurpose === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.2em] block">
                      নির্দিষ্ট খাতের নাম লিখুন (Identify Custom Sector)
                    </label>
                    <input
                      type="text"
                      required
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      placeholder="যেমন: ইন্টারনেট বিল, পানির বিল, টিকিট ক্রয় ইত্যাদি"
                      className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 border-slate-200 rounded-xl p-3 text-xs outline-none transition-all"
                    />
                  </motion.div>
                )}

                {/* Medical Commission Details Section */}
                <div className="bg-blue-50/40 border border-blue-100/75 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={15} className="text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        এটি কি মেডিকেল ও রেফারেন্স কমিশন হিসাব?
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isMedicalVoucher}
                        onChange={(e) => setIsMedicalVoucher(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 h-3 after:w-3 w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {isMedicalVoucher && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3.5 pt-2.5 border-t border-slate-200/50"
                    >
                      {/* Passenger Selection with Search */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          মেডিকেল যাত্রী (Passenger - সার্চ করুন)
                        </label>

                        {passengerId ? (
                          // Passenger Selected State Badge/Panel
                          <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-2-px h-6 bg-blue-500 rounded-full" />
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {passengerId === "custom"
                                    ? `${passengerName} (অন্যান্য যাত্রী)`
                                    : passengerName}
                                </p>
                                {passengerId !== "custom" && (
                                  <p className="text-[9px] text-slate-500 font-mono">
                                    {passengers.find(
                                      (p) => p.id === passengerId,
                                    )?.passportNumber
                                      ? `Passport: ${passengers.find((p) => p.id === passengerId)?.passportNumber}`
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPassengerId("");
                                setPassengerName("");
                                setPassengerSearchInput("");
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-all text-xs"
                              title="যাত্রী বাতিল করুন"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          // Search Input & Autocomplete dropdown State
                          <div className="relative">
                            <div className="relative">
                              <input
                                type="text"
                                value={passengerSearchInput}
                                onChange={(e) => {
                                  setPassengerSearchInput(e.target.value);
                                  setIsPassengerSearchDropdownOpen(true);
                                }}
                                onFocus={() =>
                                  setIsPassengerSearchDropdownOpen(true)
                                }
                                placeholder="যাত্রীর নাম, পাসপোর্ট নম্বর অথবা ফোন দিয়ে খুঁজুন..."
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-9 text-xs outline-none focus:border-blue-500 font-medium text-slate-800"
                              />
                              <Search
                                size={14}
                                className="absolute left-3 top-3 text-slate-400"
                              />
                              {passengerSearchInput && (
                                <button
                                  type="button"
                                  onClick={() => setPassengerSearchInput("")}
                                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            {isPassengerSearchDropdownOpen && (
                              <>
                                {/* Click outside handler/Backdrop */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() =>
                                    setIsPassengerSearchDropdownOpen(false)
                                  }
                                />
                                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-100">
                                  {filteredPassengersForSelect.length === 0 ? (
                                    <div className="p-3 text-center text-slate-400 text-xs font-light">
                                      কোন যাত্রী খুঁজে পাওয়া যায়নি।
                                    </div>
                                  ) : (
                                    filteredPassengersForSelect.map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          setPassengerId(p.id || "");
                                          setPassengerName(p.name || "");
                                          setIsPassengerSearchDropdownOpen(
                                            false,
                                          );
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer first:rounded-t-xl last:rounded-b-sm"
                                      >
                                        <span className="text-xs font-bold text-slate-800">
                                          {p.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                                          {p.passportNumber && (
                                            <span>
                                              Passport: {p.passportNumber}
                                            </span>
                                          )}
                                          {p.phone && (
                                            <span>Phone: {p.phone}</span>
                                          )}
                                        </div>
                                      </button>
                                    ))
                                  )}

                                  {/* Select Custom passenger manually option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPassengerId("custom");
                                      setPassengerName(
                                        passengerSearchInput || "",
                                      );
                                      setIsPassengerSearchDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-xs rounded-b-xl"
                                  >
                                    <PlusCircle
                                      size={14}
                                      className="text-blue-500"
                                    />
                                    <span>
                                      ম্যানুয়াল যাত্রী যোগ করুন{" "}
                                      {passengerSearchInput
                                        ? `"${passengerSearchInput}"`
                                        : ""}
                                    </span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {passengerId === "custom" && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider block">
                            যাত্রীর নাম লিখুন (Custom Passenger Name)
                          </label>
                          <input
                            type="text"
                            required
                            value={passengerName}
                            onChange={(e) => setPassengerName(e.target.value)}
                            placeholder="যাত্রীর পুরো নাম"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 font-medium"
                          />
                        </div>
                      )}

                      {/* Reference Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          রেফারেন্স স্টাফ/মার্কেটিং ম্যানেজার (Medical
                          Reference)
                        </label>
                        <select
                          value={medicalReferenceId}
                          onChange={(e) =>
                            handleReferenceChange(e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 font-medium text-slate-800"
                        >
                          <option value="">নির্বাচন করুন...</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.designation})
                            </option>
                          ))}
                          <option value="custom">
                            নতুন/অন্যান্য রেফারেন্স (Manual Name)
                          </option>
                        </select>
                      </div>

                      {medicalReferenceId === "custom" && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider block">
                            রেফারেন্সের নাম লিখুন (Custom Reference Name)
                          </label>
                          <input
                            type="text"
                            required
                            value={medicalReferenceName}
                            onChange={(e) =>
                              setMedicalReferenceName(e.target.value)
                            }
                            placeholder="রেফারেন্স ব্যক্তি/কোম্পানির নাম"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {/* Referrer & Auto-Commission Calculator Card */}
                      <div className="bg-slate-100/60 border border-slate-200/50 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            কমিশন হিসাব পদ্ধতি (Commission Rules)
                          </span>
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs text-[9px] font-extrabold">
                            <button
                              type="button"
                              onClick={() => setCommissionCalcMode("auto")}
                              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                                commissionCalcMode === "auto"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Auto %
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommissionCalcMode("manual")}
                              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                                commissionCalcMode === "manual"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Manual
                            </button>
                          </div>
                        </div>

                        {commissionCalcMode === "auto" && (
                          <div className="space-y-2.5 animate-fade-in">
                            <div className="grid grid-cols-5 gap-1">
                              {["10", "15", "20", "25"].map((percent) => {
                                const isSelected =
                                  commissionRatePercent === percent;
                                return (
                                  <button
                                    key={percent}
                                    type="button"
                                    onClick={() =>
                                      setCommissionRatePercent(percent)
                                    }
                                    className={`py-1.5 px-1 rounded-lg text-center font-mono font-bold text-[10px] border cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-blue-50 border-blue-400 text-blue-600 shadow-sm shadow-blue-50"
                                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                                    }`}
                                  >
                                    {percent}%
                                  </button>
                                );
                              })}

                              {/* Custom % Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    !["10", "15", "20", "25"].includes(
                                      commissionRatePercent,
                                    )
                                  ) {
                                    // already customized
                                  } else {
                                    setCommissionRatePercent("30"); // Default custom start value
                                  }
                                }}
                                className={`py-1.5 px-1 rounded-lg text-center font-bold text-[10px] border cursor-pointer transition-all ${
                                  !["10", "15", "20", "25"].includes(
                                    commissionRatePercent,
                                  )
                                    ? "bg-blue-50 border-blue-400 text-blue-600 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                                }`}
                              >
                                Custom
                              </button>
                            </div>

                            {!["10", "15", "20", "25"].includes(
                              commissionRatePercent,
                            ) && (
                              <div className="flex items-center gap-1.5 animate-fade-in bg-white border border-slate-200/50 p-2 rounded-lg">
                                <label className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider whitespace-nowrap">
                                  পার্সেন্টেজ (%) দিন:
                                </label>
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    value={commissionRatePercent}
                                    onChange={(e) =>
                                      setCommissionRatePercent(e.target.value)
                                    }
                                    placeholder="ভিন্ন পার্সেন্ট লিখুন"
                                    min="0"
                                    max="100"
                                    step="any"
                                    className="w-full bg-slate-50 border border-slate-200 rounded p-1 pr-6 text-2xs font-mono font-bold outline-none focus:border-blue-500"
                                  />
                                  <span className="absolute right-2 top-1 font-bold text-slate-400 text-2xs">
                                    %
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Dynamically display auto calculation values */}
                            <div className="bg-white border border-slate-150 rounded-lg p-2.5 flex items-center justify-between text-[10px] font-sans">
                              <span className="text-slate-450 font-bold">
                                ভাউচার অ্যামাউন্টের{" "}
                                <strong className="text-blue-600 font-mono">
                                  {commissionRatePercent}%
                                </strong>{" "}
                                (Auto calculated):
                              </span>
                              <span className="font-mono font-bold text-slate-700">
                                ৳
                                {(parseFloat(formAmount) || 0).toLocaleString()}{" "}
                                × {commissionRatePercent}% ={" "}
                                <strong className="text-blue-600 font-extrabold">
                                  ৳
                                  {Math.round(
                                    ((parseFloat(formAmount) || 0) *
                                      (parseFloat(commissionRatePercent) ||
                                        0)) /
                                      100,
                                  ).toLocaleString()}
                                </strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Commission Amount */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          রেফারেন্স কমিশন (Commission Amount in BDT)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={medicalCommission}
                            onChange={(e) => {
                              setMedicalCommission(e.target.value);
                              // If user updates manually, toggle to manual and save
                              setCommissionCalcMode("manual");
                            }}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-8 text-xs font-mono font-bold outline-none focus:border-blue-500"
                          />
                          <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">
                            ৳
                          </span>
                        </div>
                      </div>

                      {/* Medical Center & Actual Medical Cost */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            মেডিকেল সেন্টার (Medical Center)
                          </label>
                          <input
                            type="text"
                            value={formMedicalCenter}
                            onChange={(e) => setFormMedicalCenter(e.target.value)}
                            placeholder="যেমন: গুলশান মেডিকেয়ার, আল-নাহিয়ান"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            মেডিকেল খরচ (Actual Medical Cost BDT)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formMedicalCost}
                              onChange={(e) => setFormMedicalCost(e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="any"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-8 text-xs font-mono font-bold outline-none focus:border-blue-500"
                            />
                            <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">
                              ৳
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 4. Description Remarks Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] block">
                    অতিরিক্ত বিষয় / মন্তব্য (Remarks & Information)
                  </label>
                  <textarea
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="নাম, মোবাইল নম্বর বা অতিরিক্ত হিসাবের বিবরণ বিবরণীর অংশ হিসেবে লিখে রাখতে পারেন..."
                    rows={3}
                    className="w-full bg-slate-50 focus:bg-white border focus:border-blue-500 border-slate-200 rounded-xl p-3 text-xs outline-none transition-all resize-none"
                  />
                </div>

                {/* Footer and Submit actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingTx(null);
                    }}
                    className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X size={14} />
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    {editingTx
                      ? "ফেয়ারবদল করুন (Save Edit)"
                      : "হিসাব জমা দিন (Add Voucher)"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {showConfirmModal && pendingTxPayload && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) {
                  setShowConfirmModal(false);
                  setPendingTxPayload(null);
                }
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />

            {/* Custom Dialog Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-7 md:p-8 max-w-md w-full shadow-2xl relative z-[120] border-t-8 border-t-blue-500 overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <span className="p-3.5 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 shadow-sm inline-block">
                  <AlertTriangle className="animate-bounce" size={24} />
                </span>
                <div className="space-y-1 flex-1">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-sans">
                    {editingTx
                      ? "পরিবর্তন নিশ্চিত করুন"
                      : "নতুন এন্ট্রি নিশ্চিত করুন"}
                  </h3>
                  <h4 className="text-md font-black text-slate-900 mt-1">
                    {editingTx
                      ? "আপনি কি তথ্যগুলো ফেয়ারবদল করতে চান?"
                      : "সব তথ্য কি সঠিক আছে?"}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    ভাউচারটিতে নিচের তথ্যগুলো সংরক্ষিত হবে। অনুগ্রহ করে টাকার
                    অঙ্ক ও খাত ও বিবরণ মিলিয়ে নিন।
                  </p>
                </div>
              </div>

              {/* Transaction Highlight Summary Card */}
              <div
                className={`mt-6 rounded-2xl p-5 border ${
                  pendingTxPayload.type === "Inflow"
                    ? "bg-emerald-50/40 border-emerald-100/70"
                    : "bg-rose-50/30 border-rose-100/70"
                } space-y-3.5`}
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    লেনদেনের ধরণ:
                  </span>
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                      pendingTxPayload.type === "Inflow"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }`}
                  >
                    {pendingTxPayload.type === "Inflow"
                      ? "আয় / জমা (Inflow)"
                      : "ব্যয় / খরচ (Outflow)"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    ক্যাশ ভাউচার মূল্য:
                  </span>
                  <span
                    className={`text-lg font-mono font-black ${
                      pendingTxPayload.type === "Inflow"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ৳{pendingTxPayload.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap pt-0.5">
                    লেনদেনের খাত / উদ্দেশ্য:
                  </span>
                  <span className="text-xs font-black text-slate-800 text-right max-w-[200px] leading-tight">
                    {pendingTxPayload.purpose}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    ভাউচার তারিখ:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {pendingTxPayload.date}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap pt-0.5">
                    অতিরিক্ত বিবরণ/মন্তব্য:
                  </span>
                  <span className="text-xs font-semibold text-slate-600 text-right max-w-[185px] break-words">
                    {pendingTxPayload.remarks || "---"}
                  </span>
                </div>
              </div>

              {/* Confirm / Deny CTA */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingTxPayload(null);
                  }}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  ফিরে যান (Back)
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className={`px-6 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-md ${
                    pendingTxPayload.type === "Inflow"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} />
                  {isSubmitting
                    ? "প্রসেসিং হচ্ছে..."
                    : "হ্যাঁ, সংরক্ষণ করুন (Submit)"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Entry Calculator Modal */}
      <AnimatePresence>
        {isCalcModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCalcModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-7 md:p-8 max-w-xl w-full shadow-2xl relative z-10 space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50 shadow-sm">
                    <Calculator size={18} />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                      ক্যালকুলেটর এন্ট্রি (Quick Entry Calculator)
                    </h3>
                    <p className="text-[14px] font-black text-slate-900 mt-0.5">
                      মাল্টি-লাইন হিসাব যোগফল করুন
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCalcModalOpen(false);
                  }}
                  className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-450 hover:text-slate-600 rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Calculator Content Form */}
              <div className="space-y-5">
                {/* 1. Inflow / Outflow toggle & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      লেনদেনের ধরণ (Ledger Direction)
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("Inflow");
                          setCalcPurpose("");
                        }}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          calcType === "Inflow"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <ArrowDownLeft size={12} />
                        আয় / জমা
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("Outflow");
                          setCalcPurpose("");
                        }}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          calcType === "Outflow"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <ArrowUpRight size={12} />
                        ব্যয় / খরচ
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      ভাউচার তারিখ (Date)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={calcDate}
                        onChange={(e) => setCalcDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs outline-none transition-all"
                      />
                      <Calendar
                        size={13}
                        className="absolute left-3 top-3.5 text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Dynamic Line Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      হিসাব আইটেম তালিকা (Calculated Line Items)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCalcItem}
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      আইটেম যোগ করুন (Add Line)
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {calcItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) =>
                              handleUpdateCalcItem(
                                index,
                                "label",
                                e.target.value,
                              )
                            }
                            placeholder={`আইটেম #${index + 1} এর বিবরণ বা নাম`}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800 font-medium"
                          />
                        </div>
                        <div className="w-28 sm:w-36 relative">
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateCalcItem(
                                index,
                                "amount",
                                e.target.value,
                              )
                            }
                            placeholder="টাকা (BDT)"
                            min="0"
                            step="any"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-xs font-mono font-bold outline-none transition-all text-slate-800"
                          />
                          <span className="absolute left-3 top-3 font-semibold text-slate-400 text-xs">
                            ৳
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCalcItem(index)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <MinusCircle size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Live Total Amount Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      হিসাবকৃত মোট পরিমাণ:
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      মোট {calcItems.length} টি লাইনের যোগফল
                    </span>
                  </div>
                  <span
                    className={`text-xl font-mono font-black ${
                      calcType === "Inflow"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ৳{calcTotalAmount.toLocaleString()}
                  </span>
                </div>

                {/* 4. Purpose Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      আইটেমগুলোর ক্যাটাগরি (Purpose / Category)
                    </label>
                    <select
                      value={calcPurpose}
                      onChange={(e) => setCalcPurpose(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none transition-all cursor-pointer font-bold"
                    >
                      <option value="">নির্বাচন করুন...</option>
                      {calcType === "Inflow"
                        ? incomeCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))
                        : expenseCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      <option value="Other">
                        অন্যান্য খাত (Other Spec-purpose)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      অতিরিক্ত বিষয় / মন্তব্য (Overarching Remarks)
                    </label>
                    <input
                      type="text"
                      value={calcRemarks}
                      onChange={(e) => setCalcRemarks(e.target.value)}
                      placeholder="অতিরিক্ত সামগ্রিক বিবরণ বা মন্তব্য"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* 4b Custom purpose if "Other" is chosen */}
                {calcPurpose === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider block">
                      নির্দিষ্ট খাতের নাম লিখুন (Sector Identity)
                    </label>
                    <input
                      type="text"
                      required
                      value={calcCustomPurpose}
                      onChange={(e) => setCalcCustomPurpose(e.target.value)}
                      placeholder="যেমন: মাসিক ইন্টারনেট বিল, খুচরা মালামাল ক্রয় ইত্যাদি"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none transition-all"
                    />
                  </motion.div>
                )}

                {/* Footer and Submit/Apply actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalcModalOpen(false);
                    }}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    বাতিল (Close)
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApplyCalcToForm}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm border border-slate-200"
                    >
                      ফরম-এ পাঠান (Apply to Form)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDirectCalcSubmit(e)}
                      className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md ${
                        calcType === "Inflow"
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                          : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.5} />
                      জমা দিন (Submit)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
