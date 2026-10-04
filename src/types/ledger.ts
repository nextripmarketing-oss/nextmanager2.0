export interface CashTransaction {
  id?: string;
  date: string; // YYYY-MM-DD
  type: "Inflow" | "Outflow"; // Inflow = টাকা আসছে, Outflow = টাকা গেছে
  amount: number;
  branch?: "nextrip" | "diabari";
  purpose: string; // e.g. Passenger Payment, Direct Visa Cost, Ticket Cost, Office Rent, Staff Salary, Miscellaneous, Boss Withdrawal
  remarks?: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: string; // ISO string

  // Person / Recipient tracking (টাকা কে নিলো / প্রদানকারী / গ্রহণকারী - যেমন আহাদ, বস, ইত্যাদি)
  recipientType?: "Staff" | "Boss" | "Passenger" | "Agent" | "Other";
  personName?: string; // e.g. "আহাদ (Ahad)", "বস (Boss)", etc.
  staffId?: string; // If selected from registered staff

  // Medical tracking fields (কত টাকার মেডিকেল করাইলো, কোন প্যাসেঞ্জার, কোন হাসপাতাল)
  isMedicalVoucher?: boolean;
  medicalReferenceId?: string; // Staff member ID or 'custom'
  medicalReferenceName?: string; // Staff member name or custom reference name
  medicalCommission?: number; // Commission amount in BDT
  passengerId?: string; // Passenger ID or 'custom'
  passengerName?: string; // Passenger name
  medicalCost?: number; // কত টাকার মেডিকেল করাইলো (Medical test expense in BDT)
  medicalCenter?: string; // মেডিকেল সেন্টার বা হাসপাতালের নাম (e.g. Gamca, Wafa, etc.)
}
