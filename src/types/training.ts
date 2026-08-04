export type TrainingStatus =
  | "Admitted"
  | "Running"
  | "Completed"
  | "Dropped Out"
  | "Cancelled";

export interface TrainingEnrollment {
  id?: string;
  studentName: string;
  phone: string;
  courseName: string; // e.g. Korean Language, Computer IT, Professional Driver, Travel Agency & Ticketing
  admissionDate: string; // YYYY-MM-DD
  batchName?: string; // e.g. Morning Batch, Evening Batch, Batch 03
  status: TrainingStatus;

  // Financial info
  totalFee: number;
  paidAmount: number;
  dueAmount: number;

  // Passport info
  passportNumber?: string;
  photoUrl?: string;

  // References
  reference?: string;
  remarks?: string;

  // Metadata
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
}
