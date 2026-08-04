export interface CashTransaction {
  id?: string;
  date: string; // YYYY-MM-DD
  type: "Inflow" | "Outflow"; // Inflow = টাকা আসছে, Outflow = টাকা গেছে
  amount: number;
  purpose: string; // e.g. Passenger Payment, Direct Visa Cost, Ticket Cost, Office Rent, Staff Salary, Miscellaneous
  remarks?: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: string; // ISO string

  // Medical commission tracking fields
  isMedicalVoucher?: boolean;
  medicalReferenceId?: string; // Staff member ID or 'custom'
  medicalReferenceName?: string; // Staff member name or custom reference name
  medicalCommission?: number; // Commission amount in BDT
  passengerId?: string; // Passenger ID or 'custom'
  passengerName?: string; // Passenger name
}
