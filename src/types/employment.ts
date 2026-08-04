export interface StaffMember {
  id?: string;
  name: string;
  designation: string;
  role?: "Manager" | "Supervisor" | "Agent" | "Support Staff";
  assignedAgentId?: string;
  email?: string;
  phone?: string;
  joiningDate: string;
  baseSalary: number; // monthly salary
  status: "Active" | "Inactive";
  photoUrl?: string;
  createdAt?: string;
}

export interface TimesheetEntry {
  id?: string;
  staffId: string;
  monthYear: string; // e.g., "2026-05"
  daysPresent: number;
  overtimeHours?: number;
  remarks?: string;
  updatedAt?: string;
}

export interface AdvancePayment {
  id?: string;
  staffId: string;
  amount: number;
  date: string;
  purpose: string;
  repaymentStatus: "Pending Deduct" | "Deducted" | "Waived";
  createdAt?: string;
}

export interface SalarySheet {
  id?: string;
  staffId: string;
  monthYear: string; // "2026-05"
  baseSalary: number;
  allowance: number; // overtime, bounce, etc.
  advanceDeducted: number; // subset of advance payments deducted
  netPayable: number;
  isPaid: boolean;
  paidAt?: string;
  remarks?: string;
}

export interface DailyAttendance {
  id?: string;
  staffId: string;
  date: string; // "YYYY-MM-DD"
  status: "Present" | "Late" | "Absent" | "Half Day" | "On Leave";
  checkInTime?: string;
  remarks?: string;
  updatedAt?: string;
}
