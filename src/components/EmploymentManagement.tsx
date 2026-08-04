import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Calendar,
  IndianRupee,
  HandCoins,
  HelpCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  X,
  ArrowUpRight,
  Percent,
  Briefcase,
  Phone,
  Mail,
  CheckSquare,
  Minus,
  Check,
  Coins,
  Shield,
  ShieldAlert,
  UserCheck,
  Lock,
  History,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EmploymentService } from "../services/employmentService";
import { PrintService } from "../services/printService";
import {
  StaffMember,
  TimesheetEntry,
  AdvancePayment,
  SalarySheet,
  DailyAttendance,
} from "../types/employment";
import { useAuth } from "./AuthProvider";
import PhotoUploader from "./PhotoUploader";

export default function EmploymentManagement() {
  const { user, isAdmin } = useAuth();

  // Role simulation state (allows viewing & demonstrating different scopes)
  const [simulatedRole, setSimulatedRole] = useState<
    "Admin" | "Manager" | "Supervisor" | "Agent" | "Support Staff" | null
  >(null);

  const [activeTab, setActiveTab2] = useState<
    "directory" | "attendance" | "timesheets" | "advances" | "payroll"
  >("directory");

  // Database States
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [salaries, setSalaries] = useState<SalarySheet[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);

  // Daily attendance active tracker date
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(() => {
    // Bangladesh Local Time is UTC+6. Let's get today's date in YYYY-MM-DD
    const localD = new Date(Date.now() + 6 * 60 * 60 * 1000);
    return localD.toISOString().split("T")[0];
  });

  // Track expanded advance history for payroll list
  const [expandedStaffAdvancesId, setExpandedStaffAdvancesId] = useState<
    string | null
  >(null);

  // Authenticated/Resolved staff member associated by email (if exists)
  const currentUserStaffMember = useMemo(() => {
    if (!user?.email) return null;
    return staff.find(
      (s) => s.email?.toLowerCase() === user.email.toLowerCase(),
    );
  }, [staff, user]);

  // Actual active role used for rendering and controls
  const activeUserRole = useMemo(() => {
    if (simulatedRole) return simulatedRole;
    if (isAdmin) return "Admin";
    if (currentUserStaffMember?.role) return currentUserStaffMember.role;
    return "Agent"; // Default safe constraint
  }, [simulatedRole, currentUserStaffMember, isAdmin]);

  // The active staff id (representing the current user as an employee)
  const activeStaffId = useMemo(() => {
    return currentUserStaffMember?.id || null;
  }, [currentUserStaffMember]);

  // Search, Filters & Selections
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });

  // Modal Control States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Edit/Current Reference States
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form Field States
  const [staffFormData, setStaffFormData] = useState({
    name: "",
    designation: "",
    role: "Agent" as "Manager" | "Supervisor" | "Agent" | "Support Staff",
    assignedAgentId: "",
    email: "",
    phone: "",
    joiningDate: new Date().toISOString().split("T")[0],
    baseSalary: 15000,
    status: "Active" as "Active" | "Inactive",
    photoUrl: "",
  });

  const [advanceFormData, setAdvanceFormData] = useState({
    staffId: "",
    amount: 1000,
    date: new Date().toISOString().split("T")[0],
    purpose: "",
    repaymentStatus: "Pending Deduct" as
      | "Pending Deduct"
      | "Deducted"
      | "Waived",
  });

  const [timesheetFormData, setTimesheetFormData] = useState({
    staffId: "",
    monthYear: selectedMonth,
    daysPresent: 30,
    overtimeHours: 0,
    remarks: "",
  });

  const [salaryFormData, setSalaryFormData] = useState({
    staffId: "",
    monthYear: selectedMonth,
    baseSalary: 15000,
    allowance: 0,
    advanceDeducted: 0,
    netPayable: 15000,
    isPaid: true,
    remarks: "",
  });

  // Load Realtime Subscriptions
  useEffect(() => {
    const unsubStaff = EmploymentService.subscribeToStaff(setStaff);
    const unsubTimesheets =
      EmploymentService.subscribeToTimesheets(setTimesheets);
    const unsubAdvances = EmploymentService.subscribeToAdvances(setAdvances);
    const unsubSalaries = EmploymentService.subscribeToSalaries(setSalaries);
    const unsubDailyAttendance =
      EmploymentService.subscribeToDailyAttendance(setDailyAttendance);

    return () => {
      unsubStaff();
      unsubTimesheets();
      unsubAdvances();
      unsubSalaries();
      unsubDailyAttendance();
    };
  }, []);

  // Update month-year inputs when selector shifts
  useEffect(() => {
    setTimesheetFormData((prev) => ({ ...prev, monthYear: selectedMonth }));
    setSalaryFormData((prev) => ({ ...prev, monthYear: selectedMonth }));
  }, [selectedMonth]);

  // Sync staff editing data
  useEffect(() => {
    if (editingStaff) {
      setStaffFormData({
        name: editingStaff.name,
        designation: editingStaff.designation,
        role: editingStaff.role || "Agent",
        assignedAgentId: editingStaff.assignedAgentId || "",
        email: editingStaff.email || "",
        phone: editingStaff.phone || "",
        joiningDate: editingStaff.joiningDate,
        baseSalary: editingStaff.baseSalary,
        status: editingStaff.status,
        photoUrl: editingStaff.photoUrl || "",
      });
    } else {
      setStaffFormData({
        name: "",
        designation: "",
        role: "Agent",
        assignedAgentId: "",
        email: "",
        phone: "",
        joiningDate: new Date().toISOString().split("T")[0],
        baseSalary: 15000,
        status: "Active",
        photoUrl: "",
      });
    }
  }, [editingStaff, isStaffModalOpen]);

  // Autocalculate remaining parameters if staff or timesheet changes inside salary form
  useEffect(() => {
    const targetStaff = staff.find((s) => s.id === salaryFormData.staffId);
    if (!targetStaff) return;

    // Get present days count from timesheet
    const matchingTimesheet = timesheets.find(
      (t) =>
        t.staffId === salaryFormData.staffId && t.monthYear === selectedMonth,
    );
    const daysPresent = matchingTimesheet ? matchingTimesheet.daysPresent : 30; // default to full month (30 days)
    const otHours = matchingTimesheet
      ? matchingTimesheet.overtimeHours || 0
      : 0;

    // OT hourly rate: roughly based on baseSalary / 240 hours
    const calculatedOtAllowance = Math.round(
      otHours * ((targetStaff.baseSalary / 240) * 1.5),
    );

    // Get Total Pending Advances for this staff
    const matchingAdvances = advances.filter(
      (a) =>
        a.staffId === salaryFormData.staffId &&
        a.repaymentStatus === "Pending Deduct",
    );
    const totalPendingAdv = matchingAdvances.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // Limit deduction to smaller of total advances or half of gross income
    const partialGross =
      Math.round(targetStaff.baseSalary * (daysPresent / 30)) +
      calculatedOtAllowance;
    const suggestedDeduction = Math.min(
      totalPendingAdv,
      Math.round(partialGross * 0.5),
    );

    const netPayable = partialGross - suggestedDeduction;

    setSalaryFormData((prev) => ({
      ...prev,
      baseSalary: targetStaff.baseSalary,
      allowance: calculatedOtAllowance,
      advanceDeducted: suggestedDeduction,
      netPayable: Math.max(0, netPayable),
    }));
  }, [salaryFormData.staffId, selectedMonth, staff, timesheets, advances]);

  // Filtered lists
  const filteredStaff = useMemo(() => {
    return staff.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm)),
    );
  }, [staff, searchTerm]);

  // Aggregate pending advance values per staff member or overall
  const pendingAdvancesTotal = useMemo(() => {
    return advances
      .filter((a) => a.repaymentStatus === "Pending Deduct")
      .reduce((sum, current) => sum + current.amount, 0);
  }, [advances]);

  // Overall staff costs (Monthly Base Salaries)
  const totalBaseSalaryCost = useMemo(() => {
    return staff
      .filter((s) => s.status === "Active")
      .reduce((sum, current) => sum + current.baseSalary, 0);
  }, [staff]);

  const paidSalariesThisMonth = useMemo(() => {
    return salaries
      .filter((s) => s.monthYear === selectedMonth && s.isPaid)
      .reduce((sum, current) => sum + current.netPayable, 0);
  }, [salaries, selectedMonth]);

  // List of active staff for the Daily Attendance trackings
  const visibleAttendanceStaff = useMemo(() => {
    return staff.filter((member) => {
      if (member.status !== "Active") return false;
      if (
        activeUserRole === "Admin" ||
        activeUserRole === "Manager" ||
        activeUserRole === "Supervisor"
      ) {
        return true;
      }
      if (activeUserRole === "Agent") {
        return (
          member.assignedAgentId === activeStaffId ||
          member.id === activeStaffId
        );
      }
      if (activeUserRole === "Support Staff") {
        return member.id === activeStaffId;
      }
      return false;
    });
  }, [staff, activeUserRole, activeStaffId]);

  // Attendance for the chosen selected attendance date
  const attendanceForSelectedDate = useMemo(() => {
    return dailyAttendance.filter((a) => a.date === selectedAttendanceDate);
  }, [dailyAttendance, selectedAttendanceDate]);

  // Combined daily attendance stats for rendering metrics counters
  const dailyStats = useMemo(() => {
    const recordsForDate = attendanceForSelectedDate.filter((a) =>
      visibleAttendanceStaff.some((s) => s.id === a.staffId),
    );
    const presents = recordsForDate.filter(
      (r) => r.status === "Present",
    ).length;
    const lates = recordsForDate.filter((r) => r.status === "Late").length;
    const absents = recordsForDate.filter((r) => r.status === "Absent").length;
    const halfs = recordsForDate.filter((r) => r.status === "Half Day").length;
    const leaves = recordsForDate.filter((r) => r.status === "On Leave").length;
    const totalCount = visibleAttendanceStaff.length;
    const unprocessed = totalCount - recordsForDate.length;
    return { presents, lates, absents, halfs, leaves, totalCount, unprocessed };
  }, [attendanceForSelectedDate, visibleAttendanceStaff]);

  // Permission validator for editing daily attendance
  const canEditAttendanceOf = (
    memberId: string,
    memberAssignedAgentId?: string,
  ) => {
    if (
      activeUserRole === "Admin" ||
      activeUserRole === "Manager" ||
      activeUserRole === "Supervisor"
    ) {
      return true;
    }
    if (activeUserRole === "Agent") {
      return (
        memberAssignedAgentId === activeStaffId || memberId === activeStaffId
      );
    }
    if (activeUserRole === "Support Staff") {
      return memberId === activeStaffId;
    }
    return false;
  };

  // Perform Firestore daily attendance update
  const handleDailyAttendanceChange = async (
    staffId: string,
    status: DailyAttendance["status"],
    checkIn?: string,
    remark?: string,
  ) => {
    try {
      const existingLog = dailyAttendance.find(
        (a) => a.staffId === staffId && a.date === selectedAttendanceDate,
      );
      await EmploymentService.saveDailyAttendance({
        staffId,
        date: selectedAttendanceDate,
        status,
        checkInTime:
          checkIn !== undefined ? checkIn : existingLog?.checkInTime || "",
        remarks: remark !== undefined ? remark : existingLog?.remarks || "",
      });
    } catch (err: any) {
      console.error("Failed to record attendance state:", err);
    }
  };

  // helper to get monthly statistics for a staff member to assist timesheets
  const getMonthAttendanceStats = (staffId: string, monthYear: string) => {
    const records = dailyAttendance.filter(
      (a) => a.staffId === staffId && a.date.startsWith(monthYear),
    );
    const presents = records.filter((a) => a.status === "Present").length;
    const lates = records.filter((a) => a.status === "Late").length;
    const halfs = records.filter((a) => a.status === "Half Day").length;
    const absents = records.filter((a) => a.status === "Absent").length;
    const leaves = records.filter((a) => a.status === "On Leave").length;
    const calculatedPresentDays = presents + lates + halfs * 0.5;
    return {
      recordsCount: records.length,
      presents,
      lates,
      halfs,
      absents,
      leaves,
      calculatedPresentDays,
    };
  };

  // Action: Add/Update Staff Member
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name.trim() || !staffFormData.designation.trim()) {
      alert("Name and Designation are required.");
      return;
    }

    try {
      if (editingStaff?.id) {
        await EmploymentService.updateStaff(editingStaff.id, staffFormData);
      } else {
        await EmploymentService.addStaff(staffFormData);
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
    } catch (err: any) {
      alert(`Staff update failed: ${err.message}`);
    }
  };

  // Action: Record Advance payment
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceFormData.staffId) {
      alert("Please select a staff member.");
      return;
    }
    try {
      await EmploymentService.addAdvance(advanceFormData);
      setIsAdvanceModalOpen(false);
      setAdvanceFormData((prev) => ({ ...prev, amount: 1000, purpose: "" }));
    } catch (err: any) {
      alert(`Failed to add advance record: ${err.message}`);
    }
  };

  // Action: Timesheet save
  const handleTimesheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetFormData.staffId) {
      alert("Please select a staff member");
      return;
    }
    try {
      await EmploymentService.saveTimesheet(timesheetFormData);
      setIsTimesheetModalOpen(false);
      alert("Timesheet attendance logged successfully.");
    } catch (err: any) {
      alert(`Timesheet saving failed: ${err.message}`);
    }
  };

  // Action: Salary Sheet distribution save
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryFormData.staffId) {
      alert("Please select a staff member to compute payroll");
      return;
    }
    try {
      await EmploymentService.saveSalarySheet(salaryFormData);

      // If advances are deducted, resolve their database status optionally
      if (salaryFormData.advanceDeducted > 0) {
        const staffAdvances = advances.filter(
          (a) =>
            a.staffId === salaryFormData.staffId &&
            a.repaymentStatus === "Pending Deduct",
        );
        let deductionPool = salaryFormData.advanceDeducted;
        for (const adv of staffAdvances) {
          if (deductionPool <= 0) break;
          // Mark this individual loan record as Deducted
          await EmploymentService.updateAdvanceStatus(adv.id!, "Deducted");
          deductionPool -= adv.amount;
        }
      }

      setIsSalaryModalOpen(false);
      alert("Salary Sheet registered and payment finalized successfully!");
    } catch (err: any) {
      alert(`Failed to save salary details: ${err.message}`);
    }
  };

  // Helper mappings
  const staffNameMap = useMemo(() => {
    const m = new Map<string, string>();
    staff.forEach((s) => m.set(s.id!, s.name));
    return m;
  }, [staff]);

  const staffDesignationMap = useMemo(() => {
    const m = new Map<string, string>();
    staff.forEach((s) => m.set(s.id!, s.designation));
    return m;
  }, [staff]);

  // Compute timesheet state matrix for view with Role-Based filtering
  const timesheetMatrix = useMemo(() => {
    const visibleStaff = staff.filter((member) => {
      if (
        activeUserRole === "Admin" ||
        activeUserRole === "Manager" ||
        activeUserRole === "Supervisor"
      ) {
        return true;
      }
      if (activeUserRole === "Agent") {
        // Only manage/view assigned staff's timesheets, or their own
        return (
          member.assignedAgentId === activeStaffId ||
          member.id === activeStaffId
        );
      }
      if (activeUserRole === "Support Staff") {
        return member.id === activeStaffId;
      }
      return false;
    });

    return visibleStaff.map((member) => {
      const entry = timesheets.find(
        (t) => t.staffId === member.id && t.monthYear === selectedMonth,
      );
      return {
        member,
        logged: !!entry,
        daysPresent: entry ? entry.daysPresent : "Unrecorded (30 Days default)",
        overtimeHours: entry ? entry.overtimeHours : 0,
        remarks: entry ? entry.remarks : "",
      };
    });
  }, [staff, timesheets, selectedMonth, activeUserRole, activeStaffId]);

  // Dynamic salary sheets combined report
  const computedPayrollReport = useMemo(() => {
    return staff.map((member) => {
      // Check if logged in firebase
      const loggedSheet = salaries.find(
        (s) => s.staffId === member.id && s.monthYear === selectedMonth,
      );

      // Look up timesheet info
      const matchingTimesheet = timesheets.find(
        (t) => t.staffId === member.id && t.monthYear === selectedMonth,
      );
      const days = matchingTimesheet ? matchingTimesheet.daysPresent : 30;
      const ot = matchingTimesheet ? matchingTimesheet.overtimeHours || 0 : 0;

      return {
        member,
        loggedSheet,
        daysPresent: days,
        overtimeHours: ot,
        status: loggedSheet
          ? loggedSheet.isPaid
            ? "Paid"
            : "Unpaid Documented"
          : "Draft Setup",
      };
    });
  }, [staff, salaries, timesheets, selectedMonth]);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Internal Staff & Salary
            </h2>
            <p className="text-xs text-slate-500 font-light mt-1">
              Administer agency staff roles, record monthly work logs,
              distribute advances (Ogrim), and generate salary slips.
            </p>
          </div>
        </div>

        {/* Global Month Selection controls */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 self-start sm:self-auto">
          <Calendar size={14} className="text-slate-400 ml-1.5" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1.5"
            title="Focus Payroll Month"
          />
        </div>
      </div>

      {/* Role Security & Simulation Monitor */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                RBAC Security Monitor
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Active Policy
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Current resolved role:{" "}
              <span className="font-bold text-slate-800 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                {activeUserRole}
              </span>
              {currentUserStaffMember
                ? ` (linked to profile: ${currentUserStaffMember.name} - ${currentUserStaffMember.designation})`
                : isAdmin
                  ? " (Super Administrator access)"
                  : " (Guest Fallback)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-xl">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">
            Simulation Override:
          </span>
          <select
            value={simulatedRole || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSimulatedRole(val ? (val as any) : null);
              if (val === "Agent" || val === "Support Staff") {
                // If switching to Agent, auto-navigate to a tab they can see
                setActiveTab2("timesheets");
              } else {
                setActiveTab2("directory");
              }
            }}
            className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1.5 focus:ring-0"
          >
            <option value="">No Override (Auto-Detect)</option>
            <option value="Admin">Admin (Full Control)</option>
            <option value="Manager">Manager (Payroll & Advances)</option>
            <option value="Supervisor">
              Supervisor (Directory & Timesheets)
            </option>
            <option value="Agent">
              Agent (Assigned Staff Timesheets Only)
            </option>
            <option value="Support Staff">
              Support Staff (Read-Only Directory)
            </option>
          </select>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
              Office Staff Count
            </span>
            <span className="text-2xl font-bold text-slate-800">
              {staff.length} Members
            </span>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
            <Users size={22} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
          {activeUserRole === "Admin" || activeUserRole === "Manager" ? (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Gross Base Pay obligation
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  ৳{totalBaseSalaryCost.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
                <Briefcase size={22} strokeWidth={2} />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Gross Base Pay obligation
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                  <Lock size={12} /> Restricted (Manager)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 text-slate-350 rounded-xl border border-slate-100">
                <Lock size={20} />
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
          {activeUserRole === "Admin" || activeUserRole === "Manager" ? (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Advances Outstanding (Ogrim Tk)
                </span>
                <span className="text-2xl font-bold text-red-500">
                  ৳{pendingAdvancesTotal.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 bg-red-50 text-rose-600 rounded-xl border border-rose-100/50">
                <HandCoins size={22} strokeWidth={2} />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Advances Outstanding
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                  <Lock size={12} /> Restricted (Manager)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 text-slate-350 rounded-xl border border-slate-100">
                <Lock size={20} />
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
          {activeUserRole === "Admin" || activeUserRole === "Manager" ? (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Disbursed net salary ({selectedMonth})
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  ৳{paidSalariesThisMonth.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
                <Coins size={22} strokeWidth={2} />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Disbursed net salary
                </span>
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                  <Lock size={12} /> Restricted (Manager)
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 text-slate-350 rounded-xl border border-slate-100">
                <Lock size={20} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Menu Controls bar */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab2("directory")}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "directory"
              ? "text-emerald-600"
              : "text-slate-450 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={14} />
            Staff Directory
          </div>
          {activeTab === "directory" && (
            <motion.div
              layoutId="staffTabLine"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab2("attendance")}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "attendance"
              ? "text-emerald-600"
              : "text-slate-450 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            Daily Attendance (হাজিরা)
          </div>
          {activeTab === "attendance" && (
            <motion.div
              layoutId="staffTabLine"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab2("timesheets")}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "timesheets"
              ? "text-emerald-600"
              : "text-slate-450 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={14} />
            Timesheets (Attendance)
          </div>
          {activeTab === "timesheets" && (
            <motion.div
              layoutId="staffTabLine"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
            />
          )}
        </button>

        {activeUserRole === "Admin" || activeUserRole === "Manager" ? (
          <button
            onClick={() => setActiveTab2("advances")}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === "advances"
                ? "text-emerald-600"
                : "text-slate-450 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <HandCoins size={14} />
              Advance Payments (Ogrim)
            </div>
            {activeTab === "advances" && (
              <motion.div
                layoutId="staffTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              />
            )}
          </button>
        ) : (
          <button
            disabled
            className="pb-3.5 text-xs font-bold uppercase tracking-wider text-slate-350 cursor-not-allowed flex items-center gap-2"
            title="Restricted to Manager/Admin roles"
          >
            <Lock size={12} className="text-slate-400" />
            <HandCoins size={14} className="text-slate-300" />
            <span>Advance Payments (Ogrim)</span>
          </button>
        )}

        {activeUserRole === "Admin" || activeUserRole === "Manager" ? (
          <button
            onClick={() => setActiveTab2("payroll")}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === "payroll"
                ? "text-emerald-600"
                : "text-slate-450 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <IndianRupee size={14} />
              Salary Sheets
            </div>
            {activeTab === "payroll" && (
              <motion.div
                layoutId="staffTabLine"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              />
            )}
          </button>
        ) : (
          <button
            disabled
            className="pb-3.5 text-xs font-bold uppercase tracking-wider text-slate-350 cursor-not-allowed flex items-center gap-2"
            title="Restricted to Manager/Admin roles"
          >
            <Lock size={12} className="text-slate-400" />
            <IndianRupee size={14} className="text-slate-300" />
            <span>Salary Sheets</span>
          </button>
        )}
      </div>

      {/* RENDER ACTIVE TAB */}
      <div>
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Top Bar with Date Selector and stats */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_2px_8px_rgba(15,23,42,0.01)] flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <UserCheck size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">
                    দৈনিক অফিসার হাজিরা ও উপস্থিতি ট্র্যাকার (Daily Attendance
                    Logs)
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 font-light pl-8">
                  Select any custom calendar date to view, record, or update
                  staff daily logs instantly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Calendar
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    type="date"
                    value={selectedAttendanceDate}
                    onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const localD = new Date(Date.now() + 6 * 60 * 60 * 1000);
                    setSelectedAttendanceDate(
                      localD.toISOString().split("T")[0],
                    );
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar size={13} />
                  আজকের তারিখ (Today)
                </button>
              </div>
            </div>

            {/* Attendance Analytics Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  সক্রিয় স্টাফ (Active Staff)
                </span>
                <span className="text-2xl font-extrabold text-slate-800 mt-2 block">
                  {dailyStats.totalCount} জন
                </span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[8.5px] font-bold text-emerald-600 uppercase tracking-wider block">
                  হাজির (Present)
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-2 block">
                  {dailyStats.presents} জন
                </span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[8.5px] font-bold text-amber-600 uppercase tracking-wider block">
                  বিলম্ব (Late Entries)
                </span>
                <span className="text-2xl font-extrabold text-amber-700 mt-2 block">
                  {dailyStats.lates} জন
                </span>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[8.5px] font-bold text-rose-500 uppercase tracking-wider block">
                  অনুপস্থিত (Absent)
                </span>
                <span className="text-2xl font-extrabold text-rose-700 mt-2 block">
                  {dailyStats.absents} জন
                </span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[8.5px] font-bold text-indigo-600 uppercase tracking-wider block">
                  অর্ধ দিবস (Half Day)
                </span>
                <span className="text-2xl font-extrabold text-indigo-800 mt-2 block">
                  {dailyStats.halfs} জন
                </span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[8.5px] font-bold text-blue-600 uppercase tracking-wider block">
                  ছুটি (On Leave)
                </span>
                <span className="text-2xl font-extrabold text-blue-700 mt-2 block">
                  {dailyStats.leaves} জন
                </span>
              </div>
            </div>

            {/* Attendance Main Table */}
            <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="py-4.5 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                        স্টাফ মেম্বার (Employee Name)
                      </th>
                      <th className="py-4.5 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-center">
                        উপস্থিতি স্টেটাস (Attendance Status Action)
                      </th>
                      <th className="py-4.5 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-450 w-44">
                        প্রবেশের সময় (Check-In)
                      </th>
                      <th className="py-4.5 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                        মন্তব্য (Remarks & Reasons)
                      </th>
                      <th className="py-4.5 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-450 text-right w-24">
                        লাস্ট আপডেট (Log Status)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleAttendanceStaff.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-xs font-semibold text-slate-400 italic"
                        >
                          No active staff members visible under current role
                          scope context.
                        </td>
                      </tr>
                    ) : (
                      visibleAttendanceStaff.map((member) => {
                        const log = attendanceForSelectedDate.find(
                          (a) => a.staffId === member.id,
                        );
                        const isEditable = canEditAttendanceOf(
                          member.id!,
                          member.assignedAgentId,
                        );

                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-slate-50/20 transition-colors"
                          >
                            {/* Staff Name & Designation */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-850">
                                  {member.name}
                                </p>
                                {member.role && (
                                  <span className="text-[8.5px] font-sans font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/40 uppercase tracking-wider">
                                    {member.role}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9.5px] text-slate-450 capitalize mt-0.5">
                                {member.designation}
                              </p>
                            </td>

                            {/* Attendance Buttons or Indicators */}
                            <td className="py-4.5 px-6">
                              {isEditable ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        "Present",
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border duration-150 cursor-pointer ${
                                      log?.status === "Present"
                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 shadow-sm"
                                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-350 text-slate-500"
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        "Late",
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border duration-150 cursor-pointer ${
                                      log?.status === "Late"
                                        ? "bg-amber-500/10 border-amber-500 text-amber-700 shadow-sm"
                                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-350 text-slate-500"
                                    }`}
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        "Absent",
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border duration-150 cursor-pointer ${
                                      log?.status === "Absent"
                                        ? "bg-rose-500/10 border-rose-500 text-rose-700 shadow-sm"
                                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-350 text-slate-500"
                                    }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        "Half Day",
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border duration-150 cursor-pointer ${
                                      log?.status === "Half Day"
                                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-700 shadow-sm"
                                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-350 text-slate-500"
                                    }`}
                                  >
                                    Half Day
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        "On Leave",
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border duration-150 cursor-pointer ${
                                      log?.status === "On Leave"
                                        ? "bg-blue-500/10 border-blue-500 text-blue-700 shadow-sm"
                                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-350 text-slate-500"
                                    }`}
                                  >
                                    Leave
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  {log?.status ? (
                                    <span
                                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                                        log.status === "Present"
                                          ? "bg-emerald-500/10 border-emerald-200 text-emerald-700"
                                          : log.status === "Late"
                                            ? "bg-amber-500/10 border-amber-200 text-amber-700"
                                            : log.status === "Absent"
                                              ? "bg-rose-500/10 border-rose-200 text-rose-700"
                                              : log.status === "Half Day"
                                                ? "bg-indigo-505/10 border-indigo-200 text-indigo-700"
                                                : "bg-blue-500/10 border-blue-200 text-blue-700"
                                      }`}
                                    >
                                      {log.status === "Present" &&
                                        "✔️ Present (হাজির)"}
                                      {log.status === "Late" &&
                                        "⏰ Late (বিলম্ব)"}
                                      {log.status === "Absent" &&
                                        "❌ Absent (অনুপস্থিত)"}
                                      {log.status === "Half Day" &&
                                        "🌓 Half Day (অর্ধ দিবস)"}
                                      {log.status === "On Leave" &&
                                        "🌴 On Leave (ছুটি)"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-450 italic bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                                      Not Logged (হাজিরা নেই)
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Check-In time input field */}
                            <td className="py-4.5 px-6">
                              {isEditable ? (
                                <div className="flex items-center bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 focus-within:border-emerald-500 focus-within:bg-white rounded-xl transition-all">
                                  <input
                                    type="text"
                                    placeholder="e.g. 09:30 AM"
                                    value={log?.checkInTime || ""}
                                    onChange={(e) =>
                                      handleDailyAttendanceChange(
                                        member.id!,
                                        log?.status || "Present",
                                        e.target.value,
                                        undefined,
                                      )
                                    }
                                    className="w-full bg-transparent border-none p-2 text-xs font-mono font-bold text-slate-750 outline-none focus:ring-0"
                                  />
                                </div>
                              ) : (
                                <p className="text-xs font-mono font-bold text-slate-600 text-center lg:text-left">
                                  {log?.checkInTime || (
                                    <span className="text-slate-350 font-normal italic">
                                      --:--
                                    </span>
                                  )}
                                </p>
                              )}
                            </td>

                            {/* Remarks input field */}
                            <td className="py-4.5 px-6">
                              {isEditable ? (
                                <input
                                  type="text"
                                  placeholder="লিখুন..."
                                  value={log?.remarks || ""}
                                  onChange={(e) =>
                                    handleDailyAttendanceChange(
                                      member.id!,
                                      log?.status || "Present",
                                      undefined,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/80 focus:border-emerald-500 rounded-xl p-2 text-xs font-semibold text-slate-750 outline-none transition-all"
                                />
                              ) : (
                                <p
                                  className="text-xs text-slate-500 font-medium truncate max-w-[200px]"
                                  title={log?.remarks}
                                >
                                  {log?.remarks || (
                                    <span className="text-slate-350 italic">
                                      None
                                    </span>
                                  )}
                                </p>
                              )}
                            </td>

                            {/* Log Status Indicators */}
                            <td className="py-4.5 px-6 text-right">
                              {log?.updatedAt ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                  Saved
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-350 italic">
                                  No record
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "directory" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200/60 rounded-2xl p-4">
              <div className="relative w-full md:max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff members by name or designation..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-450 focus:outline-none transition-all"
                />
              </div>

              {(activeUserRole === "Admin" ||
                activeUserRole === "Manager" ||
                activeUserRole === "Supervisor") && (
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setIsStaffModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={3} />
                  <Users size={13} />
                  Add Staff Member
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Staff Member Details
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Contact Points
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Joining Date
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Basic Salary
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Status
                    </th>
                    <th className="py-4 px-6 text-right text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 px-6 text-center text-slate-450 text-xs font-medium"
                      >
                        No active staff records. Create a member to begin
                        internal payroll management tasks.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold uppercase shrink-0">
                                {member.name.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-bold text-slate-800">
                                  {member.name}
                                </p>
                                {member.role && (
                                  <span className="text-[8px] font-sans font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                                    {member.role}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                                {member.designation}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 space-y-1">
                          {member.email && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Mail size={12} className="text-slate-300" />
                              {member.email}
                            </p>
                          )}
                          {member.phone && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-300" />
                              {member.phone}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium font-sans">
                          {member.joiningDate}
                        </td>
                        <td className="py-4 px-6 text-xs font-mono font-bold text-slate-850">
                          ৳{member.baseSalary.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                              member.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {activeUserRole === "Admin" ||
                          activeUserRole === "Manager" ||
                          activeUserRole === "Supervisor" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingStaff(member);
                                  setIsStaffModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                                title="Edit registration profiles"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Delete ${member.name} from directory?`,
                                    )
                                  ) {
                                    await EmploymentService.deleteStaff(
                                      member.id!,
                                    );
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Read-Only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIMESHEET TAB */}
        {activeTab === "timesheets" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4">
              <div>
                <p className="text-xs font-extrabold text-slate-700 block">
                  Monthly Attendance Attendance Logging
                </p>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  Define days worked and extra overtime hours for the active
                  invoice cycle.
                </p>
              </div>

              {activeUserRole !== "Support Staff" && (
                <button
                  onClick={() => setIsTimesheetModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={3} />
                  <Briefcase size={13} />
                  Input Work Timesheet
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Staff Member Name
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Designation
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Month
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Days Present
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Daily Attendance Detail (হাজিরা রেকর্ড)
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Overtime Hours
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Remarks
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Verification Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timesheetMatrix.map(
                    ({
                      member,
                      logged,
                      daysPresent,
                      overtimeHours,
                      remarks,
                    }) => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-xs text-slate-800">
                          {member.name}
                          {member.role && (
                            <span className="ml-1.5 text-[8px] font-sans font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-wider">
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 capitalize">
                          {member.designation}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono font-bold">
                          {selectedMonth}
                        </td>
                        <td className="py-4 px-6 text-xs font-mono font-bold text-blue-600">
                          {daysPresent}
                        </td>
                        <td className="py-4 px-6">
                          {(() => {
                            const stats = getMonthAttendanceStats(
                              member.id!,
                              selectedMonth,
                            );
                            if (stats.recordsCount === 0) {
                              return (
                                <span className="text-[10px] text-slate-400 italic">
                                  No daily logs yet
                                </span>
                              );
                            }
                            return (
                              <div className="space-y-0.5">
                                <p className="text-xs font-extrabold text-slate-700">
                                  📅 {stats.calculatedPresentDays} Days Present
                                </p>
                                <p className="text-[9.5px] text-slate-450 font-medium">
                                  Present:{" "}
                                  <span className="text-emerald-600 font-bold">
                                    {stats.presents}
                                  </span>{" "}
                                  | Late:{" "}
                                  <span className="text-amber-500 font-bold">
                                    {stats.lates}
                                  </span>{" "}
                                  | Half:{" "}
                                  <span className="text-indigo-600 font-bold">
                                    {stats.halfs}
                                  </span>{" "}
                                  | Absent:{" "}
                                  <span className="text-rose-500 font-bold">
                                    {stats.absents}
                                  </span>{" "}
                                  | Leave:{" "}
                                  <span className="text-blue-500 font-bold">
                                    {stats.leaves}
                                  </span>
                                </p>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-6 text-xs font-mono font-semibold text-slate-650">
                          {overtimeHours} Hrs
                        </td>
                        <td
                          className="py-4 px-6 text-xs text-slate-500 font-light italic truncate max-w-xs"
                          title={remarks || "None"}
                        >
                          {remarks || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                              logged
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {logged ? (
                              <CheckSquare size={10} />
                            ) : (
                              <AlertTriangle size={10} />
                            )}
                            {logged ? "Logged" : "Estimating Work (30d)"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADVANCE PAYMENTS BAR TAB */}
        {activeTab === "advances" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4">
              <div>
                <p className="text-xs font-extrabold text-slate-700 block">
                  Staff Advance Tracker ("Ogrim Tk")
                </p>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  Maintain balances on money advanced to employees prior to
                  standard monthly pay days.
                </p>
              </div>

              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Plus size={12} strokeWidth={3} />
                <HandCoins size={14} />
                Disburse Advance (Ogrim)
              </button>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Staff Member Name
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Date Handed
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Amount Disbursed
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Purpose / Explanation
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Deduction Status
                    </th>
                    <th className="py-4 px-6 text-right text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Repayment controls
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 px-6 text-center text-slate-450 text-xs font-medium"
                      >
                        No cash advances or Ogrim records linked to any staff
                        member.
                      </td>
                    </tr>
                  ) : (
                    advances.map((adv) => (
                      <tr
                        key={adv.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="text-xs font-bold text-slate-800">
                            {staffNameMap.get(adv.staffId) || "Deleted Staff"}
                          </p>
                          <p className="text-[9px] text-slate-450 font-light mt-0.5">
                            {staffDesignationMap.get(adv.staffId) || "Unknown"}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-550 font-mono font-bold">
                          {adv.date}
                        </td>
                        <td className="py-4 px-6 text-xs font-mono font-black text-rose-600">
                          ৳{adv.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-650 font-medium">
                          {adv.purpose}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                              adv.repaymentStatus === "Pending Deduct"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : adv.repaymentStatus === "Deducted"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-slate-55 text-slate-600 border-slate-200"
                            }`}
                          >
                            {adv.repaymentStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1">
                          {adv.repaymentStatus === "Pending Deduct" ? (
                            <>
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "Mark this advance as successfully Deducted/Settled?",
                                    )
                                  ) {
                                    await EmploymentService.updateAdvanceStatus(
                                      adv.id!,
                                      "Deducted",
                                    );
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer"
                              >
                                Mark Deducted
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "Permanently waive this advance sum?",
                                    )
                                  ) {
                                    await EmploymentService.updateAdvanceStatus(
                                      adv.id!,
                                      "Waived",
                                    );
                                  }
                                }}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                              >
                                Waive
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Re-open this advance for payroll deductions?",
                                  )
                                ) {
                                  await EmploymentService.updateAdvanceStatus(
                                    adv.id!,
                                    "Pending Deduct",
                                  );
                                }
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[10px] font-bold text-amber-700 border border-amber-200 rounded-lg cursor-pointer"
                            >
                              Re-open
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (
                                confirm("Delete this advance entry record?")
                              ) {
                                await EmploymentService.deleteAdvance(adv.id!);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg cursor-pointer transition-colors"
                            title="Delete transaction log"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYROLL / SALARY SHEETS TAB */}
        {activeTab === "payroll" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4">
              <div>
                <p className="text-xs font-extrabold text-slate-700 block">
                  Monthly Staff Salary Ledger
                </p>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  Calculate net payouts based on presence records and
                  automatically deduct advances.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  id="btn-print-salary-sheet"
                  onClick={() =>
                    PrintService.printMonthlySalarySheet(
                      computedPayrollReport,
                      selectedMonth,
                    )
                  }
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-98"
                >
                  <Printer size={13} />
                  Print Sheet (বেতন শীট প্রিন্ট)
                </button>

                <button
                  onClick={() => setIsSalaryModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={3} />
                  <IndianRupee size={13} />
                  Generate & Distribute Salary
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Staff Member Name
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Base Salary Rate
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Attendance Weight
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Overtime Allowance
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Advances Deducted
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Net Paid Out
                    </th>
                    <th className="py-4 px-6 text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Status ({selectedMonth})
                    </th>
                    <th className="py-4 px-6 text-right text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450">
                      Payout Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedPayrollReport.map(
                    ({
                      member,
                      loggedSheet,
                      daysPresent,
                      overtimeHours,
                      status,
                    }) => {
                      const hasSlip = !!loggedSheet;

                      const shownBase = hasSlip
                        ? loggedSheet.baseSalary
                        : member.baseSalary;
                      const shownAllowance = hasSlip
                        ? loggedSheet.allowance
                        : 0;
                      const shownDeducted = hasSlip
                        ? loggedSheet.advanceDeducted
                        : 0;
                      const shownNet = hasSlip
                        ? loggedSheet.netPayable
                        : Math.round(member.baseSalary * (daysPresent / 30));

                      return (
                        <React.Fragment key={member.id}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {member.photoUrl ? (
                                  <img
                                    src={member.photoUrl}
                                    alt={member.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-extrabold uppercase shrink-0 text-[9px]">
                                    {member.name.substring(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-bold text-slate-800">
                                      {member.name}
                                    </p>
                                    {member.role && (
                                      <span className="text-[8px] font-sans font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-wider">
                                        {member.role}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-450 capitalize mt-0.5">
                                    {member.designation}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-xs font-mono text-slate-705">
                              ৳{shownBase.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-500 font-semibold font-mono">
                              {daysPresent}/30 Days
                            </td>
                            <td className="py-4 px-6 text-xs font-mono text-emerald-600 font-bold">
                              ৳{shownAllowance.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-xs font-mono text-rose-500 font-bold">
                                  ৳{shownDeducted.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedStaffAdvancesId(
                                      expandedStaffAdvancesId === member.id
                                        ? null
                                        : member.id!,
                                    )
                                  }
                                  className="text-[9.5px] text-emerald-600 hover:text-emerald-800 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <History size={10} />
                                  View Ogrim History
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-xs font-mono font-black text-slate-900 bg-slate-50/40">
                              ৳{shownNet.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded border ${
                                  status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : status === "Unpaid Documented"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  title="Print Pay Slip (বেতন রশিদ)"
                                  onClick={() =>
                                    PrintService.printSingleSalarySlip(
                                      member,
                                      loggedSheet,
                                      daysPresent,
                                      overtimeHours,
                                      selectedMonth,
                                    )
                                  }
                                  className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  <Printer size={12} />
                                </button>

                                {hasSlip ? (
                                  <button
                                    onClick={async () => {
                                      const newStatus = !loggedSheet.isPaid;
                                      if (
                                        confirm(
                                          `Switch payment status of ${member.name} to ${newStatus ? "PAID" : "UNPAID"}?`,
                                        )
                                      ) {
                                        await EmploymentService.updatePaymentStatus(
                                          loggedSheet.id!,
                                          newStatus,
                                        );
                                      }
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                      loggedSheet.isPaid
                                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {loggedSheet.isPaid
                                      ? "Revoke Paid"
                                      : "Disburse Cash"}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Generate to Pay
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {expandedStaffAdvancesId === member.id && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="py-4 px-8">
                                <div className="border border-slate-200/60 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="p-1.5 bg-rose-50/10 text-rose-600 rounded-lg">
                                        <HandCoins size={12} />
                                      </span>
                                      <p className="text-xs font-bold text-slate-800">
                                        {member.name}-এর অগ্রিম ঋণ ও পরিশোধের
                                        বিবরণ (Advance Payment History)
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedStaffAdvancesId(null)
                                      }
                                      className="text-[9px] uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg cursor-pointer font-bold transition-all"
                                    >
                                      Close Details
                                    </button>
                                  </div>

                                  {(() => {
                                    const staffAdvances = advances.filter(
                                      (a) => a.staffId === member.id,
                                    );
                                    if (staffAdvances.length === 0) {
                                      return (
                                        <p className="text-[11px] text-slate-400 italic py-2 pl-2">
                                          No advance records found for this
                                          staff member (এই স্ট্যাফের অগ্রিম
                                          লেনদেনের বিবরণ নেই)।
                                        </p>
                                      );
                                    }
                                    return (
                                      <div className="overflow-hidden border border-slate-100 rounded-xl bg-slate-50/30">
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
                                              <th className="py-2.5 px-4 w-32">
                                                বিলম্ব/তারিখ (Date)
                                              </th>
                                              <th className="py-2.5 px-4 w-36">
                                                অগ্রিম পরিমাণ (Amount)
                                              </th>
                                              <th className="py-2.5 px-4">
                                                উদ্দেশ্য / বিবরণ (Purpose &
                                                Remarks)
                                              </th>
                                              <th className="py-2.5 px-4 text-right w-48">
                                                Repayment Status
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-150/40 text-[11px] text-slate-600">
                                            {staffAdvances.map((adv) => (
                                              <tr
                                                key={adv.id}
                                                className="hover:bg-slate-100/20"
                                              >
                                                <td className="py-2.5 px-4 font-mono text-slate-500 font-semibold">
                                                  {adv.date}
                                                </td>
                                                <td className="py-2.5 px-4 font-bold font-mono text-rose-600">
                                                  ৳{adv.amount.toLocaleString()}
                                                </td>
                                                <td className="py-2.5 px-4 text-slate-500 font-medium italic">
                                                  {adv.purpose ||
                                                    "Official advance support"}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                  <span
                                                    className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${
                                                      adv.repaymentStatus ===
                                                      "Deducted"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                        : adv.repaymentStatus ===
                                                            "Pending Deduct"
                                                          ? "bg-amber-50 text-amber-700 border-amber-100"
                                                          : "bg-slate-50 text-slate-400 border-slate-150"
                                                    }`}
                                                  >
                                                    {adv.repaymentStatus ===
                                                    "Deducted"
                                                      ? "✔️ Paid & Deducted"
                                                      : adv.repaymentStatus ===
                                                          "Pending Deduct"
                                                        ? "⏳ Unpaid / Pending"
                                                        : "⚪ Waived / Forgiven"}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: STAFF DIRECTORY FORM */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsStaffModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-lg w-full relative z-10"
            >
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-extrabold text-slate-950 text-xl tracking-tight mb-2">
                {editingStaff ? "Edit Staff Profile" : "Register New Staff"}
              </h3>
              <p className="text-xs text-slate-500 font-light mb-6">
                Manage internal personnel information and default base wages.
              </p>

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <PhotoUploader
                  label="স্টাফের ছবি (Staff Photo)"
                  photoUrl={staffFormData.photoUrl}
                  onPhotoUploaded={(url) =>
                    setStaffFormData({ ...staffFormData, photoUrl: url })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffFormData.name}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Imran Hossain"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffFormData.designation}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          designation: e.target.value,
                        })
                      }
                      placeholder="e.g. Accounts Manager"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      E-mail Address
                    </label>
                    <input
                      type="email"
                      value={staffFormData.email}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          email: e.target.value,
                        })
                      }
                      placeholder="imran@example.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Phone / Mobile No.
                    </label>
                    <input
                      type="text"
                      value={staffFormData.phone}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+88017000000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={staffFormData.joiningDate}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          joiningDate: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Monthly Base Salary (BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={staffFormData.baseSalary}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          baseSalary: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Staff Role *
                    </label>
                    <select
                      required
                      value={staffFormData.role}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          role: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none cursor-pointer font-sans"
                    >
                      <option value="Agent">Agent</option>
                      <option value="Manager">Manager</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Support Staff">Support Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Employment Status
                    </label>
                    <select
                      value={staffFormData.status}
                      onChange={(e) =>
                        setStaffFormData({
                          ...staffFormData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Active">Active Employee</option>
                      <option value="Inactive">Resigned / Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Assigned Agent / Supervisor (for Agent timesheet scoping)
                  </label>
                  <select
                    value={staffFormData.assignedAgentId}
                    onChange={(e) =>
                      setStaffFormData({
                        ...staffFormData,
                        assignedAgentId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">-- No Assignment (Unassigned) --</option>
                    {staff
                      .filter(
                        (s) =>
                          s.status === "Active" &&
                          s.id !== editingStaff?.id &&
                          (s.role === "Agent" ||
                            s.role === "Supervisor" ||
                            s.role === "Manager"),
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role || "Agent"})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CASH ADVANCE ("OGRIM") FORM */}
      <AnimatePresence>
        {isAdvanceModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsAdvanceModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-sm w-full relative z-10"
            >
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-extrabold text-slate-950 text-lg tracking-tight mb-1">
                Disburse Cash Advance (Ogrim)
              </h3>
              <p className="text-xs text-slate-500 font-light mb-6">
                Disburse upfront salary advances. This is deducted from payroll.
              </p>

              <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Select staff member *
                  </label>
                  <select
                    required
                    value={advanceFormData.staffId}
                    onChange={(e) =>
                      setAdvanceFormData({
                        ...advanceFormData,
                        staffId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {staff
                      .filter((s) => s.status === "Active")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.designation})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Advance amount (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={advanceFormData.amount}
                    onChange={(e) =>
                      setAdvanceFormData({
                        ...advanceFormData,
                        amount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceFormData.date}
                    onChange={(e) =>
                      setAdvanceFormData({
                        ...advanceFormData,
                        date: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Purpose / Note
                  </label>
                  <input
                    type="text"
                    required
                    value={advanceFormData.purpose}
                    onChange={(e) =>
                      setAdvanceFormData({
                        ...advanceFormData,
                        purpose: e.target.value,
                      })
                    }
                    placeholder="e.g. Medical emergency, Family advance"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-850 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdvanceModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HandCoins size={14} />
                    Pay Advance BDT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: TIMESHEET ATTENDANCE FORM */}
      <AnimatePresence>
        {isTimesheetModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsTimesheetModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-sm w-full relative z-10"
            >
              <button
                onClick={() => setIsTimesheetModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-extrabold text-slate-950 text-lg tracking-tight mb-1">
                Record Monthly Hours/Presence
              </h3>
              <p className="text-xs text-slate-500 font-light mb-6">
                Log total business days attended and any overtime accrued in
                BDT/Hours valuation.
              </p>

              <form onSubmit={handleTimesheetSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Select staff member *
                  </label>
                  <select
                    required
                    value={timesheetFormData.staffId}
                    onChange={(e) =>
                      setTimesheetFormData({
                        ...timesheetFormData,
                        staffId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {staff
                      .filter((s) => {
                        if (s.status !== "Active") return false;
                        if (
                          activeUserRole === "Admin" ||
                          activeUserRole === "Manager" ||
                          activeUserRole === "Supervisor"
                        ) {
                          return true;
                        }
                        if (activeUserRole === "Agent") {
                          // Agents can only manage their assigned staff's timesheets, or their own
                          return (
                            s.assignedAgentId === activeStaffId ||
                            s.id === activeStaffId
                          );
                        }
                        return false;
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.id === activeStaffId ? "(Self)" : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {timesheetFormData.staffId &&
                  (() => {
                    const stats = getMonthAttendanceStats(
                      timesheetFormData.staffId,
                      selectedMonth,
                    );
                    if (stats.recordsCount > 0) {
                      return (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-1.5 shadow-[0_2px_4px_rgba(16,185,129,0.02)]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-emerald-800">
                              Hajira Auto-Calculation:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setTimesheetFormData((prev) => ({
                                  ...prev,
                                  daysPresent: stats.calculatedPresentDays,
                                }))
                              }
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              Use {stats.calculatedPresentDays} Days
                            </button>
                          </div>
                          <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                            Computed{" "}
                            <strong>
                              {stats.calculatedPresentDays} present days
                            </strong>{" "}
                            from {stats.recordsCount} daily attendance entries
                            this month ({selectedMonth}).
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Days Present *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={31}
                      value={timesheetFormData.daysPresent}
                      onChange={(e) =>
                        setTimesheetFormData({
                          ...timesheetFormData,
                          daysPresent: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Overtime Hours
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={timesheetFormData.overtimeHours}
                      onChange={(e) =>
                        setTimesheetFormData({
                          ...timesheetFormData,
                          overtimeHours: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Brief note / Remarks
                  </label>
                  <input
                    type="text"
                    value={timesheetFormData.remarks}
                    onChange={(e) =>
                      setTimesheetFormData({
                        ...timesheetFormData,
                        remarks: e.target.value,
                      })
                    }
                    placeholder="e.g. Worked fully, 2 emergency leaves"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-850 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTimesheetModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase size={14} />
                    Save Timesheet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: CALCULATE & GENERATE PAY SLIP / SALARY SHEET */}
      <AnimatePresence>
        {isSalaryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsSalaryModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-8 max-w-sm w-full relative z-10"
            >
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-extrabold text-slate-950 text-lg tracking-tight mb-1">
                Post & Process Member Salary
              </h3>
              <p className="text-xs text-slate-500 font-light mb-6">
                Review, auto-deduct outstanding balances, and authorize
                payments.
              </p>

              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Choose Employee *
                  </label>
                  <select
                    required
                    value={salaryFormData.staffId}
                    onChange={(e) =>
                      setSalaryFormData({
                        ...salaryFormData,
                        staffId: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {staff
                      .filter((s) => s.status === "Active")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Base: ৳{s.baseSalary.toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Salary Rate:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ৳{salaryFormData.baseSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      Overtime Bonus (
                      <span className="text-[10px] text-slate-400">
                        Calculated
                      </span>
                      ):
                    </span>
                    <span className="font-mono font-bold text-emerald-600">
                      +৳{salaryFormData.allowance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      Advance Deducted (
                      <span className="text-[10px] font-bold text-rose-500">
                        Ogrim
                      </span>
                      ):
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      -৳{salaryFormData.advanceDeducted.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/80 pt-2 font-bold text-sm">
                    <span className="text-slate-850">Net Payable sum:</span>
                    <span className="font-mono text-emerald-600">
                      ৳{salaryFormData.netPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Add details or Remarks
                  </label>
                  <input
                    type="text"
                    value={salaryFormData.remarks}
                    onChange={(e) =>
                      setSalaryFormData({
                        ...salaryFormData,
                        remarks: e.target.value,
                      })
                    }
                    placeholder="e.g. Cleared fully by Bank Transfer"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold text-slate-850 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Log pay Immediately as
                  </label>
                  <select
                    value={salaryFormData.isPaid ? "paid" : "unpaid"}
                    onChange={(e) =>
                      setSalaryFormData({
                        ...salaryFormData,
                        isPaid: e.target.value === "paid",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none cursor-pointer font-bold"
                  >
                    <option value="paid">Paid & Transferred now</option>
                    <option value="unpaid">Keep as Pending/Unpaid slip</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSalaryModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IndianRupee size={14} />
                    Generate Payout Slip
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
