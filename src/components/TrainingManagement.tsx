import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Calendar,
  FileText,
  Printer,
  Trash2,
  Edit3,
  GraduationCap,
  Users,
  User,
  ArrowRight,
  X,
  Sparkles,
  Filter,
  CircleDollarSign,
  TrendingUp,
  DollarSign,
  BookOpen,
  Percent,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TrainingService } from "../services/trainingService";
import { TrainingEnrollment, TrainingStatus } from "../types/training";
import { PrintService } from "../services/printService";
import { PassengerService } from "../services/passengerService";
import { PassengerType } from "../types/passenger";
import { auth } from "../lib/firebase";
import PhotoUploader from "./PhotoUploader";

export default function TrainingManagement() {
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TrainingStatus>(
    "All",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] =
    useState<TrainingEnrollment | null>(null);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [courseName, setCourseName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [admissionDate, setAdmissionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [status, setStatus] = useState<TrainingStatus>("Admitted");
  const [totalFee, setTotalFee] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Transfer states (Training to Visa section)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTrainee, setTransferTrainee] =
    useState<TrainingEnrollment | null>(null);
  const [transferCountry, setTransferCountry] = useState("South Korea");
  const [transferType, setTransferType] = useState<PassengerType>("Student");
  const [transferPassport, setTransferPassport] = useState("");
  const [transferInOut, setTransferInOut] = useState("In");
  const [transferAgentName, setTransferAgentName] = useState("");
  const [transferTrade, setTransferTrade] = useState("");

  // Manage quick enrollment payments
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentEnrollment, setPaymentEnrollment] =
    useState<TrainingEnrollment | null>(null);
  const [paymentAmountToAdd, setPaymentAmountToAdd] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = TrainingService.subscribeToEnrollments(setEnrollments);
    return unsubscribe;
  }, []);

  const openAddModal = () => {
    setEditingEnrollment(null);
    setStudentName("");
    setPhone("");
    setCourseName("");
    setBatchName("");
    setAdmissionDate(new Date().toISOString().split("T")[0]);
    setStatus("Admitted");
    setTotalFee(0);
    setPaidAmount(0);
    setReference("");
    setRemarks("");
    setPassportNumber("");
    setPhotoUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (enrollment: TrainingEnrollment) => {
    setEditingEnrollment(enrollment);
    setStudentName(enrollment.studentName);
    setPhone(enrollment.phone);
    setCourseName(enrollment.courseName);
    setBatchName(enrollment.batchName || "");
    setAdmissionDate(enrollment.admissionDate);
    setStatus(enrollment.status);
    setTotalFee(enrollment.totalFee);
    setPaidAmount(enrollment.paidAmount);
    setReference(enrollment.reference || "");
    setRemarks(enrollment.remarks || "");
    setPassportNumber(enrollment.passportNumber || "");
    setPhotoUrl(enrollment.photoUrl || "");
    setIsModalOpen(true);
  };

  const openAddPaymentModal = (enrollment: TrainingEnrollment) => {
    setPaymentEnrollment(enrollment);
    setPaymentAmountToAdd(0);
    setIsPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim() || !courseName.trim()) {
      alert("Trainee Name, Phone, and Course Name are required!");
      return;
    }

    const payload = {
      studentName: studentName.trim(),
      phone: phone.trim(),
      courseName: courseName.trim(),
      batchName: batchName.trim(),
      admissionDate,
      status,
      totalFee: Number(totalFee) || 0,
      paidAmount: Number(paidAmount) || 0,
      dueAmount: (Number(totalFee) || 0) - (Number(paidAmount) || 0),
      reference: reference.trim(),
      remarks: remarks.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      photoUrl: photoUrl,
    };

    try {
      if (editingEnrollment?.id) {
        await TrainingService.updateEnrollment(editingEnrollment.id, payload);
      } else {
        await TrainingService.addEnrollment(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error saving record: " + err.message);
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentEnrollment?.id) return;
    if (paymentAmountToAdd <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    const newPaidAmount =
      (paymentEnrollment.paidAmount || 0) + Number(paymentAmountToAdd);
    const newDueAmount = (paymentEnrollment.totalFee || 0) - newPaidAmount;

    if (newPaidAmount > paymentEnrollment.totalFee) {
      if (
        !confirm(
          "Warning: Recorded payment will exceed total course fee. Proceed?",
        )
      ) {
        return;
      }
    }

    try {
      await TrainingService.updateEnrollment(paymentEnrollment.id, {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        remarks:
          `${paymentEnrollment.remarks || ""}\n[Installment Paid: ৳${paymentAmountToAdd} on ${new Date().toLocaleDateString("en-US")}]`.trim(),
      });
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      alert("Payment submission failed: " + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete training enrollment for ${name}?`,
      )
    ) {
      try {
        await TrainingService.deleteEnrollment(id);
      } catch (err: any) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const handleOpenTransferModal = (en: TrainingEnrollment) => {
    setTransferTrainee(en);
    setTransferPassport(en.passportNumber || "");
    setTransferCountry("South Korea");
    setTransferType("Student");
    setTransferInOut("In");
    setTransferAgentName(en.reference || "TRAINING ACADEMY");
    setTransferTrade(en.courseName || "");
    setIsTransferModalOpen(true);
  };

  const handleTransferToVisaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTrainee) return;
    if (!transferPassport.trim()) {
      alert("Trainee Passport number is required to transfer to Visa Section.");
      return;
    }

    try {
      // Create new passenger
      await PassengerService.addPassenger({
        name: transferTrainee.studentName,
        phone: transferTrainee.phone,
        passportNumber: transferPassport.trim().toUpperCase(),
        inOut: transferInOut,
        tradeName: transferTrade || transferTrainee.courseName,
        agentName: transferAgentName || "TRAINING ACADEMY",
        agentNumber: "",
        reference: "ACADEMY PROMOTED",
        date: new Date().toISOString().split("T")[0],
        status: "Passport Submit",
        branch: "diabari",
        country: transferCountry,
        passengerType: transferType,
        documents: [],
        history: [
          {
            status: "Passport Submit",
            updatedBy: "Academy Manager",
            updatedByUid: "system",
            timestamp: new Date().toISOString(),
          },
        ],
        createdBy: auth.currentUser?.uid || "system",
        visaRate: 0,
        agentRate: 0,
        paidAmount: 0,
        dueAmount: 0,
      });

      // Update enrollment status to Completed if not already
      if (transferTrainee.id) {
        await TrainingService.updateEnrollment(transferTrainee.id, {
          status: "Completed",
          passportNumber: transferPassport.trim().toUpperCase(),
          remarks:
            `${transferTrainee.remarks || ""}\n[Transferred to Visa section on ${new Date().toLocaleDateString("en-US")}]`.trim(),
        });
      }

      alert(
        `Successfully transferred ${transferTrainee.studentName} to Visa & Passenger Processing list!`,
      );
      setIsTransferModalOpen(false);
    } catch (err: any) {
      alert("Transfer to visa section failed: " + err.message);
    }
  };

  // Filter & Sort Logics
  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((e) => {
      // 1. Search filter
      const text = searchQuery.toLowerCase().trim();
      const matchSearch =
        !text ||
        e.studentName.toLowerCase().includes(text) ||
        e.phone.includes(text) ||
        e.courseName.toLowerCase().includes(text) ||
        (e.reference && e.reference.toLowerCase().includes(text));

      // 2. Status filter
      const matchStatus = statusFilter === "All" || e.status === statusFilter;

      // 3. Date range filters
      const matchStart = !startDate || e.admissionDate >= startDate;
      const matchEnd = !endDate || e.admissionDate <= endDate;

      return matchSearch && matchStatus && matchStart && matchEnd;
    });
  }, [enrollments, searchQuery, statusFilter, startDate, endDate]);

  const stats = React.useMemo(() => {
    const total = filteredEnrollments.length;
    const running = filteredEnrollments.filter(
      (e) => e.status === "Running",
    ).length;
    const admitted = filteredEnrollments.filter(
      (e) => e.status === "Admitted",
    ).length;
    const completed = filteredEnrollments.filter(
      (e) => e.status === "Completed",
    ).length;

    const sumFee = filteredEnrollments.reduce(
      (acc, current) => acc + (current.totalFee || 0),
      0,
    );
    const sumPaid = filteredEnrollments.reduce(
      (acc, current) => acc + (current.paidAmount || 0),
      0,
    );
    const sumDue = filteredEnrollments.reduce(
      (acc, current) => acc + (current.dueAmount || 0),
      0,
    );

    return {
      total,
      running,
      admitted,
      completed,
      sumFee,
      sumPaid,
      sumDue,
    };
  }, [filteredEnrollments]);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Training Register & Admissions
            </h2>
            <p className="text-xs text-slate-500 font-light mt-1">
              ট্রেনিং কোর্সে ভর্তিকৃত ছাত্র-ছাত্রী ও ফি আদায়ের হিসাব নিকাশ খাতা।
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>নতুন ছাত্র ভর্তি (New Trainee)</span>
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 lg:gap-4">
        <MiniStatCard
          label="Total Trainees"
          value={stats.total}
          countLabel="জন ভর্তি"
          color="blue"
        />
        <MiniStatCard
          label="Running Batch"
          value={stats.running}
          countLabel="জন ক্লাস করছে"
          color="amber"
        />
        <MiniStatCard
          label="Admitted / Queued"
          value={stats.admitted}
          countLabel="জন অপেক্ষায়"
          color="sky"
        />
        <MiniStatCard
          label="Completed Sync"
          value={stats.completed}
          countLabel="জন কোর্স সম্পন্ন"
          color="emerald"
        />
        <MiniStatCard
          label="Total Course Fees"
          value={`৳${stats.sumFee.toLocaleString()}`}
          countLabel="মোট চুক্তিকৃত ফি"
          color="indigo"
        />
        <MiniStatCard
          label="Total Collected"
          value={`৳${stats.sumPaid.toLocaleString()}`}
          countLabel="আদায়কৃত নগদ অর্থ"
          color="emerald"
        />
        <MiniStatCard
          label="Outstanding Balance"
          value={`৳${stats.sumDue.toLocaleString()}`}
          countLabel="বকেয়া বাকি পাওনা"
          color="rose"
        />
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              placeholder="ছাত্রের নাম, ফোন নাম্বার দিয়ে সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-800 text-xs w-full focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-450 hover:text-slate-750"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none pr-3 py-1 font-semibold cursor-pointer"
            >
              <option value="All">সকল অবস্থা (All Status)</option>
              <option value="Admitted">Admitted</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Dropped Out">Dropped Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date from filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              From Date:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none font-medium cursor-pointer"
            />
            {startDate && (
              <X
                size={14}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                onClick={() => setStartDate("")}
              />
            )}
          </div>

          {/* Date to filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              To Date:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none font-medium cursor-pointer"
            />
            {endDate && (
              <X
                size={14}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                onClick={() => setEndDate("")}
              />
            )}
          </div>

          {/* Print Report Trigger */}
          <button
            onClick={() =>
              PrintService.printTrainingReport(
                filteredEnrollments,
                startDate,
                endDate,
              )
            }
            className="flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-400 bg-slate-900 text-blue-400 py-3 px-4.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Printer size={14} />
            <span>প্রিন্ট রিপোর্ট (Print Report)</span>
          </button>
        </div>
      </div>

      {/* Trainees Data Collection Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <GraduationCap
              size={44}
              className="text-slate-300 mx-auto animate-pulse"
            />
            <h4 className="font-display font-bold text-slate-700 text-xs uppercase tracking-widest">
              No Trainees Registered
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              নির্দিষ্ট খোঁজের ক্রাইটেরিয়া বা ডেটের ভেতর কোন ট্রেনিং ভর্তি পাওয়া
              যায়নি। নতুন এন্ট্রি করতে উপরে "নতুন ছাত্র ভর্তি" বাটন চাপুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-[9px] text-slate-450 font-black uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-4 px-4.5 w-12">ভর্তি ক্রম্বার (Serial)</th>
                  <th className="py-4 px-4.5">ছাত্রের বিবরণী (Student info)</th>
                  <th className="py-4 px-4.5">
                    কোর্স ও ব্যাচ (Course & Shift)
                  </th>
                  <th className="py-4 px-4.5">ভর্তির তারিখ (Adm Date)</th>
                  <th className="py-4 px-4.5">অবস্থা (Status)</th>
                  <th className="py-4 px-4.5 text-right">মোট ফি (Total Fee)</th>
                  <th className="py-4 px-4.5 text-right">জমাকৃত (Collected)</th>
                  <th className="py-4 px-4.5 text-right">বাকি (Due Balance)</th>
                  <th className="py-4 px-4.5 text-center">
                    অ্যাকশন (Operations)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((en, idx) => {
                  const statusColors: any = {
                    Admitted: "bg-blue-50 text-blue-700 border-blue-100",
                    Running: "bg-amber-50 text-amber-700 border-amber-100",
                    Completed:
                      "bg-emerald-50 text-emerald-700 border-emerald-100",
                    "Dropped Out":
                      "bg-purple-50 text-purple-700 border-purple-100",
                    Cancelled: "bg-rose-50 text-rose-700 border-rose-100",
                  };

                  return (
                    <tr
                      key={en.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="py-4 px-4.5 font-mono text-slate-400 font-bold">
                        #{String(idx + 1).padStart(3, "0")}
                      </td>
                      <td className="py-4 px-4.5">
                        <div className="flex items-center gap-3">
                          {en.photoUrl ? (
                            <img
                              src={en.photoUrl}
                              alt={en.studentName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                              <User size={15} />
                            </div>
                          )}
                          <div>
                            <div className="font-display font-bold text-slate-900 text-[13px]">
                              {en.studentName}
                            </div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                              {en.phone}
                            </div>
                            {en.passportNumber && (
                              <div className="text-blue-600 font-mono text-[10px] mt-0.5 font-bold flex items-center gap-1">
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-bold">
                                  Passport:
                                </span>
                                <span>{en.passportNumber}</span>
                              </div>
                            )}
                            {en.reference && (
                              <div className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                Ref: {en.reference}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4.5">
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                          <BookOpen size={11} className="text-blue-500" />
                          <span>{en.courseName}</span>
                        </div>
                        {en.batchName && (
                          <div className="text-slate-450 text-[10px] mt-1 font-medium">
                            Batch: {en.batchName}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4.5 font-mono font-medium text-slate-500 whitespace-nowrap">
                        {en.admissionDate}
                      </td>
                      <td className="py-4 px-4.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-full text-[9px] font-bold tracking-wider ${statusColors[en.status] || "bg-slate-50 text-slate-600 border-slate-100"}`}
                        >
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          {en.status}
                        </span>
                      </td>
                      <td className="py-4 px-4.5 font-mono font-bold text-right text-[12px] text-slate-800">
                        ৳{en.totalFee.toLocaleString()}
                      </td>
                      <td className="py-4 px-4.5 font-mono font-bold text-right text-[12px] text-emerald-600">
                        ৳{en.paidAmount.toLocaleString()}
                      </td>
                      <td
                        className={`py-4 px-4.5 font-mono font-black text-right text-[12px] ${en.dueAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        ৳{en.dueAmount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Add Cash Payment Portions */}
                          {en.dueAmount > 0 && (
                            <button
                              onClick={() => openAddPaymentModal(en)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer"
                              title="টাকা জমা নিন (Collect installment)"
                            >
                              <CircleDollarSign size={14} />
                            </button>
                          )}

                          {/* Print Slip Conf */}
                          <button
                            onClick={() => PrintService.printStudentReceipt(en)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all cursor-pointer"
                            title="ভর্তি রশিদ প্রিন্ট (Admission Slip Copy)"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Edit student */}
                          <button
                            onClick={() => openEditModal(en)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-200 transition-all cursor-pointer"
                            title="এডিট করুণ (Edit trainee)"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Transfer / Promote to Visa Processing */}
                          <button
                            onClick={() => handleOpenTransferModal(en)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-100 hover:border-emerald-250 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="ভিসা সেকশনে ট্রান্সফার (Transfer to Visa section)"
                          >
                            <ArrowRight
                              size={14}
                              className="text-emerald-500"
                            />
                            <span className="hidden xl:inline">Promote</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(en.id!, en.studentName)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 hover:border-red-200 transition-all cursor-pointer"
                            title="ডিলিট করুন (Delete)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Student Add/Edit Admission Drawer/Modal popup form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl z-10 border border-slate-100 space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">
                      {editingEnrollment
                        ? "অংশগ্রহণকারী ভর্তি এডিট করুন (Edit Admission)"
                        : "নতুন ছাত্র ভর্তি ফরম (New Admission)"}
                    </h3>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      NexTrip Training Academy Register
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-450 hover:text-slate-650 p-1 bg-slate-50 border border-slate-200/50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <PhotoUploader
                  label="ছাত্রের ছবি (Student Photo)"
                  photoUrl={photoUrl}
                  onPhotoUploaded={(url) => setPhotoUrl(url)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trainee Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ছাত্রের নাম (Trainee Name){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="উদা: MD KAMRUL ISLAM"
                      value={studentName}
                      onChange={(e) =>
                        setStudentName(e.target.value.toUpperCase())
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-bold uppercase"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ফোন নম্বর (Phone Number){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="উদা: 017xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    />
                  </div>

                  {/* Passport Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      পাসপোর্ট নম্বর (Passport Number)
                    </label>
                    <input
                      type="text"
                      placeholder="উদা: EF0123456"
                      value={passportNumber}
                      onChange={(e) =>
                        setPassportNumber(
                          e.target.value.toUpperCase().replace(/\s/g, ""),
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-805 font-bold"
                    />
                  </div>

                  {/* Course select / enter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      কোর্সের নাম (Course Subject){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer font-bold select-custom"
                    >
                      <option value="">নির্বাচন করুন (Select Subject)</option>
                      <option value="KOREAN LANGUAGE COURSE (EPS)">
                        KOREAN LANGUAGE COURSE (EPS)
                      </option>
                      <option value="PROFESSIONAL COMPUTER & IT CORE">
                        PROFESSIONAL COMPUTER & IT CORE
                      </option>
                      <option value="HEAVY / LIGHT CIVIL DRIVING LICENSE">
                        HEAVY / LIGHT CIVIL DRIVING LICENSE
                      </option>
                      <option value="TRAVEL AGENCY MANAGEMENT & BOOKING">
                        TRAVEL AGENCY MANAGEMENT & BOOKING
                      </option>
                      <option value="TAILORING & SEWING TRAINEE">
                        TAILORING & SEWING TRAINEE
                      </option>
                      <option value="OTHERS SPECIFIC TRAINING">
                        OTHERS SPECIFIC TRAINING
                      </option>
                    </select>
                  </div>

                  {/* Batch name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ব্যাচ / সময় (Batch / Shift Slot)
                    </label>
                    <input
                      type="text"
                      placeholder="উদা: EPS BATCH 04 (6.00 PM)"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    />
                  </div>

                  {/* Admission Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ভর্তির তারিখ (Admission Date)
                    </label>
                    <input
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer"
                    />
                  </div>

                  {/* Status Options */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ভর্তি অবস্থা (Trainee Status)
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as TrainingStatus)
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer font-bold"
                    >
                      <option value="Admitted">Admitted (আসন বরাদ্দ)</option>
                      <option value="Running">Running (ক্লাস চলমান)</option>
                      <option value="Completed">
                        Completed (কোর্স সম্পন্ন)
                      </option>
                      <option value="Dropped Out">
                        Dropped Out (বাতিল/ড্রপ)
                      </option>
                      <option value="Cancelled">
                        Cancelled (ফেরত/ভর্তি বাতিল)
                      </option>
                    </select>
                  </div>

                  {/* Total fee */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      মোট কোর্স ফি (Total Fee ৳){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="যেমন: 12000"
                      value={totalFee || ""}
                      onChange={(e) => setTotalFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-mono font-bold"
                    />
                  </div>

                  {/* Paid amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      জমাকৃত ক্যাশ অর্থ (Initial Paid ৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="যেমন: 5000"
                      value={paidAmount || ""}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-mono font-bold"
                    />
                  </div>

                  {/* Due amount visual confirmation */}
                  <div className="space-y-1 sm:col-span-2 bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        বাকি বকেয়া ফি (Calculated Due Balance)
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        স্বয়ংক্রিয় হিসাবকৃত অবশিষ্টাংশ
                      </p>
                    </div>
                    <div className="text-lg font-mono font-black text-rose-600">
                      ৳{((totalFee || 0) - (paidAmount || 0)).toLocaleString()}
                    </div>
                  </div>

                  {/* Sourced By / Reference */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                      রেফারেন্স / দালাল নাম (Sourced By / Scribe)
                    </label>
                    <input
                      type="text"
                      placeholder="উদা: AGENT MAMUN"
                      value={reference}
                      onChange={(e) =>
                        setReference(e.target.value.toUpperCase())
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 uppercase"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      বিশেষ মন্তব্য / নোট (Admission Notes)
                    </label>
                    <textarea
                      placeholder="কোর্স মেটেরিয়ালস বা কিস্তির পরিশোধ সময়ের বিস্তারিত তথ্য এখানে লিখতে পারেন..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 leading-relaxed resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all"
                  >
                    আদেশ বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 active:scale-98"
                  >
                    {editingEnrollment
                      ? "তথ্য আপডেট করুন (Save Changes)"
                      : "ভর্তি নিশ্চিত করুন (Confirm Admission)"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collect Portion / Payments Installment small dialog */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white max-w-sm w-full rounded-2xl p-6.5 shadow-2xl z-10 border border-slate-100 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={18} className="text-emerald-600" />
                  <h4 className="font-display font-bold text-slate-900 text-sm">
                    কিস্তি / টাকা আদায় (Collect Installment)
                  </h4>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {paymentEnrollment && (
                <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-650 space-y-1 border border-slate-200">
                    <div>
                      ছাত্র:{" "}
                      <strong className="text-slate-900">
                        {paymentEnrollment.studentName}
                      </strong>
                    </div>
                    <div>
                      কোর্স:{" "}
                      <strong className="text-slate-900">
                        {paymentEnrollment.courseName}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                      <span>
                        মোট কোর্স ফি:{" "}
                        <strong>৳{paymentEnrollment.totalFee}</strong>
                      </span>
                      <span className="text-rose-600">
                        অবশিষ্ট বকেয়া:{" "}
                        <strong>৳{paymentEnrollment.dueAmount}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      সংগৃহীত কিস্তির পরিমাণ (Cash installment Amount ৳){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={paymentEnrollment.dueAmount}
                      placeholder="যেমন: BDT 2000"
                      value={paymentAmountToAdd || ""}
                      onChange={(e) =>
                        setPaymentAmountToAdd(Number(e.target.value))
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-mono font-bold text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                    >
                      জমা সংরক্ষণ (Add Cash)
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trainee to Visa Section Promotion Modal */}
      <AnimatePresence>
        {isTransferModalOpen && transferTrainee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white max-w-lg w-full rounded-2xl p-6.5 shadow-2xl z-10 border border-slate-100 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ArrowRight
                    size={18}
                    className="text-emerald-500 animate-bounce"
                  />
                  <h4 className="font-display font-bold text-slate-900 text-sm">
                    ভিসা ফাইলে ট্র্যান্সফার (Promote Trainee to Visa System)
                  </h4>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-blue-50/60 text-xs text-blue-700/90 rounded-xl p-3 border border-blue-100 space-y-1">
                <p className="font-semibold text-[10px] text-blue-600 uppercase tracking-wider">
                  টোকেন রিলেশন (Trainee Reference)
                </p>
                <div>
                  ছাত্রের নাম:{" "}
                  <strong className="text-slate-900 font-bold">
                    {transferTrainee.studentName}
                  </strong>
                </div>
                <div>
                  ফোন নম্বর:{" "}
                  <strong className="text-slate-900 font-bold">
                    {transferTrainee.phone}
                  </strong>
                </div>
                <div>
                  ট্রেনিং কোর্স:{" "}
                  <strong className="text-slate-900 font-bold">
                    {transferTrainee.courseName}
                  </strong>
                </div>
              </div>

              <form onSubmit={handleTransferToVisaSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Passport number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      পাসপোর্ট নম্বর (Passport No){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: EE0123456"
                      value={transferPassport}
                      onChange={(e) =>
                        setTransferPassport(
                          e.target.value.toUpperCase().replace(/\s/g, ""),
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-8 w-full font-mono font-bold uppercase"
                    />
                  </div>

                  {/* Processing Country */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      প্রসেসিং দেশ (Target Country){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={transferCountry}
                      onChange={(e) => setTransferCountry(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-800 cursor-pointer font-bold"
                    >
                      <option value="South Korea">Korea (দক্ষিণ কোরিয়া)</option>
                      <option value="Japan">Japan (জাপান)</option>
                      <option value="Saudi Arabia">
                        Saudi Arabia (সৌদি আরব)
                      </option>
                      <option value="Malaysia">Malaysia (মালয়েশিয়া)</option>
                      <option value="Vietnam">Vietnam (ভিয়েতনাম)</option>
                      <option value="Romania">Romania (রোমানিয়া)</option>
                      <option value="Croatia">Croatia (ক্রোয়েশিয়া)</option>
                      <option value="United Kingdom">
                        United Kingdom (যুক্তরাজ্য)
                      </option>
                      <option value="United States">
                        United States (আমেরিকা)
                      </option>
                      <option value="Italy">Italy (ইতালি)</option>
                      <option value="Others-Global">
                        অন্যান্য দেশ / Others
                      </option>
                    </select>
                  </div>

                  {/* Passenger Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ভিসার ধরন (Passenger Category)
                    </label>
                    <select
                      value={transferType}
                      onChange={(e) =>
                        setTransferType(e.target.value as PassengerType)
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-800 cursor-pointer font-bold"
                    >
                      <option value="Student">Student (স্টুডেন্ট ভিসা)</option>
                      <option value="Worker">
                        Worker (এমপ্লয়মেন্ট কর্মী)
                      </option>
                      <option value="Tourist">
                        Tourist (ভ্রমণকারী/ট্যুরিস্ট)
                      </option>
                      <option value="Business Visitor">
                        Business (বিজনেস ক্যাটাগরি)
                      </option>
                      <option value="Family Visit">
                        Family (পারিবারিক ভিসা)
                      </option>
                      <option value="Others">Others (অন্যান্য)</option>
                    </select>
                  </div>

                  {/* Sourced Agent */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      প্রতিনিধি / এজেন্ট (Agent Scribe)
                    </label>
                    <input
                      type="text"
                      placeholder="অটো সেভড রেফারেন্স"
                      value={transferAgentName}
                      onChange={(e) =>
                        setTransferAgentName(e.target.value.toUpperCase())
                      }
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-800 uppercase"
                    />
                  </div>

                  {/* Trade / Skill name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ট্রেড নাম (Processing Trade / Sector)
                    </label>
                    <input
                      type="text"
                      value={transferTrade}
                      onChange={(e) =>
                        setTransferTrade(e.target.value.toUpperCase())
                      }
                      placeholder="যেমন: EPS KOREAN STUDENT / Driver"
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-80c uppercase"
                    />
                  </div>

                  {/* Ledger directions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      ডকুমেন্ট ফাইল (Direction)
                    </label>
                    <select
                      value={transferInOut}
                      onChange={(e) => setTransferInOut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-550 outline-none text-slate-800 cursor-pointer font-bold"
                    >
                      <option value="In">In (ভেতরে সংগৃহীত)</option>
                      <option value="Out">Out (বাইরে ফেরত বা রেফারেন্স)</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center text-[10px] text-slate-550">
                    <span className="font-semibold text-emerald-600 block mb-0.5">
                      💡 Visa System Auto Sync:
                    </span>
                    এন্ট্রিটি সরাসরি ভিসার "পাসপোর্ট জমাদান" সেকশনে চলে যাবে,
                    এবং শিক্ষার্থীর ট্রেনিং স্ট্যাটাস 'Completed' মার্ক করা হবে।
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold font-display uppercase rounded-xl border border-slate-200"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-display uppercase rounded-xl transition-all shadow-md active:scale-95"
                  >
                    ট্রান্সফার করুন (Confirm Promotion)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  countLabel,
  color,
}: {
  label: string;
  value: string | number;
  countLabel: string;
  color: string;
}) {
  const bgColors: any = {
    blue: "border-blue-100/70 shadow-blue-500/5",
    amber: "border-amber-100/70 shadow-amber-500/5",
    sky: "border-sky-100/70 shadow-sky-500/5",
    emerald: "border-emerald-100/70 shadow-emerald-500/5",
    indigo: "border-indigo-100/70 shadow-indigo-500/5",
    rose: "border-rose-100/70 shadow-rose-500/5",
  };

  const textColors: any = {
    blue: "text-blue-600",
    amber: "text-amber-600",
    sky: "text-sky-500",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    rose: "text-rose-600",
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-4.5 group ${bgColors[color] || "border-slate-200"} shadow-[0_2px_8px_-3px_rgba(15,23,42,0.03)] h-full flex flex-col justify-between`}
    >
      <div>
        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
          {label}
        </p>
        <p
          className={`text-xl font-display font-black tracking-tight mt-1 truncate ${textColors[color] || "text-slate-800"}`}
        >
          {value}
        </p>
      </div>
      <div className="text-[10px] text-slate-500 mt-2.5 font-medium border-t border-slate-100 pt-2 flex items-center justify-between">
        <span>{countLabel}</span>
      </div>
    </div>
  );
}
