import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  StaffMember,
  TimesheetEntry,
  AdvancePayment,
  SalarySheet,
  DailyAttendance,
} from "../types/employment";

export const EmploymentService = {
  // === STAFF MANAGEMENT ===
  subscribeToStaff(onUpdate: (staff: StaffMember[]) => void) {
    const colRef = collection(db, "office_staff");
    const q = query(colRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const staff: StaffMember[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          staff.push({
            id: docSnap.id,
            name: data.name || "",
            designation: data.designation || "",
            role: data.role || undefined,
            assignedAgentId: data.assignedAgentId || undefined,
            email: data.email || "",
            phone: data.phone || "",
            joiningDate: data.joiningDate || "",
            baseSalary: Number(data.baseSalary) || 0,
            status: data.status || "Active",
            photoUrl: data.photoUrl || "",
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : undefined,
          });
        });
        // Sort in-memory asc by name
        staff.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        onUpdate(staff);
      },
      (error) => {
        console.error(
          "Firestore office staff listen error, handling gracefully:",
          error,
        );
        onUpdate([]);
      },
    );
  },

  async addStaff(member: Omit<StaffMember, "id" | "createdAt">) {
    try {
      const colRef = collection(db, "office_staff");
      const docRef = await addDoc(colRef, {
        ...member,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding staff:", error);
      throw error;
    }
  },

  async updateStaff(id: string, updates: Partial<StaffMember>) {
    try {
      const docRef = doc(db, "office_staff", id);
      await updateDoc(docRef, {
        ...updates,
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  },

  async deleteStaff(id: string) {
    try {
      const docRef = doc(db, "office_staff", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting staff:", error);
      throw error;
    }
  },

  // === TIMESHEETS ===
  subscribeToTimesheets(onUpdate: (timesheets: TimesheetEntry[]) => void) {
    const colRef = collection(db, "office_timesheets");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: TimesheetEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            staffId: data.staffId || "",
            monthYear: data.monthYear || "",
            daysPresent: Number(data.daysPresent) || 0,
            overtimeHours: Number(data.overtimeHours) || 0,
            remarks: data.remarks || "",
            updatedAt: data.updatedAt
              ? data.updatedAt.toDate
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt
              : undefined,
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.error("Firestore timesheets listen error:", error);
      },
    );
  },

  async saveTimesheet(entry: Omit<TimesheetEntry, "id">) {
    try {
      // Use unique key "staffId_monthYear" to easily overwrite or create
      const key = `${entry.staffId}_${entry.monthYear}`;
      const docRef = doc(db, "office_timesheets", key);
      await setDoc(docRef, {
        ...entry,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving timesheet:", error);
      throw error;
    }
  },

  // === ADVANCE PAYMENTS ("Ogrim Tk") ===
  subscribeToAdvances(onUpdate: (advances: AdvancePayment[]) => void) {
    const colRef = collection(db, "office_advances");
    const q = query(colRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const advances: AdvancePayment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          advances.push({
            id: docSnap.id,
            staffId: data.staffId || "",
            amount: Number(data.amount) || 0,
            date: data.date || "",
            purpose: data.purpose || "",
            repaymentStatus: data.repaymentStatus || "Pending Deduct",
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : undefined,
          });
        });
        // Sort in-memory desc by date
        advances.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        onUpdate(advances);
      },
      (error) => {
        console.error(
          "Firestore advances listen error, handling gracefully:",
          error,
        );
        onUpdate([]);
      },
    );
  },

  async addAdvance(advance: Omit<AdvancePayment, "id" | "createdAt">) {
    try {
      const colRef = collection(db, "office_advances");
      const docRef = await addDoc(colRef, {
        ...advance,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error recording advance payment:", error);
      throw error;
    }
  },

  async updateAdvanceStatus(
    id: string,
    repaymentStatus: "Pending Deduct" | "Deducted" | "Waived",
  ) {
    try {
      const docRef = doc(db, "office_advances", id);
      await updateDoc(docRef, {
        repaymentStatus,
      });
    } catch (error) {
      console.error("Error updating advance:", error);
      throw error;
    }
  },

  async deleteAdvance(id: string) {
    try {
      const docRef = doc(db, "office_advances", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting advance payment:", error);
      throw error;
    }
  },

  // === SALARY SHEETS ===
  subscribeToSalaries(onUpdate: (salaries: SalarySheet[]) => void) {
    const colRef = collection(db, "office_salaries");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const salaries: SalarySheet[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          salaries.push({
            id: docSnap.id,
            staffId: data.staffId || "",
            monthYear: data.monthYear || "",
            baseSalary: Number(data.baseSalary) || 0,
            allowance: Number(data.allowance) || 0,
            advanceDeducted: Number(data.advanceDeducted) || 0,
            netPayable: Number(data.netPayable) || 0,
            isPaid: !!data.isPaid,
            paidAt: data.paidAt
              ? data.paidAt.toDate
                ? data.paidAt.toDate().toISOString()
                : data.paidAt
              : undefined,
            remarks: data.remarks || "",
          });
        });
        onUpdate(salaries);
      },
      (error) => {
        console.error("Firestore salaries listen error:", error);
      },
    );
  },

  async saveSalarySheet(sheet: Omit<SalarySheet, "id">) {
    try {
      // Use unique key "staffId_monthYear"
      const key = `${sheet.staffId}_${sheet.monthYear}`;
      const docRef = doc(db, "office_salaries", key);
      await setDoc(docRef, {
        ...sheet,
        paidAt: sheet.isPaid ? serverTimestamp() : null,
      });
    } catch (error) {
      console.error("Error saving salary sheet:", error);
      throw error;
    }
  },

  async updatePaymentStatus(id: string, isPaid: boolean) {
    try {
      const docRef = doc(db, "office_salaries", id);
      await updateDoc(docRef, {
        isPaid,
        paidAt: isPaid ? serverTimestamp() : null,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  // === DAILY ATTENDANCE ("Daily Hajira") ===
  subscribeToDailyAttendance(
    onUpdate: (attendance: DailyAttendance[]) => void,
  ) {
    const colRef = collection(db, "office_attendance");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: DailyAttendance[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            staffId: data.staffId || "",
            date: data.date || "",
            status: data.status || "Present",
            checkInTime: data.checkInTime || "",
            remarks: data.remarks || "",
            updatedAt: data.updatedAt
              ? data.updatedAt.toDate
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt
              : undefined,
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.error("Firestore daily attendance listen error:", error);
      },
    );
  },

  async saveDailyAttendance(entry: Omit<DailyAttendance, "id">) {
    try {
      const key = `${entry.staffId}_${entry.date}`;
      const docRef = doc(db, "office_attendance", key);
      await setDoc(docRef, {
        ...entry,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving daily attendance:", error);
      throw error;
    }
  },

  async deleteDailyAttendance(staffId: string, date: string) {
    try {
      const key = `${staffId}_${date}`;
      const docRef = doc(db, "office_attendance", key);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting daily attendance:", error);
      throw error;
    }
  },
};
